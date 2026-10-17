import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), events: vi.fn(), list: vi.fn(), retrieve: vi.fn(),
  grant: vi.fn(), fetch: vi.fn(), verify: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/admin-api", () => ({ ensureAdminApiPermission: async () => ({ ok: true, userId: "currency-admin" }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "webhook-id": "currency-event", "webhook-signature": "fixture-signature", "webhook-timestamp": String(Math.floor(Date.now() / 1000)) }) }));
vi.mock("@/lib/db", () => ({ db: {
  user: { findFirst: async () => ({ id: "currency-actor", email: "currency@example.test" }),
    findMany: async () => [{ id: "currency-actor", email: "currency@example.test" }] },
  course: { findUnique: async () => ({ id: "currency-course" }) },
  purchase: { findUnique: async () => null },
  paymentWebhookEvent: { findUnique: async () => null, findMany: mocks.events,
    create: async () => ({ id: "currency-event-row" }), update: async () => ({ id: "currency-event-row" }) },
} }));
vi.mock("@/lib/course-purchase-sync", () => ({ upsertCoursePurchaseFromProvider: mocks.grant, revertCoursePurchaseByProviderReferenceId: vi.fn() }));
vi.mock("@/lib/payments/providers/dodo", () => ({ listDodoPaymentsForCustomer: mocks.list,
  retrieveDodoPayment: mocks.retrieve, isDodoWebhookTimestampFresh: () => true, verifyDodoWebhookSignature: mocks.verify }));

const routes = ["webhook", "purchases-event", "purchases-detail", "purchases-list", "auto", "admin-detail", "admin-list", "sweep"] as const;
type Route = typeof routes[number];
function record(currency: string, total_amount: number) {
  return { payment_id: "currency-payment", status: "succeeded", currency, total_amount,
    customer: { email: "currency@example.test" }, metadata: { userId: "currency-actor", courseId: "currency-course" } };
}
async function invoke(route: Route, payment: ReturnType<typeof record>) {
  const payload = { type: "payment.succeeded", data: payment };
  mocks.list.mockResolvedValue([payment]); mocks.retrieve.mockResolvedValue(payment);
  if (route === "webhook") return (await import("@/app/api/webhooks/dodo-jazzlms/route")).POST(new Request("http://localhost/api/webhooks/dodo-jazzlms", { method: "POST", body: JSON.stringify(payload) }));
  if (route.startsWith("purchases-")) {
    if (route === "purchases-event") mocks.events.mockResolvedValue([{ eventId: "currency-event", payload }]);
    return (await import("@/app/api/purchases/route")).POST(new Request("http://localhost/api/purchases", { method: "POST", body: JSON.stringify({
      action: "reconcile", courseId: "currency-course", ...(route === "purchases-detail" ? { paymentId: payment.payment_id } : {}),
    }) }));
  }
  if (route === "auto") return (await import("@/app/api/purchases/auto-reconcile/route")).POST();
  if (route.startsWith("admin-")) return (await import("@/app/api/admin/users/reconcile-purchase/route")).POST(new Request("http://localhost/api/admin/users/reconcile-purchase", {
    method: "POST", body: JSON.stringify({ email: "currency@example.test", courseId: "currency-course", ...(route === "admin-detail" ? { paymentId: payment.payment_id } : {}) }),
  }));
  return (await import("@/app/api/cron/payments-sweep/route")).GET(new Request("http://localhost/api/cron/payments-sweep", { headers: { authorization: "Bearer currency-fixture-only" } }));
}
beforeEach(() => {
  vi.resetAllMocks(); Reflect.deleteProperty(globalThis, "__jazzPaymentSweepStateV1");
  vi.stubEnv("CRON_SECRET", "currency-fixture-only");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "currency-actor", email: "currency@example.test" } } });
  mocks.events.mockResolvedValue([]); mocks.grant.mockResolvedValue(undefined); mocks.verify.mockReturnValue(true);
  mocks.fetch.mockImplementation(() => { throw new Error("Network prohibited"); }); vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => { expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); Reflect.deleteProperty(globalThis, "__jazzPaymentSweepStateV1"); });

describe.each(routes)("%s paid currency ingestion", (route) => {
  for (const [currency, total, major] of [["JPY", 2990, 2990], ["KWD", 1234, 1.234]] as const) {
    test(`forwards ${currency} exact units and correctly scaled convenience value`, async ({ task }) => {
    const response = await invoke(route, record(currency, total));
    expect(response.status).toBe(200); expect(mocks.grant).toHaveBeenCalledOnce();
    Object.assign(task.meta, { observed: structuredClone(mocks.grant.mock.calls[0][0]) });
    expect(mocks.grant).toHaveBeenCalledWith(expect.objectContaining({
      userId: "currency-actor", courseId: "currency-course", providerReferenceId: "dodo-pay:currency-payment",
      finalPrice: major, paymentCurrency: currency, paymentAmountMinor: String(total),
    }));
    });
  }
});
