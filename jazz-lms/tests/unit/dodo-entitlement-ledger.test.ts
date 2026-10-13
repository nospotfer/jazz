import { beforeEach, describe, expect, test, vi } from "vitest";

type LedgerEvent = { eventType: string; payload: Record<string, unknown>; createdAt: Date };
const mocks = vi.hoisted(() => ({
  lock: vi.fn(), events: vi.fn(), findPurchase: vi.fn(), upsert: vi.fn(),
  findReference: vi.fn(), deletePurchase: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: async (callback: (tx: unknown) => unknown) => callback({
      $executeRaw: mocks.lock,
      paymentWebhookEvent: { findMany: mocks.events },
      purchase: { findUnique: mocks.findPurchase, upsert: mocks.upsert, findFirst: mocks.findReference, delete: mocks.deletePurchase },
      voucherRedemption: { findFirst: vi.fn(async () => null), deleteMany: vi.fn() },
      discountApplied: { upsert: vi.fn(), deleteMany: vi.fn() },
    }),
  },
}));

import { upsertCoursePurchaseFromProvider, revertCoursePurchaseByProviderReferenceId } from "@/lib/course-purchase-sync";

const input = {
  userId: "buyer", courseId: "course", providerReferenceId: "dodo-pay:pay_old",
  originalPrice: 29.99, finalPrice: 29.99, discountAmount: 0,
};
function event(eventType: string, paymentId = "pay_old", timestamp: string | null = "2026-10-13T00:00:00Z"): LedgerEvent {
  return { eventType, payload: { type: eventType, timestamp, data: { payment_id: paymentId } }, createdAt: new Date("2026-10-13T00:00:00Z") };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.lock.mockResolvedValue(1);
  mocks.events.mockResolvedValue([]);
  mocks.findPurchase.mockResolvedValue(null);
  mocks.findReference.mockResolvedValue(null);
  mocks.upsert.mockResolvedValue({ id: "purchase" });
});

describe("Dodo entitlement ledger", () => {
  test.each(["PROCESSING", "PROCESSED", "FAILED"])(
    "blocks grant after successful refund even while its delivery is %s", async (status) => {
      mocks.events.mockResolvedValue([{ ...event("refund.succeeded"), status }]);
      await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
      expect(mocks.upsert).not.toHaveBeenCalled();
      expect(mocks.lock).toHaveBeenCalledTimes(1);
      expect(mocks.events.mock.calls[0][0].where.status).toBeUndefined();
    },
  );

  test("blocks late paid webhook and reconciliation after refund, allows new payment", async () => {
    await upsertCoursePurchaseFromProvider(input);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    mocks.events.mockResolvedValue([event("refund.succeeded")]);
    mocks.findReference.mockResolvedValue({ id: "purchase", redemption: null });
    await revertCoursePurchaseByProviderReferenceId(input.providerReferenceId);
    expect(mocks.deletePurchase).toHaveBeenCalledTimes(1);
    await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    await upsertCoursePurchaseFromProvider({ ...input, providerReferenceId: "dodo-pay:pay_new" });
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  test("a delayed refund for old payment cannot delete a purchase from a new payment", async () => {
    mocks.events.mockResolvedValue([event("refund.succeeded")]);
    mocks.findReference.mockImplementation(async ({ where }) => where.providerReferenceId === "dodo-pay:pay_new"
      ? { id: "new-purchase", redemption: null } : null);
    await revertCoursePurchaseByProviderReferenceId("dodo-pay:pay_old");
    expect(mocks.deletePurchase).not.toHaveBeenCalled();
    expect(mocks.findReference).toHaveBeenCalledWith(expect.objectContaining({ where: { providerReferenceId: "dodo-pay:pay_old" } }));
  });

  test("later resolved dispute permits grant and ignores older revoke delivered late", async () => {
    mocks.events.mockResolvedValue([
      event("dispute.opened", "pay_old", "2026-10-13T00:00:00Z"),
      event("dispute.won", "pay_old", "2026-10-13T00:01:00Z"),
    ]);
    await upsertCoursePurchaseFromProvider(input);
    await revertCoursePurchaseByProviderReferenceId(input.providerReferenceId);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.deletePurchase).not.toHaveBeenCalled();
  });

  test.each([null, "invalid"])("a resolution with unknown timestamp cannot override known revocation (%s)", async (timestamp) => {
    mocks.events.mockResolvedValue([
      event("dispute.opened"), event("dispute.won", "pay_old", timestamp),
    ]);
    await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
  });

  test("unknown revocation timestamps and tied states fail closed", async () => {
    mocks.events.mockResolvedValue([event("dispute.opened", "pay_old", null), event("dispute.won")]);
    await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    mocks.events.mockResolvedValue([event("dispute.opened"), event("dispute.won")]);
    await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
  });

  test("preserves existing revoke-on-successful-partial-refund policy", async () => {
    const refund = event("refund.succeeded");
    (refund.payload.data as Record<string, unknown>).is_partial = true;
    mocks.events.mockResolvedValue([refund]);
    await expect(upsertCoursePurchaseFromProvider(input)).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
  });

  test("failed refund does not block purchase", async () => {
    mocks.events.mockResolvedValue([event("refund.failed")]);
    await upsertCoursePurchaseFromProvider(input);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });
});
