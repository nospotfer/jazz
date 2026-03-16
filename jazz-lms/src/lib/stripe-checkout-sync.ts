import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

type SyncCheckoutParams = {
  sessionId: string;
  expectedUserId?: string;
  expectedCourseId?: string;
};

type SyncCheckoutResult = {
  success: boolean;
  reason?: 'stripe_unavailable' | 'session_not_found' | 'metadata_invalid' | 'user_mismatch' | 'course_mismatch' | 'not_paid';
  sessionId: string;
  userId?: string;
  courseId?: string;
  voucherCode?: string | null;
  voucherId?: string | null;
};

function isPaidOrZeroTotal(session: any) {
  if (session?.payment_status === 'paid') {
    return true;
  }

  const amountTotal = session?.amount_total ?? 0;
  return session?.status === 'complete' && amountTotal === 0;
}

export async function syncCourseCheckoutSession(params: SyncCheckoutParams): Promise<SyncCheckoutResult> {
  if (!stripe) {
    return {
      success: false,
      reason: 'stripe_unavailable',
      sessionId: params.sessionId,
    };
  }

  const hydratedSession = await stripe.checkout.sessions.retrieve(params.sessionId, {
    expand: [
      'total_details.breakdown.discounts.discount.promotion_code',
      'total_details.breakdown.discounts.discount.coupon',
    ],
  });

  if (!hydratedSession) {
    return {
      success: false,
      reason: 'session_not_found',
      sessionId: params.sessionId,
    };
  }

  const userId = hydratedSession?.metadata?.userId;
  const courseId = hydratedSession?.metadata?.courseId;
  const purchaseType = hydratedSession?.metadata?.purchaseType;

  if (!userId || !courseId || purchaseType !== 'course') {
    return {
      success: false,
      reason: 'metadata_invalid',
      sessionId: params.sessionId,
      userId: userId || undefined,
      courseId: courseId || undefined,
    };
  }

  if (params.expectedUserId && params.expectedUserId !== userId) {
    return {
      success: false,
      reason: 'user_mismatch',
      sessionId: params.sessionId,
      userId,
      courseId,
    };
  }

  if (params.expectedCourseId && params.expectedCourseId !== courseId) {
    return {
      success: false,
      reason: 'course_mismatch',
      sessionId: params.sessionId,
      userId,
      courseId,
    };
  }

  if (!isPaidOrZeroTotal(hydratedSession)) {
    return {
      success: false,
      reason: 'not_paid',
      sessionId: params.sessionId,
      userId,
      courseId,
    };
  }

  const subtotalAmount = (hydratedSession.amount_subtotal ?? 0) / 100;
  const totalAmount = (hydratedSession.amount_total ?? 0) / 100;
  const amountDiscount = (hydratedSession.total_details?.amount_discount ?? 0) / 100;

  const breakdownDiscounts = hydratedSession.total_details?.breakdown?.discounts ?? [];
  const appliedPromotionCode = breakdownDiscounts
    .map((entry: any) => {
      const promotionCode = entry.discount.promotion_code;
      if (!promotionCode || typeof promotionCode === 'string') {
        return null;
      }

      return promotionCode.code;
    })
    .find((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);

  const normalizedPromotionCode = appliedPromotionCode?.trim().toUpperCase() || null;

  const prisma = db as any;
  const mappedVoucher = normalizedPromotionCode
    ? await prisma.voucherCode.findUnique({
        where: {
          code: normalizedPromotionCode,
        },
        select: {
          id: true,
        },
      })
    : null;

  if (amountDiscount > 0 && normalizedPromotionCode && !mappedVoucher) {
    console.error('[CHECKOUT_SYNC_UNKNOWN_PROMO_CODE]', {
      sessionId: params.sessionId,
      promotionCode: normalizedPromotionCode,
      amountDiscount,
    });
  }

  const voucherId = mappedVoucher?.id ?? null;
  const originalPrice = Number.isFinite(subtotalAmount) ? Number(subtotalAmount.toFixed(2)) : 0;
  const discountAmount = Number.isFinite(amountDiscount) ? Number(amountDiscount.toFixed(2)) : 0;
  const finalPrice = Number.isFinite(totalAmount) ? Number(totalAmount.toFixed(2)) : 0;

  await prisma.$transaction(async (tx: any) => {
    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        id: true,
      },
    });

    const purchase = await tx.purchase.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        stripeSessionId: params.sessionId,
        voucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
      create: {
        courseId,
        userId,
        stripeSessionId: params.sessionId,
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
            userId,
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
          originalPrice: Number.isFinite(originalPrice) ? originalPrice : 0,
          discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
          finalPrice: Number.isFinite(finalPrice) ? finalPrice : 0,
        },
        create: {
          purchaseId: purchase.id,
          voucherId,
          originalPrice: Number.isFinite(originalPrice) ? originalPrice : 0,
          discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
          finalPrice: Number.isFinite(finalPrice) ? finalPrice : 0,
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

  return {
    success: true,
    sessionId: params.sessionId,
    userId,
    courseId,
    voucherCode: normalizedPromotionCode,
    voucherId,
  };
}