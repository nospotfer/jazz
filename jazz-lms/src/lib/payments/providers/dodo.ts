import crypto from "crypto";

export type DodoCheckoutInput = {
  productId: string;
  email: string;
  returnUrl: string;
  metadata: Record<string, string>;
  discountCode?: string;
};

export type DodoApiPaymentRecord = {
  id?: string;
  payment_id?: string;
  status?: string;
  amount?: string | number;
  subtotal_amount?: string | number;
  total_amount?: string | number;
  refund_status?: string | null;
  dispute_status?: string | null;
  refunds?: Array<{ status?: string }>;
  disputes?: Array<{ status?: string }>;
  discount_id?: string | null;
  discounts?: Array<{ discount_id?: string; code?: string }> | null;
  customer?: {
    email?: string;
    customer_id?: string;
  };
  customer_email?: string;
  metadata?: Record<string, unknown>;
};

const DODO_DEFAULT_TIMEOUT_MS = 12_000;
const FIVE_MINUTES_IN_SECONDS = 5 * 60;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getDodoBaseUrl() {
  const explicitUrl = readOptionalEnv("DODO_API_BASE_URL");
  if (explicitUrl) {
    return explicitUrl;
  }

  const mode = readOptionalEnv("DODO_ENVIRONMENT")?.toLowerCase();
  if (mode === "live_mode" || mode === "live") {
    return "https://live.dodopayments.com";
  }

  return "https://test.dodopayments.com";
}

async function toJson(response: Response, signal?: AbortSignal) {
  try {
    const json = await response.json() as Record<string, unknown>;
    signal?.throwIfAborted();
    return json;
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) throw error;
    return null;
  }
}

export type DodoReadOptions = { signal?: AbortSignal };

function readDeadline(callerSignal?: AbortSignal) {
  callerSignal?.throwIfAborted();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);
  return {
    signal: callerSignal ? AbortSignal.any([callerSignal, controller.signal]) : controller.signal,
    dispose: () => clearTimeout(timeout),
  };
}

export class DodoPaginationIncompleteError extends Error {
  constructor() {
    super('Dodo payment history exceeded the bounded pagination limit');
    this.name = 'DodoPaginationIncompleteError';
  }
}

export function isDodoConfigured() {
  return Boolean(
    readOptionalEnv("DODO_PAYMENTS_API_KEY") &&
    readOptionalEnv("DODO_PRODUCT_ID"),
  );
}

export function isDodoWebhookConfigured() {
  return Boolean(readOptionalEnv("DODO_PAYMENTS_WEBHOOK_SECRET"));
}

export function getDodoConfig() {
  return {
    apiKey: readOptionalEnv("DODO_PAYMENTS_API_KEY"),
    webhookSecret: readOptionalEnv("DODO_PAYMENTS_WEBHOOK_SECRET"),
    businessId: readOptionalEnv("DODO_BUSINESS_ID"),
    productId: readOptionalEnv("DODO_PRODUCT_ID"),
    environment: readOptionalEnv("DODO_ENVIRONMENT") ?? "test_mode",
    replayWindowSeconds: Number(
      readOptionalEnv("DODO_WEBHOOK_REPLAY_WINDOW_SECONDS") ??
        String(FIVE_MINUTES_IN_SECONDS),
    ),
  };
}

type DodoDiscountInput = {
  code: string;
  type: 'percentage' | 'flat';
  /** Percentage basis points, or the flat deduction in EUR cents. */
  amount: number;
  usageLimit?: number | null;
  perCustomerUsageLimit?: number | null;
  minimumSubtotal?: number | null;
  expiresAt?: Date | null;
  name?: string | null;
  restrictedToProductIds?: string[];
  voucherId?: string;
  discountId?: string | null;
};

type DodoDiscountResult = {
  ok: boolean;
  discountId?: string;
  code?: string;
  reason?: string;
};

function isManagedDodoDiscount(discount: Record<string, unknown>, voucherId: string | undefined, productIds: string[]) {
  const metadata = discount.metadata as Record<string, unknown> | undefined;
  const tagged = Boolean(voucherId && metadata?.integration === "jazz-lms" && metadata.voucherId === voucherId);
  const restricted = discount.restricted_to;
  return tagged || (Array.isArray(restricted) && restricted.length > 0 &&
    restricted.every((product) => typeof product === "string" && productIds.includes(product)));
}

export async function createDodoDiscount(input: DodoDiscountInput): Promise<DodoDiscountResult> {
  const apiKey = readOptionalEnv('DODO_PAYMENTS_API_KEY');
  if (!apiKey) {
    return { ok: false, reason: 'Missing DODO_PAYMENTS_API_KEY' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);

  try {
    const productIds = input.restrictedToProductIds ?? [readRequiredEnv("DODO_PRODUCT_ID")];
    if (!Number.isFinite(input.amount) || input.amount <= 0 || productIds.length === 0 ||
        (input.type === "percentage" && input.amount > 10000)) {
      return { ok: false, reason: "Invalid discount amount or product restriction" };
    }
    if ((input.usageLimit != null && (!Number.isSafeInteger(input.usageLimit) || input.usageLimit < 1)) ||
        (input.perCustomerUsageLimit != null && (!Number.isSafeInteger(input.perCustomerUsageLimit) || input.perCustomerUsageLimit < 1 ||
          (input.usageLimit != null && input.perCustomerUsageLimit > input.usageLimit))) ||
        (input.minimumSubtotal != null && (!Number.isFinite(input.minimumSubtotal) || input.minimumSubtotal < 0)) ||
        Math.round(input.amount) < 1) {
      return { ok: false, reason: "Invalid discount usage limit or minimum subtotal" };
    }
    const body: Record<string, unknown> = {
      code: input.code.toUpperCase(),
      type: input.type,
      // Flat discounts use currency_options.max_amount_possible for their
      // deduction; `amount` is still required in basis points by Dodo's schema.
      amount: input.type === "flat" ? 10000 : Math.round(input.amount),
      expires_at: input.expiresAt?.toISOString() ?? null,
      usage_limit: input.usageLimit ?? null,
      per_customer_usage_limit: input.perCustomerUsageLimit ?? null,
      restricted_to: productIds,
      ...(input.voucherId ? { metadata: { integration: "jazz-lms", voucherId: input.voucherId } } : {}),
    };
    if (input.type === "flat" || (input.minimumSubtotal ?? 0) > 0) {
      body.currency_options = [{
        currency: "EUR",
        is_default: true,
        minimum_subtotal: Math.max(0, Math.round(input.minimumSubtotal ?? 0)),
        ...(input.type === "flat" ? { max_amount_possible: Math.round(input.amount) } : {}),
      }];
    }
    if (input.name) {
      body.name = input.name;
    }

    const response = await fetch(`${getDodoBaseUrl()}/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = await toJson(response);

    if (!response.ok) {
      const reason = `Dodo discount create failed (${response.status})`;
      // An existing code can belong to another service or have different limits.
      // Verify ownership, then reconcile configuration instead of claiming sync.
      const message = JSON.stringify(json ?? {}).toLowerCase();
      if (
        response.status === 409 ||
        message.includes('already exists') ||
        message.includes('duplicate') ||
        message.includes('code is already')
      ) {
        const lookup = input.discountId ? `/discounts/${encodeURIComponent(input.discountId)}`
          : `/discounts/code/${encodeURIComponent(input.code.toUpperCase())}`;
        const existingResponse = await fetch(`${getDodoBaseUrl()}${lookup}`, {
          headers: { Authorization: `Bearer ${apiKey}` }, signal: controller.signal,
        });
        const existing = await toJson(existingResponse);
        if (!existingResponse.ok || !existing || existing.code !== input.code.toUpperCase() ||
            typeof existing.discount_id !== "string" || !isManagedDodoDiscount(existing, input.voucherId, productIds)) {
          return { ok: false, reason: "Existing provider discount requires ownership review" };
        }
        const updateResponse = await fetch(`${getDodoBaseUrl()}/discounts/${encodeURIComponent(existing.discount_id)}`, {
          method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body), signal: controller.signal,
        });
        if (!updateResponse.ok) return { ok: false, reason: `Dodo discount update failed (${updateResponse.status})` };
        return { ok: true, discountId: existing.discount_id, code: input.code.toUpperCase() };
      }
      return { ok: false, reason };
    }

    const discountId =
      (json?.discount_id as string | undefined) ??
      (json?.id as string | undefined) ??
      undefined;
    const code =
      (json?.code as string | undefined) ?? input.code.toUpperCase();

    return discountId ? { ok: true, discountId, code } : { ok: false, reason: "Dodo discount response missing discount_id" };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error && error.name === 'AbortError'
        ? 'Dodo discount request timed out' : 'Dodo discount request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function disableDodoDiscount(input: {
  code: string; voucherId: string; discountId?: string | null;
}): Promise<DodoDiscountResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);
  try {
    const headers = { Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}` };
    const lookup = input.discountId
      ? `/discounts/${encodeURIComponent(input.discountId)}`
      : `/discounts/code/${encodeURIComponent(input.code.toUpperCase())}`;
    const response = await fetch(`${getDodoBaseUrl()}${lookup}`, { headers, signal: controller.signal });
    if (response.status === 404) return { ok: true, reason: "not_found" };
    const discount = await toJson(response);
    if (!response.ok || !discount || discount.code !== input.code.toUpperCase() ||
        typeof discount.discount_id !== "string" ||
        !isManagedDodoDiscount(discount, input.voucherId, [readRequiredEnv("DODO_PRODUCT_ID")])) {
      return { ok: false, reason: "Provider discount removal requires ownership review" };
    }
    const update = await fetch(`${getDodoBaseUrl()}/discounts/${encodeURIComponent(discount.discount_id)}`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ expires_at: new Date().toISOString() }), signal: controller.signal,
    });
    return update.ok
      ? { ok: true, discountId: discount.discount_id, code: input.code.toUpperCase() }
      : { ok: false, reason: `Dodo discount disable failed (${update.status})` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === 'AbortError'
      ? 'Dodo discount removal timed out' : 'Dodo discount removal failed' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDodoCheckout(
  input: DodoCheckoutInput,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${getDodoBaseUrl()}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: input.productId, quantity: 1 }],
        customer: { email: input.email },
        return_url: input.returnUrl,
        metadata: input.metadata,
        ...(input.discountCode ? { discount_code: input.discountCode } : {}),
      }),
      signal: controller.signal,
    });

    const json = await toJson(response);

    if (!response.ok) {
      // Preserve the existing retry/limit decisions without carrying provider
      // bodies, customer data or tokenized URLs into errors and diagnostics.
      const message = JSON.stringify(json ?? {}).toLowerCase();
      const normalized = message.replace(/[_-]+/g, " ");
      const limit = normalized.includes("discount") && (
        normalized.includes("maximum redemptions") || normalized.includes("max redemptions") ||
        normalized.includes("reached its maximum") || normalized.includes("maximum uses") ||
        normalized.includes("max uses") || normalized.includes("usage limit") ||
        (normalized.includes("redemption") && (normalized.includes("limit") || normalized.includes("reached")))
      );
      const invalid = message.includes("discount") && (
        message.includes("does not exist") || message.includes("invalid") ||
        message.includes("not found") || message.includes("not valid")
      );
      const hint = limit ? ": discount usage limit" : invalid ? ": invalid discount" : "";
      throw Object.assign(new Error(`Dodo checkout create failed (${response.status})${hint}`), {
        status: response.status,
      });
    }

    const checkoutUrl =
      (json?.checkout_url as string | undefined) ??
      (json?.data as { checkout_url?: string } | undefined)?.checkout_url;

    if (!checkoutUrl || typeof checkoutUrl !== "string") {
      throw new Error("Dodo checkout response missing checkout_url");
    }

    return checkoutUrl;
  } finally {
    clearTimeout(timeout);
  }
}

export async function retrieveDodoPayment(
  paymentId: string,
  options?: DodoReadOptions,
): Promise<DodoApiPaymentRecord | null> {
  options?.signal?.throwIfAborted();
  const normalizedPaymentId = paymentId.trim();
  if (!normalizedPaymentId) {
    return null;
  }

  const deadline = readDeadline(options?.signal);

  try {
    const response = await fetch(
      `${getDodoBaseUrl()}/payments/${encodeURIComponent(normalizedPaymentId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}`,
        },
        signal: deadline.signal,
      },
    );

    deadline.signal.throwIfAborted();
    if (response.status === 404) {
      return null;
    }

    const json = await toJson(response, deadline.signal);

    if (!response.ok) {
      throw Object.assign(new Error(`Dodo payment retrieve failed (${response.status})`), {
        status: response.status,
      });
    }

    if (!json) {
      return null;
    }

    const payment = (json.data && typeof json.data === "object"
      ? json.data
      : json) as DodoApiPaymentRecord;
    return { ...payment, id: payment.payment_id ?? payment.id };
  } finally {
    deadline.dispose();
  }
}

/**
 * Lista pagamentos recentes para um determinado email.
 * Usado como fallback de reconciliação quando o webhook falha
 * ou quando a URL de retorno não traz `payment_id`.
 */
export async function listDodoPaymentsForCustomer(input: {
  email: string;
  sinceISO?: string;
  pageSize?: number;
  signal?: AbortSignal;
}): Promise<DodoApiPaymentRecord[]> {
  input.signal?.throwIfAborted();
  const trimmedEmail = input.email.trim().toLowerCase();
  if (!trimmedEmail) {
    return [];
  }

  const deadline = readDeadline(input.signal);

  try {
    const requestPage = async (resource: string, params: URLSearchParams) => {
      deadline.signal.throwIfAborted();
      const response = await fetch(`${getDodoBaseUrl()}/${resource}?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}`,
        },
        signal: deadline.signal,
      });
      deadline.signal.throwIfAborted();
      if (!response.ok) throw new Error(`Dodo ${resource} list failed (${response.status})`);
      const json = await toJson(response, deadline.signal);
      if (!Array.isArray(json?.items)) throw new Error(`Dodo ${resource} list returned an invalid response`);
      return json.items as Record<string, unknown>[];
    };

    // /payments supports customer_id, not customer_email. Resolve every matching
    // customer first; historical checkouts can have more than one customer ID.
    const customerIds = new Set<string>();
    for (let page = 0; page < 10; page += 1) {
      const customers = await requestPage("customers", new URLSearchParams({
        email: trimmedEmail, page_size: "100", page_number: String(page),
      }));
      for (const customer of customers) {
        if (typeof customer.email === "string" && customer.email.trim().toLowerCase() === trimmedEmail &&
            typeof customer.customer_id === "string" && customer.customer_id.trim()) {
          customerIds.add(customer.customer_id);
        }
      }
      if (customers.length < 100) break;
      if (page === 9) throw new DodoPaginationIncompleteError();
    }

    const pageSize = Math.max(1, Math.min(100, Math.trunc(input.pageSize ?? 25)));
    const payments = new Map<string, DodoApiPaymentRecord>();
    for (const customerId of customerIds) {
      for (let page = 0; page < 10; page += 1) {
        const params = new URLSearchParams({
          customer_id: customerId, page_size: String(pageSize), page_number: String(page),
        });
        if (input.sinceISO) params.set("created_at_gte", input.sinceISO);
        const items = await requestPage("payments", params);
        for (const item of items) {
          const payment = item as DodoApiPaymentRecord;
          const id = payment.payment_id ?? payment.id;
          // Defense in depth if provider filtering changes or returns bad data.
          if (typeof id !== "string" || !id.trim() ||
              payment.customer?.email?.trim().toLowerCase() !== trimmedEmail ||
              payment.customer.customer_id !== customerId) continue;
          payments.set(id, { ...payment, id });
        }
        if (items.length < pageSize) break;
        if (page === 9) throw new DodoPaginationIncompleteError();
      }
    }
    deadline.signal.throwIfAborted();
    return [...payments.values()];
  } catch (error) {
    // An outage is different from an empty customer history. Let callers report
    // failed reconciliation instead of silently returning a successful sweep.
    throw error;
  } finally {
    deadline.dispose();
  }
}

export function verifyDodoWebhookSignature(input: {
  payload: string;
  signature: string | null;
  webhookId: string | null;
  webhookTimestamp: string | null;
}): boolean {
  const secret = readOptionalEnv("DODO_PAYMENTS_WEBHOOK_SECRET");
  if (
    !secret ||
    !input.signature ||
    !input.webhookId ||
    !input.webhookTimestamp
  ) {
    return false;
  }

  // Standard Webhooks secrets encode the signing key, rather than supplying
  // the literal UTF-8 key. Dodo may include the `whsec_` prefix.
  const encodedKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedKey)) {
    return false;
  }

  const signingKey = Buffer.from(encodedKey, "base64");
  const canonicalKey = signingKey.toString("base64");
  if (
    signingKey.length === 0 ||
    (encodedKey !== canonicalKey &&
      encodedKey !== canonicalKey.replace(/=+$/, ""))
  ) {
    return false;
  }

  const signedPayload = `${input.webhookId}.${input.webhookTimestamp}.${input.payload}`;
  const digest = crypto
    .createHmac("sha256", signingKey)
    .update(signedPayload)
    .digest("base64");

  const incomingSignatures = input.signature
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.startsWith("v1,"))
    .map((token) => token.slice(3));

  return incomingSignatures.some((candidate) => {
    // Check ASCII/base64 shape before comparing bytes; character length alone
    // allows multibyte input to throw inside timingSafeEqual.
    if (!/^[A-Za-z0-9+/]{43}=$/.test(candidate)) {
      return false;
    }

    const candidateBytes = Buffer.from(candidate, "ascii");
    const digestBytes = Buffer.from(digest, "ascii");
    return crypto.timingSafeEqual(candidateBytes, digestBytes);
  });
}

export function isDodoWebhookTimestampFresh(timestamp: string | null): boolean {
  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return false;
  }

  const parsed = Number(timestamp);
  if (!Number.isSafeInteger(parsed)) {
    return false;
  }

  const replayWindowSeconds = Number(
    readOptionalEnv("DODO_WEBHOOK_REPLAY_WINDOW_SECONDS") ??
      String(FIVE_MINUTES_IN_SECONDS),
  );
  if (!Number.isFinite(replayWindowSeconds) || replayWindowSeconds <= 0) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - parsed) <= Math.max(30, replayWindowSeconds);
}
