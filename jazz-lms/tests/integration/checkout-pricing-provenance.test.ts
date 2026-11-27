import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type Money = { originalPrice: number | null; discountAmount: number | null; finalPrice: number | null };
type Purchase = Money & { id: string; providerReferenceId: string; voucherId: string | null };
type Discount = Money & { voucherId: string | null };
const fixtures = vi.hoisted(() => ({ purchase: null as Purchase | null, discount: null as Discount | null,
  redemption: null as { id: string; voucherId: string } | null, uses: 0 }));
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), course: vi.fn(), findPurchase: vi.fn(), upsert: vi.fn(),
  voucher: vi.fn(), synchronize: vi.fn(), fetch: vi.fn(), events: vi.fn(), discountUpsert: vi.fn(),
  discountDelete: vi.fn(), discountUpdate: vi.fn(), increment: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/vouchers", () => ({ validateVoucherForCourse: mocks.voucher }));
vi.mock("@/lib/voucher-provider-sync", () => ({ ensureVoucherDiscountSynced: mocks.synchronize }));
vi.mock("@/lib/test-mode", () => ({ isLocalTestRequest: () => false }));
vi.mock("@/lib/db", () => {
  const transaction = {
    $executeRaw: vi.fn(async () => 1), paymentWebhookEvent: { findMany: mocks.events },
    purchase: { findUnique: mocks.findPurchase, upsert: mocks.upsert },
    voucherRedemption: { findFirst: async () => fixtures.redemption,
      create: async ({ data }: { data: { voucherId: string } }) => {
        fixtures.redemption = { id: "redemption-fixture", voucherId: data.voucherId }; return fixtures.redemption;
      }, delete: vi.fn(), update: vi.fn() },
    voucherCode: { update: mocks.increment, updateMany: vi.fn() },
    discountApplied: { upsert: mocks.discountUpsert, deleteMany: mocks.discountDelete, updateMany: mocks.discountUpdate },
  };
  return { db: { user: { findUnique: async () => ({ role: "USER" }) }, course: { findUnique: mocks.course },
    purchase: transaction.purchase, voucherCode: { update: vi.fn(), findUnique: async () => null,
      findFirst: async ({ where }: { where: { metadata?: unknown } }) => where.metadata ? { id: "voucher-fixture" } : null,
      findMany: async () => [] },
    $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) } };
});

import { POST } from "@/app/api/checkout/route";
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { extractDodoPricing, resolveDodoVoucherAccounting } from "@/lib/payments/providers/dodo-events";

const appOrigin = "https://app.fixture.invalid";
const paymentReference = "dodo-pay:payment-fixture";
function request(voucherCode?: string, expectedUserId = "owner-fixture") {
  return new Request(`${appOrigin}/api/checkout?expectedUserId=${expectedUserId}`, { method: "POST",
    headers: { "content-type": "application/json", origin: appOrigin },
    body: JSON.stringify({ courseId: "course-fixture", source: "dashboard", language: "en", voucherCode }) });
}
function checkoutBody(index = 0) {
  const call = mocks.fetch.mock.calls[index];
  expect(call[0]).toBe("https://test.dodopayments.com/checkouts");
  expect(call[1].method).toBe("POST");
  return JSON.parse(call[1].body) as { product_cart: { product_id: string; quantity: number }[];
    metadata: Record<string, string>; discount_code?: string };
}
async function settle(data: Record<string, unknown>, reference = paymentReference) {
  const payload = { data };
  const pricing = extractDodoPricing(payload);
  await upsertCoursePurchaseFromProvider({ userId: "owner-fixture", courseId: "course-fixture",
    providerReferenceId: reference, originalPrice: pricing.subtotalAmount, discountAmount: pricing.discountAmount,
    finalPrice: pricing.totalAmount, paymentCurrency: pricing.paymentCurrency, paymentAmountMinor: pricing.paymentAmountMinor, ...resolveDodoVoucherAccounting(payload) });
}

beforeEach(() => {
  vi.resetAllMocks(); fixtures.purchase = null; fixtures.discount = null; fixtures.redemption = null; fixtures.uses = 0;
  vi.stubEnv("NEXT_PUBLIC_APP_URL", appOrigin); vi.stubEnv("DODO_ENVIRONMENT", "test_mode");
  vi.stubEnv("DODO_PAYMENTS_API_KEY", "fixture-provider-value"); vi.stubEnv("DODO_PRODUCT_ID", "pdt_fixture");
  vi.stubEnv("DODO_WEBHOOK_SECRET", "fixture-webhook-value"); vi.stubEnv("DODO_API_BASE_URL", "");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-fixture", email: "actor@example.test" } } });
  mocks.course.mockResolvedValue({ id: "course-fixture", title: "Fixture course", isPublished: true, price: 80 });
  mocks.findPurchase.mockImplementation(async () => fixtures.purchase);
  mocks.upsert.mockImplementation(async ({ create, update }: { create: Omit<Purchase, "id">; update: Omit<Purchase, "id"> }) => {
    fixtures.purchase = { id: "purchase-fixture", ...(fixtures.purchase ? update : create) }; return fixtures.purchase;
  });
  mocks.events.mockResolvedValue([]);
  mocks.discountUpsert.mockImplementation(async ({ create }: { create: Discount }) => { fixtures.discount = create; });
  mocks.discountDelete.mockImplementation(async () => { fixtures.discount = null; });
  mocks.discountUpdate.mockImplementation(async ({ data }: { data: { voucherId: string | null } }) => {
    if (fixtures.discount) fixtures.discount.voucherId = data.voucherId;
  });
  mocks.increment.mockImplementation(async () => { fixtures.uses += 1; });
  mocks.fetch.mockImplementation(async (url, init) => {
    if (url !== "https://test.dodopayments.com/checkouts" || init?.method !== "POST") throw new Error("Unpermitted fixture request");
    return Response.json({ checkout_url: "https://checkout.fixture.invalid/session" });
  });
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("checkout quote provenance through the actual Dodo request", () => {
  test.each([29.99, 80])("catalog %s is identified as a quote without changing the configured product cart", async (price) => {
    mocks.course.mockResolvedValue({ id: "course-fixture", title: "Fixture course", isPublished: true, price });
    expect((await POST(request())).status).toBe(200);
    const body = checkoutBody();
    expect(body.product_cart).toEqual([{ product_id: "pdt_fixture", quantity: 1 }]);
    expect(body.discount_code).toBeUndefined();
    expect(body.metadata).toMatchObject({ pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: String(price),
      quotedDiscount: "0", quotedFinalPrice: String(price) });
    expect(body.metadata.originalPrice).toBeUndefined();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  test("uses the validated voucher quote snapshot rather than the earlier course read or default", async () => {
    mocks.voucher.mockResolvedValue({ valid: true, isFree: false, originalPrice: 90, discount: 9, finalPrice: 81,
      voucher: { id: "voucher-fixture", code: "LOCAL10", providerDiscountCode: "PROVIDER10" } });
    expect((await POST(request("LOCAL10"))).status).toBe(200);
    const body = checkoutBody();
    expect(body.product_cart).toEqual([{ product_id: "pdt_fixture", quantity: 1 }]);
    expect(body.discount_code).toBe("PROVIDER10");
    expect(body.metadata).toMatchObject({ pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: "90",
      quotedDiscount: "9", quotedFinalPrice: "81", voucherCode: "LOCAL10", providerDiscountCode: "PROVIDER10" });
    expect(body.metadata.originalPrice).toBeUndefined();
  });

  test("a successful coupon backfill retry retains the quote and coupon instead of preparing full price", async () => {
    mocks.voucher.mockResolvedValue({ valid: true, isFree: false, originalPrice: 80, discount: 8, finalPrice: 72,
      voucher: { id: "voucher-fixture", code: "LOCAL10", providerDiscountCode: "PROVIDER10", type: "DISCOUNT_PERCENT" } });
    mocks.synchronize.mockResolvedValue({ ok: true, metadata: {} });
    mocks.fetch.mockResolvedValueOnce(Response.json({ error: "invalid discount" }, { status: 400 }));
    expect((await POST(request("LOCAL10"))).status).toBe(200);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(checkoutBody(1)).toEqual(checkoutBody(0));
    expect(checkoutBody(1).metadata).toMatchObject({ pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: "80", quotedDiscount: "8", quotedFinalPrice: "72" });
    expect(checkoutBody(1).discount_code).toBe("PROVIDER10");
  });

  test("control verified owner mismatch rejects before any course/provider work", async () => {
    expect((await POST(request(undefined, "another-owner"))).status).toBe(409);
    expect(mocks.course).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled(); expect(mocks.upsert).not.toHaveBeenCalled();
  });

  test("control a rejected coupon cannot silently fall back to undiscounted checkout", async () => {
    mocks.voucher.mockResolvedValue({ valid: true, isFree: false, originalPrice: 80, discount: 8, finalPrice: 72,
      voucher: { id: "voucher-fixture", code: "LOCAL10", providerDiscountCode: "PROVIDER10", type: "DISCOUNT_PERCENT" } });
    mocks.synchronize.mockResolvedValue({ ok: false, metadata: {} });
    mocks.fetch.mockResolvedValueOnce(Response.json({ error: "invalid discount" }, { status: 400 }));
    expect((await POST(request("LOCAL10"))).status).toBe(400);
    expect(mocks.fetch).toHaveBeenCalledOnce(); expect(checkoutBody().discount_code).toBe("PROVIDER10");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

describe("provider settlement remains separate from the quote", () => {
  test("a real final amount grants access without a phantom nine-cent DiscountApplied row", async ({ task }) => {
    expect((await POST(request())).status).toBe(200);
    await settle({ payment_id: "payment-fixture", total_amount: 2990, currency: "EUR", tax: 0, metadata: checkoutBody().metadata });
    Object.assign(task.meta, { observed: structuredClone({ checkout: checkoutBody(), purchase: fixtures.purchase, discount: fixtures.discount, uses: fixtures.uses }) });
    expect(fixtures.purchase).toMatchObject({ providerReferenceId: paymentReference, originalPrice: null, discountAmount: null, finalPrice: 29.9, voucherId: null });
    expect(fixtures.discount).toBeNull(); expect(fixtures.uses).toBe(0);
  });

  test("actual coupon identity counts once even while gross-inclusive monetary discount is unknown", async ({ task }) => {
    const data = { payment_id: "payment-fixture", total_amount: 7920, currency: "EUR", tax: 720,
      discount_id: "discount-fixture", metadata: { originalPrice: "80", voucherCode: "LOCAL10", providerDiscountCode: "PROVIDER10" } };
    await settle(data); await settle(data);
    Object.assign(task.meta, { observed: structuredClone({ purchase: fixtures.purchase, discount: fixtures.discount, uses: fixtures.uses, redemption: fixtures.redemption }) });
    expect(fixtures.uses).toBe(1); expect(fixtures.redemption?.voucherId).toBe("voucher-fixture");
    expect(fixtures.purchase).toMatchObject({ originalPrice: null, discountAmount: null, finalPrice: 79.2, voucherId: "voucher-fixture" });
    expect(fixtures.discount).toBeNull();
  });

  test("an incomplete same-reference replay preserves already recorded facts", async ({ task }) => {
    fixtures.purchase = { id: "purchase-fixture", providerReferenceId: paymentReference, voucherId: null, originalPrice: 100, discountAmount: 20, finalPrice: 80 };
    fixtures.discount = { originalPrice: 100, discountAmount: 20, finalPrice: 80, voucherId: null };
    await settle({ total_amount: 7920, currency: "EUR", tax: 720, metadata: { originalPrice: "80" } });
    Object.assign(task.meta, { observed: structuredClone({ purchase: fixtures.purchase, discount: fixtures.discount }) });
    expect(fixtures.purchase).toMatchObject({ originalPrice: 100, discountAmount: 20, finalPrice: 80 });
    expect(fixtures.discount).toEqual({ originalPrice: 100, discountAmount: 20, finalPrice: 80, voucherId: null });
  });

  test("an incomplete replacement does not inherit another reference's base or discount", async ({ task }) => {
    fixtures.purchase = { id: "purchase-fixture", providerReferenceId: "dodo-pay:old-fixture", voucherId: null, originalPrice: 100, discountAmount: 20, finalPrice: 80 };
    fixtures.discount = { originalPrice: 100, discountAmount: 20, finalPrice: 80, voucherId: null };
    await settle({ total_amount: 7920, currency: "EUR", tax: 720, metadata: { originalPrice: "80" } });
    Object.assign(task.meta, { observed: structuredClone({ purchase: fixtures.purchase, discount: fixtures.discount }) });
    expect(fixtures.purchase).toMatchObject({ providerReferenceId: paymentReference, originalPrice: null, discountAmount: null, finalPrice: 79.2 });
    expect(fixtures.discount).toBeNull();
  });

  test("control provenance changes never bypass the successful-refund barrier", async () => {
    mocks.events.mockResolvedValue([{ eventType: "refund.succeeded", payload: { type: "refund.succeeded", data: { payment_id: "payment-fixture" } }, createdAt: new Date("2026-10-13T00:00:00Z") }]);
    await expect(settle({ total_amount: 2990, metadata: { originalPrice: "29.99" } })).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(mocks.upsert).not.toHaveBeenCalled(); expect(fixtures.discount).toBeNull();
  });
});
