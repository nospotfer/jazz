import { beforeEach, describe, expect, test, vi } from "vitest";

type Row = { id: string; providerReferenceId: string; originalPrice: number | null; finalPrice: number | null;
  discountAmount: number | null; voucherId: string | null; paymentCurrency?: string | null; paymentAmountMinor?: string | null };
const state = vi.hoisted(() => ({ row: null as Row | null }));
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), events: vi.fn(), discountUpdate: vi.fn(), discountDelete: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (callback: (tx: unknown) => unknown) => callback({
  $executeRaw: vi.fn(), paymentWebhookEvent: { findMany: mocks.events },
  purchase: { findUnique: async () => state.row, upsert: mocks.upsert },
  voucherRedemption: { findFirst: async () => null },
  discountApplied: { updateMany: mocks.discountUpdate, deleteMany: mocks.discountDelete, upsert: vi.fn() },
}) } }));
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";

const identity = { userId: "currency-actor", courseId: "currency-course", providerReferenceId: "dodo-pay:currency-payment" };
const legacy = { originalPrice: 80, finalPrice: 72, discountAmount: 8 };
const incomplete = { originalPrice: null, finalPrice: null, discountAmount: null };
beforeEach(() => {
  vi.clearAllMocks(); state.row = null; mocks.events.mockResolvedValue([]);
  mocks.upsert.mockImplementation(async ({ create, update }: { create: Omit<Row, "id">; update: Partial<Row> }) => {
    state.row = state.row ? { ...state.row, ...update } : { id: "currency-purchase", ...create }; return state.row;
  });
});

describe("exact payment pair versus legacy purchase money", () => {
  test("persists KWD three-decimal convenience amounts without two-decimal truncation", async ({ task }) => {
    await upsertCoursePurchaseFromProvider({ ...identity, originalPrice: null, discountAmount: null, finalPrice: 1.234,
      ...{ paymentCurrency: "KWD", paymentAmountMinor: "1234" } });
    Object.assign(task.meta, { observed: structuredClone(state.row) });
    expect(state.row).toMatchObject({ finalPrice: 1.234, paymentCurrency: "KWD", paymentAmountMinor: "1234" });
  });

  test("attaches an authoritative JPY pair without relabeling or erasing legacy same-reference floats", async ({ task }) => {
    state.row = { id: "currency-purchase", ...identity, ...legacy, voucherId: null };
    await upsertCoursePurchaseFromProvider({ ...identity, ...incomplete, finalPrice: 2990,
      ...{ paymentCurrency: "JPY", paymentAmountMinor: "2990" } });
    Object.assign(task.meta, { observed: structuredClone(state.row) });
    expect(state.row).toMatchObject({ ...legacy, paymentCurrency: "JPY", paymentAmountMinor: "2990" });
  });

  test("an incomplete retry cannot pair a new raw amount with the previous currency", async () => {
    state.row = { id: "currency-purchase", ...identity, ...legacy, voucherId: null, paymentCurrency: "JPY", paymentAmountMinor: "2990" };
    await upsertCoursePurchaseFromProvider({ ...identity, ...incomplete,
      ...{ paymentCurrency: null, paymentAmountMinor: "1234" } });
    expect(state.row).toMatchObject({ ...legacy, paymentCurrency: "JPY", paymentAmountMinor: "2990" });
  });

  test("a new complete pair refreshes together while the independent legacy partial merge remains intact", async () => {
    state.row = { id: "currency-purchase", ...identity, ...legacy, voucherId: null, paymentCurrency: "JPY", paymentAmountMinor: "2990" };
    await upsertCoursePurchaseFromProvider({ ...identity, ...incomplete, finalPrice: 1.234,
      ...{ paymentCurrency: "KWD", paymentAmountMinor: "1234" } });
    expect(state.row).toMatchObject({ ...legacy, paymentCurrency: "KWD", paymentAmountMinor: "1234" });
  });

  test("a replacement with unknown currency clears both the prior currency and unrelated legacy amounts", async ({ task }) => {
    state.row = { id: "currency-purchase", ...identity, ...legacy, voucherId: null, paymentCurrency: "JPY", paymentAmountMinor: "2990" };
    await upsertCoursePurchaseFromProvider({ ...identity, providerReferenceId: "dodo-pay:new-currency-payment", ...incomplete,
      ...{ paymentCurrency: null, paymentAmountMinor: "1234" } });
    Object.assign(task.meta, { observed: structuredClone(state.row) });
    expect(state.row).toMatchObject({ ...incomplete, paymentCurrency: null, paymentAmountMinor: "1234" });
  });

  test("stores genuine zero and raw units even with no trustworthy currency", async () => {
    await upsertCoursePurchaseFromProvider({ ...identity, ...incomplete, finalPrice: 0,
      ...{ paymentCurrency: null, paymentAmountMinor: "0" } });
    expect(state.row).toMatchObject({ finalPrice: 0, paymentCurrency: null, paymentAmountMinor: "0" });
  });

  test("the successful-refund barrier still rejects before any currency or purchase mutation", async () => {
    mocks.events.mockResolvedValue([{ eventType: "refund.succeeded", payload: { type: "refund.succeeded", data: { payment_id: "currency-payment" } }, createdAt: new Date("2026-10-13T00:00:00Z") }]);
    await expect(upsertCoursePurchaseFromProvider({ ...identity, ...incomplete,
      ...{ paymentCurrency: "JPY", paymentAmountMinor: "2990" } })).rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
