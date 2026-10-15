import {
  formatPaymentAmount,
  getPaymentCurrencyExponent,
  minorUnitsToMajor,
  normalizePaymentAmountMinor,
  normalizePaymentCurrency,
} from '@/lib/payment-money';

export type RecordedPayment = {
  paymentCurrency?: unknown;
  paymentAmountMinor?: unknown;
  finalPrice?: unknown;
};
export type CurrencyTotal = { currency: string; amountMinor: string; value: number | null };
export type PaymentTotals = { byCurrency: CurrencyTotal[]; unavailableCount: number };

export function recordedAmountKind(record: RecordedPayment): 'positive' | 'zero' | 'unknown' {
  const minor = normalizePaymentAmountMinor(record.paymentAmountMinor);
  if (minor !== null) return BigInt(minor) === BigInt(0) ? 'zero' : 'positive';
  if (record.paymentAmountMinor != null) return 'unknown';
  const legacy = record.finalPrice;
  return typeof legacy === 'number' && Number.isFinite(legacy) && legacy >= 0
    ? legacy === 0 ? 'zero' : 'positive'
    : 'unknown';
}

export function getExactPayment(record: RecordedPayment): { currency: string; amountMinor: string } | null {
  const currency = normalizePaymentCurrency(record.paymentCurrency);
  const amountMinor = normalizePaymentAmountMinor(record.paymentAmountMinor);
  return currency !== null && getPaymentCurrencyExponent(currency) !== null && amountMinor !== null
    ? { currency, amountMinor }
    : null;
}

/** Legacy floats have no proven unit. They can be displayed as recorded facts, never summed as currency. */
export function summarizePayments(records: RecordedPayment[], averagePaidOnly = false): PaymentTotals {
  const groups = new Map<string, { sum: bigint; count: bigint }>();
  let unavailableCount = 0;
  for (const record of records) {
    const payment = getExactPayment(record);
    if (payment === null) { unavailableCount += 1; continue; }
    const amount = BigInt(payment.amountMinor);
    if (averagePaidOnly && amount === BigInt(0)) continue;
    const group = groups.get(payment.currency) ?? { sum: BigInt(0), count: BigInt(0) };
    group.sum += amount; group.count += BigInt(1);
    groups.set(payment.currency, group);
  }
  const byCurrency = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, group]) => {
    // Round the average once at this currency's minor unit, using integer half-up arithmetic.
    const amountMinor = (averagePaidOnly
      ? (group.sum * BigInt(2) + group.count) / (group.count * BigInt(2))
      : group.sum).toString();
    return { currency, amountMinor, value: minorUnitsToMajor(amountMinor, currency) };
  });
  return { byCurrency, unavailableCount };
}

export function formatRecordedPayment(record: RecordedPayment, locale = 'es-ES'): string {
  const payment = getExactPayment(record);
  if (payment !== null) return formatPaymentAmount(payment.amountMinor, payment.currency, locale) ?? 'No disponible';
  const legacy = record.finalPrice;
  if (typeof legacy !== 'number' || !Number.isFinite(legacy) || legacy < 0) return 'No disponible';
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(legacy)} · Moneda no disponible`;
}
