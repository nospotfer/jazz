import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { extractDodoPricing } from "@/lib/payments/providers/dodo-events";

const target = process.env.PAYMENTS_TEST_DATABASE_URL;
function isolatedTarget(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" && url.hostname === "127.0.0.1" && url.port === "55432" &&
      url.pathname === "/jazz_maintenance" && url.username === "postgres" && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
if (target && !isolatedTarget(target)) throw new Error("Currency tests require the dedicated disposable loopback database");

describe.skipIf(!isolatedTarget(target))("persisted provider payment currency", () => {
  const prefix = `currency-${randomUUID()}`;
  const courseId = `${prefix}-course`, userId = `${prefix}-actor`, paymentId = `${prefix}-payment`;
  const reference = `dodo-pay:${paymentId}`, voucherId = `${prefix}-voucher`, discountId = `${prefix}-discount`;
  let client: PrismaClient;
  let sync: typeof import("@/lib/course-purchase-sync");
  const identity = { userId, courseId, providerReferenceId: reference };
  const partial = { originalPrice: null, finalPrice: null, discountAmount: null };
  async function grant(currency: string | undefined, total_amount: number, newReference = reference) {
    const pricing = extractDodoPricing({ data: { currency, total_amount } });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, providerReferenceId: newReference,
      originalPrice: pricing.subtotalAmount, finalPrice: pricing.totalAmount, discountAmount: pricing.discountAmount,
      ...{ paymentCurrency: currency ?? null, paymentAmountMinor: String(total_amount) } });
  }
  async function purchase() {
    return client.purchase.findUnique({ where: { userId_courseId: { userId, courseId } } });
  }
  beforeAll(async () => {
    client = new PrismaClient({ datasources: { db: { url: target! } }, log: [] });
    vi.doMock("@/lib/db", () => ({ db: client }));
    sync = await import("@/lib/course-purchase-sync");
    await client.course.create({ data: { id: courseId, title: "Isolated currency persistence fixture", price: 80, isPublished: true } });
  });
  beforeEach(async () => {
    await client.purchase.deleteMany({ where: { courseId } });
    await client.voucherCode.deleteMany({ where: { id: voucherId } });
    await client.paymentWebhookEvent.deleteMany({ where: { eventKey: { startsWith: prefix } } });
  });
  afterAll(async () => {
    if (client) {
      await client.purchase.deleteMany({ where: { courseId } });
      await client.voucherCode.deleteMany({ where: { id: voucherId } });
      await client.paymentWebhookEvent.deleteMany({ where: { eventKey: { startsWith: prefix } } });
      await client.course.deleteMany({ where: { id: courseId } });
      await client.$disconnect();
    }
    vi.doUnmock("@/lib/db");
  });

  for (const [currency, total, major] of [["JPY", 2990, 2990], ["KWD", 1234, 1.234]] as const) {
    test(`stores exact ${currency} units without cents scaling or precision loss`, async ({ task }) => {
      await grant(currency, total);
      const row = await purchase(); Object.assign(task.meta, { observed: row });
      expect(row).toMatchObject({ paymentCurrency: currency, paymentAmountMinor: String(total), finalPrice: major });
    });
  }

  test("same-reference exact pair is separate from retained historical floats and coupon use", async ({ task }) => {
    await client.voucherCode.create({ data: { id: voucherId, code: `${prefix}-code`, type: "DISCOUNT_PERCENT", discountPercent: 20,
      metadata: { providerDiscountId: discountId } } });
    const known = { originalPrice: 100, finalPrice: 80, discountAmount: 20 };
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known, providerDiscountId: discountId });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...partial, finalPrice: 1.234, providerDiscountId: discountId,
      ...{ paymentCurrency: "KWD", paymentAmountMinor: "1234" } });
    const row = await purchase(); Object.assign(task.meta, { observed: row });
    expect(row).toMatchObject({ ...known, voucherId, paymentCurrency: "KWD", paymentAmountMinor: "1234" });
    expect((await client.voucherCode.findUnique({ where: { id: voucherId } }))?.currentUses).toBe(1);
    expect(await client.discountApplied.findUnique({ where: { purchaseId: row!.id } })).toMatchObject(known);
  });

  test("a partial replay never mixes its new raw units with a prior trusted currency", async ({ task }) => {
    await grant("JPY", 2990);
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...partial,
      ...{ paymentCurrency: null, paymentAmountMinor: "1234" } });
    const row = await purchase(); Object.assign(task.meta, { observed: row });
    expect(row).toMatchObject({ paymentCurrency: "JPY", paymentAmountMinor: "2990", finalPrice: 2990 });
  });

  test("a replacement retains unknown-currency raw units without inheriting old money", async ({ task }) => {
    await grant("JPY", 2990);
    await sync.upsertCoursePurchaseFromProvider({ ...identity, providerReferenceId: `dodo-pay:${prefix}-replacement`, ...partial,
      ...{ paymentCurrency: null, paymentAmountMinor: "1234" } });
    const row = await purchase(); Object.assign(task.meta, { observed: row });
    expect(row).toMatchObject({ ...partial, paymentCurrency: null, paymentAmountMinor: "1234" });
  });

  test("control an actual zero remains zero and grants without a guessed unit", async () => {
    await grant(undefined, 0);
    expect(await purchase()).toMatchObject({ finalPrice: 0 });
  });

  test("control successful reversal prevents any late same-payment regrant", async () => {
    await grant("JPY", 2990);
    await client.paymentWebhookEvent.create({ data: { eventKey: `${prefix}-refund`, eventId: `${prefix}-refund`, provider: "dodo",
      eventType: "refund.succeeded", status: "PROCESSED", payload: { type: "refund.succeeded", data: { payment_id: paymentId } }, payloadHash: "isolated-currency-fixture" } });
    await sync.revertCoursePurchaseByProviderReferenceId(reference);
    expect(await purchase()).toBeNull();
    await expect(grant("JPY", 2990)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(await purchase()).toBeNull();
  });
});
