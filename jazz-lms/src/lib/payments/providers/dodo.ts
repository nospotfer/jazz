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
