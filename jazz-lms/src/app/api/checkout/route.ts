import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { isLocalTestRequest } from '@/lib/test-mode';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return new NextResponse('Not Found', { status: 404 });
    }

    if (isLocalTestRequest(req)) {
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      return NextResponse.json({
        url: `${origin}/courses/${courseId}?success=true&localTest=true`,
      });
    }

    // Check if already purchased
    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingPurchase) {
      return new NextResponse('Already purchased', { status: 400 });
    }

    // Find or create Stripe customer
    let stripeCustomerId: string;
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: course.title,
            description: course.description || undefined,
          },
          unit_amount: Math.round((course.price || 0) * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${req.headers.get(
        'origin'
      )}/courses/${courseId}?success=true`,
      cancel_url: `${req.headers.get('origin')}/courses/${courseId}?canceled=true`,
      metadata: {
        purchaseType: 'course',
        courseId: course.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
