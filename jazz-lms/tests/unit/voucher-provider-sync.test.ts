import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ensureVoucherDiscountSynced, removeVoucherDiscountSync } from "@/lib/voucher-provider-sync";
import { createDodoDiscount } from "@/lib/payments/providers/dodo";

const voucher = {
  id: "voucher-contract", code: "JAZZTEST", type: "DISCOUNT_FIXED" as const,
  discountAmount: 5, discountPercent: null, minOrderValue: 10,
  maxUses: 10, maxUsesPerUser: 2, expiresAt: null, metadata: {},
};
const providerDiscount = {
  code: "JAZZTEST", discount_id: "dsc_contract", restricted_to: ["pdt_jazz"],
  metadata: { integration: "jazz-lms", voucherId: "voucher-contract" },
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

beforeEach(() => {
  vi.stubEnv("DODO_PAYMENTS_API_KEY", "dummy-provider-test-key");
  vi.stubEnv("DODO_PRODUCT_ID", "pdt_jazz");
  vi.stubEnv("DODO_ENVIRONMENT", "test_mode");
  vi.stubEnv("DODO_API_BASE_URL", "https://test.dodopayments.com");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Dodo voucher provider contract", () => {
  test("creates flat discount with EUR default currency row and local limits", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(providerDiscount));
    const result = await ensureVoucherDiscountSynced(voucher);
    expect(result.ok).toBe(true);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({
      code: "JAZZTEST", type: "flat", amount: 10000,
      expires_at: null, usage_limit: 10, per_customer_usage_limit: 2,
      restricted_to: ["pdt_jazz"], metadata: { integration: "jazz-lms", voucherId: "voucher-contract" },
      currency_options: [{ currency: "EUR", is_default: true, minimum_subtotal: 1000, max_amount_possible: 500 }],
    });
    expect(result.metadata.providerDiscountId).toBe("dsc_contract");
  });

  test("maps percentage to basis points and clamps per-user limit only to effective global maximum", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(json(providerDiscount));
    await ensureVoucherDiscountSynced({ ...voucher, type: "DISCOUNT_PERCENT", discountPercent: 20, maxUses: 1, minOrderValue: null });
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toMatchObject({
      type: "percentage", amount: 2000, usage_limit: 1, per_customer_usage_limit: 1, restricted_to: ["pdt_jazz"],
    });
  });

  test("reconciles managed existing code instead of blindly accepting 409", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ message: "Code already exists" }, 409))
      .mockResolvedValueOnce(json(providerDiscount))
      .mockResolvedValueOnce(json(providerDiscount));
    const result = await ensureVoucherDiscountSynced(voucher);
    expect(result.ok).toBe(true);
    expect(fetch.mock.calls[1][0]).toBe("https://test.dodopayments.com/discounts/code/JAZZTEST");
    expect(fetch.mock.calls[2][1]?.method).toBe("PATCH");
    expect(JSON.parse(String(fetch.mock.calls[2][1]?.body)).usage_limit).toBe(10);
  });

  test("reactivates an expired managed code by ID and restores its original expiry", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ message: "Code already exists" }, 409))
      .mockResolvedValueOnce(json({ ...providerDiscount, expires_at: "2020-01-01T00:00:00Z" }))
      .mockResolvedValueOnce(json(providerDiscount));
    await ensureVoucherDiscountSynced({ ...voucher, metadata: { providerDiscountId: "dsc_contract" } });
    expect(fetch.mock.calls[1][0]).toBe("https://test.dodopayments.com/discounts/dsc_contract");
    expect(JSON.parse(String(fetch.mock.calls[2][1]?.body)).expires_at).toBeNull();
  });

  test("refuses to change shared or unowned existing discount", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ message: "Code already exists" }, 409))
      .mockResolvedValueOnce(json({ ...providerDiscount, metadata: {}, restricted_to: ["pdt_other_service"] }));
    const result = await ensureVoucherDiscountSynced(voucher);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/ownership review/);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("deactivation expires provider discount and preserves ID/code for reactivation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T00:00:00Z"));
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(providerDiscount))
      .mockResolvedValueOnce(json(providerDiscount));
    try {
      const result = await removeVoucherDiscountSync(voucher);
      expect(result.ok).toBe(true);
      expect(result.metadata).toMatchObject({ providerDiscountCode: "JAZZTEST", providerDiscountId: "dsc_contract", providerDiscountSyncStatus: "disabled" });
      expect(fetch.mock.calls[1][1]?.method).toBe("PATCH");
      expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({ expires_at: "2026-10-13T00:00:00.000Z" });
    } finally { vi.useRealTimers(); }
  });

  test("reports provider disable failure without marking coupon deleted", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json(providerDiscount)).mockResolvedValueOnce(json({}, 503));
    const result = await removeVoucherDiscountSync(voucher);
    expect(result.ok).toBe(false);
    expect(result.metadata.providerDiscountSyncStatus).toBe("failed");
  });

  test("inactive resync keeps provider coupon disabled", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json(providerDiscount)).mockResolvedValueOnce(json(providerDiscount));
    const result = await ensureVoucherDiscountSynced({ ...voucher, isActive: false });
    expect(result.metadata.providerDiscountSyncStatus).toBe("disabled");
    expect(fetch.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  test("does not call provider for FREE_ACCESS codes", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await removeVoucherDiscountSync({ ...voucher, type: "FREE_ACCESS" })).ok).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("invalid limits cannot create an unlimited discount", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await createDodoDiscount({ code: "JAZZTEST", type: "percentage", amount: 2000, usageLimit: 0 })).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
