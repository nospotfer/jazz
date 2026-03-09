import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';
import { cookies } from 'next/headers';
import { languageToStripeLocale, normalizeLanguage } from '@/lib/language';
import { getCourseTranslationBundle, resolveCourseText } from '@/lib/course-translations';

export const runtime = 'nodejs';

type SupportedPaymentMethod = 'card' | 'paypal' | 'bizum';

const supportedPaymentMethods = new Set<SupportedPaymentMethod>(['card', 'paypal', 'bizum']);

function isSupportedPaymentMethod(value: unknown): value is SupportedPaymentMethod {
  return typeof value === 'string' && supportedPaymentMethods.has(value as SupportedPaymentMethod);
}

function isUnsupportedPaymentMethodStripeError(error: Stripe.errors.StripeInvalidRequestError): boolean {
  const param = (error.param || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  return (
    param.includes('payment_method_types') ||
    param.includes('automatic_payment_methods') ||
    message.includes('payment method') ||
    message.includes('unsupported') ||
    message.includes('not available')
  );
}

export async function POST(req: Request) {
  let copy = {
    unauthorized: 'No autorizado',
    emailRequired: 'El correo del usuario es obligatorio',
    invalidRequest: 'Solicitud inválida',
    courseNotFound: 'Curso no encontrado',
    alreadyPurchased: 'El curso ya fue comprado',
    paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
    internalError: 'Error interno del servidor',
  };

  try {
    const payload = await req.json();
    const { courseId, source, language, paymentMethod } = payload ?? {};

    if (!courseId) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }

    if (paymentMethod !== undefined && paymentMethod !== null && !isSupportedPaymentMethod(paymentMethod)) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }

    const cookieStore = await cookies();
    const selectedLanguage = typeof language === 'string' && language.trim().length > 0
      ? normalizeLanguage(language)
      : normalizeLanguage(cookieStore.get('jazz_lang')?.value);
    const stripeLocale = languageToStripeLocale(selectedLanguage);
    copy = {
      es: {
        unauthorized: 'No autorizado',
        emailRequired: 'El correo del usuario es obligatorio',
        invalidRequest: 'Solicitud inválida',
        courseNotFound: 'Curso no encontrado',
        alreadyPurchased: 'El curso ya fue comprado',
        paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
        internalError: 'Error interno del servidor',
      },
      en: {
        unauthorized: 'Unauthorized',
        emailRequired: 'User email is required',
        invalidRequest: 'Invalid request',
        courseNotFound: 'Course not found',
        alreadyPurchased: 'Course already purchased',
        paymentMethodUnavailable: 'Payment method is unavailable for this purchase',
        internalError: 'Internal server error',
      },
      fr: {
        unauthorized: 'Non autorisé',
        emailRequired: 'L’e-mail utilisateur est obligatoire',
        invalidRequest: 'Requête invalide',
        courseNotFound: 'Cours introuvable',
        alreadyPurchased: 'Le cours a déjà été acheté',
        paymentMethodUnavailable: 'Le moyen de paiement n’est pas disponible pour cet achat',
        internalError: 'Erreur interne du serveur',
      },
      pt: {
        unauthorized: 'Não autorizado',
        emailRequired: 'O e-mail do usuário é obrigatório',
        invalidRequest: 'Solicitação inválida',
        courseNotFound: 'Curso não encontrado',
        alreadyPurchased: 'O curso já foi comprado',
        paymentMethodUnavailable: 'O método de pagamento não está disponível para esta compra',
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

    const translationBundle = await getCourseTranslationBundle({
      language: selectedLanguage,
      courseIds: [course.id],
      chapterIds: [],
      lessonIds: [],
    });
    const localizedCourse = resolveCourseText(
      translationBundle.courses,
      course.id,
      course.title,
      course.description
    );

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
            name: localizedCourse.title,
            description: localizedCourse.description || undefined,
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

    const baseSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
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
    };

    let session: Stripe.Checkout.Session;
    try {
      if (isSupportedPaymentMethod(paymentMethod)) {
        const explicitMethodParams: Stripe.Checkout.SessionCreateParams = {
          ...baseSessionParams,
          payment_method_types: [paymentMethod] as unknown as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        };

        session = await stripe.checkout.sessions.create(explicitMethodParams);
      } else {
        try {
          const multiMethodParams: Stripe.Checkout.SessionCreateParams = {
            ...baseSessionParams,
            payment_method_types: ['card', 'paypal', 'bizum'] as unknown as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
          };

          session = await stripe.checkout.sessions.create(multiMethodParams);
        } catch (fallbackError) {
          if (
            fallbackError instanceof Stripe.errors.StripeInvalidRequestError &&
            isUnsupportedPaymentMethodStripeError(fallbackError)
          ) {
            const cardOnlyParams: Stripe.Checkout.SessionCreateParams = {
              ...baseSessionParams,
              payment_method_types: ['card'],
            };

            session = await stripe.checkout.sessions.create(cardOnlyParams);
          } else {
            throw fallbackError;
          }
        }
      }
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        isUnsupportedPaymentMethodStripeError(error)
      ) {
        return new NextResponse(copy.paymentMethodUnavailable, { status: 400 });
      }

      throw error;
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
