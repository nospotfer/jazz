import { expect, test } from 'vitest';
import { formatRecordedPayment } from '@/lib/admin/payment-totals';

test.each([null, 'ZZZ'])('raw zero with unknown currency %s overrides a conflicting old amount', paymentCurrency => {
  expect(formatRecordedPayment({ paymentCurrency, paymentAmountMinor: '0', finalPrice: 80 })).toBe('0,00 · Moneda no disponible');
});
test.each([null, 'ZZZ'])('raw zero with unknown currency %s remains available without a legacy amount', paymentCurrency => {
  expect(formatRecordedPayment({ paymentCurrency, paymentAmountMinor: '0' })).toBe('0,00 · Moneda no disponible');
});
test.each([null, 'ZZZ'])('unknown positive raw units %s preserve the independent legacy number without assigning a scale', paymentCurrency => {
  expect(formatRecordedPayment({ paymentCurrency, paymentAmountMinor: '1234', finalPrice: 80 })).toBe('80,00 · Moneda no disponible');
});
test('malformed zero text cannot replace an independently known legacy amount', () => {
  expect(formatRecordedPayment({ paymentCurrency: null, paymentAmountMinor: '00', finalPrice: 80 })).toBe('80,00 · Moneda no disponible');
});
test('unknown positive raw units without a legacy amount remain unavailable', () => {
  expect(formatRecordedPayment({ paymentCurrency: null, paymentAmountMinor: '1234' })).toBe('No disponible');
});
