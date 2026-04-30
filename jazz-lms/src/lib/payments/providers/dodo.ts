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
  customer?: {
    email?: string;
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

function toJson(response: Response) {
  return response.json().catch(() => null) as Promise<Record<
    string,
    unknown
  > | null>;
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

export async function createDodoDiscount(input: {
  code: string;
  type: 'percentage' | 'flat';
  /** Para percentage: basis points (20% = 2000). Para flat: USD cents. */
  amount: number;
  usageLimit?: number | null;
  expiresAt?: Date | null;
  name?: string | null;
  restrictedToProductIds?: string[];
}): Promise<{
  ok: boolean;
  discountId?: string;
  code?: string;
  reason?: string;
}> {
  const apiKey = readOptionalEnv('DODO_PAYMENTS_API_KEY');
  if (!apiKey) {
    return { ok: false, reason: 'Missing DODO_PAYMENTS_API_KEY' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      code: input.code.toUpperCase(),
      type: input.type,
      amount: Math.max(1, Math.round(input.amount)),
    };
    if (input.usageLimit && input.usageLimit > 0) {
      body.usage_limit = input.usageLimit;
    }
    if (input.expiresAt) {
      body.expires_at = input.expiresAt.toISOString();
    }
    if (input.name) {
      body.name = input.name;
    }
    if (input.restrictedToProductIds && input.restrictedToProductIds.length > 0) {
      body.restricted_to = input.restrictedToProductIds;
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
      const reason = `Dodo discount create failed (${response.status}): ${JSON.stringify(json ?? {})}`;
      // 409 / already exists is fine: discount já registrado.
      const message = JSON.stringify(json ?? {}).toLowerCase();
      if (
        response.status === 409 ||
        message.includes('already exists') ||
        message.includes('duplicate') ||
        message.includes('code is already')
      ) {
        return { ok: true, code: input.code.toUpperCase(), reason: 'already_exists' };
      }
      return { ok: false, reason };
    }

    const discountId =
      (json?.discount_id as string | undefined) ??
      (json?.id as string | undefined) ??
      undefined;
    const code =
      (json?.code as string | undefined) ?? input.code.toUpperCase();

    return { ok: true, discountId, code };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
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
      throw new Error(
        `Dodo checkout create failed (${response.status}): ${JSON.stringify(json ?? {})}`,
      );
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
): Promise<DodoApiPaymentRecord | null> {
  const normalizedPaymentId = paymentId.trim();
  if (!normalizedPaymentId) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${getDodoBaseUrl()}/payments/${encodeURIComponent(normalizedPaymentId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}`,
        },
        signal: controller.signal,
      },
    );

    if (response.status === 404) {
      return null;
    }

    const json = await toJson(response);

    if (!response.ok) {
      throw new Error(
        `Dodo payment retrieve failed (${response.status}): ${JSON.stringify(json ?? {})}`,
      );
    }

    if (!json) {
      return null;
    }

    if (json.data && typeof json.data === "object") {
      return json.data as DodoApiPaymentRecord;
    }

    return json as DodoApiPaymentRecord;
  } finally {
    clearTimeout(timeout);
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
}): Promise<DodoApiPaymentRecord[]> {
  const trimmedEmail = input.email.trim();
  if (!trimmedEmail) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DODO_DEFAULT_TIMEOUT_MS);

  try {
    const params = new URLSearchParams();
    params.set("customer_email", trimmedEmail);
    params.set("page_size", String(input.pageSize ?? 25));
    if (input.sinceISO) {
      params.set("created_at_gte", input.sinceISO);
    }

    const response = await fetch(
      `${getDodoBaseUrl()}/payments?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${readRequiredEnv("DODO_PAYMENTS_API_KEY")}`,
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      // Loga e devolve vazio: fallback é best-effort.
      const text = await response.text().catch(() => "");
      console.error("[DODO_LIST_PAYMENTS_FAILED]", {
        status: response.status,
        body: text.slice(0, 500),
      });
      return [];
    }

    const json = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!json) {
      return [];
    }

    const items = Array.isArray((json as { items?: unknown[] }).items)
      ? ((json as { items: unknown[] }).items as DodoApiPaymentRecord[])
      : Array.isArray((json as { data?: unknown[] }).data)
        ? ((json as { data: unknown[] }).data as DodoApiPaymentRecord[])
        : [];

    // A API de listagem da Dodo retorna `payment_id`, mas a API de retrieve
    // e os webhooks usam `id`. Normaliza para que o resto do código possa
    // usar `payment.id` indistintamente.
    return items.map((item) => ({
      ...item,
      id: item.id ?? item.payment_id,
    }));
  } catch (error) {
    console.error("[DODO_LIST_PAYMENTS_ERROR]", error);
    return [];
  } finally {
    clearTimeout(timeout);
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

  const signedPayload = `${input.webhookId}.${input.webhookTimestamp}.${input.payload}`;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");

  const incomingSignatures = input.signature
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap((token) => {
      if (token.startsWith("v1,")) {
        return token
          .slice(3)
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return token;
    });

  return incomingSignatures.some((candidate) => {
    if (candidate.length !== digest.length) {
      return false;
    }

    const candidateBytes = new TextEncoder().encode(candidate);
    const digestBytes = new TextEncoder().encode(digest);
    return crypto.timingSafeEqual(candidateBytes, digestBytes);
  });
}

export function isDodoWebhookTimestampFresh(timestamp: string | null): boolean {
  if (!timestamp) {
    return false;
  }

  const parsed = Number(timestamp);
  if (!Number.isFinite(parsed)) {
    return false;
  }

  const replayWindowSeconds = Number(
    readOptionalEnv("DODO_WEBHOOK_REPLAY_WINDOW_SECONDS") ??
      String(FIVE_MINUTES_IN_SECONDS),
  );

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - parsed) <= Math.max(30, replayWindowSeconds);
}
