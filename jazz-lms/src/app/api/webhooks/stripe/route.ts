import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
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
      await db.purchase.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        update: {},
        create: {
          courseId,
          userId,
        },
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
