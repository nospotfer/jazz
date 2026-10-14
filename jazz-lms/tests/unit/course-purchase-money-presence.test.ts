import { beforeEach, describe, expect, test, vi } from "vitest";
import { extractDodoPricing, resolveDodoVoucherAccounting } from "@/lib/payments/providers/dodo-events";

type Money = { originalPrice: number | null; finalPrice: number | null; discountAmount: number | null };
type Purchase = Money & { id: string; providerReferenceId: string; voucherId: string | null };
type PurchaseWrite = Omit<Purchase, "id">;
type Discount = Money & { purchaseId: string; voucherId: string | null };
let purchase: Purchase | null;
let discount: Discount | null;
let redemption: { id: string; voucherId: string } | null;
let voucherUses: number;
let upsertDiscount: ReturnType<typeof vi.fn>;
let deleteDiscount: ReturnType<typeof vi.fn>;
let events: ReturnType<typeof vi.fn>;
let sync: typeof import("@/lib/course-purchase-sync");

const identity = { userId: "fixture-user", courseId: "fixture-course", providerReferenceId: "dodo-pay:fixture-payment" };
const known = { originalPrice: 100, finalPrice: 80, discountAmount: 20 };
const unknown = { originalPrice: null, finalPrice: null, discountAmount: null };

beforeEach(async () => {
  vi.resetModules();
  purchase = null;
  discount = null;
  redemption = null;
  voucherUses = 0;
  events = vi.fn().mockResolvedValue([]);
  upsertDiscount = vi.fn(async ({ create, update }: { create: Discount; update: Omit<Discount, "purchaseId"> }) => {
    const values = discount ? update : create;
    for (const field of ["originalPrice", "finalPrice", "discountAmount"] as const) {
      if (typeof values[field] !== "number" || !Number.isFinite(values[field])) {
        throw new Error("DiscountApplied requires a recorded monetary value");
      }
    }
    discount = discount ? { ...discount, ...update } : create;
    return discount;
  });
  deleteDiscount = vi.fn(async () => { discount = null; return { count: 1 }; });
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    paymentWebhookEvent: { findMany: events },
    purchase: {
      findUnique: vi.fn(async ({ select }: { select: Record<string, boolean> }) => purchase
        ? Object.fromEntries(Object.keys(select).map((field) => [field, purchase![field as keyof Purchase]])) : null),
      upsert: vi.fn(async ({ create, update }: { create: PurchaseWrite; update: PurchaseWrite }) => {
        purchase = purchase ? { ...purchase, ...update } : { id: "purchase-fixture", ...create };
        return purchase;
      }),
    },
    voucherRedemption: {
      findFirst: vi.fn(async () => redemption),
      create: vi.fn(async ({ data }: { data: { voucherId: string } }) => {
        redemption = { id: "redemption-fixture", voucherId: data.voucherId };
        return redemption;
      }),
    },
    voucherCode: { update: vi.fn(async () => { voucherUses += 1; }) },
    discountApplied: {
      upsert: upsertDiscount, deleteMany: deleteDiscount,
      updateMany: vi.fn(async ({ data }: { data: { voucherId: string | null } }) => {
        if (!discount) return { count: 0 };
        discount = { ...discount, voucherId: data.voucherId };
        return { count: 1 };
      }),
    },
  };
  vi.doMock("@/lib/db", () => ({ db: {
    $transaction: async (callback: (transaction: unknown) => unknown) => callback(tx),
    voucherCode: { findFirst: vi.fn().mockResolvedValue({ id: "voucher-fixture" }) },
  } }));
  sync = await import("@/lib/course-purchase-sync");
});

describe("Purchase monetary availability", () => {
  test.each(["originalPrice", "finalPrice", "discountAmount"] as const)(
    "normalizes negative %s to unknown without inventing a monetary row", async (field) => {
      await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known, [field]: -1 });
      expect(purchase).toMatchObject({ ...known, [field]: null });
      expect(discount).toBeNull();
    },
  );

  test("a late coupon identity links the existing monetary row while preserving known amounts", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    expect(discount?.voucherId).toBeNull();
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown, providerDiscountId: "discount-fixture" });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown, providerDiscountId: "discount-fixture" });
    expect(purchase).toMatchObject({ ...known, voucherId: "voucher-fixture" });
    expect(discount).toMatchObject({ ...known, voucherId: "voucher-fixture" });
    expect(voucherUses).toBe(1);
  });

  test("grants a status-validated partial payment without inventing zero or a discount", async () => {
    const pricing = extractDodoPricing({ data: { metadata: { originalPrice: "29.99" } } });
    await sync.upsertCoursePurchaseFromProvider({ ...identity,
      originalPrice: pricing.subtotalAmount, finalPrice: pricing.totalAmount, discountAmount: pricing.discountAmount,
    });
    expect(purchase).toMatchObject({ originalPrice: null, finalPrice: null, discountAmount: null });
    expect(discount).toBeNull();
    expect(upsertDiscount).not.toHaveBeenCalled();
  });

  test("an incomplete same-payment retry preserves the known amounts and monetary row", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    const priorDiscount = { ...discount };
    upsertDiscount.mockClear();
    deleteDiscount.mockClear();
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown });
    expect(purchase).toMatchObject(known);
    expect(discount).toEqual(priorDiscount);
    expect(upsertDiscount).not.toHaveBeenCalled();
    expect(deleteDiscount).not.toHaveBeenCalled();
  });

  test("a conflicting partial same-payment total cannot mix with old subtotal and discount", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    const priorDiscount = { ...discount };
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown, finalPrice: 70 });
    expect(purchase).toMatchObject(known);
    expect(discount).toEqual(priorDiscount);
  });

  test("a partial same-payment snapshot can fill a previously unknown field without inventing a discount row", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown, finalPrice: 80 });
    expect(purchase).toMatchObject({ originalPrice: null, finalPrice: 80, discountAmount: null });
    expect(discount).toBeNull();
  });

  test("a later complete same-payment snapshot records all amounts and creates the monetary row", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    expect(purchase).toMatchObject(known);
    expect(discount).toMatchObject(known);
  });

  test("a complete same-payment snapshot keeps existing replacement behavior", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    const changed = { originalPrice: 100, finalPrice: 70, discountAmount: 30 };
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...changed });
    expect(purchase).toMatchObject(changed);
    expect(discount).toMatchObject(changed);
  });

  test("a different payment cannot inherit amounts or a monetary row from the previous reference", async () => {
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...known });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown,
      originalPrice: 29.99, providerReferenceId: "dodo-pay:different-fixture-payment",
    });
    expect(purchase).toMatchObject({ providerReferenceId: "dodo-pay:different-fixture-payment",
      originalPrice: 29.99, finalPrice: null, discountAmount: null,
    });
    expect(discount).toBeNull();
  });

  test("preserves recorded zero on a complete snapshot and a later incomplete retry", async () => {
    const zero = { originalPrice: 100, finalPrice: 0, discountAmount: 100 };
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...zero });
    await sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown });
    expect(purchase).toMatchObject(zero);
    expect(discount).toMatchObject(zero);
  });

  test("actual coupon identity still counts a partial paid settlement exactly once", async () => {
    const payload = { data: { payment_id: "fixture-payment", discount_id: "discount-fixture", metadata: { originalPrice: "29.99" } } };
    const pricing = extractDodoPricing(payload);
    const input = { ...identity, originalPrice: pricing.subtotalAmount, finalPrice: pricing.totalAmount,
      discountAmount: pricing.discountAmount, ...resolveDodoVoucherAccounting(payload) };
    await sync.upsertCoursePurchaseFromProvider(input);
    await sync.upsertCoursePurchaseFromProvider(input);
    expect(purchase).toMatchObject({ voucherId: "voucher-fixture", finalPrice: null, discountAmount: null });
    expect(voucherUses).toBe(1);
    expect(discount).toBeNull();
  });

  test("incomplete monetary data cannot bypass a successful-refund entitlement barrier", async () => {
    events.mockResolvedValue([{ eventType: "refund.succeeded", payload: { data: { payment_id: "fixture-payment" } } }]);
    await expect(sync.upsertCoursePurchaseFromProvider({ ...identity, ...unknown }))
      .rejects.toMatchObject({ name: "DodoPaymentRevokedError" });
    expect(purchase).toBeNull();
  });
});
