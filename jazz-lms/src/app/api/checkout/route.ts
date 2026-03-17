import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';
import { cookies } from 'next/headers';
import { normalizeLanguage } from '@/lib/language';
import { isSupportedPaymentMethod } from '@/lib/checkout-helpers';
import { isLocalTestRequest } from '@/lib/test-mode';
import { createLemonCheckout, getLemonConfig, isLemonConfigured } from '@/lib/lemon-squeezy';
import { validateVoucherForCourse } from '@/lib/vouchers';
import { upsertCoursePurchaseFromProvider } from '@/lib/course-purchase-sync';

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
        voucherNotConfigured: 'Este voucher não está configurado no checkout',
        internalError: 'Erro interno do servidor',
      },
    }[selectedLanguage];

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existingPurchase) {
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
        voucherCode: voucherValidation.voucher.code,
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

    const lemonConfig = getLemonConfig();

    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true`;

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
          language: selectedLanguage,
          courseTitle: course.title,
          originalPrice: String(Number(numericPrice.toFixed(2))),
        },
        discountCode: voucherValidation?.valid ? voucherValidation.voucher.providerDiscountCode : undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const voucherRejectedByProvider =
        errorMessage.includes('discount code') && errorMessage.includes('does not exist');

      if (voucherRejectedByProvider) {
        return new NextResponse(copy.voucherNotConfigured, { status: 400 });
      }

      throw error;
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.log('[CHECKOUT_ERROR]', error);
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
