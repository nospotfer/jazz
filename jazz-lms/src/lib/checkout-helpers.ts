type SupportedPaymentMethod = 'card' | 'paypal';

const supportedPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal']);
const enabledPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal']);

export function isSupportedPaymentMethod(value: unknown): value is SupportedPaymentMethod {
  return typeof value === 'string' && supportedPaymentMethods.has(value as SupportedPaymentMethod);
}

export function isEnabledPaymentMethod(value: SupportedPaymentMethod): boolean {
  return enabledPaymentMethods.has(value);
}
