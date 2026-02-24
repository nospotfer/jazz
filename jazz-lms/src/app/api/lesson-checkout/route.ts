import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { LESSON_UNIT_PRICE_EUR } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId, lessonId } = await req.json();

    if (!courseId || !lessonId) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson || lesson.chapter.courseId !== courseId || !lesson.isPublished) {
      return new NextResponse('Lesson not found', { status: 404 });
    }

    const hasFullCourse = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (hasFullCourse) {
      return new NextResponse('You already purchased the full course', {
        status: 400,
      });
    }

    const existingLessonPurchase = await db.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM LessonPurchase
      WHERE userId = ${user.id}
        AND lessonId = ${lessonId}
      LIMIT 1
    `;

    if (existingLessonPurchase.length > 0) {
      return new NextResponse('Lesson already purchased', { status: 400 });
    }

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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${lesson.chapter.course.title} — ${lesson.title}`,
            description:
              lesson.description ||
              'Single lesson purchase. Full course bundle remains available.',
          },
          unit_amount: Math.round(LESSON_UNIT_PRICE_EUR * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${req.headers.get('origin')}/courses/${courseId}/lessons/${lessonId}?success=true`,
      cancel_url: `${req.headers.get('origin')}/courses/${courseId}?canceled=true`,
      metadata: {
        purchaseType: 'lesson',
        userId: user.id,
        courseId,
        lessonId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log('[LESSON_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
