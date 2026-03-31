import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("upsertCoursePurchaseFromProvider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("preserves existing voucher redemption on conflicting later write by default", async () => {
    const providerVoucherFindUnique = vi
      .fn()
      .mockResolvedValue({ id: "voucher-next" });
    const providerVoucherFindFirst = vi.fn().mockResolvedValue(null);
    const providerVoucherFindMany = vi.fn().mockResolvedValue([]);

    const purchaseFindUnique = vi
      .fn()
      .mockResolvedValue({ id: "purchase-1", voucherId: "voucher-existing" });
    const purchaseUpsert = vi.fn().mockResolvedValue({ id: "purchase-1" });

    const redemptionFindFirst = vi.fn().mockResolvedValue({
      id: "redemption-1",
      voucherId: "voucher-existing",
    });
    const redemptionCreate = vi.fn();
    const redemptionUpdate = vi.fn();
    const redemptionDelete = vi.fn();

    const txVoucherUpdate = vi.fn();
    const txVoucherUpdateMany = vi.fn();

    const discountUpsert = vi.fn().mockResolvedValue({ id: "discount-1" });
    const discountDeleteMany = vi.fn();

    vi.doMock("@/lib/db", () => ({
      db: {
        voucherCode: {
          findUnique: providerVoucherFindUnique,
          findFirst: providerVoucherFindFirst,
          findMany: providerVoucherFindMany,
        },
        $transaction: async (callback: (tx: any) => Promise<unknown>) =>
          callback({
            purchase: {
              findUnique: purchaseFindUnique,
              upsert: purchaseUpsert,
            },
            voucherRedemption: {
              findFirst: redemptionFindFirst,
              create: redemptionCreate,
              update: redemptionUpdate,
              delete: redemptionDelete,
            },
            voucherCode: {
              update: txVoucherUpdate,
              updateMany: txVoucherUpdateMany,
            },
            discountApplied: {
              upsert: discountUpsert,
              deleteMany: discountDeleteMany,
            },
          }),
      },
    }));

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const { upsertCoursePurchaseFromProvider } =
      await import("@/lib/course-purchase-sync");

    await upsertCoursePurchaseFromProvider({
      userId: "user-1",
      courseId: "course-1",
      providerReferenceId: "ls-order:1",
      originalPrice: 100,
      discountAmount: 100,
      finalPrice: 0,
      localVoucherCode: "NEWCODE",
    });

    expect(purchaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ voucherId: "voucher-existing" }),
        create: expect.objectContaining({ voucherId: "voucher-existing" }),
      }),
    );
    expect(redemptionCreate).not.toHaveBeenCalled();
    expect(redemptionUpdate).not.toHaveBeenCalled();
    expect(redemptionDelete).not.toHaveBeenCalled();
    expect(txVoucherUpdate).not.toHaveBeenCalled();
    expect(txVoucherUpdateMany).not.toHaveBeenCalled();
    expect(discountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ voucherId: "voucher-existing" }),
      }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[COURSE_PURCHASE_SYNC_VOUCHER_CONFLICT_PRESERVED]",
      expect.objectContaining({
        userId: "user-1",
        courseId: "course-1",
        existingVoucherId: "voucher-existing",
        incomingVoucherId: "voucher-next",
      }),
    );
  });

  test("maps provider discount code via metadata dodoDiscountCode when direct match does not exist", async () => {
    const providerVoucherFindUnique = vi.fn().mockResolvedValue(null);
    const providerVoucherFindFirst = vi.fn().mockResolvedValue(null);
    const providerVoucherFindMany = vi.fn().mockResolvedValue([
      {
        id: "voucher-meta",
        metadata: {
          dodoDiscountCode: "DODO-DISC-42",
        },
      },
    ]);

    const purchaseFindUnique = vi.fn().mockResolvedValue(null);
    const purchaseUpsert = vi.fn().mockResolvedValue({ id: "purchase-2" });

    const redemptionFindFirst = vi.fn().mockResolvedValue(null);
    const redemptionCreate = vi.fn().mockResolvedValue({ id: "redemption-2" });

    const txVoucherUpdate = vi.fn().mockResolvedValue({ id: "voucher-meta" });
    const txVoucherUpdateMany = vi.fn();

    const discountUpsert = vi.fn().mockResolvedValue({ id: "discount-2" });
    const discountDeleteMany = vi.fn();

    vi.doMock("@/lib/db", () => ({
      db: {
        voucherCode: {
          findUnique: providerVoucherFindUnique,
          findFirst: providerVoucherFindFirst,
          findMany: providerVoucherFindMany,
        },
        $transaction: async (callback: (tx: any) => Promise<unknown>) =>
          callback({
            purchase: {
              findUnique: purchaseFindUnique,
              upsert: purchaseUpsert,
            },
            voucherRedemption: {
              findFirst: redemptionFindFirst,
              create: redemptionCreate,
              update: vi.fn(),
              delete: vi.fn(),
            },
            voucherCode: {
              update: txVoucherUpdate,
              updateMany: txVoucherUpdateMany,
            },
            discountApplied: {
              upsert: discountUpsert,
              deleteMany: discountDeleteMany,
            },
          }),
      },
    }));

    const { upsertCoursePurchaseFromProvider } =
      await import("@/lib/course-purchase-sync");

    await upsertCoursePurchaseFromProvider({
      userId: "user-2",
      courseId: "course-2",
      providerReferenceId: "dodo-pay:2",
      originalPrice: 75,
      discountAmount: 10,
      finalPrice: 65,
      providerDiscountCode: "dodo-disc-42",
    });

    expect(providerVoucherFindMany).toHaveBeenCalledTimes(1);
    expect(purchaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ voucherId: "voucher-meta" }),
        create: expect.objectContaining({ voucherId: "voucher-meta" }),
      }),
    );
    expect(redemptionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ voucherId: "voucher-meta" }),
      }),
    );
    expect(txVoucherUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "voucher-meta" },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      }),
    );
    expect(txVoucherUpdateMany).not.toHaveBeenCalled();
    expect(discountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ voucherId: "voucher-meta" }),
      }),
    );
  });

  test("decrements voucher usage with guarded atomic update when redemption is removed", async () => {
    const purchaseFindUnique = vi.fn().mockResolvedValue({
      id: "purchase-3",
      voucherId: "voucher-existing",
    });
    const purchaseUpsert = vi.fn().mockResolvedValue({ id: "purchase-3" });

    const redemptionFindFirst = vi.fn().mockResolvedValue({
      id: "redemption-3",
      voucherId: "voucher-existing",
    });
    const redemptionDelete = vi.fn().mockResolvedValue({ id: "redemption-3" });

    const txVoucherUpdate = vi.fn();
    const txVoucherUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

    const discountUpsert = vi.fn();
    const discountDeleteMany = vi.fn().mockResolvedValue({ count: 1 });

    vi.doMock("@/lib/db", () => ({
      db: {
        voucherCode: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
        },
        $transaction: async (callback: (tx: any) => Promise<unknown>) =>
          callback({
            purchase: {
              findUnique: purchaseFindUnique,
              upsert: purchaseUpsert,
            },
            voucherRedemption: {
              findFirst: redemptionFindFirst,
              create: vi.fn(),
              update: vi.fn(),
              delete: redemptionDelete,
            },
            voucherCode: {
              update: txVoucherUpdate,
              updateMany: txVoucherUpdateMany,
            },
            discountApplied: {
              upsert: discountUpsert,
              deleteMany: discountDeleteMany,
            },
          }),
      },
    }));

    const { upsertCoursePurchaseFromProvider } =
      await import("@/lib/course-purchase-sync");

    await upsertCoursePurchaseFromProvider({
      userId: "user-3",
      courseId: "course-3",
      providerReferenceId: "dodo-pay:3",
      originalPrice: 29.9,
      discountAmount: 0,
      finalPrice: 29.9,
      preserveExistingVoucher: false,
    });

    expect(txVoucherUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "voucher-existing",
        currentUses: {
          gt: 0,
        },
      },
      data: {
        currentUses: {
          decrement: 1,
        },
      },
    });
    expect(txVoucherUpdate).not.toHaveBeenCalled();
    expect(redemptionDelete).toHaveBeenCalledWith({
      where: {
        id: "redemption-3",
      },
    });
    expect(discountDeleteMany).toHaveBeenCalledWith({
      where: {
        purchaseId: "purchase-3",
      },
    });
    expect(discountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          purchaseId: "purchase-3",
        },
        update: expect.objectContaining({
          voucherId: null,
        }),
      }),
    );
  });
});
