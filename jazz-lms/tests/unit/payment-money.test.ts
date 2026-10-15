import { describe, expect, test } from "vitest";
import { formatPaymentAmount, getPaymentCurrencyExponent, minorUnitsToDecimal, minorUnitsToMajor,
  normalizePaymentAmountMinor, normalizePaymentCurrency } from "@/lib/payment-money";

describe("exact payment money", () => {
  test.each([
    ["JPY", "2990", "2990", "JPY 2,990"],
    ["KWD", "1234", "1.234", "KWD 1.234"],
    ["EUR", "2990", "29.90", "EUR 29.90"],
    ["IQD", "1234", "1.234", "IQD 1.234"],
    ["MGA", "1234", "12.34", "MGA 12.34"],
    ["CLF", "12345", "1.2345", "CLF 1.2345"],
  ])("formats %s using explicit SIX units without losing fractional digits", (currency, raw, decimal, formatted) => {
    expect(minorUnitsToDecimal(raw, currency)).toBe(decimal);
    expect(minorUnitsToMajor(raw, currency)).toBe(Number(decimal));
    expect(formatPaymentAmount(raw, currency, "en")?.replace(/\s/g, " ")).toBe(formatted);
  });

  test("does not trust Node Intl's IQD/MGA default fraction settings", () => {
    expect(getPaymentCurrencyExponent("IQD")).toBe(3);
    expect(getPaymentCurrencyExponent("MGA")).toBe(2);
    expect(formatPaymentAmount("1", "IQD", "en")).toContain("0.001");
    expect(formatPaymentAmount("1", "MGA", "en")).toContain("0.01");
  });

  test.each(["ZZZ", "XXX", "XAU", "ANG", "SLL", "VEF", "__proto__", null])("unknown or unsupported %j cannot acquire a default scale", (currency) => {
    expect(normalizePaymentCurrency(currency)).toBeNull();
    expect(minorUnitsToMajor("1234", currency)).toBeNull();
    expect(formatPaymentAmount("1234", currency)).toBeNull();
    expect(minorUnitsToMajor("0", currency)).toBe(0);
    expect(formatPaymentAmount("0", currency)).toBeNull();
  });

  test.each([Number.MAX_SAFE_INTEGER + 1, Number.NaN, Infinity, -1, 1.5, "1.0", "01", " 1", "1e3", "-1", "9".repeat(65)])("rejects unsafe or noncanonical units %j rather than silently coercing", (amount) => {
    expect(normalizePaymentAmountMinor(amount)).toBeNull();
  });

  test("keeps a large exact payment despite an unavailable numeric projection", () => {
    const raw = "9".repeat(64);
    expect(normalizePaymentAmountMinor(raw)).toBe(raw);
    expect(minorUnitsToMajor(raw, "EUR")).toBeNull();
    expect(formatPaymentAmount(raw, "EUR", "en")?.replace(/[\s,]/g, "")).toBe(`EUR${raw.slice(0, -2)}.${raw.slice(-2)}`);
  });

  test("formats aggregate totals beyond the per-payment input limit exactly", () => {
    const sum = (BigInt("9".repeat(64)) * BigInt(2)).toString();
    expect(normalizePaymentAmountMinor(sum)).toBeNull();
    expect(minorUnitsToMajor(sum, "JPY")).toBeNull();
    expect(formatPaymentAmount(sum, "JPY", "en")?.replace(/[\s,]/g, "")).toBe(`JPY${sum}`);
  });

  test("preserves explicit precision and selected locale without changing the amount", () => {
    expect(formatPaymentAmount("1234", "KWD", "fr")?.replace(/\s/g, " ")).toBe("1,234 KWD");
    expect(formatPaymentAmount("0", "KWD", "en")?.replace(/\s/g, " ")).toBe("KWD 0.000");
  });
});
