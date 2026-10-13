import { createHmac } from "node:crypto";
import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), exchange: vi.fn(), updateUser: vi.fn(), syncUser: vi.fn(),
  userFindUnique: vi.fn(), userFindMany: vi.fn(), courseFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(), voucherUpdate: vi.fn(),
  eventFindMany: vi.fn(), eventFindUnique: vi.fn(), eventCreate: vi.fn(), eventUpdate: vi.fn(),
  purchaseSync: vi.fn(), purchaseRevert: vi.fn(), voucherValidation: vi.fn(),
  headers: new Headers(),
}));

vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: {
  getUser: mocks.getUser, exchangeCodeForSession: mocks.exchange, updateUser: mocks.updateUser,
} }) }));
vi.mock("@/lib/sync-user", () => ({ syncUserWithDatabase: mocks.syncUser }));
vi.mock("@/lib/db", () => ({ db: {
  user: { findUnique: mocks.userFindUnique, findMany: mocks.userFindMany },
  course: { findUnique: mocks.courseFindUnique },
  purchase: { findUnique: mocks.purchaseFindUnique },
  voucherCode: { update: mocks.voucherUpdate },
  paymentWebhookEvent: {
    findMany: mocks.eventFindMany, findUnique: mocks.eventFindUnique,
    create: mocks.eventCreate, update: mocks.eventUpdate,
  },
} }));
vi.mock("@/lib/course-purchase-sync", () => ({
  upsertCoursePurchaseFromProvider: mocks.purchaseSync,
  revertCoursePurchaseByProviderReferenceId: mocks.purchaseRevert,
}));
vi.mock("@/lib/vouchers", () => ({ validateVoucherForCourse: mocks.voucherValidation }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }), headers: async () => mocks.headers,
}));
vi.mock("@/lib/test-mode", () => ({ isLocalTestRequest: () => false }));
vi.mock("@/lib/app-origin", () => ({
  resolveServerAppOrigin: () => "https://app.example.invalid",
  normalizeBaseOrigin: () => "https://app.example.invalid", isLocalOrigin: () => false,
}));

const PRIVATE = "private-diagnostic-regression-marker";
const EMAIL = `${PRIVATE}@example.invalid`;
const DATABASE_URL = `postgresql://fixture:${PRIVATE}@db.example.invalid:5432/jazz`;
const SIGNED_URL = `https://storage.example.invalid/private.pdf?token=${PRIVATE}`;
const VOUCHER_CODE = "PRIVATE12XYZ";
const USER_ID = "761a729b-d346-4e0d-a5b2-e36b5cec582b";
const COURSE_ID = "diagnostic-course";
const SIGNING_KEY = Buffer.from("synthetic-webhook-key-for-local-unit-tests");
const API_ORIGIN = "https://dodo.example.invalid";
const actor = { id: USER_ID, email: EMAIL, user_metadata: { avatar_mode: "fixed" } };

function privateFailure() {
  return Object.assign(new Error(`${DATABASE_URL} ${SIGNED_URL} ${EMAIL}`), {
    name: PRIVATE, code: PRIVATE, cause: { authorization: `Bearer ${PRIVATE}` },
  });
}

const privateFailures: [string, () => unknown][] = [
  ["Error with private message/name/code/cause", privateFailure],
  ["arbitrary string", () => `${DATABASE_URL} Bearer ${PRIVATE}`],
  ["arbitrary object", () => ({ name: PRIVATE, code: PRIVATE, body: { email: EMAIL }, url: SIGNED_URL })],
  ["throwing accessor", () => ({ get name() { throw privateFailure(); }, message: PRIVATE })],
];

function request(path: string, body: unknown) {
  return new Request(`https://app.example.invalid${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

function providerResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const voucher = {
  id: "diagnostic-voucher", code: VOUCHER_CODE, type: "DISCOUNT_PERCENT",
  discountPercent: 10, discountAmount: null, maxUses: 3, maxUsesPerUser: 1,
  currentUses: 0, minOrderValue: null, expiresAt: null, metadata: {},
  providerDiscountCode: VOUCHER_CODE,
};

function useVoucher() {
  mocks.voucherValidation.mockResolvedValue({
    valid: true, isFree: false, originalPrice: 80, discount: 8, finalPrice: 72, voucher,
  });
}

let outputs: ReturnType<typeof vi.spyOn>[];
let fetchMock: ReturnType<typeof vi.fn>;

function diagnosticOutput() {
  return inspect(outputs.flatMap(spy => spy.mock.calls), { depth: 12 });
}

function expectPrivateDetailsOmitted(additional: unknown = "") {
  const output = `${diagnosticOutput()} ${inspect(additional, { depth: 12 })}`;
  for (const value of [PRIVATE, EMAIL, DATABASE_URL, SIGNED_URL, VOUCHER_CODE]) {
    expect(output).not.toContain(value);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  outputs = (["error", "warn", "log", "info", "debug"] as const)
    .map(level => vi.spyOn(console, level).mockImplementation(() => undefined));
  fetchMock = vi.fn(async () => { throw new Error("Unexpected isolated provider request"); });
  // All provider helpers are real, but no request can leave this fake fetch.
  vi.stubGlobal("fetch", fetchMock);
  for (const [name, value] of Object.entries({
    NODE_ENV: "production", APP_URL: "https://app.example.invalid",
    NEXT_PUBLIC_APP_URL: "https://app.example.invalid", DODO_API_BASE_URL: API_ORIGIN,
    DODO_ENVIRONMENT: "test_mode", DODO_PRODUCT_ID: "diagnostic-product",
    DODO_PAYMENTS_API_KEY: "synthetic-not-a-real-api-key",
    DODO_PAYMENTS_WEBHOOK_SECRET: `whsec_${SIGNING_KEY.toString("base64")}`,
    CRON_SECRET: "synthetic-local-cron-secret",
  })) vi.stubEnv(name, value);
  mocks.getUser.mockResolvedValue({ data: { user: actor }, error: null });
  mocks.exchange.mockResolvedValue({ data: { session: { user: actor } }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.syncUser.mockResolvedValue(undefined);
  mocks.userFindUnique.mockResolvedValue({ role: "USER" });
  mocks.userFindMany.mockResolvedValue([actor]);
  mocks.courseFindUnique.mockResolvedValue({ id: COURSE_ID, title: "Synthetic course", price: 80 });
  mocks.purchaseFindUnique.mockResolvedValue(null);
  mocks.voucherValidation.mockResolvedValue(null);
  mocks.voucherUpdate.mockResolvedValue({});
  mocks.eventFindMany.mockResolvedValue([]);
  mocks.eventFindUnique.mockResolvedValue(null);
  mocks.eventCreate.mockResolvedValue({ id: "diagnostic-event" });
  mocks.eventUpdate.mockResolvedValue({});
  mocks.purchaseSync.mockResolvedValue(undefined);
  mocks.headers = new Headers();
});

afterEach(() => {
  for (const [input] of fetchMock.mock.calls) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.origin).toBe(API_ORIGIN);
  }
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("checkout diagnostic confidentiality without changing payment behavior", () => {
  test.each(privateFailures)("soft user lookup failure omits %s", async (_name, makeFailure) => {
    mocks.userFindUnique.mockRejectedValue(makeFailure());
    fetchMock.mockResolvedValue(providerResponse({ checkout_url: "https://checkout.example.invalid/session/fixture" }));
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID }));
    expect(response.status).toBe(200);
    expect(diagnosticOutput()).toContain("CHECKOUT_DB_USER_LOOKUP_FAILED");
    expectPrivateDetailsOmitted(await response.json());
  });

  test("duplicate purchase omits email and voucher capability but remains 400", async () => {
    mocks.purchaseFindUnique.mockResolvedValue({ id: "diagnostic-purchase", providerReferenceId: `dodo-voucher:${VOUCHER_CODE}` });
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(diagnosticOutput()).toContain("CHECKOUT_ALREADY_PURCHASED");
    expectPrivateDetailsOmitted(await response.text());
  });

  test.each(privateFailures)("unexpected course lookup failure omits %s", async (_name, makeFailure) => {
    mocks.courseFindUnique.mockRejectedValue(makeFailure());
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID }));
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expectPrivateDetailsOmitted(await response.text());
  });

  test("ordinary provider failure keeps generic 503 and drops the provider body", async () => {
    fetchMock.mockResolvedValue(providerResponse({ message: PRIVATE, customer: { email: EMAIL }, debug_url: SIGNED_URL }, 503));
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID }));
    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledOnce();
    expectPrivateDetailsOmitted(await response.text());
  });

  test("invalid discount backfill persists safe failure metadata and returns 400", async () => {
    useVoucher();
    fetchMock.mockResolvedValueOnce(providerResponse({ message: `discount not found ${PRIVATE}`, email: EMAIL }, 400))
      .mockResolvedValueOnce(providerResponse({ message: PRIVATE, authorization: `Bearer ${PRIVATE}`, url: SIGNED_URL }, 422));
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID, voucherCode: VOUCHER_CODE }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const update = mocks.voucherUpdate.mock.calls[0][0];
    expect(update.where.id).toBe(voucher.id);
    expect(update.data.metadata.providerDiscountSyncStatus).toBe("failed");
    const failureReason = update.data.metadata.providerDiscountSyncError;
    expect(typeof failureReason).toBe("string");
    expect(failureReason).toContain("422");
    // Successful voucher metadata intentionally retains its business code;
    // only failure diagnostics and logs must exclude that capability.
    expectPrivateDetailsOmitted({ response: await response.text(), failureReason });
  });

  test("valid backfill retries the real checkout once and keeps its success URL", async () => {
    useVoucher();
    const url = "https://checkout.example.invalid/session/fixture";
    fetchMock.mockResolvedValueOnce(providerResponse({ message: `invalid discount ${PRIVATE}` }, 400))
      .mockResolvedValueOnce(providerResponse({ discount_id: "diagnostic-discount", code: VOUCHER_CODE }))
      .mockResolvedValueOnce(providerResponse({ checkout_url: url }));
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID, voucherCode: VOUCHER_CODE }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mocks.voucherUpdate.mock.calls[0][0].data.metadata.providerDiscountSyncStatus).toBe("synced");
    expectPrivateDetailsOmitted();
  });

  test("failed retry omits its raw exception and retains voucher-error 400", async () => {
    useVoucher();
    fetchMock.mockResolvedValueOnce(providerResponse({ message: "discount does not exist" }, 400))
      .mockResolvedValueOnce(providerResponse({ discount_id: "diagnostic-discount", code: VOUCHER_CODE }))
      .mockRejectedValueOnce(privateFailure());
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID, voucherCode: VOUCHER_CODE }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(diagnosticOutput()).toContain("CHECKOUT_VOUCHER_BACKFILL_RETRY_FAILED");
    expectPrivateDetailsOmitted(await response.text());
  });

  test("provider discount usage limit preserves counter reconciliation and 400", async () => {
    useVoucher();
    fetchMock.mockResolvedValue(providerResponse({ message: `discount reached its maximum redemptions ${PRIVATE}`, email: EMAIL }, 400));
    const response = await (await import("@/app/api/checkout/route")).POST(request("/api/checkout", { courseId: COURSE_ID, voucherCode: VOUCHER_CODE }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(mocks.voucherUpdate).toHaveBeenCalledWith({ where: { id: voucher.id }, data: { currentUses: 3 } });
    expectPrivateDetailsOmitted(await response.text());
  });
});

describe("reconciliation and webhook diagnostic confidentiality", () => {
  test("real provider payment-detail failure keeps finite status and generic 503", async () => {
    fetchMock.mockResolvedValue(providerResponse({ customer: { email: EMAIL }, detail: PRIVATE, debug_url: SIGNED_URL }, 503));
    const response = await (await import("@/app/api/purchases/route")).POST(request("/api/purchases", { action: "reconcile", courseId: COURSE_ID, paymentId: "diagnostic-payment" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ purchased: false, reason: "provider_unavailable" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(diagnosticOutput()).toContain("503");
    expectPrivateDetailsOmitted();
  });

  test("auto reconciliation cannot expose a raw transport failure", async () => {
    const dodo = await import("@/lib/payments/providers/dodo");
    vi.spyOn(dodo, "listDodoPaymentsForCustomer").mockRejectedValue(privateFailure());
    const response = await (await import("@/app/api/purchases/auto-reconcile/route")).POST();
    expect(response.status).toBe(500);
    expectPrivateDetailsOmitted(await response.text());
  });

  test("cron failures remain aggregate-only and omit customer email/error", async () => {
    const dodo = await import("@/lib/payments/providers/dodo");
    vi.spyOn(dodo, "listDodoPaymentsForCustomer").mockRejectedValue(privateFailure());
    const response = await (await import("@/app/api/cron/payments-sweep/route")).GET(new Request("https://app.example.invalid/api/cron/payments-sweep", { headers: { authorization: "Bearer synthetic-local-cron-secret" } }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, complete: false, failures: 1, unlocked: 0 });
    expectPrivateDetailsOmitted();
  });

  test("signed webhook failure stores finite lastError without private exception details", async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const eventId = "diagnostic-webhook";
    const body = JSON.stringify({ type: "payment.succeeded", data: {
      payment_id: "diagnostic-payment", status: "succeeded", total_amount: 8000,
      metadata: { userId: USER_ID, courseId: COURSE_ID }, customer: { email: EMAIL },
    } });
    const signature = createHmac("sha256", SIGNING_KEY).update(`${eventId}.${timestamp}.${body}`).digest("base64");
    mocks.headers = new Headers({ "webhook-id": eventId, "webhook-timestamp": timestamp, "webhook-signature": `v1,${signature}` });
    mocks.purchaseSync.mockRejectedValue(privateFailure());
    const response = await (await import("@/app/api/webhooks/dodo-jazzlms/route")).POST(new Request("https://app.example.invalid/api/webhooks/dodo-jazzlms", { method: "POST", body }));
    expect(response.status).toBe(500);
    expect(mocks.eventCreate).toHaveBeenCalledOnce();
    expect(mocks.purchaseSync).toHaveBeenCalledOnce();
    const failed = mocks.eventUpdate.mock.calls.find(([input]) => input.data.status === "FAILED")?.[0];
    expect(failed).toBeDefined();
    expect(typeof failed.data.lastError).toBe("string");
    expect(failed.data.lastError.length).toBeGreaterThan(0);
    expectPrivateDetailsOmitted({ response: await response.json(), lastError: failed.data.lastError });
  });
});

describe("callback diagnostic confidentiality", () => {
  test.each(privateFailures)("OAuth exchange failure omits %s and retains generic redirect", async (_name, makeFailure) => {
    mocks.exchange.mockRejectedValue(makeFailure());
    const response = await (await import("@/app/auth/callback/route")).GET(new Request("https://app.example.invalid/auth/callback?code=synthetic-code"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("oauth_error=");
    expect(mocks.getUser).not.toHaveBeenCalled();
    expectPrivateDetailsOmitted(response.headers.get("location"));
  });

  test("OAuth user load and metadata failures omit raw returned errors", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: privateFailure() });
    const route = await import("@/app/auth/callback/route");
    const denied = await route.GET(new Request("https://app.example.invalid/auth/callback?code=synthetic-code"));
    expect(denied.headers.get("location")).toContain("oauth_error=");
    mocks.getUser.mockResolvedValueOnce({ data: { user: { ...actor, user_metadata: {} } }, error: null });
    mocks.updateUser.mockResolvedValueOnce({ error: privateFailure() });
    mocks.syncUser.mockRejectedValueOnce(privateFailure());
    const signedIn = await route.GET(new Request("https://app.example.invalid/auth/callback?code=synthetic-code"));
    expect(signedIn.headers.get("location")).toBe("https://app.example.invalid/dashboard");
    expect(mocks.updateUser).toHaveBeenCalledOnce();
    expectPrivateDetailsOmitted([denied.headers.get("location"), signedIn.headers.get("location")]);
  });

  test.each(privateFailures)("recovery callback exception omits %s and retains safe reset error", async (_name, makeFailure) => {
    mocks.exchange.mockRejectedValue(makeFailure());
    const response = await (await import("@/app/auth/reset-password/callback/route")).GET(new Request("https://app.example.invalid/auth/reset-password/callback?code=synthetic-code"));
    expect(response.headers.get("location")).toContain("reset_error=exchange_exception");
    expectPrivateDetailsOmitted(response.headers.get("location"));
  });

  test("recovery returned arbitrary provider code is not copied into diagnostics", async () => {
    mocks.exchange.mockResolvedValue({ data: { session: null }, error: { code: PRIVATE, message: SIGNED_URL } });
    const response = await (await import("@/app/auth/reset-password/callback/route")).GET(new Request("https://app.example.invalid/auth/reset-password/callback?code=synthetic-code"));
    expect(response.headers.get("location")).toContain("reset_error=exchange_failed");
    expectPrivateDetailsOmitted(response.headers.get("location"));
  });
});
