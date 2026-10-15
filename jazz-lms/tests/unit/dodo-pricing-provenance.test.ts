import { describe, expect, test } from "vitest";
import { extractDodoPricing, resolveDodoVoucherAccounting } from "@/lib/payments/providers/dodo-events";

describe("Dodo quote versus payment provenance", () => {
  test.each([
    ["untagged historical default", { originalPrice: "29.99" }],
    ["new catalog quote", { pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: "29.99", quotedDiscount: "0", quotedFinalPrice: "29.99" }],
    ["tagged quote with obsolete base", { pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: "80", originalPrice: "29.99" }],
  ])("does not manufacture a provider base or nine-cent discount from %s", (_name, metadata) => {
    expect(extractDodoPricing({ data: { currency: "EUR", total_amount: 2990, metadata } })).toMatchObject({
      subtotalAmount: null, totalAmount: 29.9, discountAmount: null,
    });
  });

  test.each([
    ["tax-inclusive payment", { currency: "EUR", tax: 720, total_amount: 7920 }],
    ["adaptive payment currency", { currency: "USD", settlement_currency: "EUR", settlement_amount: 7200, total_amount: 8800 }],
    ["no currency or tax basis", { total_amount: 7200 }],
  ])("does not subtract a catalog quote from %s", (_name, facts) => {
    expect(extractDodoPricing({ data: { ...facts, metadata: { originalPrice: "80", pricingProvenance: "catalog_quote_v1", quotedOriginalPrice: "80", quotedDiscount: "8", quotedFinalPrice: "72" } } })).toMatchObject({
      subtotalAmount: null, totalAmount: "currency" in facts ? facts.total_amount / 100 : null, discountAmount: null,
    });
  });

  test("preserves actual applied coupon identity without guessing its monetary value", () => {
    const payload = { data: { total_amount: 7920, currency: "EUR", tax: 720, discount_id: "discount-fixture",
      discounts: [{ discount_id: "discount-fixture", code: "PROVIDER10" }],
      metadata: { originalPrice: "80", voucherCode: "LOCAL10", providerDiscountCode: "PROVIDER10" } } };
    expect(resolveDodoVoucherAccounting(payload)).toEqual({
      localVoucherCode: "LOCAL10", providerDiscountCode: "PROVIDER10", providerDiscountId: "discount-fixture",
    });
    expect(extractDodoPricing(payload)).toMatchObject({ subtotalAmount: null, totalAmount: 79.2, discountAmount: null });
  });

  test("keeps documented zero final amount without turning the quote into a full discount", () => {
    expect(extractDodoPricing({ data: { total_amount: 0, amount: 8000, metadata: { originalPrice: "80" } } })).toMatchObject({
      subtotalAmount: null, totalAmount: 0, discountAmount: null,
    });
  });

  test.each([undefined, "invalid"])("missing or malformed final amount %j remains unknown despite a catalog quote", (total_amount) => {
    expect(extractDodoPricing({ data: { total_amount, metadata: { originalPrice: "80" } } })).toMatchObject({
      subtotalAmount: null, totalAmount: null, discountAmount: null,
    });
  });

  test("retains comparable legacy provider subtotal and zero-tax EUR discount", () => {
    expect(extractDodoPricing({ data: { subtotal_amount: 8000, total_amount: 7200, currency: "EUR", tax: 0,
      metadata: { originalPrice: "29.99" } } })).toMatchObject({ subtotalAmount: 80, totalAmount: 72, discountAmount: 8 });
  });

  test.each([
    ["tax included", { currency: "EUR", tax: 720, total_amount: 7920 }],
    ["tax basis absent", { currency: "EUR", total_amount: 7200 }],
    ["currency basis absent", { tax: 0, total_amount: 7200 }],
  ])("preserves explicit provider subtotal but avoids a guessed discount with %s", (_name, facts) => {
    expect(extractDodoPricing({ data: { subtotal_amount: 8000, ...facts } })).toMatchObject({
      subtotalAmount: "currency" in facts ? 80 : null, totalAmount: "currency" in facts ? facts.total_amount / 100 : null, discountAmount: null,
    });
  });

  test("preserves comparable explicit provider zero facts", () => {
    expect(extractDodoPricing({ data: { payment: { subtotal_amount: 0, total_amount: 0, currency: "EUR", tax: 0 },
      metadata: { originalPrice: "80" } } })).toMatchObject({ subtotalAmount: 0, totalAmount: 0, discountAmount: 0 });
  });

  test.each([
    ["charged total exceeds base", 9000, null],
    ["equal amounts", 8000, 0],
    ["base exceeds charged total", 7200, 8],
  ])("provider amount ordering: %s with explicit zero-tax EUR basis", (_name, total_amount, discountAmount) => {
    expect(extractDodoPricing({ data: { subtotal_amount: 8000, total_amount, currency: "EUR", tax: 0 } })).toMatchObject({
      subtotalAmount: 80, totalAmount: (total_amount as number) / 100, discountAmount,
    });
  });
});
