import { describe, expect, test } from 'vitest';
import {
  hasSuccessfulDashboardCheckoutReturn,
  shouldResetCheckoutTransientState,
} from '@/lib/checkout-return';

describe('checkout return helpers', () => {
  test('detects successful dashboard checkout return', () => {
    const params = new URLSearchParams('purchase=success&source=dashboard');

    expect(hasSuccessfulDashboardCheckoutReturn(params)).toBe(true);
    expect(shouldResetCheckoutTransientState(params)).toBe(false);
  });

  test('resets transient state when purchase status is missing', () => {
    const params = new URLSearchParams('source=dashboard');

    expect(hasSuccessfulDashboardCheckoutReturn(params)).toBe(false);
    expect(shouldResetCheckoutTransientState(params)).toBe(true);
  });

  test('resets transient state when source is not dashboard', () => {
    const params = new URLSearchParams('purchase=success&source=landing');

    expect(hasSuccessfulDashboardCheckoutReturn(params)).toBe(false);
    expect(shouldResetCheckoutTransientState(params)).toBe(true);
  });
});
