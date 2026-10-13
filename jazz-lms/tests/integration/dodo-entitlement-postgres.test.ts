import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { extractDodoPricing, resolveDodoVoucherAccounting } from "@/lib/payments/providers/dodo-events";

// Opt-in only. This suite writes uniquely scoped fixtures to a disposable local
// database; it must never inherit the application's DATABASE_URL.
const databaseUrl = process.env.PAYMENTS_TEST_DATABASE_URL;
const prefix = `payment-maintenance-${randomUUID()}`;
let client: PrismaClient;
let sync: typeof import("@/lib/course-purchase-sync");
const courseId = `${prefix}-course`;
const secondCourseId = `${prefix}-course-2`;
const voucherId = `${prefix}-voucher`;
const secondVoucherId = `${prefix}-voucher-2`;
const userId = `${prefix}-buyer`;
const paymentId = `${prefix}-old-payment`;
const providerReferenceId = `dodo-pay:${paymentId}`;
const input = { userId, courseId, providerReferenceId, originalPrice: 29.99, finalPrice: 29.99, discountAmount: 0 };

describe.skipIf(!databaseUrl)("Dodo entitlements on isolated PostgreSQL", () => {
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname) ||
        url.port !== "55432" || url.pathname !== "/jazz_maintenance") {
      throw new Error("Payment integration tests require the disposable localhost:55432/jazz_maintenance database");
    }
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    client = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    globalThis.prisma = client;
    sync = await import("@/lib/course-purchase-sync");
    await client.course.create({ data: { id: courseId, title: "Isolated payment test course", price: 29.99 } });
    await client.course.create({ data: { id: secondCourseId, title: "Second isolated course", price: 29.99 } });
  });

  beforeEach(async () => {
    await client.purchase.deleteMany({ where: { courseId: { in: [courseId, secondCourseId] } } });
    await client.voucherCode.deleteMany({ where: { id: { in: [voucherId, secondVoucherId] } } });
    await client.paymentWebhookEvent.deleteMany({ where: { eventKey: { startsWith: prefix } } });
  });

  afterAll(async () => {
    if (client) {
      await client.paymentWebhookEvent.deleteMany({ where: { eventKey: { startsWith: prefix } } });
      await client.voucherCode.deleteMany({ where: { id: { in: [voucherId, secondVoucherId] } } });
      await client.course.deleteMany({ where: { id: { in: [courseId, secondCourseId] } } });
      await client.$disconnect();
      delete globalThis.prisma;
    }
    vi.unstubAllEnvs();
  });

  const storeEvent = (type: string, status: "PROCESSING" | "PROCESSED" | "FAILED" = "PROCESSED", timestamp: string | null = "2026-10-13T00:00:00Z") => {
    const id = randomUUID();
    return client.paymentWebhookEvent.create({ data: {
      eventKey: `${prefix}:${id}`, eventId: id, provider: "dodo", eventType: type, status,
      payload: { type, timestamp, data: { payment_id: paymentId } }, payloadHash: "isolated-test",
    } });
  };

  test.each(["PROCESSING", "PROCESSED", "FAILED"] as const)("blocks refund-before-paid sequence with %s ledger event", async (status) => {
    await storeEvent("refund.succeeded", status);
    await expect(sync.upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(await client.purchase.count({ where: { courseId } })).toBe(0);
  });

  test("revokes old purchase, prevents resurrection, preserves purchase with new payment", async () => {
    await sync.upsertCoursePurchaseFromProvider(input);
    await storeEvent("refund.succeeded");
    await sync.revertCoursePurchaseByProviderReferenceId(providerReferenceId);
    expect(await client.purchase.count({ where: { courseId } })).toBe(0);
    await expect(sync.upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    const newReference = `dodo-pay:${prefix}-new-payment`;
    await sync.upsertCoursePurchaseFromProvider({ ...input, providerReferenceId: newReference });
    await sync.revertCoursePurchaseByProviderReferenceId(providerReferenceId);
    expect((await client.purchase.findUnique({ where: { userId_courseId: { userId, courseId } } }))?.providerReferenceId).toBe(newReference);
  });

  test("orders dispute state by provider timestamp instead of delayed arrival", async () => {
    await storeEvent("dispute.won", "PROCESSED", "2026-10-13T00:02:00Z");
    await storeEvent("dispute.opened", "PROCESSING", "2026-10-13T00:01:00Z");
    await sync.upsertCoursePurchaseFromProvider(input);
    await sync.revertCoursePurchaseByProviderReferenceId(providerReferenceId);
    expect(await client.purchase.count({ where: { courseId } })).toBe(1);
  });

  test("advisory lock waits for concurrent operation and re-reads refund ledger before granting", async () => {
    let release!: () => void;
    let acquired!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const ready = new Promise<void>((resolve) => { acquired = resolve; });
    const holding = client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${providerReferenceId}, 0))`;
      acquired();
      await gate;
    });
    await ready;
    let settled = false;
    const grant = sync.upsertCoursePurchaseFromProvider(input).then(
      () => { settled = true; return null; },
      (error: Error) => { settled = true; return error; },
    );
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(settled).toBe(false);
      await storeEvent("refund.succeeded", "PROCESSING");
    } finally {
      release();
      await holding;
    }
    expect(await grant).toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(await client.purchase.count({ where: { courseId } })).toBe(0);
  });

  test("concurrent free voucher checkouts cannot exceed the global usage limit", async () => {
    const voucher = await client.voucherCode.create({ data: {
      id: voucherId, code: `FREE${randomUUID().slice(0, 8)}`, type: "FREE_ACCESS", maxUses: 1, maxUsesPerUser: 1,
    } });
    const freeInput = { ...input, finalPrice: 0, discountAmount: 29.99, providerReferenceId: `dodo-voucher:${voucher.code}`, localVoucherCode: voucher.code };
    const results = await Promise.allSettled([
      sync.upsertCoursePurchaseFromProvider(freeInput),
      sync.upsertCoursePurchaseFromProvider({ ...freeInput, userId: `${userId}-other` }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await client.purchase.count({ where: { courseId } })).toBe(1);
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(1);
  });

  test("concurrent free checkouts across courses cannot exceed per-user voucher limit", async () => {
    const voucher = await client.voucherCode.create({ data: {
      id: voucherId, code: `FREE${randomUUID().slice(0, 8)}`, type: "FREE_ACCESS", maxUses: 4, maxUsesPerUser: 1,
    } });
    const freeInput = { ...input, finalPrice: 0, discountAmount: 29.99, providerReferenceId: `dodo-voucher:${voucher.code}`, localVoucherCode: voucher.code };
    const results = await Promise.allSettled([
      sync.upsertCoursePurchaseFromProvider(freeInput),
      sync.upsertCoursePurchaseFromProvider({ ...freeInput, courseId: secondCourseId }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await client.voucherRedemption.count({ where: { voucherId, userId } })).toBe(1);
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(1);
  });

  test("a full-price settlement cannot consume voucher named in stale checkout metadata", async () => {
    const voucher = await client.voucherCode.create({ data: {
      id: voucherId, code: `SAVE${randomUUID().slice(0, 8)}`, type: "DISCOUNT_PERCENT", discountPercent: 20, maxUses: 1,
    } });
    await sync.upsertCoursePurchaseFromProvider({ ...input, localVoucherCode: voucher.code });
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(0);
    expect(await client.voucherRedemption.count({ where: { voucherId } })).toBe(0);
    expect((await client.purchase.findUnique({ where: { userId_courseId: { userId, courseId } } }))?.voucherId).toBeNull();
  });

  test("provider-shaped settlement consumes actual locally matched coupon, preserves obsolete voucher", async () => {
    const oldVoucher = await client.voucherCode.create({ data: {
      id: voucherId, code: `OLD${randomUUID().slice(0, 8)}`, type: "DISCOUNT_PERCENT", discountPercent: 20, maxUses: 1,
    } });
    const actualVoucher = await client.voucherCode.create({ data: {
      id: secondVoucherId, code: `NEW${randomUUID().slice(0, 8)}`, type: "DISCOUNT_PERCENT", discountPercent: 20, maxUses: 1,
      metadata: { providerDiscountId: `${prefix}-actual-discount` },
    } });
    const payload = { type: "payment.succeeded", data: {
      payment_id: paymentId, total_amount: 2399,
      discounts: [{ discount_id: `${prefix}-actual-discount`, code: actualVoucher.code }],
      metadata: { userId, courseId, originalPrice: "29.99", voucherCode: oldVoucher.code, providerDiscountCode: oldVoucher.code },
    } };
    const pricing = extractDodoPricing(payload);
    await sync.upsertCoursePurchaseFromProvider({ ...input, originalPrice: pricing.subtotalAmount,
      finalPrice: pricing.totalAmount, discountAmount: pricing.discountAmount, ...resolveDodoVoucherAccounting(payload) });
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(0);
    expect((await client.voucherCode.findUnique({ where: { id: secondVoucherId } }))?.currentUses).toBe(1);
    expect((await client.purchase.findUnique({ where: { userId_courseId: { userId, courseId } } }))?.voucherId).toBe(secondVoucherId);
  });

  test("actual provider discount proof counts voucher even if tax-inclusive total exceeds metadata base", async () => {
    const voucher = await client.voucherCode.create({ data: {
      id: voucherId, code: `TAX${randomUUID().slice(0, 8)}`, type: "DISCOUNT_PERCENT", discountPercent: 10, maxUses: 1,
      metadata: { providerDiscountId: `${prefix}-tax-discount` },
    } });
    const payload = { type: "payment.succeeded", data: {
      payment_id: paymentId, total_amount: 3266, tax: 567,
      discounts: [{ discount_id: `${prefix}-tax-discount`, code: voucher.code }],
      metadata: { userId, courseId, originalPrice: "29.99", voucherCode: voucher.code, providerDiscountCode: voucher.code },
    } };
    const pricing = extractDodoPricing(payload);
    expect(pricing.discountAmount).toBe(0); // Monetary gross/net reconciliation remains a separate gap.
    await sync.upsertCoursePurchaseFromProvider({ ...input, originalPrice: pricing.subtotalAmount,
      finalPrice: pricing.totalAmount, discountAmount: pricing.discountAmount, ...resolveDodoVoucherAccounting(payload) });
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(1);
    expect((await client.purchase.findUnique({ where: { userId_courseId: { userId, courseId } } }))?.voucherId).toBe(voucherId);
  });
});
