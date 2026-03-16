import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

async function revertCoursePurchaseBySessionId(sessionId: string) {
  const prisma = db as any;

  await prisma.$transaction(async (tx: any) => {
    const purchase = await tx.purchase.findFirst({
      where: {
        stripeSessionId: sessionId,
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

async function resolveSessionIdFromRefundEvent(eventObject: Stripe.Event.Data.Object) {
  if (!stripe) {
    return null;
  }

  const charge = eventObject as Stripe.Charge;
  const paymentIntent = charge.payment_intent;
  if (!paymentIntent || typeof paymentIntent !== 'string') {
    return null;
  }

  const sessions = await (stripe.checkout.sessions as any).list({
    payment_intent: paymentIntent,
    limit: 1,
  });

  const session = sessions?.data?.[0];
  return session?.id || null;
}

async function processCompletedCheckoutSession(session: Stripe.Checkout.Session) {
  const purchaseType = session?.metadata?.purchaseType;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;
  const lessonId = session?.metadata?.lessonId;

  if (!userId || !courseId) {
    return new NextResponse('Webhook Error: Missing metadata', {
      status: 400,
    });
  }

  if (purchaseType === 'lesson') {
    if (!lessonId) {
      return new NextResponse('Webhook Error: Missing lesson metadata', {
        status: 400,
      });
    }

    await db.lessonPurchase.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {},
      create: {
        userId,
        lessonId,
      },
    });

    return null;
  }

  const prisma = db as any;

  const hydratedSession = await stripe!.checkout.sessions.retrieve(session.id, {
    expand: [
      'total_details.breakdown.discounts.discount.promotion_code',
      'total_details.breakdown.discounts.discount.coupon',
    ],
  });

  const subtotalAmount = (hydratedSession.amount_subtotal ?? 0) / 100;
  const totalAmount = (hydratedSession.amount_total ?? 0) / 100;
  const amountDiscount = (hydratedSession.total_details?.amount_discount ?? 0) / 100;

  const breakdownDiscounts = hydratedSession.total_details?.breakdown?.discounts ?? [];
  const appliedPromotionCode = breakdownDiscounts
    .map((entry) => {
      const promotionCode = entry.discount.promotion_code;
      if (!promotionCode || typeof promotionCode === 'string') {
        return null;
      }

      return promotionCode.code;
    })
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const normalizedPromotionCode = appliedPromotionCode?.trim().toUpperCase() || null;
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

  if (amountDiscount > 0 && !normalizedPromotionCode) {
    console.error('[STRIPE_WEBHOOK_DISCOUNT_WITHOUT_CODE]', {
      sessionId: session.id,
      amountDiscount,
    });
  }

  if (amountDiscount > 0 && normalizedPromotionCode && !mappedVoucher) {
    console.error('[STRIPE_WEBHOOK_UNKNOWN_PROMO_CODE]', {
      sessionId: session.id,
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
        stripeSessionId: session.id,
        voucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
      create: {
        courseId,
        userId,
        stripeSessionId: session.id,
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

  return null;
}

export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse('Webhook temporarily disabled: Stripe is not configured', {
      status: 503,
    });
  }

  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return new NextResponse('Webhook Error: Missing Stripe-Signature header', {
      status: 400,
    });
  }

  if (!webhookSecret) {
    return new NextResponse('Webhook Error: Missing STRIPE_WEBHOOK_SECRET', {
      status: 500,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, {
      status: 400,
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    const completedResponse = await processCompletedCheckoutSession(session);
    if (completedResponse) {
      return completedResponse;
    }
  } else if (
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    if (session?.id) {
      await revertCoursePurchaseBySessionId(session.id);
    }
  } else if (event.type === 'charge.refunded') {
    const refundedSessionId = await resolveSessionIdFromRefundEvent(event.data.object);
    if (refundedSessionId) {
      await revertCoursePurchaseBySessionId(refundedSessionId);
    }
  } else {
    return new NextResponse(`Webhook Error: Unhandled event type ${event.type}`, { status: 200 });
  }

  return new NextResponse(null, { status: 200 });
}
