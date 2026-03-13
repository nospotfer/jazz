import { describe, expect, test } from 'vitest';
import { isSupportedPaymentMethod, isUnsupportedPaymentMethodStripeError } from '@/lib/checkout-helpers';

describe('checkout helpers', () => {
  test('validates supported payment methods', () => {
    expect(isSupportedPaymentMethod('card')).toBe(true);
    expect(isSupportedPaymentMethod('paypal')).toBe(true);
    expect(isSupportedPaymentMethod('bizum')).toBe(true);
    expect(isSupportedPaymentMethod('pix')).toBe(false);
    expect(isSupportedPaymentMethod(null)).toBe(false);
  });

  test('detects unsupported payment method stripe errors', () => {
    const unsupportedByParam = {
      param: 'payment_method_types',
      message: 'Unsupported payment method',
    } as any;

    const unsupportedByMessage = {
      param: 'foo',
      message: 'Payment method not available',
    } as any;

    const unrelated = {
      param: 'customer',
      message: 'Some other stripe error',
    } as any;

    expect(isUnsupportedPaymentMethodStripeError(unsupportedByParam)).toBe(true);
    expect(isUnsupportedPaymentMethodStripeError(unsupportedByMessage)).toBe(true);
    expect(isUnsupportedPaymentMethodStripeError(unrelated)).toBe(false);
  });
});
