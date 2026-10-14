import { describe, expect, test } from "vitest";

import {
  doesDodoPaymentBelongToUser,
  extractDodoPricing,
  isDodoPaymentGrantable,
  normalizeDodoEventKind,
  resolveDodoProviderReferenceId,
  resolveDodoVoucherAccounting,
} from "@/lib/payments/providers/dodo-events";

describe("Dodo provider payment contracts", () => {
  test("resolves documented payment_id in flat webhook and nested API payloads", () => {
    expect(resolveDodoProviderReferenceId({ data: { payment_id: "pay_flat" } })).toBe("dodo-pay:pay_flat");
    expect(resolveDodoProviderReferenceId({ data: { payment: { payment_id: "pay_detail" } } })).toBe("dodo-pay:pay_detail");
  });

  test.each([
    ["payment.succeeded", "paid"], ["refund.succeeded", "refunded"],
    ["refund.failed", "ignored"], ["refund.created", "ignored"],
    ["dispute.opened", "disputed"], ["dispute.lost", "disputed"],
    ["dispute.won", "ignored"], ["dispute.cancelled", "ignored"],
    ["subscription.created", "ignored"], ["subscription.renewed", "ignored"],
    ["fake.payment.succeeded", "ignored"], ["payment.failed", "ignored"],
  ])("classifies only supported financial events: %s", (event, kind) => {
    expect(normalizeDodoEventKind(event)).toBe(kind);
  });

  test.each([
    { status: "failed" }, { status: "succeeded", refund_status: "full" },
    { status: "succeeded", refund_status: "partial" },
    { status: "succeeded", refunds: [{ status: "succeeded" }] },
    { status: "succeeded", dispute_status: "dispute_lost" },
  ])("does not grant refunded, disputed or unpaid payment: %j", (payment) => {
    expect(isDodoPaymentGrantable(payment)).toBe(false);
  });

  test("allows successful payments with failed refunds or resolved disputes", () => {
    expect(isDodoPaymentGrantable({ status: "succeeded", refunds: [{ status: "failed" }] })).toBe(true);
    expect(isDodoPaymentGrantable({ status: "succeeded", dispute_status: "dispute_won" })).toBe(true);
  });

  test("requires matching metadata owner or matching legacy customer email", () => {
    const payload = { data: { customer: { email: "buyer@example.test" } }, metadata: { courseId: "course" } };
    expect(doesDodoPaymentBelongToUser(payload, "buyer", "buyer@example.test")).toBe(true);
    expect(doesDodoPaymentBelongToUser(payload, "other", "other@example.test")).toBe(false);
    expect(doesDodoPaymentBelongToUser(payload, "buyer", null)).toBe(false);
    expect(doesDodoPaymentBelongToUser({ ...payload, metadata: { userId: "other" } }, "buyer", "buyer@example.test")).toBe(false);
  });

  test("removed or absent applied discounts cannot consume a voucher named in metadata", () => {
    const metadata = { voucherCode: "JAZZ20", providerDiscountCode: "DODO20" };
    expect(resolveDodoVoucherAccounting({ data: { total_amount: 2999, discount_id: null, discounts: [], metadata } })).toEqual({
      localVoucherCode: null, providerDiscountCode: null, providerDiscountId: null,
    });
    expect(resolveDodoVoucherAccounting({ data: { total_amount: 2999, metadata } })).toEqual({
      localVoucherCode: null, providerDiscountCode: null, providerDiscountId: null,
    });
  });

  test("uses provider applied coupon when buyer replaces original checkout voucher", () => {
    const payload = { data: {
      payment_id: "pay_actual", discounts: [{ code: "NEWCODE", discount_id: "dsc_new" }],
      metadata: { voucherCode: "OLDLOCAL", providerDiscountCode: "OLDCODE" },
    } };
    expect(resolveDodoVoucherAccounting(payload)).toEqual({ localVoucherCode: null, providerDiscountCode: "NEWCODE", providerDiscountId: "dsc_new" });
    payload.data.discounts = [{ code: "OLDCODE", discount_id: "dsc_old" }];
    expect(resolveDodoVoucherAccounting(payload)).toEqual({ localVoucherCode: "OLDLOCAL", providerDiscountCode: "OLDCODE", providerDiscountId: "dsc_old" });
  });
});

describe("extractDodoPricing", () => {
  test.each([
    ["legacy total", { amount: -100, metadata: { originalPrice: "29.99" } }, { subtotalAmount: 29.99, totalAmount: null, discountAmount: null }],
    ["legacy subtotal", { subtotal_amount: -100, total_amount: 2990 }, { subtotalAmount: null, totalAmount: 29.9, discountAmount: null }],
    ["metadata base", { total_amount: 2990, metadata: { originalPrice: "-5" } }, { subtotalAmount: null, totalAmount: 29.9, discountAmount: null }],
  ])("keeps negative %s money unknown", (_name, data, expected) => {
    expect(extractDodoPricing({ data })).toEqual(expected);
  });

  test.each([undefined, null, "", "invalid", NaN, Infinity, {}, 123.5, -1, Number.MAX_SAFE_INTEGER + 1])(
    "keeps missing or malformed documented total unknown (%j)", (total_amount) => {
      expect(extractDodoPricing({ data: { total_amount, metadata: { originalPrice: "29.99" } } })).toEqual({
        subtotalAmount: 29.99, totalAmount: null, discountAmount: null,
      });
    },
  );

  test("keeps all absent monetary facts unknown without metadata", () => {
    expect(extractDodoPricing({ data: {} })).toEqual({
      subtotalAmount: null, totalAmount: null, discountAmount: null,
    });
  });

  test("keeps present malformed base metadata unknown without replacing it with the total", () => {
    expect(extractDodoPricing({ data: { total_amount: 2990, metadata: { originalPrice: "invalid" } } })).toEqual({
      subtotalAmount: null, totalAmount: 29.9, discountAmount: null,
    });
  });

  test.each([
    { total_amount: 0, amount: 2990 },
    { payment: { total_amount: 0, amount: 2990 } },
    { payment: { amount: 2990 }, total_amount: 0 },
  ])("preserves documented zero over the legacy amount alias (%j)", (data) => {
    expect(extractDodoPricing({ data: { ...data, metadata: { originalPrice: "29.99" } } })).toEqual({
      subtotalAmount: 29.99, totalAmount: 0, discountAmount: 29.99,
    });
  });

  test("uses documented total over a conflicting legacy amount", () => {
    expect(extractDodoPricing({ data: { total_amount: 2490, amount: 2990 } }).totalAmount).toBe(24.9);
  });

  test("does not substitute a legacy alias for a present malformed documented total", () => {
    expect(extractDodoPricing({ data: { total_amount: "invalid", amount: 990 } }).totalAmount).toBeNull();
  });

  test("does not substitute flat totals or aliases for a present malformed nested total", () => {
    expect(extractDodoPricing({ data: { payment: { total_amount: "invalid" }, total_amount: 2490, amount: 2990 } }).totalAmount).toBeNull();
  });

  test("preserves explicit zero subtotal and zero metadata base instead of using truthiness", () => {
    expect(extractDodoPricing({ data: { subtotal_amount: 0, total_amount: 0, metadata: { originalPrice: "29.99" } } })).toEqual({
      subtotalAmount: 0, totalAmount: 0, discountAmount: 0,
    });
    expect(extractDodoPricing({ data: { total_amount: 2490, metadata: { originalPrice: "0" } } })).toEqual({
      subtotalAmount: 0, totalAmount: 24.9, discountAmount: 0,
    });
  });

  test("retains legacy decimal major-unit compatibility when documented total is absent", () => {
    expect(extractDodoPricing({ data: { payment: { amount: "9.90" }, metadata: { originalPrice: "29.99" } } })).toEqual({
      subtotalAmount: 29.99, totalAmount: 9.9, discountAmount: 20.09,
    });
  });

  test("converts integer provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 2990,
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 29.9,
      totalAmount: 29.9,
      discountAmount: 0,
    });
  });

  test("converts low-value integer provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 990,
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 9.9,
      totalAmount: 9.9,
      discountAmount: 0,
    });
  });

  test("converts integer string provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: "1000",
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 10,
      totalAmount: 10,
      discountAmount: 0,
    });
  });

  test("keeps metadata originalPrice as major units when provider subtotal is missing", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 990,
        },
        metadata: {
          originalPrice: "29",
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 29,
      totalAmount: 9.9,
      discountAmount: 19.1,
    });
  });
});
