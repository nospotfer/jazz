import { describe, expect, test } from 'vitest';
import { isEnabledPaymentMethod, isSupportedPaymentMethod } from '@/lib/checkout-helpers';

describe('checkout helpers', () => {
  test('validates supported payment methods', () => {
    expect(isSupportedPaymentMethod('card')).toBe(true);
    expect(isSupportedPaymentMethod('paypal')).toBe(true);
    expect(isSupportedPaymentMethod('applepay')).toBe(false);
    expect(isSupportedPaymentMethod('pix')).toBe(false);
    expect(isSupportedPaymentMethod(null)).toBe(false);
  });

  test('enabled methods mirror supported methods', () => {
    expect(isEnabledPaymentMethod('card')).toBe(true);
    expect(isEnabledPaymentMethod('paypal')).toBe(true);
  });
});
