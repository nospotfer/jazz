import {
  isDodoWebhookTimestampFresh,
  verifyDodoWebhookSignature,
} from "@/lib/payments/providers/dodo";
import crypto from "crypto";
import { describe, expect, test } from "vitest";

describe("dodo provider webhook helpers", () => {
  test("accepts valid webhook signature", () => {
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET = "secret_test";

    const payload = JSON.stringify({ type: "payment.succeeded" });
    const webhookId = "wh_evt_1";
    const webhookTimestamp = String(Math.floor(Date.now() / 1000));
    const signedPayload = `${webhookId}.${webhookTimestamp}.${payload}`;
    const digest = crypto
      .createHmac("sha256", process.env.DODO_PAYMENTS_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("base64");

    const valid = verifyDodoWebhookSignature({
      payload,
      signature: `v1,${digest}`,
      webhookId,
      webhookTimestamp,
    });

    expect(valid).toBe(true);
  });

  test("rejects invalid webhook signature", () => {
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET = "secret_test";

    const valid = verifyDodoWebhookSignature({
      payload: JSON.stringify({ ok: true }),
      signature: "v1,wrong-signature",
      webhookId: "wh_evt_1",
      webhookTimestamp: String(Math.floor(Date.now() / 1000)),
    });

    expect(valid).toBe(false);
  });

  test("accepts fresh timestamp and rejects stale timestamp", () => {
    process.env.DODO_WEBHOOK_REPLAY_WINDOW_SECONDS = "300";

    const now = Math.floor(Date.now() / 1000);
    expect(isDodoWebhookTimestampFresh(String(now))).toBe(true);
    expect(isDodoWebhookTimestampFresh(String(now - 301))).toBe(false);
  });
});
