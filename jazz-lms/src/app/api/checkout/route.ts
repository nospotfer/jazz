import { isSupportedPaymentMethod } from "@/lib/checkout-helpers";
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { safeErrorDiagnostic } from "@/lib/error-diagnostics";
import { expectedUserConsistencyResponse } from "@/lib/expected-user-consistency";
import { normalizeLanguage } from "@/lib/language";
import {
  createProviderCheckout,
  getPaymentProvider,
  getProviderVoucherReferencePrefix,
  isActivePaymentProviderConfigured,
} from "@/lib/payments/provider";
import { isDodoWebhookConfigured } from "@/lib/payments/providers/dodo";
import { getDodoDiscountLimitScope } from "@/lib/payments/providers/dodo-checkout-errors";
import { DEFAULT_FULL_COURSE_PRICE_EUR, getKnownCatalogPrice } from "@/lib/pricing";
import { isLocalTestRequest } from "@/lib/test-mode";
import {
  lockPublishedCourseForGrant,
  revalidateVoucherForGrant,
  validateVoucherForCourse,
  VoucherGrantError,
} from "@/lib/vouchers";
import { ensureVoucherDiscountSynced } from "@/lib/voucher-provider-sync";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function isProviderCheckoutFailure(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("dodo checkout create failed") ||
    message.includes("missing dodo") ||
    message.includes("fetch failed") ||
    message.includes("aborted") ||
    message.includes("timeout")
  );
}

function isInvalidJsonBodyError(error: unknown) {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("json") ||
    message.includes("unexpected token") ||
    message.includes("unexpected end")
  );
}

export async function POST(req: Request) {
  const paymentProvider = getPaymentProvider();
  let copy = {
    unauthorized: "No autorizado",
    emailRequired: "El correo del usuario es obligatorio",
    invalidRequest: "Solicitud inválida",
    courseNotFound: "Curso no encontrado",
    priceUnavailable: "El precio del curso no está disponible. Inténtalo de nuevo más tarde.",
    quoteChanged: "El curso o el cupón cambió. Vuelve a intentarlo para validar el precio.",
    alreadyPurchased: "El curso ya fue comprado",
    paymentsUnavailable: "Pagos temporalmente no disponibles",
    paymentMethodUnavailable: "Método de pago no disponible para esta compra",
    invalidVoucher: "Código de voucher inválido",
    voucherMaxUsesReached: "Este cupón ha alcanzado el límite total de usos.",
    voucherCustomerLimit: "Has alcanzado el límite de este cupón para tu cuenta.",
    voucherUsageUnavailable: "Este cupón no está disponible para esta compra. Vuelve a validar el código.",
    voucherNotConfigured: "Este voucher no está configurado en el checkout",
    internalError: "Error interno del servidor",
  };

  try {
    const payload = await req.json();
    const { courseId, source, language, paymentMethod, voucherCode } =
      payload ?? {};
    // Keep backward-compatible API validation for legacy clients/tests.
    if (
      paymentMethod !== undefined &&
      paymentMethod !== null &&
      !isSupportedPaymentMethod(paymentMethod)
    ) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }

    if (!courseId) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }

    const cookieStore = await cookies();
    const selectedLanguage =
      typeof language === "string" && language.trim().length > 0
        ? normalizeLanguage(language)
        : normalizeLanguage(cookieStore.get("jazz_lang")?.value);

    copy = {
      es: {
        unauthorized: "No autorizado",
        emailRequired: "El correo del usuario es obligatorio",
        invalidRequest: "Solicitud inválida",
        courseNotFound: "Curso no encontrado",
        priceUnavailable: "El precio del curso no está disponible. Inténtalo de nuevo más tarde.",
        quoteChanged: "El curso o el cupón cambió. Vuelve a intentarlo para validar el precio.",
        alreadyPurchased: "El curso ya fue comprado",
        paymentsUnavailable: "Pagos temporalmente no disponibles",
        paymentMethodUnavailable:
          "Método de pago no disponible para esta compra",
        invalidVoucher: "Código de voucher inválido",
        voucherMaxUsesReached: "Este cupón ha alcanzado el límite total de usos.",
        voucherCustomerLimit: "Has alcanzado el límite de este cupón para tu cuenta.",
        voucherUsageUnavailable: "Este cupón no está disponible para esta compra. Vuelve a validar el código.",
        voucherNotConfigured: "Este voucher no está configurado en el checkout",
        internalError: "Error interno del servidor",
      },
      en: {
        unauthorized: "Unauthorized",
        emailRequired: "User email is required",
        invalidRequest: "Invalid request",
        courseNotFound: "Course not found",
        priceUnavailable: "The course price is unavailable. Please try again later.",
        quoteChanged: "The course or voucher changed. Try again to confirm the price.",
        alreadyPurchased: "Course already purchased",
        paymentsUnavailable: "Payments are temporarily unavailable",
        paymentMethodUnavailable:
          "Payment method is unavailable for this purchase",
        invalidVoucher: "Invalid voucher code",
        voucherMaxUsesReached:
          "This voucher has reached its maximum number of uses",
        voucherCustomerLimit: "You have reached this voucher's limit for your account.",
        voucherUsageUnavailable: "This voucher is unavailable for this purchase. Please check the code again.",
        voucherNotConfigured: "This voucher is not configured in checkout",
        internalError: "Internal server error",
      },
      fr: {
        unauthorized: "Non autorisé",
        emailRequired: "L’e-mail utilisateur est obligatoire",
        invalidRequest: "Requête invalide",
        courseNotFound: "Cours introuvable",
        priceUnavailable: "Le prix du cours est indisponible. Réessayez plus tard.",
        quoteChanged: "Le cours ou le code promo a changé. Réessayez pour confirmer le prix.",
        alreadyPurchased: "Le cours a déjà été acheté",
        paymentsUnavailable: "Les paiements sont temporairement indisponibles",
        paymentMethodUnavailable:
          "Le moyen de paiement n’est pas disponible pour cet achat",
        invalidVoucher: "Code promo invalide",
        voucherMaxUsesReached:
          "Ce code promo a atteint son nombre maximal d’utilisations",
        voucherCustomerLimit: "Vous avez atteint la limite de ce code promo pour votre compte.",
        voucherUsageUnavailable: "Ce code promo n’est pas disponible pour cet achat. Vérifiez de nouveau le code.",
        voucherNotConfigured:
          "Ce code promo n’est pas configuré dans le checkout",
        internalError: "Erreur interne du serveur",
      },
      pt: {
        unauthorized: "No autorizado",
        emailRequired: "O e-mail do usuário é obrigatório",
        invalidRequest: "Solicitação inválida",
        courseNotFound: "Curso no encontrado",
        priceUnavailable: "O preço do curso está indisponível. Tente novamente mais tarde.",
        quoteChanged: "O curso ou o cupom mudou. Tente novamente para confirmar o preço.",
        alreadyPurchased: "O curso já foi comprado",
        paymentsUnavailable: "Pagamentos temporariamente indisponíveis",
        paymentMethodUnavailable:
          "El método de pago no está disponible para esta compra",
        invalidVoucher: "Código de voucher inválido",
        voucherMaxUsesReached: "Este voucher atingiu o limite total de usos",
        voucherCustomerLimit: "Você atingiu o limite deste cupom para a sua conta.",
        voucherUsageUnavailable: "Este cupom não está disponível para esta compra. Valide o código novamente.",
        voucherNotConfigured: "Este cupom não está configurado no checkout",
        internalError: "Erro interno do servidor",
      },
    }[selectedLanguage];

    const configuredAppOrigin = normalizeOrigin(
      process.env.NEXT_PUBLIC_APP_URL,
    );
    const requestOrigin = normalizeOrigin(req.headers.get("origin"));
    const trustedOrigins = new Set<string>([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]);
    if (configuredAppOrigin) {
      trustedOrigins.add(configuredAppOrigin);
    }

    const origin =
      requestOrigin && trustedOrigins.has(requestOrigin)
        ? requestOrigin
        : (configuredAppOrigin ?? "http://localhost:3000");

    const supabase = createClient();
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user ?? null;

    if (!user) {
      return new NextResponse(copy.unauthorized, { status: 401 });
    }

    const ownerMismatch = expectedUserConsistencyResponse(req, user.id);
    if (ownerMismatch) return ownerMismatch;

    if (!user.email) {
      return new NextResponse(copy.emailRequired, { status: 400 });
    }
    const userEmail = user.email;

    try {
      await db.user.findUnique({
        where: { email: user.email },
        select: { role: true },
      });
    } catch (dbUserLookupError) {
      console.warn("[CHECKOUT_DB_USER_LOOKUP_FAILED]", {
        diagnostic: safeErrorDiagnostic(dbUserLookupError),
      });
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

    if (!course || course.isPublished !== true) {
      return new NextResponse(copy.courseNotFound, { status: 404 });
    }

    if (existingPurchase) {
      console.warn("[CHECKOUT_ALREADY_PURCHASED]", {
        diagnostic: "already_purchased",
      });
      return new NextResponse(copy.alreadyPurchased, { status: 400 });
    }

    const configuredPrice = getKnownCatalogPrice(course.price);
    if (configuredPrice === null) {
      return new NextResponse(copy.priceUnavailable, { status: 503 });
    }
    const isFreeCourse = configuredPrice === 0;
    const numericPrice = isFreeCourse ? 0 : DEFAULT_FULL_COURSE_PRICE_EUR;

    const normalizedVoucherCode =
      typeof voucherCode === "string" && voucherCode.trim().length > 0
        ? voucherCode.trim().toUpperCase()
        : null;

    const voucherValidation = normalizedVoucherCode
      ? await validateVoucherForCourse({
          code: normalizedVoucherCode,
          courseId,
          userId: user.id,
        })
      : null;

    if (voucherValidation && !voucherValidation.valid) {
      if (voucherValidation.error === 'Price unavailable') {
        return new NextResponse(copy.priceUnavailable, { status: 503 });
      }
      if (voucherValidation.error === 'Course not found') {
        return new NextResponse(copy.courseNotFound, { status: 404 });
      }
      return new NextResponse(
        voucherValidation.message || copy.invalidVoucher,
        { status: 400 },
      );
    }

    if (isFreeCourse) {
      await db.$transaction(async (tx) => {
        await lockPublishedCourseForGrant(tx, courseId, configuredPrice);
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

      const successUrl =
        source === "dashboard"
          ? `${origin}/dashboard?purchase=success&source=dashboard&free=true`
          : `${origin}/courses/${courseId}?success=true&free=true`;

      return NextResponse.json({
        url: successUrl,
      });
    }

    if (voucherValidation?.valid && voucherValidation.isFree) {
      const expectedQuote = voucherValidation;
      const providerVoucherPrefix =
        getProviderVoucherReferencePrefix(paymentProvider);

      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId: `${providerVoucherPrefix}:${voucherValidation.voucher.providerDiscountCode}`,
        originalPrice: voucherValidation.originalPrice,
        discountAmount: voucherValidation.discount,
        finalPrice: voucherValidation.finalPrice,
        localVoucherCode: voucherValidation.voucher.code,
        providerDiscountCode: voucherValidation.voucher.providerDiscountCode,
        beforeFreeVoucherGrant: async (tx, voucherId) => {
          if (voucherId !== expectedQuote.voucher.id) {
            throw new VoucherGrantError("Quote changed", copy.quoteChanged);
          }
          await revalidateVoucherForGrant(tx, {
            code: expectedQuote.voucher.code,
            courseId,
            userId: user.id,
          }, expectedQuote);
        },
      });

      const successUrl =
        source === "dashboard"
          ? `${origin}/dashboard?purchase=success&source=dashboard&voucher=true&free=true`
          : `${origin}/courses/${courseId}?success=true&voucher=true&free=true`;

      return NextResponse.json({ url: successUrl });
    }

    if (isLocalTestRequest(req)) {
      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId: "local-test-session",
        originalPrice: numericPrice,
        discountAmount: 0,
        finalPrice: numericPrice,
      });

      const successUrl =
        source === "dashboard"
          ? `${origin}/dashboard?purchase=success&source=dashboard&test=1`
          : `${origin}/courses/${courseId}?success=true&test=1`;

      return NextResponse.json({ url: successUrl });
    }

    if (!isActivePaymentProviderConfigured(paymentProvider)) {
      return new NextResponse(copy.paymentsUnavailable, { status: 503 });
    }

    if (paymentProvider === "dodo" && !isDodoWebhookConfigured()) {
      console.warn(
        "[CHECKOUT_WARNING] Dodo webhook secret is missing. Purchase unlock may not persist.",
      );
    }

    const encodedCourseId = encodeURIComponent(courseId);
    const checkoutAttemptId = randomUUID();
    const encodedCheckoutAttemptId = encodeURIComponent(checkoutAttemptId);
    const encodedExpectedUserId = encodeURIComponent(user.id);
    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}&expectedUserId=${encodedExpectedUserId}`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}&expectedUserId=${encodedExpectedUserId}`;

    // These are application quotes, not Dodo's charged amount or tax basis.
    // The provider cart still determines the payment; settlement extraction
    // must never turn these fields into an original price or discount fact.
    const quotedOriginalPrice = voucherValidation?.valid
      ? voucherValidation.originalPrice : configuredPrice;
    const quotedDiscount = voucherValidation?.valid ? voucherValidation.discount : 0;
    const quotedFinalPrice = voucherValidation?.valid
      ? voucherValidation.finalPrice : configuredPrice;
    const checkoutMetadata = {
      purchaseType: "course",
      courseId: course.id,
      userId: user.id,
      checkoutAttemptId,
      language: selectedLanguage,
      courseTitle: course.title,
      pricingProvenance: "catalog_quote_v1",
      quotedOriginalPrice: String(Number(quotedOriginalPrice.toFixed(2))),
      quotedDiscount: String(Number(quotedDiscount.toFixed(2))),
      quotedFinalPrice: String(Number(quotedFinalPrice.toFixed(2))),
    };

    const createCheckout = async (providerDiscountCode?: string) => {
      const withVoucher =
        Boolean(providerDiscountCode) && Boolean(voucherValidation?.valid);

      return createProviderCheckout(
        {
          email: userEmail,
          successUrl:
            source === "dashboard" ? dashboardSuccessUrl : courseSuccessUrl,
          customData: withVoucher
            ? {
                ...checkoutMetadata,
                voucherCode: voucherValidation!.voucher.code,
                providerDiscountCode:
                  voucherValidation!.voucher.providerDiscountCode,
              }
            : checkoutMetadata,
          providerDiscountCode: providerDiscountCode,
        },
        paymentProvider,
      );
    };

    let checkoutUrl: string;
    try {
      checkoutUrl = await createCheckout(
        voucherValidation?.valid
          ? voucherValidation.voucher.providerDiscountCode
          : undefined,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      const providerStatus = error instanceof Error ? (error as Error & { status?: unknown }).status : undefined;
      const providerClientError = typeof providerStatus !== "number" || (providerStatus >= 400 && providerStatus < 500);
      const voucherRejectedByProvider =
        providerClientError && errorMessage.includes("discount") &&
        (errorMessage.includes("does not exist") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("not valid"));
      const voucherLimitScope = getDodoDiscountLimitScope(error);

      const providerConfigFailure =
        errorMessage.includes("missing dodo");

      const providerCheckoutFailure = isProviderCheckoutFailure(error);

      if (voucherLimitScope) {
        if (voucherLimitScope === "global" && voucherValidation?.valid &&
            voucherValidation.voucher.maxUses !== null) {
          const nextCurrentUses = Math.max(
            voucherValidation.voucher.maxUses,
            voucherValidation.voucher.currentUses,
          );

          await db.voucherCode.update({
            where: {
              id: voucherValidation.voucher.id,
            },
            data: {
              currentUses: nextCurrentUses,
            },
          });

          console.warn("[CHECKOUT_VOUCHER_MAX_USES_SYNCED]", {
            voucherId: voucherValidation.voucher.id,
            localMaxUses: voucherValidation.voucher.maxUses,
            localCurrentUsesBefore: voucherValidation.voucher.currentUses,
            localCurrentUsesAfter: nextCurrentUses,
          });
        }

        const message = voucherLimitScope === "customer" ? copy.voucherCustomerLimit
          : voucherLimitScope === "global" ? copy.voucherMaxUsesReached : copy.voucherUsageUnavailable;
        return new NextResponse(message, { status: 400 });
      }

      if (voucherRejectedByProvider) {
        // Tenta backfill do discount no Dodo (vouchers legados criados antes da sync real).
        if (voucherValidation?.valid) {
          console.warn("[CHECKOUT_VOUCHER_BACKFILL_ATTEMPT]", {
            courseId,
            userId: user.id,
            voucherId: voucherValidation.voucher.id,
          });
          const syncResult = await ensureVoucherDiscountSynced({
            id: voucherValidation.voucher.id,
            code: voucherValidation.voucher.code,
            type: voucherValidation.voucher.type,
            discountPercent: voucherValidation.voucher.discountPercent ?? null,
            discountAmount: voucherValidation.voucher.discountAmount ?? null,
            maxUses: voucherValidation.voucher.maxUses,
            maxUsesPerUser: voucherValidation.voucher.maxUsesPerUser,
            minOrderValue: voucherValidation.voucher.minOrderValue,
            expiresAt: voucherValidation.voucher.expiresAt ?? null,
            metadata: voucherValidation.voucher.metadata,
          });
          await db.voucherCode.update({
            where: { id: voucherValidation.voucher.id },
            data: {
              metadata: (syncResult.metadata ?? null) as never,
            },
          });
          if (syncResult.ok) {
            try {
              checkoutUrl = await createCheckout(
                voucherValidation.voucher.providerDiscountCode,
              );
              return NextResponse.json({ url: checkoutUrl });
            } catch (retryError) {
              console.error("[CHECKOUT_VOUCHER_BACKFILL_RETRY_FAILED]", {
                voucherId: voucherValidation.voucher.id,
                diagnostic: safeErrorDiagnostic(retryError),
              });
            }
          } else {
            console.error("[CHECKOUT_VOUCHER_BACKFILL_FAILED]", {
              voucherId: voucherValidation.voucher.id,
              diagnostic: "discount_sync_failed",
            });
          }
        }

        // A requested discount must survive provider validation. Let the buyer
        // resolve/remove the voucher explicitly before offering full price.
        return new NextResponse(copy.voucherNotConfigured, { status: 400 });
      }

      if (providerConfigFailure) {
        return new NextResponse(copy.paymentsUnavailable, { status: 503 });
      }

      if (providerCheckoutFailure) {
        return new NextResponse(copy.paymentsUnavailable, { status: 503 });
      }

      console.error("[CHECKOUT_PROVIDER_CREATE_ERROR]", {
        courseId,
        userId: user.id,
        provider: paymentProvider,
        voucherId: voucherValidation?.valid ? voucherValidation.voucher.id : null,
        diagnostic: safeErrorDiagnostic(error),
      });

      throw error;
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.name === "VoucherGrantError") {
      const grantError = error as VoucherGrantError;
      if (grantError.reason === "Course not found") {
        return new NextResponse(copy.courseNotFound, { status: 404 });
      }
      if (grantError.reason === "Price unavailable") {
        return new NextResponse(copy.priceUnavailable, { status: 503 });
      }
      if (grantError.reason === "Quote changed") {
        return new NextResponse(copy.quoteChanged, { status: 409 });
      }
      return new NextResponse(grantError.message, { status: grantError.status });
    }
    if (error instanceof Error && error.name === "VoucherRedemptionRejectedError") {
      return new NextResponse(error.message, { status: 409 });
    }
    console.log("[CHECKOUT_ERROR]", safeErrorDiagnostic(error));
    if (isInvalidJsonBodyError(error)) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }
    if (isProviderCheckoutFailure(error)) {
      return new NextResponse(copy.paymentsUnavailable, { status: 503 });
    }
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
