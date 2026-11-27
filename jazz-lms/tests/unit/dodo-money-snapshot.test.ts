import { expect, test } from "vitest";
import { extractDodoPricing } from "@/lib/payments/providers/dodo-events";

test.each([
  ["nested currency cannot borrow outer total", { currency: "EUR", total_amount: 2990, payment: { currency: "JPY" } }, { paymentCurrency: "JPY", paymentAmountMinor: null, totalAmount: null, subtotalAmount: null, discountAmount: null }],
  ["nested total cannot borrow outer currency", { currency: "KWD", total_amount: 2990, payment: { total_amount: 1234 } }, { paymentCurrency: null, paymentAmountMinor: "1234", totalAmount: null, subtotalAmount: null, discountAmount: null }],
  ["malformed nested canonical total cannot use outer amount or unit", { currency: "KWD", total_amount: 1234, payment: { total_amount: "invalid", amount: 999 } }, { paymentCurrency: null, paymentAmountMinor: null, totalAmount: null, subtotalAmount: null, discountAmount: null }],
  ["nested legacy snapshot cannot borrow a flat canonical zero", { currency: "EUR", total_amount: 0, payment: { amount: 2990, currency: "JPY" } }, { paymentCurrency: "JPY", paymentAmountMinor: "2990", totalAmount: 2990, subtotalAmount: null, discountAmount: null }],
  ["nested snapshot cannot borrow outer subtotal", { subtotal_amount: 9000, payment: { currency: "EUR", total_amount: 8000, tax: 0 } }, { paymentCurrency: "EUR", paymentAmountMinor: "8000", totalAmount: 80, subtotalAmount: null, discountAmount: null }],
  ["nested snapshot cannot borrow outer tax", { tax: 0, payment: { currency: "EUR", total_amount: 8000, subtotal_amount: 9000 } }, { paymentCurrency: "EUR", paymentAmountMinor: "8000", totalAmount: 80, subtotalAmount: 90, discountAmount: null }],
  ["control complete flat KWD", { currency: "KWD", total_amount: 1234 }, { paymentCurrency: "KWD", paymentAmountMinor: "1234", totalAmount: 1.234, subtotalAmount: null, discountAmount: null }],
  ["control complete nested JPY", { currency: "EUR", total_amount: 1234, payment: { currency: "JPY", total_amount: 2990 } }, { paymentCurrency: "JPY", paymentAmountMinor: "2990", totalAmount: 2990, subtotalAmount: null, discountAmount: null }],
])("coherent monetary snapshot: %s", (_name, data, expected) => {
  expect(extractDodoPricing({ data })).toEqual(expected);
});
