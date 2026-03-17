import { db } from '@/lib/db';

type UpsertCoursePurchaseInput = {
  userId: string;
  courseId: string;
  providerReferenceId: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  voucherCode?: string | null;
};

function toMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

export async function upsertCoursePurchaseFromProvider(input: UpsertCoursePurchaseInput) {
  const prisma = db as any;
  const normalizedCode = input.voucherCode?.trim().toUpperCase() || null;

  const mappedVoucher = normalizedCode
    ? await prisma.voucherCode.findUnique({
        where: {
          code: normalizedCode,
        },
        select: {
          id: true,
        },
      })
    : null;

  const voucherId = mappedVoucher?.id ?? null;
  const originalPrice = toMoney(input.originalPrice);
  const discountAmount = toMoney(input.discountAmount);
  const finalPrice = toMoney(input.finalPrice);

  await prisma.$transaction(async (tx: any) => {
    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
      select: {
        id: true,
      },
    });

    const purchase = await tx.purchase.upsert({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
      update: {
        stripeSessionId: input.providerReferenceId,
        voucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
      create: {
        courseId: input.courseId,
        userId: input.userId,
        stripeSessionId: input.providerReferenceId,
        voucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
    });

    const existingRedemption = await tx.voucherRedemption.findFirst({
      where: {
        purchaseId: purchase.id,
      },
      select: {
        id: true,
        voucherId: true,
      },
    });

    if (voucherId) {
      if (!existingRedemption) {
        await tx.voucherRedemption.create({
          data: {
            voucherId,
            userId: input.userId,
            purchaseId: purchase.id,
          },
        });

        const voucher = await tx.voucherCode.findUnique({
          where: { id: voucherId },
          select: { currentUses: true },
        });

        if (voucher) {
          await tx.voucherCode.update({
            where: { id: voucherId },
            data: {
              currentUses: voucher.currentUses + 1,
            },
          });
        }
      } else if (existingRedemption.voucherId !== voucherId) {
        const previousVoucher = await tx.voucherCode.findUnique({
          where: { id: existingRedemption.voucherId },
          select: { currentUses: true },
        });

        if (previousVoucher) {
          await tx.voucherCode.update({
            where: { id: existingRedemption.voucherId },
            data: {
              currentUses: Math.max(0, previousVoucher.currentUses - 1),
            },
          });
        }

        const nextVoucher = await tx.voucherCode.findUnique({
          where: { id: voucherId },
          select: { currentUses: true },
        });

        if (nextVoucher) {
          await tx.voucherCode.update({
            where: { id: voucherId },
            data: {
              currentUses: nextVoucher.currentUses + 1,
            },
          });
        }

        await tx.voucherRedemption.update({
          where: {
            id: existingRedemption.id,
          },
          data: {
            voucherId,
          },
        });
      }
    } else if (existingRedemption) {
      const previousVoucher = await tx.voucherCode.findUnique({
        where: { id: existingRedemption.voucherId },
        select: { currentUses: true },
      });

      if (previousVoucher) {
        await tx.voucherCode.update({
          where: { id: existingRedemption.voucherId },
          data: {
            currentUses: Math.max(0, previousVoucher.currentUses - 1),
          },
        });
      }

      await tx.voucherRedemption.delete({
        where: {
          id: existingRedemption.id,
        },
      });
    }

    if (discountAmount > 0 || existingPurchase) {
      await tx.discountApplied.upsert({
        where: {
          purchaseId: purchase.id,
        },
        update: {
          voucherId,
          originalPrice,
          discountAmount,
          finalPrice,
        },
        create: {
          purchaseId: purchase.id,
          voucherId,
          originalPrice,
          discountAmount,
          finalPrice,
        },
      });
    }

    if (discountAmount <= 0) {
      await tx.discountApplied.deleteMany({
        where: {
          purchaseId: purchase.id,
        },
      });
    }
  });
}

export async function revertCoursePurchaseByProviderReferenceId(providerReferenceId: string) {
  const prisma = db as any;

  await prisma.$transaction(async (tx: any) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        stripeSessionId: providerReferenceId,
      },
      include: {
        redemption: {
          select: {
            id: true,
            voucherId: true,
          },
        },
      },
    });

    if (!purchase) {
      return;
    }

    if (purchase.redemption?.voucherId) {
      const voucher = await tx.voucherCode.findUnique({
        where: { id: purchase.redemption.voucherId },
        select: { currentUses: true },
      });

      if (voucher) {
        await tx.voucherCode.update({
          where: { id: purchase.redemption.voucherId },
          data: {
            currentUses: Math.max(0, voucher.currentUses - 1),
          },
        });
      }
    }

    await tx.discountApplied.deleteMany({
      where: {
        purchaseId: purchase.id,
      },
    });

    await tx.voucherRedemption.deleteMany({
      where: {
        purchaseId: purchase.id,
      },
    });

    await tx.purchase.delete({
      where: {
        id: purchase.id,
      },
    });
  });
}
