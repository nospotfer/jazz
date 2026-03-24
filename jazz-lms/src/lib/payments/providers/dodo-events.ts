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

  if (typeof value === "string" && value.includes(".")) {
    return Number(parsed.toFixed(2));
  }

  if (parsed > 1000) {
    return Number((parsed / 100).toFixed(2));
  }

  return Number(parsed.toFixed(2));
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

  if (
    normalized.includes("payment.succeeded") ||
    normalized.includes("payment.paid") ||
    normalized.includes("payment.completed") ||
    normalized.includes("payment.captured") ||
    normalized.includes("subscription.renewed") ||
    normalized.includes("subscription.created") ||
    normalized.includes("subscription.activated")
  ) {
    return "paid";
  }

  if (normalized.includes("refund")) {
    return "refunded";
  }

  if (normalized.includes("dispute")) {
    return "disputed";
  }

  return "ignored";
}

export function extractDodoPricing(payload: LooseObject): {
  subtotalAmount: number;
  totalAmount: number;
  discountAmount: number;
} {
  const metadata = resolveDodoMetadata(payload);
  const data = asObject(payload.data);
  const payment = asObject(data.payment);

  const totalAmount =
    toMoney(payment.amount) ||
    toMoney(data.amount) ||
    toMoney(payment.total_amount) ||
    toMoney(data.total_amount);
  const subtotalAmount =
    toMoney(payment.subtotal_amount) ||
    toMoney(data.subtotal_amount) ||
    toMoney(metadata.originalPrice) ||
    totalAmount;
  const discountAmount = Number(
    Math.max(0, subtotalAmount - totalAmount).toFixed(2),
  );

  return {
    subtotalAmount,
    totalAmount,
    discountAmount,
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
