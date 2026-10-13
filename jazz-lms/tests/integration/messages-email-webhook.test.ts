import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(), query: vi.fn(), execute: vi.fn(), transaction: vi.fn(), receiving: vi.fn(), send: vi.fn(),
}));
vi.mock("@/lib/messages-db", () => ({ ensureMessagingTables: mocks.ensure }));
vi.mock("@/lib/db", () => ({ db: { $queryRawUnsafe: mocks.query, $transaction: mocks.transaction } }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true }), createRateLimitHeaders: () => ({}),
}));
vi.mock("resend", async importOriginal => {
  const actual = await importOriginal<typeof import("resend")>();
  return { ...actual, Resend: class {
    webhooks = new actual.Resend("re_isolated_verification").webhooks;
    emails = { receiving: { get: mocks.receiving }, send: mocks.send };
  } };
});

const key = Buffer.from("isolated-independent-messaging-signature-key");
const secret = `whsec_${key.toString("base64")}`;
const emailId = "931b4143-0662-4d15-8bfb-a881760b7412";
const threadId = "11111111-1111-4111-8111-111111111111";
const professor = "professor@example.invalid";
const event = { type: "email.received", created_at: "2026-10-13T00:00:00Z", data: {
  email_id: emailId, from: professor, to: ["inbox@example.invalid"], subject: `Re: Question [Thread:${threadId}]`,
} };

function signedRequest(payload: unknown = event, options: { timestamp?: number; tamper?: boolean; headers?: Record<string, string> } = {}) {
  const raw = `${JSON.stringify(payload, null, 2)}\n`;
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  const id = "msg_independent_messaging_vector";
  // Independently construct the provider's documented HMAC message; verification
  // is performed by the real Resend SDK, not a mocked verifier or signer.
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  return new Request("http://localhost/api/webhooks/messages-email", { method: "POST", headers: {
    "content-type": "application/json", "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}`,
    ...options.headers,
  }, body: options.tamper ? raw.replace("Question", "Tampered") : raw });
}

async function post(request: Request) {
  return (await import("@/app/api/webhooks/messages-email/route")).POST(request);
}

function expectNoDatabaseWork() {
  expect(mocks.ensure).not.toHaveBeenCalled();
  expect(mocks.query).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("PROFESSOR_EMAIL", professor);
  vi.stubEnv("RESEND_API_KEY", "re_isolated_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "Jazz <no-reply@example.invalid>");
  vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
  vi.stubEnv("INBOUND_EMAIL_WEBHOOK_SECRET", "");
  mocks.ensure.mockResolvedValue(undefined);
  mocks.query.mockResolvedValue([{ id: threadId, subject: "Question", studentId: "isolated-student", studentEmail: "student@example.invalid" }]);
  mocks.execute.mockResolvedValue(1);
  mocks.transaction.mockImplementation(callback => callback({ $executeRawUnsafe: mocks.execute }));
  mocks.receiving.mockResolvedValue({ data: {
    id: emailId, from: professor, subject: `Re: Question [Thread:${threadId}]`, text: "Here is the professor's answer.", html: null,
    authentication: { spf: "pass", dkim: "pass", dmarc: "pass" },
  }, error: null });
  mocks.send.mockResolvedValue({ data: { id: "isolated-notification" }, error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("native Resend professor replies", () => {
  test("rejects unsigned requests before readiness, database or provider work", async () => {
    const response = await post(new Request("http://localhost/api/webhooks/messages-email", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
    expectNoDatabaseWork();
    expect(mocks.receiving).not.toHaveBeenCalled();
  });

  test("verifies raw signed metadata, retrieves content and inserts a typed atomic reply", async () => {
    const response = await post(signedRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, threadId, studentId: "isolated-student" });
    expect(mocks.receiving).toHaveBeenCalledWith(emailId, { html_format: "cid" });
    expect(mocks.receiving.mock.invocationCallOrder[0]).toBeLessThan(mocks.ensure.mock.invocationCallOrder[0]);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('studentEmail AS "studentEmail"'), threadId);
    expect(mocks.execute.mock.calls[0]).toEqual([expect.stringContaining("ON CONFLICT (id) DO NOTHING"), `resend-email:${emailId}`, threadId, professor, "Here is the professor's answer.", expect.any(String)]);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "student@example.invalid" }));
  });

  test.each(["tampered", "expired", "future"])("rejects %s native signatures without legacy downgrade", async kind => {
    vi.stubEnv("INBOUND_EMAIL_WEBHOOK_SECRET", "legacy-test-secret");
    const request = signedRequest(event, { tamper: kind === "tampered", timestamp: kind === "expired" ? Math.floor(Date.now() / 1000) - 600 : kind === "future" ? Math.floor(Date.now() / 1000) + 600 : undefined, headers: { "x-inbox-secret": "legacy-test-secret" } });
    expect((await post(request)).status).toBe(401);
    expectNoDatabaseWork();
    expect(mocks.receiving).not.toHaveBeenCalled();
  });

  test("does not downgrade partial signature headers to a valid relay secret", async () => {
    vi.stubEnv("INBOUND_EMAIL_WEBHOOK_SECRET", "legacy-test-secret");
    const request = new Request("http://localhost/api/webhooks/messages-email", { method: "POST", headers: { "svix-id": "partial", "x-inbox-secret": "legacy-test-secret" }, body: "{}" });
    expect((await post(request)).status).toBe(401);
    expectNoDatabaseWork();
  });

  test.each([{ dkim: "fail", dmarc: "pass" }, { dkim: "pass", dmarc: "fail" }, undefined])("fails closed on unverified sender authentication %j", async authentication => {
    mocks.receiving.mockResolvedValue({ data: { id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, text: "Forged professor message", headers: { "authentication-results": "dkim=pass; dmarc=pass" }, authentication }, error: null });
    expect((await post(signedRequest())).status).toBe(202);
    expectNoDatabaseWork();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("ignores other senders before retrieving body", async () => {
    expect((await post(signedRequest({ ...event, data: { ...event.data, from: "other@example.invalid" } }))).status).toBe(202);
    expect(mocks.receiving).not.toHaveBeenCalled();
    expectNoDatabaseWork();
  });

  test("rejects a receiving response whose From differs from the configured professor", async () => {
    mocks.receiving.mockResolvedValue({ data: { id: emailId, from: "attacker@example.invalid", authentication: { dkim: "pass", dmarc: "pass" } }, error: null });
    expect((await post(signedRequest())).status).toBe(202);
    expectNoDatabaseWork();
  });

  test("retries provider failures without touching messaging data", async () => {
    mocks.receiving.mockResolvedValue({ data: null, error: { name: "internal_server_error" } });
    expect((await post(signedRequest())).status).toBe(503);
    expectNoDatabaseWork();
  });

  test("handles HTML-only content as text without evaluating or fetching markup", async () => {
    mocks.receiving.mockResolvedValue({ data: { id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, text: null, html: "<script>alert('unsafe')</script><p>Hello &amp; welcome</p><p>Listen to jazz.</p>", authentication: { dkim: "pass", dmarc: "pass" } }, error: null });
    expect((await post(signedRequest())).status).toBe(200);
    expect(mocks.execute.mock.calls[0][4]).toBe("Hello & welcome\nListen to jazz.");
  });

  test("parses nested script/style markup and preserves a thread marker in HTML-only body text", async () => {
    mocks.receiving.mockResolvedValue({ data: {
      id: emailId, from: professor, subject: 'Professor reply', text: null,
      html: `<script><script>hidden()</script></script><style><style>hidden</style></style><p>Thread ID: ${threadId}</p><p>&#x1F3B7; &eacute; answer</p>`,
      authentication: { dkim: 'pass', dmarc: 'pass' },
    }, error: null });
    expect((await post(signedRequest())).status).toBe(200);
    expect(mocks.execute.mock.calls[0][4]).toBe(`Thread ID: ${threadId}\n🎷 é answer`);
    expect(mocks.send.mock.calls[0][0].text).toContain('🎷 é answer');
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty('html');
  });

  test("prefers supplied plain text and keeps literal markup in a text-only notification", async () => {
    const text = '<script>literal professor example</script>';
    mocks.receiving.mockResolvedValue({ data: {
      id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, text,
      html: 'x'.repeat(100_001), authentication: { dkim: 'pass', dmarc: 'pass' },
    }, error: null });
    expect((await post(signedRequest())).status).toBe(200);
    expect(mocks.execute.mock.calls[0][4]).toBe(text);
    expect(mocks.send.mock.calls[0][0].text).toContain(text);
    expect(mocks.send.mock.calls[0][0]).not.toHaveProperty('html');
  });

  test.each([
    { text: null, html: 'x'.repeat(100_001) },
    { text: null, html: `${'<div>'.repeat(300)}Deep reply${'</div>'.repeat(300)}` },
    { text: 'x'.repeat(100_001), html: null },
  ])("rejects oversized/deep receiving content before database or notification work", async body => {
    mocks.receiving.mockResolvedValue({ data: {
      id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, ...body,
      authentication: { dkim: 'pass', dmarc: 'pass' },
    }, error: null });
    expect((await post(signedRequest())).status).toBe(413);
    expectNoDatabaseWork();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("ignores unauthenticated sender before even attempting oversized HTML conversion", async () => {
    mocks.receiving.mockResolvedValue({ data: {
      id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, text: null,
      html: 'x'.repeat(100_001), authentication: { dkim: 'fail', dmarc: 'pass' },
    }, error: null });
    expect((await post(signedRequest())).status).toBe(202);
    expectNoDatabaseWork();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("rejects script-only HTML whose conversion has no message body", async () => {
    mocks.receiving.mockResolvedValue({ data: {
      id: emailId, from: professor, subject: `Question [Thread:${threadId}]`, text: null,
      html: '<script>hidden</script><style>hidden</style>', authentication: { dkim: 'pass', dmarc: 'pass' },
    }, error: null });
    expect((await post(signedRequest())).status).toBe(400);
    expectNoDatabaseWork();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("acknowledges retries without updating thread or resending notifications", async () => {
    mocks.execute.mockResolvedValueOnce(0);
    const response = await post(signedRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicateSkipped: true });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test("returns a clear unavailable response when an authenticated reply finds missing schema", async () => {
    const error = new Error("Messaging temporarily unavailable"); error.name = "MessagingSchemaUnavailableError";
    mocks.ensure.mockRejectedValue(error);
    const response = await post(signedRequest());
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("Messaging temporarily unavailable");
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("explicitly configured legacy relay", () => {
  test("supports its authenticated flattened format without pretending it is a native webhook", async () => {
    vi.stubEnv("INBOUND_EMAIL_WEBHOOK_SECRET", "legacy-test-secret");
    const request = new Request("http://localhost/api/webhooks/messages-email", { method: "POST", headers: { "content-type": "application/json", "x-inbox-secret": "legacy-test-secret" }, body: JSON.stringify({ from: professor, subject: `Question [Thread:${threadId}]`, text: "Trusted relay answer" }) });
    expect((await post(request)).status).toBe(200);
    expect(mocks.receiving).not.toHaveBeenCalled();
    expect(mocks.execute.mock.calls[0][4]).toBe("Trusted relay answer");
  });

  test("rejects the custom header unless the relay secret is explicitly configured", async () => {
    const request = new Request("http://localhost/api/webhooks/messages-email", { method: "POST", headers: { "x-inbox-secret": "legacy-test-secret" }, body: "{}" });
    expect((await post(request)).status).toBe(401);
    expectNoDatabaseWork();
  });
});
