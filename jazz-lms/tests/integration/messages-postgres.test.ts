import { PrismaClient } from "@prisma/client";
import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), receiving: vi.fn(), send: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => ({ allowed: true }), createRateLimitHeaders: () => ({}) }));
vi.mock("resend", async importOriginal => {
  const actual = await importOriginal<typeof import("resend")>();
  return { ...actual, Resend: class {
    webhooks = new actual.Resend("re_isolated_verification").webhooks;
    emails = { receiving: { get: mocks.receiving }, send: mocks.send };
  } };
});

// Never inherit DATABASE_URL. Only explicitly opt in to the disposable local DB.
const databaseUrl = process.env.MESSAGING_TEST_DATABASE_URL;
const prefix = `messages-maintenance-${randomUUID()}`;
const threadId = randomUUID();
const emailId = randomUUID();
const studentId = `${prefix}-student`;
const studentEmail = `${prefix}@example.invalid`;
const professorEmail = "professor@example.invalid";
const signingKey = Buffer.from("isolated-native-messaging-postgres-signature-key");
let client: PrismaClient;
let schemaReady = false;
let inboxRoute: typeof import("@/app/api/messages/route");
let threadRoute: typeof import("@/app/api/messages/[threadId]/route");
let countRoute: typeof import("@/app/api/messages/unread-count/route");
let webhookRoute: typeof import("@/app/api/webhooks/messages-email/route");
const params = { params: Promise.resolve({ threadId }) };
const requestUrl = `http://localhost/api/messages/${threadId}`;

function setUser(id: string, email: string) {
  mocks.getUser.mockResolvedValue({ data: { user: { id, email, user_metadata: { full_name: "Isolated test user" } } } });
}

describe.skipIf(!databaseUrl)("messaging routes on isolated PostgreSQL", () => {
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "55432" || url.pathname !== "/jazz_maintenance") {
      throw new Error("Messaging tests require disposable localhost:55432/jazz_maintenance");
    }
    vi.stubEnv("DATABASE_URL", databaseUrl!);
    vi.stubEnv("PROFESSOR_EMAIL", professorEmail);
    vi.stubEnv("RESEND_API_KEY", "re_isolated_test");
    vi.stubEnv("RESEND_FROM_EMAIL", "Jazz <no-reply@example.invalid>");
    vi.stubEnv("MESSAGES_REPLY_TO_EMAIL", "receiving@example.invalid");
    vi.stubEnv("RESEND_WEBHOOK_SECRET", `whsec_${signingKey.toString("base64")}`);
    vi.stubEnv("INBOUND_EMAIL_WEBHOOK_SECRET", "");
    client = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
    globalThis.prisma = client;
    inboxRoute = await import("@/app/api/messages/route");
    threadRoute = await import("@/app/api/messages/[threadId]/route");
    countRoute = await import("@/app/api/messages/unread-count/route");
    webhookRoute = await import("@/app/api/webhooks/messages-email/route");
    // Setup is performed explicitly outside requests; this suite validates readiness only.
    await (await import("@/lib/messages-db")).ensureMessagingTables();
    schemaReady = true;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await client.$executeRawUnsafe("DELETE FROM messagethread WHERE id = $1", threadId);
    const createdAt = new Date(Date.now() - 30_000).toISOString();
    await client.$executeRawUnsafe("INSERT INTO messagethread (id, studentid, studentemail, studentname, subject, createdat, updatedat) VALUES ($1,$2,$3,$4,$5,$6,$6)", threadId, studentId, studentEmail, "Isolated Student", "First question", createdAt);
    await client.$executeRawUnsafe("INSERT INTO message (id, threadid, senderid, senderemail, sendername, senderrole, body, unreadbystudent, unreadbyprofessor, createdat) VALUES ($1,$2,$3,$4,$5,'student',$6,0,1,$7)", `${prefix}-seed`, threadId, studentId, studentEmail, "Isolated Student", "Seed question", createdAt);
    setUser(studentId, studentEmail);
    mocks.send.mockResolvedValue({ data: { id: "isolated-notification" }, error: null });
    mocks.receiving.mockResolvedValue({ data: { id: emailId, from: professorEmail, subject: `Re: First question [Thread:${threadId}]`, text: "Professor's answer", authentication: { dkim: "pass", dmarc: "pass" } }, error: null });
  });

  afterAll(async () => {
    if (client) {
      try {
        if (schemaReady) await client.$executeRawUnsafe("DELETE FROM messagethread WHERE id = $1", threadId);
      } finally {
        await client.$disconnect();
        delete globalThis.prisma;
      }
    }
    vi.unstubAllEnvs();
  });

  test("returns actual SQL camelCase fields and serializes populated bigint inbox counts", async () => {
    const studentResponse = await inboxRoute.GET();
    expect(studentResponse.status).toBe(200);
    expect((await studentResponse.json()).threads.find((row: { id: string }) => row.id === threadId)).toMatchObject({
      studentId, studentEmail, studentName: "Isolated Student", lastMessage: "Seed question", unreadCount: 0,
    });
    setUser(`${prefix}-professor`, professorEmail);
    const professorResponse = await inboxRoute.GET();
    expect(professorResponse.status).toBe(200);
    expect((await professorResponse.json()).threads.find((row: { id: string }) => row.id === threadId)).toMatchObject({ unreadCount: 1, studentId, studentEmail });
    const countResponse = await countRoute.GET();
    expect(countResponse.status).toBe(200);
    expect((await countResponse.json()).count).toBeGreaterThanOrEqual(1);
  });

  test("authorizes a thread owner using real lowercase storage and returns typed messages", async () => {
    const response = await threadRoute.GET(new Request(requestUrl), params);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.thread).toMatchObject({ studentId, studentEmail, studentName: "Isolated Student" });
    expect(result.messages[0]).toMatchObject({ threadId, senderId: studentId, senderEmail: studentEmail, senderRole: "student" });
    expect(result.messages[0].createdAt).toEqual(expect.any(String));
    setUser(`${prefix}-other-student`, "other@example.invalid");
    expect((await threadRoute.GET(new Request(requestUrl), params)).status).toBe(403);
  });

  test("preserves apostrophes and skips quick duplicate replies with real SQL aliases", async () => {
    const body = "O'Brien's question about the blues";
    const request = () => new Request(requestUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: body }) });
    expect((await threadRoute.POST(request(), params)).status).toBe(200);
    const duplicate = await threadRoute.POST(request(), params);
    expect(await duplicate.json()).toMatchObject({ duplicateSkipped: true });
    const stored = await client.$queryRawUnsafe<Array<{ body: string }>>("SELECT body FROM message WHERE threadid=$1 ORDER BY createdat DESC", threadId);
    expect(stored[0].body).toBe(body);
    expect(stored).toHaveLength(2);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: professorEmail, replyTo: "receiving@example.invalid" }));
  });

  test("concurrent native webhook deliveries create one reply and one notification", async () => {
    const payload = JSON.stringify({ type: "email.received", created_at: new Date().toISOString(), data: { email_id: emailId, from: professorEmail, subject: `First question [Thread:${threadId}]` } });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const id = "msg_isolated_postgres_native";
    const signature = createHmac("sha256", signingKey).update(`${id}.${timestamp}.${payload}`).digest("base64");
    const request = () => new Request("http://localhost/api/webhooks/messages-email", { method: "POST", headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` }, body: payload });
    const responses = await Promise.all([webhookRoute.POST(request()), webhookRoute.POST(request())]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const replies = await client.$queryRawUnsafe<Array<{ id: string; body: string; unreadbystudent: number }>>("SELECT id, body, unreadbystudent FROM message WHERE threadid=$1 AND senderrole='professor'", threadId);
    expect(replies).toEqual([{ id: `resend-email:${emailId}`, body: "Professor's answer", unreadbystudent: 1 }]);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: studentEmail }));
  });
});
