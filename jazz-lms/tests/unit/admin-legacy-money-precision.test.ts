import { expect, test } from 'vitest';
import { formatRecordedPayment } from '@/lib/admin/payment-totals';

test.each([
  [1.234, '1,234'], [0.001, '0,001'], [0.0000001, '0,0000001'],
  [1e-21, '0,000000000000000000001'],
  [0.012345678901234567, '0,012345678901234567'],
  [80, '80,00'], [0, '0,00'], [-0, '0,00'],
])('legacy final %s keeps its recorded precision and does not acquire a currency', (value, expected) => {
  expect(formatRecordedPayment({ finalPrice: value })).toBe(expected + ' · Moneda no disponible');
});

test('legacy locale formatting preserves precision', () => {
  expect(formatRecordedPayment({ finalPrice: 1.234 }, 'en-US')).toBe('1.234 · Moneda no disponible');
});

test('a tiny positive legacy payment is never presented as zero', () => {
  const amount = formatRecordedPayment({ finalPrice: Number.MIN_VALUE });
  expect(amount).toBe('0,' + '0'.repeat(323) + '5 · Moneda no disponible');
});

test.each([null, undefined, NaN, Infinity, -1])('unavailable or invalid legacy final %s remains unavailable', finalPrice => {
  expect(formatRecordedPayment({ finalPrice })).toBe('No disponible');
});

test('verified canonical minor units keep their own precision and override a conflicting legacy amount', () => {
  expect(formatRecordedPayment({ paymentCurrency: 'KWD', paymentAmountMinor: '1234', finalPrice: 80 })).toBe('1,234\u00a0KWD');
  expect(formatRecordedPayment({ paymentCurrency: 'EUR', paymentAmountMinor: '0', finalPrice: 80 })).toBe('0,00\u00a0EUR');
});
