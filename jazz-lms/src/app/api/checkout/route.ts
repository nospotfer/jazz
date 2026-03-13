import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';
import { cookies } from 'next/headers';
import { languageToStripeLocale, normalizeLanguage } from '@/lib/language';
import { getCourseTranslationBundle, resolveCourseText } from '@/lib/course-translations';
import { isSupportedPaymentMethod, isUnsupportedPaymentMethodStripeError } from '@/lib/checkout-helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let copy = {
    unauthorized: 'No autorizado',
    emailRequired: 'El correo del usuario es obligatorio',
    invalidRequest: 'Solicitud inválida',
    courseNotFound: 'Curso no encontrado',
    alreadyPurchased: 'El curso ya fue comprado',
    paymentsUnavailable: 'Pagos temporalmente no disponibles',
    inDevelopment: 'En desarrollo',
    paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
    voucherInProvider: 'Introduce el código de descuento en la página de pago segura',
    internalError: 'Error interno del servidor',
  };

  try {
    const payload = await req.json();
    const { courseId, source, language, paymentMethod, voucherCode } = payload ?? {};

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
        paymentsUnavailable: 'Pagos temporalmente no disponibles',
        inDevelopment: 'En desarrollo',
        paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
        voucherInProvider: 'Introduce el código de descuento en la página de pago segura',
        internalError: 'Error interno del servidor',
      },
      en: {
        unauthorized: 'Unauthorized',
        emailRequired: 'User email is required',
        invalidRequest: 'Invalid request',
        courseNotFound: 'Course not found',
        alreadyPurchased: 'Course already purchased',
        paymentsUnavailable: 'Payments are temporarily unavailable',
        inDevelopment: 'In development',
        paymentMethodUnavailable: 'Payment method is unavailable for this purchase',
        voucherInProvider: 'Enter your discount code on the secure payment page',
        internalError: 'Internal server error',
      },
      fr: {
        unauthorized: 'Non autorisé',
        emailRequired: 'L’e-mail utilisateur est obligatoire',
        invalidRequest: 'Requête invalide',
        courseNotFound: 'Cours introuvable',
        alreadyPurchased: 'Le cours a déjà été acheté',
        paymentsUnavailable: 'Les paiements sont temporairement indisponibles',
        inDevelopment: 'En developpement',
        paymentMethodUnavailable: 'Le moyen de paiement n’est pas disponible pour cet achat',
        voucherInProvider: 'Saisissez votre code de réduction sur la page de paiement sécurisée',
        internalError: 'Erreur interne du serveur',
      },
      pt: {
        unauthorized: 'Não autorizado',
        emailRequired: 'O e-mail do usuário é obrigatório',
        invalidRequest: 'Solicitação inválida',
        courseNotFound: 'Curso não encontrado',
        alreadyPurchased: 'O curso já foi comprado',
        paymentsUnavailable: 'Pagamentos temporariamente indisponíveis',
        inDevelopment: 'Em desenvolvimento',
        paymentMethodUnavailable: 'O método de pagamento não está disponível para esta compra',
        voucherInProvider: 'Insira o código de desconto na página de pagamento segura',
        internalError: 'Erro interno do servidor',
      },
    }[selectedLanguage];

    if (typeof voucherCode === 'string' && voucherCode.trim().length > 0) {
      return new NextResponse(copy.voucherInProvider, { status: 400 });
    }

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

    const [course, existingPurchase] = await Promise.all([
      db.course.findUnique({
        where: {
          id: courseId,
        },
      }),
      db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      }),
    ]);

    if (!course) {
      return new NextResponse(copy.courseNotFound, { status: 404 });
    }

    if (existingPurchase) {
      return new NextResponse(copy.alreadyPurchased, { status: 400 });
    }

    const configuredPrice = Number(course.price ?? 0);
    const isFreeCourse = !Number.isFinite(configuredPrice) || configuredPrice <= 0;
    const numericPrice = isFreeCourse ? 0 : DEFAULT_FULL_COURSE_PRICE_EUR;

    if (isFreeCourse) {
      const prisma = db as any;
      await prisma.$transaction(async (tx: any) => {
        await tx.purchase.upsert({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId,
            },
          },
          update: {
            voucherId: null,
            originalPrice: 0,
            finalPrice: 0,
            discountAmount: 0,
          },
          create: {
            userId: user.id,
            courseId,
            voucherId: null,
            originalPrice: 0,
            finalPrice: 0,
            discountAmount: 0,
          },
        });
      });

      const successUrl = source === 'dashboard'
        ? `${origin}/dashboard?purchase=success&source=dashboard&free=true`
        : `${origin}/courses/${courseId}?success=true&free=true`;

      return NextResponse.json({
        url: successUrl,
      });
    }

    if (!stripe) {
      return new NextResponse(copy.inDevelopment, { status: 503 });
    }

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

    const checkoutOriginalPrice = Number(numericPrice.toFixed(2));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: localizedCourse.title,
            description: localizedCourse.description || undefined,
          },
          unit_amount: Math.round(checkoutOriginalPrice * 100),
        },
        quantity: 1,
      },
    ];

    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard&session_id={CHECKOUT_SESSION_ID}`;
    const dashboardCancelUrl = `${origin}/dashboard?purchase=canceled&source=dashboard`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const courseCancelUrl = `${origin}/courses/${courseId}?canceled=true`;

    const baseSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_creation: 'always',
      customer_email: user.email,
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
        originalPrice: String(checkoutOriginalPrice),
        discountAmount: '0',
        finalPrice: String(checkoutOriginalPrice),
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
            payment_method_types: ['card', 'paypal'] as unknown as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
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
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        if (isUnsupportedPaymentMethodStripeError(error)) {
          return new NextResponse(copy.paymentMethodUnavailable, { status: 400 });
        }

        console.log('[CHECKOUT_STRIPE_INVALID_REQUEST]', {
          message: error.message,
          param: error.param,
          code: error.code,
        });
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
