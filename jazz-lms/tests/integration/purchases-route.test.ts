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

  test("returns 500 on internal errors", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mocks.purchaseFindMany.mockRejectedValue(new Error("db down"));

    const { GET } = await import("@/app/api/purchases/route");
    const response = await GET();

    expect(response.status).toBe(500);
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

  test("returns 401 when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile", courseId: "course-1" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  test("returns 400 when courseId is missing", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  test("returns purchased=true from database when purchase already exists", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.purchaseFindUnique.mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile", courseId: "course-1" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ purchased: true, source: "database" });
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

  test("skips non-paid and mismatched webhook events and returns pending", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.paymentWebhookEventFindMany.mockResolvedValue([
      {
        eventId: "evt_not_paid",
        payload: {
          type: "payment.pending",
          data: {
            payment: { id: "pay_pending" },
            metadata: { userId: "u1", courseId: "course-1" },
          },
        },
      },
      {
        eventId: "evt_wrong_course",
        payload: {
          type: "payment.succeeded",
          data: {
            payment: { id: "pay_wrong_course" },
            metadata: { userId: "u1", courseId: "course-2" },
          },
        },
      },
      {
        eventId: "evt_wrong_attempt",
        payload: {
          type: "payment.succeeded",
          data: {
            payment: {
              id: "pay_wrong_attempt",
              customer: { email: "admin@neurofactory.net" },
            },
            metadata: {
              userId: "u1",
              courseId: "course-1",
              checkoutAttemptId: "other-attempt",
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

    expect(response.status).toBe(202);
    expect(body).toEqual({
      purchased: false,
      reason: "pending_webhook",
      provider: "dodo",
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

  test("reconciles purchase from Dodo payment API when webhook event is absent", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_1",
      status: "succeeded",
      subtotal_amount: 2990,
      total_amount: 2490,
      amount: 2490,
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u1",
        courseId: "course-1",
        checkoutAttemptId: "attempt-1",
        voucherCode: "JAZZ50",
        providerDiscountCode: "DODO50",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          checkoutAttemptId: "attempt-1",
          paymentId: "pay_api_1",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: "reconciled_dodo_api",
      providerReferenceId: "dodo-pay:pay_api_1",
    });
  });

  test("returns pending when payment API result is not paid", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_pending",
      status: "pending",
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u1",
        courseId: "course-1",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_pending",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("returns pending when payment API metadata does not match user/course/attempt", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_mismatch",
      status: "succeeded",
      customer_email: "other@neurofactory.net",
      metadata: {
        userId: "u2",
        courseId: "course-2",
        checkoutAttemptId: "attempt-2",
      },
      customer: {
        email: "other@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          checkoutAttemptId: "attempt-1",
          paymentId: "pay_api_mismatch",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("returns pending when payment API customer email mismatches and metadata userId is absent", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_email_mismatch",
      status: "succeeded",
      customer_email: "other@neurofactory.net",
      metadata: {
        courseId: "course-1",
      },
      customer: {
        email: "other@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_email_mismatch",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("returns pending when payment API misses checkout attempt id", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_attempt_missing",
      status: "succeeded",
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u1",
        courseId: "course-1",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          checkoutAttemptId: "attempt-required",
          paymentId: "pay_api_attempt_missing",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("returns pending when payment API metadata userId mismatches", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_api_user_mismatch",
      status: "succeeded",
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u-other",
        courseId: "course-1",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_user_mismatch",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("returns pending when payment API cannot resolve provider reference", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: null,
      status: "succeeded",
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u1",
        courseId: "course-1",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_missing_ref",
        }),
      }),
    );

    expect(response.status).toBe(202);
  });

  test("reconciles webhook event when metadata userId is missing but customer email matches", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.paymentWebhookEventFindMany.mockResolvedValue([
      {
        eventId: "evt_email_match",
        payload: {
          type: "payment.succeeded",
          data: {
            payment: {
              id: "pay_email_match",
              amount: 2990,
              customer: {
                email: "admin@neurofactory.net",
              },
            },
            metadata: {
              courseId: "course-1",
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
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: "reconciled_dodo_event",
      providerReferenceId: "dodo-pay:pay_email_match",
    });
  });

  test("returns pending when paymentId enforces provider reference mismatch in webhook events", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.paymentWebhookEventFindMany.mockResolvedValue([
      {
        eventId: "evt_other_payment",
        payload: {
          type: "payment.succeeded",
          data: {
            payment: {
              id: "pay_other",
              customer: {
                email: "admin@neurofactory.net",
              },
            },
            metadata: {
              userId: "u1",
              courseId: "course-1",
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
          paymentId: "pay_expected",
        }),
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

  test("accepts snake_case payment and attempt aliases for Dodo API reconciliation", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockResolvedValue({
      id: "pay_alias_1",
      status: "succeeded",
      subtotal_amount: 2990,
      total_amount: 1990,
      amount: 1990,
      customer_email: "admin@neurofactory.net",
      metadata: {
        userId: "u1",
        courseId: "course-1",
        checkoutAttemptId: "attempt-alias-1",
      },
      customer: {
        email: "admin@neurofactory.net",
      },
    });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          checkout_attempt_id: "attempt-alias-1",
          payment_id: "pay_alias_1",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: "reconciled_dodo_api",
      providerReferenceId: "dodo-pay:pay_alias_1",
    });
  });

  test("returns 503 when Dodo API is unavailable during reconcile", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockRejectedValue(
      new Error("Dodo payment retrieve failed: network"),
    );

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_1",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      purchased: false,
      reason: "provider_unavailable",
      provider: "dodo",
    });
  });

  test("returns 503 when Dodo API rejects with provider-unavailable string error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockRejectedValue(
      "Dodo payment retrieve failed: upstream timeout",
    );

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_1",
        }),
      }),
    );

    expect(response.status).toBe(503);
  });

  test("returns 500 when Dodo API throws non-standard object error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockRejectedValue({ type: "unexpected" });

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_1",
        }),
      }),
    );

    expect(response.status).toBe(500);
  });

  test("returns 500 when Dodo API throws a non-provider error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.retrieveDodoPayment.mockRejectedValue(new Error("unexpected timeout"));

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({
          action: "reconcile",
          courseId: "course-1",
          paymentId: "pay_api_1",
        }),
      }),
    );

    expect(response.status).toBe(500);
  });

  test("returns 500 on unexpected reconciliation errors", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@neurofactory.net" } },
    });
    mocks.paymentWebhookEventFindMany.mockRejectedValue(new Error("unexpected"));

    const { POST } = await import("@/app/api/purchases/route");
    const response = await POST(
      new Request("http://localhost:3000/api/purchases", {
        method: "POST",
        body: JSON.stringify({ action: "reconcile", courseId: "course-1" }),
      }),
    );

    expect(response.status).toBe(500);
  });
});
