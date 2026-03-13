import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

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
  const purchaseType = session?.metadata?.purchaseType;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;
  const lessonId = session?.metadata?.lessonId;

  if (event.type === 'checkout.session.completed') {
    if (!userId || !courseId) {
      return new NextResponse(`Webhook Error: Missing metadata`, {
        status: 400,
      });
    }

    if (purchaseType === 'lesson') {
      if (!lessonId) {
        return new NextResponse(`Webhook Error: Missing lesson metadata`, {
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
    } else {
      const prisma = db as any;

      const hydratedSession = await stripe.checkout.sessions.retrieve(session.id, {
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
          if (!promotionCode) {
            return null;
          }

          if (typeof promotionCode === 'string') {
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
        return new NextResponse('Webhook Error: Discount without promotion code', { status: 400 });
      }

      if (amountDiscount > 0 && normalizedPromotionCode && !mappedVoucher) {
        console.error('[STRIPE_WEBHOOK_UNKNOWN_PROMO_CODE]', {
          sessionId: session.id,
          promotionCode: normalizedPromotionCode,
          amountDiscount,
        });
        return new NextResponse('Webhook Error: Unknown promotion code', { status: 400 });
      }

      const voucherId = mappedVoucher?.id ?? null;
      const originalPrice = Number.isFinite(subtotalAmount) ? Number(subtotalAmount.toFixed(2)) : 0;
      const discountAmount = Number.isFinite(amountDiscount) ? Number(amountDiscount.toFixed(2)) : 0;
      const finalPrice = Number.isFinite(totalAmount) ? Number(totalAmount.toFixed(2)) : 0;

      await prisma.$transaction(async (tx: any) => {
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

        if (voucherId) {
          const redemption = await tx.voucherRedemption.findFirst({
            where: {
              purchaseId: purchase.id,
            },
            select: {
              id: true,
            },
          });

          if (!redemption) {
            await tx.voucherRedemption.create({
              data: {
                voucherId,
                userId,
                purchaseId: purchase.id,
              },
            });

            await tx.voucherCode.update({
              where: { id: voucherId },
              data: {
                currentUses: {
                  increment: 1,
                },
              },
            });
          }

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
      });
    }
  } else {
    return new NextResponse(
      `Webhook Error: Unhandled event type ${event.type}`,
      { status: 200 }
    );
  }

  return new NextResponse(null, { status: 200 });
}
