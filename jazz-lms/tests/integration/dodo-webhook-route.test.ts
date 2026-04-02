import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headersGet: vi.fn(),
  isDodoWebhookTimestampFresh: vi.fn(),
  verifyDodoWebhookSignature: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
  revertCoursePurchaseByProviderReferenceId: vi.fn(),
  webhookFindUnique: vi.fn(),
  webhookCreate: vi.fn(),
  webhookUpdate: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: mocks.headersGet,
  }),
}));

vi.mock("@/lib/payments/providers/dodo", () => ({
  isDodoWebhookTimestampFresh: mocks.isDodoWebhookTimestampFresh,
  verifyDodoWebhookSignature: mocks.verifyDodoWebhookSignature,
}));

vi.mock("@/lib/course-purchase-sync", () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
  revertCoursePurchaseByProviderReferenceId:
    mocks.revertCoursePurchaseByProviderReferenceId,
}));

vi.mock("@/lib/db", () => ({
  db: {
    paymentWebhookEvent: {
      findUnique: mocks.webhookFindUnique,
      create: mocks.webhookCreate,
      update: mocks.webhookUpdate,
    },
  },
}));

describe("POST /api/webhooks/dodo-jazzlms", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.headersGet.mockImplementation((name: string) => {
      if (name === "webhook-id") return "wh_evt_1";
      if (name === "webhook-signature") return "v1,signature";
      if (name === "webhook-timestamp")
        return String(Math.floor(Date.now() / 1000));
      return null;
    });

    mocks.isDodoWebhookTimestampFresh.mockReturnValue(true);
    mocks.verifyDodoWebhookSignature.mockReturnValue(true);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    mocks.revertCoursePurchaseByProviderReferenceId.mockResolvedValue(
      undefined,
    );
    mocks.webhookFindUnique.mockResolvedValue(null);
    mocks.webhookCreate.mockResolvedValue({ id: "evt-db-1" });
    mocks.webhookUpdate.mockResolvedValue({ id: "evt-db-1" });
  });

  test("returns 401 for stale timestamp", async () => {
    mocks.isDodoWebhookTimestampFresh.mockReturnValue(false);

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify({ type: "payment.succeeded" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });

  test("returns 401 for invalid signature", async () => {
    mocks.verifyDodoWebhookSignature.mockReturnValue(false);

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify({ type: "payment.succeeded" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });

  test("returns 400 for invalid JSON payload", async () => {
    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: "{invalid",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });

  test("processes paid event and upserts purchase", async () => {
    const payload = {
      business_id: "bus_123",
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
          amount: 2990,
        },
        metadata: {
          userId: "user-1",
          courseId: "course-1",
          originalPrice: "29.90",
          voucherCode: "JAZZ20",
          providerDiscountCode: "DODO20",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.webhookCreate).toHaveBeenCalledTimes(1);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: "user-1",
      courseId: "course-1",
      providerReferenceId: "dodo-pay:pay_123",
      originalPrice: 29.9,
      finalPrice: 29.9,
      discountAmount: 0,
      localVoucherCode: "JAZZ20",
      providerDiscountCode: "DODO20",
    });
  });

  test("processes paid event and normalizes low-value cent amounts", async () => {
    const payload = {
      business_id: "bus_123",
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_124",
          amount: 990,
        },
        metadata: {
          userId: "user-2",
          courseId: "course-2",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        providerReferenceId: "dodo-pay:pay_124",
        originalPrice: 9.9,
        finalPrice: 9.9,
        discountAmount: 0,
      }),
    );
  });

  test("marks event ignored when provider reference id is missing", async () => {
    const payload = {
      type: "payment.succeeded",
      data: {
        payment: {},
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.webhookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "IGNORED" }),
      }),
    );
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test("returns 400 when metadata is missing for paid events", async () => {
    const payload = {
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
          amount: 2990,
        },
        metadata: {},
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.webhookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });

  test("processes refund-like event and reverts purchase", async () => {
    const payload = {
      type: "refund.created",
      data: {
        payment: {
          id: "pay_refund_1",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(
      mocks.revertCoursePurchaseByProviderReferenceId,
    ).toHaveBeenCalledWith("dodo-pay:pay_refund_1");
  });

  test("returns 200 and skips duplicate already processed events", async () => {
    mocks.webhookFindUnique.mockResolvedValue({
      id: "evt-existing",
      status: "PROCESSED",
      attemptCount: 2,
    });

    const payload = {
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
    expect(
      mocks.revertCoursePurchaseByProviderReferenceId,
    ).not.toHaveBeenCalled();
  });

  test("updates existing non-processed event and continues processing", async () => {
    mocks.webhookFindUnique.mockResolvedValue({
      id: "evt-existing",
      status: "FAILED",
      attemptCount: 2,
    });

    const payload = {
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
          amount: 2990,
        },
        metadata: {
          userId: "user-1",
          courseId: "course-1",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.webhookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-existing" },
        data: expect.objectContaining({
          status: "PROCESSING",
          attemptCount: 3,
        }),
      }),
    );
  });

  test("marks event ignored when event kind is ignored", async () => {
    const payload = {
      type: "checkout.created",
      data: {
        payment: {
          id: "pay_ignored_1",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.webhookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "IGNORED" }),
      }),
    );
  });

  test("returns 500 when processing fails after event upsert", async () => {
    mocks.upsertCoursePurchaseFromProvider.mockRejectedValue(
      new Error("db down"),
    );

    const payload = {
      business_id: "bus_123",
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
          amount: 2990,
        },
        metadata: {
          userId: "user-1",
          courseId: "course-1",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(500);
    expect(mocks.webhookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });

  test("returns 500 even when marking event as failed also throws", async () => {
    mocks.upsertCoursePurchaseFromProvider.mockRejectedValue(
      new Error("db down"),
    );
    mocks.webhookUpdate
      .mockResolvedValueOnce({ id: "evt-db-1" })
      .mockRejectedValueOnce(new Error("status update failed"));

    const payload = {
      type: "payment.succeeded",
      data: {
        payment: {
          id: "pay_123",
          amount: 2990,
        },
        metadata: {
          userId: "user-1",
          courseId: "course-1",
        },
      },
    };

    const { POST } = await import("@/app/api/webhooks/dodo-jazzlms/route");
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/dodo-jazzlms", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(500);
  });
});
