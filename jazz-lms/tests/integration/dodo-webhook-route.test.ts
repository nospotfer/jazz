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
});
