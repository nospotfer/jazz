import { getPaymentCurrencyExponent, minorUnitsToMajor, normalizePaymentAmountMinor, normalizePaymentCurrency } from "@/lib/payment-money";

export type LooseObject = Record<string, unknown>;

export function asObject(value: unknown): LooseObject {
  return value && typeof value === "object" ? (value as LooseObject) : {};
}

export function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toMoney(value: unknown): number {
  const parsed = toNumber(value);
  if (parsed === null) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

function toProviderMoney(value: unknown, currency: string | null): number | null {
  const parsed = toNumber(value);
  if (parsed === null || parsed < 0) {
    return null;
  }

  const hasDecimalSeparator =
    typeof value === "string" && (value.includes(".") || value.includes(","));

  // Legacy integer aliases use explicit provider currency units, never cents by default.
  if (!hasDecimalSeparator && Number.isInteger(parsed)) {
    return minorUnitsToMajor(normalizePaymentAmountMinor(value), currency);
  }

  // Recognized legacy decimal-major facts stay independent of canonical units.
  return parsed <= Number.MAX_SAFE_INTEGER ? parsed : null;
}

export function readCustomString(
  data: LooseObject,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = asString(data[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

export function resolveDodoEventType(payload: LooseObject): string {
  return (
    asString(payload.type) ??
    asString(payload.event_type) ??
    asString(asObject(payload.data).type) ??
    asString(asObject(payload.data).event_type) ??
    "unknown"
  );
}

export function resolveDodoEventId(
  payload: LooseObject,
  webhookIdHeader: string | null,
): string {
  return (
    webhookIdHeader ??
    asString(payload.id) ??
    asString(payload.event_id) ??
    asString(asObject(payload.data).id) ??
    "unknown"
  );
}

export function resolveDodoMetadata(payload: LooseObject): LooseObject {
  const data = asObject(payload.data);
  const metadata = asObject(payload.metadata);
  if (Object.keys(metadata).length > 0) {
    return metadata;
  }

  const dataMetadata = asObject(data.metadata);
  if (Object.keys(dataMetadata).length > 0) {
    return dataMetadata;
  }

  const payment = asObject(data.payment);
  const paymentMetadata = asObject(payment.metadata);
  if (Object.keys(paymentMetadata).length > 0) {
    return paymentMetadata;
  }

  return {};
}

export function resolveDodoProviderReferenceId(
  payload: LooseObject,
): string | null {
  const data = asObject(payload.data);
  const payment = asObject(data.payment);
  const paymentId =
    asString(payment.payment_id) ??
    asString(payment.id) ??
    asString(data.payment_id) ??
    asString(data.id) ??
    asString(payload.id);

  if (!paymentId) {
    return null;
  }

  return `dodo-pay:${paymentId}`;
}

export function normalizeDodoEventKind(
  eventType: string,
): "paid" | "refunded" | "disputed" | "ignored" {
  const normalized = eventType.toLowerCase();

  if (normalized === "payment.succeeded") {
    return "paid";
  }

  if (normalized === "refund.succeeded") {
    return "refunded";
  }

  if (DODO_REVOKING_DISPUTE_EVENTS.includes(normalized)) {
    return "disputed";
  }

  return "ignored";
}

export const DODO_REVOKING_DISPUTE_EVENTS = [
  "dispute.opened",
  "dispute.expired",
  "dispute.accepted",
  "dispute.challenged",
  "dispute.lost",
];

export const DODO_ENTITLEMENT_EVENTS = [
  "refund.succeeded",
  ...DODO_REVOKING_DISPUTE_EVENTS,
  "dispute.won",
  "dispute.cancelled",
];

/** A successful payment remains succeeded after a refund; inspect both states. */
export function isDodoPaymentGrantable(payment: LooseObject): boolean {
  if (asString(payment.status)?.toLowerCase() !== "succeeded") return false;
  if (asString(payment.refund_status)) return false;
  if (Array.isArray(payment.refunds) && payment.refunds.some((refund) =>
    asString(asObject(refund).status)?.toLowerCase() === "succeeded"
  )) return false;
  if (Array.isArray(payment.disputes) && payment.disputes.some((dispute) => {
    const status = asString(asObject(dispute).status)?.toLowerCase();
    return !status || !["dispute_won", "dispute_cancelled"].includes(status);
  })) return false;
  const disputeStatus = asString(payment.dispute_status)?.toLowerCase();
  return !disputeStatus || ["dispute_won", "dispute_cancelled"].includes(disputeStatus);
}

/** Require an owner in metadata or, for legacy payments, a matching email. */
export function doesDodoPaymentBelongToUser(
  payload: LooseObject,
  userId: string,
  userEmail: string | null,
): boolean {
  const metadataUserId = readCustomString(resolveDodoMetadata(payload), "userId", "user_id");
  if (metadataUserId) return metadataUserId === userId;
  return Boolean(userEmail && resolveDodoCustomerEmail(payload) === userEmail.trim().toLowerCase());
}

/** Checkout metadata is only a hint; Dodo's applied discount snapshot is proof. */
export function resolveDodoVoucherAccounting(payload: LooseObject): {
  localVoucherCode: string | null;
  providerDiscountCode: string | null;
  providerDiscountId: string | null;
} {
  const metadata = resolveDodoMetadata(payload);
  const data = asObject(payload.data);
  const payment = Object.keys(asObject(data.payment)).length ? asObject(data.payment) : data;
  const metadataProviderCode = readCustomString(metadata, "providerDiscountCode", "provider_discount_code", "discountCode", "discount_code")?.toUpperCase();
  const discounts = Array.isArray(payment.discounts) ? payment.discounts.map(asObject) : [];
  const applied = discounts.find((discount) => asString(discount.code)?.toUpperCase() === metadataProviderCode) ?? discounts[0];
  const providerDiscountCode = asString(applied?.code)?.toUpperCase() ?? null;
  const providerDiscountId = asString(applied?.discount_id) ?? asString(payment.discount_id);
  return {
    localVoucherCode: providerDiscountCode && providerDiscountCode === metadataProviderCode
      ? readCustomString(metadata, "voucherCode", "voucher_code")
      : null,
    providerDiscountCode,
    providerDiscountId,
  };
}

export function extractDodoPricing(payload: LooseObject): {
  subtotalAmount: number | null;
  totalAmount: number | null;
  discountAmount: number | null;
  paymentCurrency: string | null;
  paymentAmountMinor: string | null;
} {
  const data = asObject(payload.data);
  const payment = asObject(data.payment);
  // Currency, raw total, aliases, subtotal and tax must describe one snapshot.
  // An incomplete nested legacy payment cannot borrow outer financial facts.
  const money = Object.keys(payment).length ? payment : data;
  const paymentCurrency = normalizePaymentCurrency(money.currency);

  // The documented total is integer minor units, including tax. A present
  // malformed total is unknown; a legacy alias must not replace it or real zero.
  const documentedTotal = money.total_amount;
  const legacyTotal = money.amount;
  const paymentAmountMinor = normalizePaymentAmountMinor(documentedTotal !== undefined ? documentedTotal : legacyTotal);
  const totalAmount = documentedTotal !== undefined
    ? minorUnitsToMajor(paymentAmountMinor, paymentCurrency)
    : toProviderMoney(legacyTotal, paymentCurrency);
  const providerSubtotal = money.subtotal_amount;
  // A merchant/catalog quote (including legacy originalPrice metadata) is not
  // a provider subtotal. Nor does a charged total prove an undiscounted base.
  // Retain the explicit legacy subtotal alias, without inventing absent facts.
  const subtotalAmount = providerSubtotal !== undefined
    ? toProviderMoney(providerSubtotal, paymentCurrency) : null;
  const tax = money.tax;
  const digits = getPaymentCurrencyExponent(paymentCurrency);
  // Both legacy provider amounts need the same explicit unit and zero-tax basis.
  const discountAmount = digits !== null && tax === 0 && subtotalAmount !== null && totalAmount !== null && subtotalAmount >= totalAmount
    ? Number((subtotalAmount - totalAmount).toFixed(digits)) : null;

  return {
    subtotalAmount,
    totalAmount,
    discountAmount,
    paymentCurrency,
    paymentAmountMinor,
  };
}

export function resolveDodoCustomerEmail(payload: LooseObject): string | null {
  const data = asObject(payload.data);
  const customer = asObject(data.customer);
  const payment = asObject(data.payment);
  const paymentCustomer = asObject(payment.customer);

  return (
    asString(customer.email)?.toLowerCase() ??
    asString(paymentCustomer.email)?.toLowerCase() ??
    asString(data.customer_email)?.toLowerCase() ??
    asString(payment.customer_email)?.toLowerCase() ??
    null
  );
}

export function resolveDodoCheckoutAttemptId(
  payload: LooseObject,
): string | null {
  const metadata = resolveDodoMetadata(payload);
  return readCustomString(
    metadata,
    "checkoutAttemptId",
    "checkout_attempt_id",
    "attemptId",
    "attempt_id",
  );
}
