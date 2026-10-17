import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), createUser: vi.fn(), otp: vi.fn(), verifyOtp: vi.fn(),
  userFindUnique: vi.fn(), userUpsert: vi.fn(), courseFindFirst: vi.fn(),
  lessonFindUnique: vi.fn(), lessonFindFirst: vi.fn(), purchaseFindUnique: vi.fn(),
  lessonPurchaseFindUnique: vi.fn(), muxTokens: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: {
  admin: { createUser: mocks.createUser }, signInWithOtp: mocks.otp, verifyOtp: mocks.verifyOtp,
} }) }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/utils/supabase/admin", () => ({ createAdminClient: () => { throw new Error("Unexpected storage client"); } }));
vi.mock("@/lib/db", () => ({ db: {
  user: { findUnique: mocks.userFindUnique, upsert: mocks.userUpsert },
  course: { findFirst: mocks.courseFindFirst },
  lesson: { findUnique: mocks.lessonFindUnique, findFirst: mocks.lessonFindFirst },
  purchase: { findUnique: mocks.purchaseFindUnique },
  lessonPurchase: { findUnique: mocks.lessonPurchaseFindUnique },
} }));
vi.mock("@/lib/mux", () => ({ createMuxPlaybackTokens: mocks.muxTokens }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("react", async original => ({
  ...await original<Record<string, unknown>>(), cache: (fn: unknown) => fn,
}));

const MARKER = "private-api-diagnostic-marker";
const EMAIL = `${MARKER}@example.invalid`;
const DB_URL = `postgresql://fixture:${MARKER}@db.example.invalid:5432/jazz`;
const SIGNED_URL = `https://storage.example.invalid/private.pdf?token=${MARKER}`;
const ACTOR = { id: "diagnostic-actor", email: EMAIL };

function privateError() {
  return Object.assign(new Error(`${DB_URL} ${EMAIL} ${SIGNED_URL}`), {
    name: MARKER, code: MARKER, cause: { authorization: `Bearer ${MARKER}` },
  });
}

const failures: [string, () => unknown][] = [
  ["private Error fields", privateError],
  ["arbitrary string", () => `${DB_URL} ${EMAIL}`],
  ["arbitrary object", () => ({ name: MARKER, code: MARKER, body: { email: EMAIL }, url: SIGNED_URL })],
  ["throwing accessor", () => ({ get name() { throw privateError(); }, message: MARKER })],
];

let output: ReturnType<typeof vi.spyOn>[];
let fetchMock: ReturnType<typeof vi.fn>;

function expectPrivateOmitted(response?: unknown) {
  const text = inspect({ logs: output.flatMap(spy => spy.mock.calls), response }, { depth: 12 });
  for (const value of [MARKER, EMAIL, DB_URL, SIGNED_URL]) expect(text).not.toContain(value);
}

function post(body: unknown = {}) {
  return new Request("https://app.example.invalid/fixture", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  output = (["error", "warn", "log", "info", "debug"] as const)
    .map(level => vi.spyOn(console, level).mockImplementation(() => undefined));
  fetchMock = vi.fn(() => { throw new Error("Unexpected external request"); });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-service-key");
  vi.stubEnv("SUPABASE_STORAGE_BUCKET", "synthetic-private-pdfs");
  vi.stubEnv("ADMIN_OWNER_EMAIL", "owner@example.invalid");
  mocks.getUser.mockResolvedValue({ data: { user: ACTOR }, error: null });
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userUpsert.mockResolvedValue({ id: ACTOR.id });
  mocks.createUser.mockResolvedValue({ data: { user: { id: ACTOR.id } }, error: null });
  mocks.otp.mockResolvedValue({ error: null });
  mocks.verifyOtp.mockResolvedValue({ data: { user: ACTOR }, error: null });
});

afterEach(() => {
  expect(fetchMock).not.toHaveBeenCalled();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});

const parserRoutes = [
  ["registration", () => import("@/app/api/auth/register/route")],
  ["send-code", () => import("@/app/api/auth/send-code/route")],
  ["verify-code", () => import("@/app/api/auth/verify-code/route")],
  ["voucher validation", () => import("@/app/api/vouchers/validate/route")],
] as const;

describe.each(parserRoutes)("%s parser failure", (_name, load) => {
  test.each(failures)("omits %s from logs and generic failure response", async (_kind, makeFailure) => {
    const request = post(); vi.spyOn(request, "json").mockRejectedValue(makeFailure());
    const response = await (await load()).POST(request);
    expect(response.status).toBe(500);
    expect(output.some(spy => spy.mock.calls.length > 0)).toBe(true);
    expectPrivateOmitted(await response.text());
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.otp).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
  });
});

describe("Auth provider response confidentiality", () => {
  test("registration failure cannot return provider prose or create a database identity", async () => {
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: privateError() });
    const response = await (await import("@/app/api/auth/register/route")).POST(post({
      email: EMAIL, password: "synthetic-long-password", fullName: "Fixture",
    }));
    expect(response.status).toBe(400); expectPrivateOmitted(await response.text());
    expect(mocks.userUpsert).not.toHaveBeenCalled(); expect(mocks.otp).not.toHaveBeenCalled();
  });

  test("registration OTP failure cannot return provider prose or claim success", async () => {
    mocks.otp.mockResolvedValue({ error: privateError() });
    const response = await (await import("@/app/api/auth/register/route")).POST(post({
      email: EMAIL, password: "synthetic-long-password", fullName: "Fixture",
    }));
    expect(response.status).toBe(400); const body = await response.json();
    expect(body.success).not.toBe(true); expectPrivateOmitted(body);
  });

  test("resend failure omits returned provider prose from logs and body", async () => {
    mocks.otp.mockResolvedValue({ error: privateError() });
    const response = await (await import("@/app/api/auth/send-code/route")).POST(post({ email: EMAIL }));
    expect(response.status).toBe(400); expectPrivateOmitted(await response.text());
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  test("existing resend rate-limit behavior survives without logging provider prose", async () => {
    mocks.otp.mockResolvedValue({ error: { message: `rate limit exceeded ${MARKER}` } });
    const response = await (await import("@/app/api/auth/send-code/route")).POST(post({ email: EMAIL }));
    expect(response.status).toBe(429); const body = await response.json();
    expect(body.retryAfterSeconds).toBe(120); expectPrivateOmitted(body);
  });
});

const identityRoutes = [
  ["voucher redemption", async () => (await import("@/app/api/vouchers/redeem/route")).POST(post())],
  ["messages", async () => (await import("@/app/api/messages/route")).GET()],
  ["unread", async () => (await import("@/app/api/messages/unread-count/route")).GET(new Request("https://app.example.test/api/messages/unread-count"))],
  ["thread", async () => (await import("@/app/api/messages/[threadId]/route")).GET(new Request("https://app.example.invalid/api/messages/fixture"), { params: Promise.resolve({ threadId: "fixture" }) })],
  ["Mux", async () => (await import("@/app/api/lessons/[lessonId]/mux-playback/route")).GET(new Request("https://app.example.invalid/api/lessons/fixture/mux-playback"), { params: Promise.resolve({ lessonId: "fixture" }) })],
  ["PDF", async () => {
    const { NextRequest } = await import("next/server");
    return (await import("@/app/api/lessons/[lessonId]/attachments/[attachmentId]/route")).GET(new NextRequest("https://app.example.invalid/api/lessons/fixture/attachments/fixture"), { params: Promise.resolve({ lessonId: "fixture", attachmentId: "fixture" }) });
  }],
] as const;

describe.each(identityRoutes)("%s identity failure", (_name, invoke) => {
  test.each(failures)("omits %s and grants no access", async (_kind, makeFailure) => {
    mocks.getUser.mockRejectedValue(makeFailure());
    const response = await invoke(); expect(response.status).toBe(500);
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expectPrivateOmitted(await response.text());
    expect(mocks.muxTokens).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
  });
});

describe("server fallback diagnostics", () => {
  test.each(failures)("role lookup omits %s and denies ordinary actor", async (_kind, makeFailure) => {
    mocks.userFindUnique.mockRejectedValue(makeFailure());
    const result = await (await import("@/lib/admin-api")).ensureAdminApiPermission("vouchers.update");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
    expectPrivateOmitted();
  });

  test.each(failures)("course fallback omits %s and stays unavailable", async (_kind, makeFailure) => {
    mocks.courseFindFirst.mockRejectedValue(makeFailure());
    expect(await (await import("@/lib/dashboard-server-data")).getFirstPublishedCourseId()).toBeNull();
    expectPrivateOmitted();
  });
});

test("Mux signer failure omits raw key/parser details from logs and customer response", async () => {
  mocks.lessonFindUnique.mockResolvedValue({ id: "fixture", isPublished: true, videoUrl: "https://stream.mux.com/abc123XYZabc123XYZabc123XYZ.m3u8", chapter: { courseId: "fixture", isPublished: true, course: { isPublished: true } } });
  mocks.userFindUnique.mockResolvedValue({ role: "USER" });
  mocks.purchaseFindUnique.mockResolvedValue(null); mocks.lessonPurchaseFindUnique.mockResolvedValue(null);
  mocks.lessonFindFirst.mockResolvedValue({ id: "fixture" }); mocks.muxTokens.mockImplementation(() => { throw privateError(); });
  const response = await (await import("@/app/api/lessons/[lessonId]/mux-playback/route")).GET(new Request("https://app.example.invalid/api/lessons/fixture/mux-playback"), { params: Promise.resolve({ lessonId: "fixture" }) });
  expect(response.status).toBe(500); const body = await response.text();
  expectPrivateOmitted(body); expect(body).not.toContain("MUX_SIGNING_PRIVATE_KEY");
  expect(mocks.muxTokens).toHaveBeenCalledOnce();
});
