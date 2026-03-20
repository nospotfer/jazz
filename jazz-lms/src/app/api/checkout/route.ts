import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';
import { cookies } from 'next/headers';
import { normalizeLanguage } from '@/lib/language';
import { isSupportedPaymentMethod } from '@/lib/checkout-helpers';
import { isLocalTestRequest } from '@/lib/test-mode';
import { createLemonCheckout, getLemonConfig, isLemonConfigured, isLemonWebhookConfigured } from '@/lib/lemon-squeezy';
import { validateVoucherForCourse } from '@/lib/vouchers';
import { upsertCoursePurchaseFromProvider } from '@/lib/course-purchase-sync';
import { randomUUID } from 'crypto';
import { languageToStripeLocale, normalizeLanguage } from '@/lib/language';
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
    paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
    invalidVoucher: 'Código de voucher inválido',
    voucherMaxUsesReached: 'Este voucher atingiu o limite total de usos',
    voucherNotConfigured: 'Este voucher no está configurado en el checkout',
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

    copy = {
      es: {
        unauthorized: 'No autorizado',
        emailRequired: 'El correo del usuario es obligatorio',
        invalidRequest: 'Solicitud inválida',
        courseNotFound: 'Curso no encontrado',
        alreadyPurchased: 'El curso ya fue comprado',
        paymentsUnavailable: 'Pagos temporalmente no disponibles',
        paymentMethodUnavailable: 'Método de pago no disponible para esta compra',
        invalidVoucher: 'Código de voucher inválido',
        voucherMaxUsesReached: 'Este voucher atingiu o limite total de usos',
        voucherNotConfigured: 'Este voucher no está configurado en el checkout',
        internalError: 'Error interno del servidor',
      },
      en: {
        unauthorized: 'Unauthorized',
        emailRequired: 'User email is required',
        invalidRequest: 'Invalid request',
        courseNotFound: 'Course not found',
        alreadyPurchased: 'Course already purchased',
        paymentsUnavailable: 'Payments are temporarily unavailable',
        paymentMethodUnavailable: 'Payment method is unavailable for this purchase',
        invalidVoucher: 'Invalid voucher code',
        voucherMaxUsesReached: 'This voucher has reached its maximum number of uses',
        voucherNotConfigured: 'This voucher is not configured in checkout',
        internalError: 'Internal server error',
      },
      fr: {
        unauthorized: 'Non autorisé',
        emailRequired: 'L’e-mail utilisateur est obligatoire',
        invalidRequest: 'Requête invalide',
        courseNotFound: 'Cours introuvable',
        alreadyPurchased: 'Le cours a déjà été acheté',
        paymentsUnavailable: 'Les paiements sont temporairement indisponibles',
        paymentMethodUnavailable: 'Le moyen de paiement n’est pas disponible pour cet achat',
        invalidVoucher: 'Code promo invalide',
        voucherMaxUsesReached: 'Ce code promo a atteint son nombre maximal d’utilisations',
        voucherNotConfigured: 'Ce code promo n’est pas configuré dans le checkout',
        internalError: 'Erreur interne du serveur',
      },
      pt: {
        unauthorized: 'Não autorizado',
        emailRequired: 'O e-mail do usuário é obrigatório',
        invalidRequest: 'Solicitação inválida',
        courseNotFound: 'Curso não encontrado',
        alreadyPurchased: 'O curso já foi comprado',
        paymentsUnavailable: 'Pagamentos temporariamente indisponíveis',
        paymentMethodUnavailable: 'O método de pagamento não está disponível para esta compra',
        invalidVoucher: 'Código de voucher inválido',
        voucherMaxUsesReached: 'Este voucher atingiu o limite total de usos',
        voucherNotConfigured: 'Este voucher não está configurado no checkout',
        internalError: 'Erro interno do servidor',
      },
    }[selectedLanguage];

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const supabase = createClient();
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user ?? null;

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

    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existingPurchase) {
      console.warn('[CHECKOUT_ALREADY_PURCHASED]', {
        userId: user.id,
        userEmail: user.email,
        courseId,
        purchaseId: existingPurchase.id,
        providerReferenceId: existingPurchase.providerReferenceId ?? null,
      });
      return new NextResponse(copy.alreadyPurchased, { status: 400 });
    }

    const configuredPrice = Number(course.price ?? 0);
    const isFreeCourse = !Number.isFinite(configuredPrice) || configuredPrice <= 0;
    const numericPrice = isFreeCourse ? 0 : DEFAULT_FULL_COURSE_PRICE_EUR;

    const normalizedVoucherCode =
      typeof voucherCode === 'string' && voucherCode.trim().length > 0 ? voucherCode.trim().toUpperCase() : null;

    const voucherValidation = normalizedVoucherCode
      ? await validateVoucherForCourse({
          code: normalizedVoucherCode,
          courseId,
          userId: user.id,
        })
      : null;

    if (voucherValidation && !voucherValidation.valid) {
      return new NextResponse(voucherValidation.message || copy.invalidVoucher, { status: 400 });
    }

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

    if (voucherValidation?.valid && voucherValidation.isFree) {
      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId: `ls-voucher:${voucherValidation.voucher.providerDiscountCode}`,
        originalPrice: voucherValidation.originalPrice,
        discountAmount: voucherValidation.discount,
        finalPrice: voucherValidation.finalPrice,
        localVoucherCode: voucherValidation.voucher.code,
        providerDiscountCode: voucherValidation.voucher.providerDiscountCode,
      });

      const successUrl = source === 'dashboard'
        ? `${origin}/dashboard?purchase=success&source=dashboard&voucher=true&free=true`
        : `${origin}/courses/${courseId}?success=true&voucher=true&free=true`;

      return NextResponse.json({ url: successUrl });
    }

    if (isLocalTestRequest(req)) {
      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId: 'local-test-session',
        originalPrice: numericPrice,
        discountAmount: 0,
        finalPrice: numericPrice,
      });

      const successUrl = source === 'dashboard'
        ? `${origin}/dashboard?purchase=success&source=dashboard&test=1`
        : `${origin}/courses/${courseId}?success=true&test=1`;

      return NextResponse.json({ url: successUrl });
    }

    if (!isLemonConfigured()) {
      return new NextResponse(copy.paymentsUnavailable, { status: 503 });
    }

    if (!isLemonWebhookConfigured()) {
      console.warn('[CHECKOUT_WARNING] Lemon webhook secret is missing. Purchase unlock may not persist.');
    }

    const lemonConfig = getLemonConfig();

    const encodedCourseId = encodeURIComponent(courseId);
    const checkoutAttemptId = randomUUID();
    const encodedCheckoutAttemptId = encodeURIComponent(checkoutAttemptId);
    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}`;

    let checkoutUrl: string;
    try {
      checkoutUrl = await createLemonCheckout({
        storeId: lemonConfig.storeId as string,
        variantId: lemonConfig.variantId as string,
        email: user.email,
        successUrl: source === 'dashboard' ? dashboardSuccessUrl : courseSuccessUrl,
        customData: {
          purchaseType: 'course',
          courseId: course.id,
          userId: user.id,
          checkoutAttemptId,
          language: selectedLanguage,
          courseTitle: course.title,
          originalPrice: String(Number(numericPrice.toFixed(2))),
          ...(voucherValidation?.valid
            ? {
                voucherCode: voucherValidation.voucher.code,
                providerDiscountCode: voucherValidation.voucher.providerDiscountCode,
              }
            : {}),
        },
        discountCode: voucherValidation?.valid ? voucherValidation.voucher.providerDiscountCode : undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const normalizedProviderError = errorMessage.replace(/[_-]+/g, ' ');
      const voucherRejectedByProvider =
        errorMessage.includes('discount') &&
        (errorMessage.includes('does not exist') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('not valid'));
      const voucherMaxUsesReachedAtProvider =
        normalizedProviderError.includes('discount') &&
        (normalizedProviderError.includes('maximum redemptions') ||
          normalizedProviderError.includes('max redemptions') ||
          normalizedProviderError.includes('reached its maximum') ||
          normalizedProviderError.includes('maximum uses') ||
          normalizedProviderError.includes('max uses') ||
          normalizedProviderError.includes('usage limit') ||
          (normalizedProviderError.includes('redemption') && normalizedProviderError.includes('limit')) ||
          (normalizedProviderError.includes('redemption') && normalizedProviderError.includes('reached')));

      const lemonConfigFailure =
        errorMessage.includes('missing lemon_squeezy') ||
        errorMessage.includes('missing lemon');

      if (voucherMaxUsesReachedAtProvider) {
        if (voucherValidation?.valid) {
          const nextCurrentUses = voucherValidation.voucher.maxUses !== null
            ? Math.max(voucherValidation.voucher.maxUses, voucherValidation.voucher.currentUses)
            : Math.max(1, voucherValidation.voucher.currentUses + 1);

          await db.voucherCode.update({
            where: {
              id: voucherValidation.voucher.id,
            },
            data: {
              currentUses: nextCurrentUses,
            },
          });

          console.warn('[CHECKOUT_VOUCHER_MAX_USES_SYNCED]', {
            voucherId: voucherValidation.voucher.id,
            voucherCode: voucherValidation.voucher.code,
            localMaxUses: voucherValidation.voucher.maxUses,
            localCurrentUsesBefore: voucherValidation.voucher.currentUses,
            localCurrentUsesAfter: nextCurrentUses,
          });
        }

        return new NextResponse(copy.voucherMaxUsesReached, { status: 400 });
      }
    if (!stripe) {
      return new NextResponse(copy.paymentsUnavailable, { status: 503 });
    }

    const checkoutOriginalPrice = Number(numericPrice.toFixed(2));

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: course.title,
            description: course.description || undefined,
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

      if (voucherRejectedByProvider) {
        return new NextResponse(copy.voucherNotConfigured, { status: 400 });
      }

      if (lemonConfigFailure) {
        return new NextResponse(copy.paymentsUnavailable, { status: 503 });
      }

      console.error('[CHECKOUT_LEMON_CREATE_ERROR]', {
        courseId,
        userId: user.id,
        voucherCode: voucherValidation?.valid ? voucherValidation.voucher.code : null,
        error,
      });

      throw error;
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
