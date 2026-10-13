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
