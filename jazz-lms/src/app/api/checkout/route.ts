import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    if (!user.email) {
      return new NextResponse('El correo del usuario es obligatorio', { status: 400 });
    }

    const { courseId, source } = await req.json();

    if (!courseId) {
      return new NextResponse('Solicitud inválida', { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return new NextResponse('Curso no encontrado', { status: 404 });
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
      return new NextResponse('El curso ya fue comprado', { status: 400 });
    }

    const configuredPrice = Number(course.price ?? 0);
    const isFreeCourse = !Number.isFinite(configuredPrice) || configuredPrice <= 0;
    const numericPrice = isFreeCourse ? 0 : DEFAULT_FULL_COURSE_PRICE_EUR;

    if (isFreeCourse) {
      await db.purchase.create({
        data: {
          userId: user.id,
          courseId,
        },
      });

      const successUrl = source === 'dashboard'
        ? `${origin}/dashboard?purchase=success&source=dashboard&free=true`
        : `${origin}/courses/${courseId}?success=true&free=true`;

      return NextResponse.json({
        url: successUrl,
      });
    }

    // Find or create Stripe customer
    let stripeCustomerId: string;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
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
          unit_amount: Math.round(numericPrice * 100),
        },
        quantity: 1,
      },
    ];

    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard&session_id={CHECKOUT_SESSION_ID}`;
    const dashboardCancelUrl = `${origin}/dashboard?purchase=canceled&source=dashboard`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const courseCancelUrl = `${origin}/courses/${courseId}?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: source === 'dashboard' ? dashboardSuccessUrl : courseSuccessUrl,
      cancel_url: source === 'dashboard' ? dashboardCancelUrl : courseCancelUrl,
      metadata: {
        purchaseType: 'course',
        courseId: course.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
