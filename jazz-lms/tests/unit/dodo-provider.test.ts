import {
  isDodoWebhookTimestampFresh,
  verifyDodoWebhookSignature,
} from "@/lib/payments/providers/dodo";
import crypto from "crypto";
import { afterEach, describe, expect, test, vi } from "vitest";

// A fixed provider-contract vector using raw key bytes 0..31, independently
// signed with HMAC-SHA256. Dodo/Standard Webhooks expose those bytes as base64:
// https://docs.dodopayments.com/developer-resources/webhooks#manual-verification-alternative
const encodedKey = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8="; // gitleaks:allow -- public test bytes 0..31
const vector = {
  payload:
    '{"type":"payment.succeeded","data":{"payment_id":"pay_contract","total_amount":15900}}',
  webhookId: "msg_contract_example",
  webhookTimestamp: "1704067200",
  signature: "v1,UaJwW24q6LGkOX6pZKJs390FMYbsLso66nkM5Ku+89o=",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("dodo provider webhook helpers", () => {
  test.each([`whsec_${encodedKey}`, encodedKey, encodedKey.slice(0, -1)])(
    "accepts a provider-signed vector with encoded key %s",
    (secret) => {
      vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", secret);
      expect(verifyDodoWebhookSignature(vector)).toBe(true);
    },
  );

  test("rejects a signature made using the literal encoded secret as the key", () => {
    const secret = `whsec_${encodedKey}`;
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", secret);
    const incorrectDigest = crypto
      .createHmac("sha256", secret)
      .update(`${vector.webhookId}.${vector.webhookTimestamp}.${vector.payload}`)
      .digest("base64");

    expect(
      verifyDodoWebhookSignature({ ...vector, signature: `v1,${incorrectDigest}` }),
    ).toBe(false);
  });

  test("accepts any valid v1 signature during key rotation", () => {
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", `whsec_${encodedKey}`);
    expect(
      verifyDodoWebhookSignature({
        ...vector,
        signature: `v1,${"A".repeat(43)}= ${vector.signature}`,
      }),
    ).toBe(true);
  });

  test.each([
    { payload: `${vector.payload}\n` },
    { webhookId: "msg_other" },
    { webhookTimestamp: "1704067201" },
  ])("rejects tampering of any signed field: %j", (mutation) => {
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", `whsec_${encodedKey}`);
    expect(verifyDodoWebhookSignature({ ...vector, ...mutation })).toBe(false);
  });

  test.each([
    null,
    "",
    "v1,wrong-signature",
    vector.signature.slice(3),
    vector.signature.replace("v1,", "v2,"),
    "v1," + "é".repeat(44),
    "v1," + "😀".repeat(22),
    `${vector.signature};other`,
  ])("rejects malformed or unsupported signatures without throwing: %s", (signature) => {
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", `whsec_${encodedKey}`);
    expect(verifyDodoWebhookSignature({ ...vector, signature })).toBe(false);
  });

  test.each(["", "whsec_", "secret_test", "whsec_%%%", "whsec_A=", "whsec_AB=="])(
    "rejects missing or malformed signing keys without throwing: %s",
    (secret) => {
      vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", secret);
      expect(verifyDodoWebhookSignature(vector)).toBe(false);
    },
  );

  test.each([{ webhookId: null }, { webhookTimestamp: null }])(
    "rejects missing signed headers: %j",
    (mutation) => {
      vi.stubEnv("DODO_PAYMENTS_WEBHOOK_SECRET", `whsec_${encodedKey}`);
      expect(verifyDodoWebhookSignature({ ...vector, ...mutation })).toBe(false);
    },
  );

  test("accepts fresh timestamps and rejects stale or future timestamps", () => {
    vi.stubEnv("DODO_WEBHOOK_REPLAY_WINDOW_SECONDS", "300");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const now = 1704067200;
    expect(isDodoWebhookTimestampFresh(String(now))).toBe(true);
    expect(isDodoWebhookTimestampFresh(String(now - 300))).toBe(true);
    expect(isDodoWebhookTimestampFresh(String(now - 301))).toBe(false);
    expect(isDodoWebhookTimestampFresh(String(now + 301))).toBe(false);
    expect(isDodoWebhookTimestampFresh(null)).toBe(false);
    expect(isDodoWebhookTimestampFresh("not-a-timestamp")).toBe(false);
  });

  test.each(["Infinity", "not-a-number", "0", "-1"])("invalid replay-window configuration fails closed: %s", (window) => {
    vi.stubEnv("DODO_WEBHOOK_REPLAY_WINDOW_SECONDS", window);
    expect(isDodoWebhookTimestampFresh(String(Math.floor(Date.now() / 1000)))).toBe(false);
  });
});
