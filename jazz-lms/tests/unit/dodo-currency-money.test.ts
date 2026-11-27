import { describe, expect, test } from "vitest";
import { extractDodoPricing } from "@/lib/payments/providers/dodo-events";

describe("provider payment currency and exact minor units", () => {
  test.each([
    ["JPY", 2990, 2990], ["KWD", 1234, 1.234], ["EUR", 2990, 29.9],
    ["IQD", 1234, 1.234], ["MGA", 1234, 12.34],
  ])("uses explicit %s scale without assuming cents or Intl defaults", (currency, total_amount, totalAmount) => {
    expect(extractDodoPricing({ data: { currency, total_amount } })).toMatchObject({
      totalAmount, paymentCurrency: currency, paymentAmountMinor: String(total_amount),
      subtotalAmount: null, discountAmount: null,
    });
  });

  test.each([undefined, null, "", "ZZZ", "XXX", "SLL", "ANG"])("retains raw units with unknown or unsupported currency %j without making a positive major amount", (currency) => {
    expect(extractDodoPricing({ data: { currency, total_amount: 2990, settlement_currency: "EUR", settlement_amount: 2990,
      metadata: { currency: "EUR", originalPrice: "29.90" } } })).toMatchObject({
      totalAmount: null, paymentCurrency: null, paymentAmountMinor: "2990",
      subtotalAmount: null, discountAmount: null,
    });
  });

  test.each(["JPY", "KWD", undefined])("preserves actual zero for %j independently of the unknown unit label", (currency) => {
    expect(extractDodoPricing({ data: { currency, total_amount: 0, amount: 2990 } })).toMatchObject({
      totalAmount: 0, paymentCurrency: currency ?? null, paymentAmountMinor: "0",
    });
  });

  test.each([null, "invalid", -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("a malformed canonical total %j never falls back to a legacy alias", (total_amount) => {
    expect(extractDodoPricing({ data: { currency: "JPY", total_amount, amount: 2990 } })).toMatchObject({
      totalAmount: null, paymentCurrency: "JPY", paymentAmountMinor: null,
    });
  });

  test("does not hide malformed nested totals/currency behind valid outer fields", () => {
    expect(extractDodoPricing({ data: { payment: { total_amount: "invalid", currency: "ZZZ" }, total_amount: 1234,
      currency: "KWD", amount: 2990 } })).toMatchObject({ totalAmount: null, paymentCurrency: null, paymentAmountMinor: null });
  });

  test("keeps exact large canonical text while refusing an unsafe float projection", () => {
    expect(extractDodoPricing({ data: { currency: "EUR", total_amount: "9".repeat(64) } })).toMatchObject({
      totalAmount: null, paymentCurrency: "EUR", paymentAmountMinor: "9".repeat(64),
    });
  });
});
