import type { SupportedLanguage } from '@/lib/language';

type SupportedPaymentMethod = 'card' | 'paypal';

const supportedPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal']);
const enabledPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal']);

export function isSupportedPaymentMethod(value: unknown): value is SupportedPaymentMethod {
  return typeof value === 'string' && supportedPaymentMethods.has(value as SupportedPaymentMethod);
}

export function isEnabledPaymentMethod(value: SupportedPaymentMethod): boolean {
  return enabledPaymentMethods.has(value);
}

/** A consistency conflict is distinct from a voucher or payment conflict. */
export function isCheckoutSessionChanged(status: number | undefined, data: unknown): boolean {
  return status === 409 && data !== null && typeof data === 'object'
    && !Array.isArray(data) && 'error' in data && data.error === 'Session changed';
}

export function getCheckoutSessionChangedMessage(language: SupportedLanguage): string {
  return {
    es: 'Tu sesión cambió. Actualiza la página antes de continuar.',
    en: 'Your session changed. Refresh the page before continuing.',
    fr: 'Votre session a changé. Actualisez la page avant de continuer.',
    pt: 'Sua sessão mudou. Atualize a página antes de continuar.',
  }[language];
}
