import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';
import { cookies } from 'next/headers';
import { languageToStripeLocale, normalizeLanguage } from '@/lib/language';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let copy = {
    unauthorized: 'No autorizado',
    emailRequired: 'El correo del usuario es obligatorio',
    invalidRequest: 'Solicitud inválida',
    courseNotFound: 'Curso no encontrado',
    alreadyPurchased: 'El curso ya fue comprado',
    internalError: 'Error interno del servidor',
  };

  try {
    const cookieStore = await cookies();
    const selectedLanguage = normalizeLanguage(cookieStore.get('jazz_lang')?.value);
    const stripeLocale = languageToStripeLocale(selectedLanguage);
    copy = {
      es: {
        unauthorized: 'No autorizado',
        emailRequired: 'El correo del usuario es obligatorio',
        invalidRequest: 'Solicitud inválida',
        courseNotFound: 'Curso no encontrado',
        alreadyPurchased: 'El curso ya fue comprado',
        internalError: 'Error interno del servidor',
      },
      en: {
        unauthorized: 'Unauthorized',
        emailRequired: 'User email is required',
        invalidRequest: 'Invalid request',
        courseNotFound: 'Course not found',
        alreadyPurchased: 'Course already purchased',
        internalError: 'Internal server error',
      },
      fr: {
        unauthorized: 'Non autorisé',
        emailRequired: 'L’e-mail utilisateur est obligatoire',
        invalidRequest: 'Requête invalide',
        courseNotFound: 'Cours introuvable',
        alreadyPurchased: 'Le cours a déjà été acheté',
        internalError: 'Erreur interne du serveur',
      },
      pt: {
        unauthorized: 'Não autorizado',
        emailRequired: 'O e-mail do usuário é obrigatório',
        invalidRequest: 'Solicitação inválida',
        courseNotFound: 'Curso não encontrado',
        alreadyPurchased: 'O curso já foi comprado',
        internalError: 'Erro interno do servidor',
      },
    }[selectedLanguage];
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(copy.unauthorized, { status: 401 });
    }

    if (!user.email) {
      return new NextResponse(copy.emailRequired, { status: 400 });
    }

    const { courseId, source } = await req.json();

    if (!courseId) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }

    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return new NextResponse(copy.courseNotFound, { status: 404 });
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
      return new NextResponse(copy.alreadyPurchased, { status: 400 });
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
      locale: stripeLocale,
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
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
