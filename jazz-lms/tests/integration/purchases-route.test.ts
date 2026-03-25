import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchaseFindMany: vi.fn(),
  purchaseFindUnique: vi.fn(),
  paymentWebhookEventFindMany: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
  getPaymentProvider: vi.fn(),
  retrieveDodoPayment: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    purchase: {
      findMany: mocks.purchaseFindMany,
      findUnique: mocks.purchaseFindUnique,
    },
    paymentWebhookEvent: {
      findMany: mocks.paymentWebhookEventFindMany,
    },
  },
}));

vi.mock("@/lib/course-purchase-sync", () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
}));

vi.mock("@/lib/payments/provider", () => ({
  getPaymentProvider: mocks.getPaymentProvider,
}));

vi.mock("@/lib/payments/providers/dodo", () => ({
  retrieveDodoPayment: mocks.retrieveDodoPayment,
}));

describe("GET /api/purchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
  });

  test("returns 401 when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/purchases/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  test("returns formatted purchase list", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.purchaseFindMany.mockResolvedValue([
      {
        id: "p1",
        course: { title: "Jazz Basics", price: 29.99 },
        createdAt: new Date("2026-01-15T10:00:00Z"),
      },
    ]);

    const { GET } = await import("@/app/api/purchases/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0]).toEqual({
      id: "p1",
      itemType: "Curso",
      itemTitle: "Jazz Basics",
      amount: 29.99,
      createdAt: "2026-01-15T10:00:00.000Z",
      currency: "EUR",
    });
  });
});

describe("POST /api/purchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPaymentProvider.mockReturnValue("dodo");
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.paymentWebhookEventFindMany.mockResolvedValue([]);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    mocks.retrieveDodoPayment.mockResolvedValue(null);
  });

  test("returns 400 when action is invalid", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "unknown" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  test("returns 503 when active provider is not dodo", async () => {
    mocks.getPaymentProvider.mockReturnValue("unsupported");
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile", courseId: "course-1" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ purchased: false, reason: "payments_unavailable" });
  });

  test("reconciles dodo purchase from processed webhook events", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.paymentWebhookEventFindMany.mockResolvedValue([
      {
        eventId: "evt_1",
        payload: {
          type: "payment.succeeded",
          data: {
            payment: {
              id: "pay_1",
              amount: 2990,
              customer: {
                email: "admin@neurofactory.net",
              },
            },
            metadata: {
              userId: "u1",
              courseId: "course-1",
              checkoutAttemptId: "attempt-1",
              originalPrice: "29.90",
              voucherCode: "JAZZ10",
              providerDiscountCode: "DODO10",
            },
          },
        },
      },
    ]);

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          checkoutAttemptId: "attempt-1",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: "reconciled_dodo_event",
      providerReferenceId: "dodo-pay:pay_1",
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: "u1",
      courseId: "course-1",
      providerReferenceId: "dodo-pay:pay_1",
      originalPrice: 29.9,
      discountAmount: 0,
      finalPrice: 29.9,
      localVoucherCode: "JAZZ10",
      providerDiscountCode: "DODO10",
    });
  });

  test("returns 202 when no event/payment reconciliation is available", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile", courseId: "course-1" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({
      purchased: false,
      reason: "pending_webhook",
      provider: "dodo",
    });
  });
});
