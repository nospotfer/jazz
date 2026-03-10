import Stripe from 'stripe';

type SupportedPaymentMethod = 'card' | 'paypal' | 'bizum';

const supportedPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal', 'bizum']);

export function isSupportedPaymentMethod(value: unknown): value is SupportedPaymentMethod {
  return typeof value === 'string' && supportedPaymentMethods.has(value as SupportedPaymentMethod);
}

export function isUnsupportedPaymentMethodStripeError(error: Stripe.errors.StripeInvalidRequestError): boolean {
  const param = (error.param || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  return (
    param.includes('payment_method_types') ||
    param.includes('automatic_payment_methods') ||
    message.includes('payment method') ||
    message.includes('unsupported') ||
    message.includes('not available')
  );
}
