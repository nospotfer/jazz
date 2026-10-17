import { retrieveDodoPayment, type DodoReadOptions, type DodoApiPaymentRecord } from '@/lib/payments/providers/dodo';
import { asString, isDodoPaymentGrantable, type LooseObject } from '@/lib/payments/providers/dodo-events';

export function dodoPaymentPayload(payment: DodoApiPaymentRecord): LooseObject {
  return {
    type: `payment.${String(payment.status ?? 'unknown').toLowerCase()}`,
    data: { payment },
  };
}

/** List responses omit applied discounts and detailed reversals. Never account
 * for a purchase using checkout hints when a full provider snapshot is available.
 */
export async function retrieveDodoReconciliationSnapshot(
  summary: DodoApiPaymentRecord,
  options?: DodoReadOptions,
): Promise<LooseObject | null> {
  options?.signal?.throwIfAborted();
  if (!isDodoPaymentGrantable(summary)) return null;
  const id = asString(summary.payment_id) ?? asString(summary.id);
  if (!id) return null;
  const detail = options ? await retrieveDodoPayment(id, options) : await retrieveDodoPayment(id);
  options?.signal?.throwIfAborted();
  if (!detail || (asString(detail.payment_id) ?? asString(detail.id)) !== id ||
      !isDodoPaymentGrantable(detail)) return null;
  return dodoPaymentPayload(detail);
}
