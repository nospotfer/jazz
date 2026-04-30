import { isSupportedPaymentMethod } from "@/lib/checkout-helpers";
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { normalizeLanguage } from "@/lib/language";
import {
  createProviderCheckout,
  getPaymentProvider,
  getProviderVoucherReferencePrefix,
  isActivePaymentProviderConfigured,
} from "@/lib/payments/provider";
import { isDodoWebhookConfigured } from "@/lib/payments/providers/dodo";
import { DEFAULT_FULL_COURSE_PRICE_EUR } from "@/lib/pricing";
import { isLocalTestRequest } from "@/lib/test-mode";
import { validateVoucherForCourse } from "@/lib/vouchers";
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
    alreadyPurchased: "El curso ya fue comprado",
    paymentsUnavailable: "Pagos temporalmente no disponibles",
    paymentMethodUnavailable: "Método de pago no disponible para esta compra",
    invalidVoucher: "Código de voucher inválido",
    voucherMaxUsesReached: "Este voucher atingiu o limite total de usos",
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
        alreadyPurchased: "El curso ya fue comprado",
        paymentsUnavailable: "Pagos temporalmente no disponibles",
        paymentMethodUnavailable:
          "Método de pago no disponible para esta compra",
        invalidVoucher: "Código de voucher inválido",
        voucherMaxUsesReached: "Este voucher atingiu o limite total de usos",
        voucherNotConfigured: "Este voucher no está configurado en el checkout",
        internalError: "Error interno del servidor",
      },
      en: {
        unauthorized: "Unauthorized",
        emailRequired: "User email is required",
        invalidRequest: "Invalid request",
        courseNotFound: "Course not found",
        alreadyPurchased: "Course already purchased",
        paymentsUnavailable: "Payments are temporarily unavailable",
        paymentMethodUnavailable:
          "Payment method is unavailable for this purchase",
        invalidVoucher: "Invalid voucher code",
        voucherMaxUsesReached:
          "This voucher has reached its maximum number of uses",
        voucherNotConfigured: "This voucher is not configured in checkout",
        internalError: "Internal server error",
      },
      fr: {
        unauthorized: "Non autorisé",
        emailRequired: "L’e-mail utilisateur est obligatoire",
        invalidRequest: "Requête invalide",
        courseNotFound: "Cours introuvable",
        alreadyPurchased: "Le cours a déjà été acheté",
        paymentsUnavailable: "Les paiements sont temporairement indisponibles",
        paymentMethodUnavailable:
          "Le moyen de paiement n’est pas disponible pour cet achat",
        invalidVoucher: "Code promo invalide",
        voucherMaxUsesReached:
          "Ce code promo a atteint son nombre maximal d’utilisations",
        voucherNotConfigured:
          "Ce code promo n’est pas configuré dans le checkout",
        internalError: "Erreur interne du serveur",
      },
      pt: {
        unauthorized: "No autorizado",
        emailRequired: "O e-mail do usuário é obrigatório",
        invalidRequest: "Solicitação inválida",
        courseNotFound: "Curso no encontrado",
        alreadyPurchased: "O curso já foi comprado",
        paymentsUnavailable: "Pagamentos temporariamente indisponíveis",
        paymentMethodUnavailable:
          "El método de pago no está disponible para esta compra",
        invalidVoucher: "Código de voucher inválido",
        voucherMaxUsesReached: "Este voucher atingiu o limite total de usos",
        voucherNotConfigured: "Este cupón no está configurado en el checkout",
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

    if (!user.email) {
      return new NextResponse(copy.emailRequired, { status: 400 });
    }
    const userEmail = user.email;

    let dbUser = null;
    try {
      dbUser = await db.user.findUnique({
        where: { email: user.email },
        select: { role: true },
      });
    } catch (dbUserLookupError) {
      console.warn("[CHECKOUT_DB_USER_LOOKUP_FAILED]", {
        email: user.email,
        error: dbUserLookupError,
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

    if (!course) {
      return new NextResponse(copy.courseNotFound, { status: 404 });
    }

    if (existingPurchase) {
      console.warn("[CHECKOUT_ALREADY_PURCHASED]", {
        userId: user.id,
        userEmail: user.email,
        courseId,
        purchaseId: existingPurchase.id,
        providerReferenceId: existingPurchase.providerReferenceId ?? null,
        role: dbUser?.role ?? null,
      });
      return new NextResponse(copy.alreadyPurchased, { status: 400 });
    }

    const configuredPrice = Number(course.price ?? 0);
    const isFreeCourse =
      !Number.isFinite(configuredPrice) || configuredPrice <= 0;
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
      return new NextResponse(
        voucherValidation.message || copy.invalidVoucher,
        { status: 400 },
      );
    }

    if (isFreeCourse) {
      await db.$transaction(async (tx) => {
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
    const dashboardSuccessUrl = `${origin}/dashboard?purchase=success&source=dashboard&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}`;
    const courseSuccessUrl = `${origin}/courses/${courseId}?success=true&courseId=${encodedCourseId}&checkoutAttemptId=${encodedCheckoutAttemptId}`;

    const checkoutMetadata = {
      purchaseType: "course",
      courseId: course.id,
      userId: user.id,
      checkoutAttemptId,
      language: selectedLanguage,
      courseTitle: course.title,
      originalPrice: String(Number(numericPrice.toFixed(2))),
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
      const normalizedProviderError = errorMessage.replace(/[_-]+/g, " ");
      const voucherRejectedByProvider =
        errorMessage.includes("discount") &&
        (errorMessage.includes("does not exist") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("not valid"));
      const voucherMaxUsesReachedAtProvider =
        normalizedProviderError.includes("discount") &&
        (normalizedProviderError.includes("maximum redemptions") ||
          normalizedProviderError.includes("max redemptions") ||
          normalizedProviderError.includes("reached its maximum") ||
          normalizedProviderError.includes("maximum uses") ||
          normalizedProviderError.includes("max uses") ||
          normalizedProviderError.includes("usage limit") ||
          (normalizedProviderError.includes("redemption") &&
            normalizedProviderError.includes("limit")) ||
          (normalizedProviderError.includes("redemption") &&
            normalizedProviderError.includes("reached")));

      const providerConfigFailure =
        errorMessage.includes("missing dodo");

      const providerCheckoutFailure = isProviderCheckoutFailure(error);

      if (voucherMaxUsesReachedAtProvider) {
        if (voucherValidation?.valid) {
          const nextCurrentUses =
            voucherValidation.voucher.maxUses !== null
              ? Math.max(
                  voucherValidation.voucher.maxUses,
                  voucherValidation.voucher.currentUses,
                )
              : Math.max(1, voucherValidation.voucher.currentUses + 1);

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
            voucherCode: voucherValidation.voucher.code,
            localMaxUses: voucherValidation.voucher.maxUses,
            localCurrentUsesBefore: voucherValidation.voucher.currentUses,
            localCurrentUsesAfter: nextCurrentUses,
          });
        }

        return new NextResponse(copy.voucherMaxUsesReached, { status: 400 });
      }

      if (voucherRejectedByProvider) {
        // Tenta backfill do discount no Dodo (vouchers legados criados antes da sync real).
        if (voucherValidation?.valid) {
          console.warn("[CHECKOUT_VOUCHER_BACKFILL_ATTEMPT]", {
            courseId,
            userId: user.id,
            voucherCode: voucherValidation.voucher.code,
          });
          const remainingUses =
            voucherValidation.voucher.maxUses !== null
              ? Math.max(1, voucherValidation.voucher.maxUses - voucherValidation.voucher.currentUses)
              : null;
          const syncResult = await ensureVoucherDiscountSynced({
            id: voucherValidation.voucher.id,
            code: voucherValidation.voucher.code,
            type: voucherValidation.voucher.type,
            discountPercent: voucherValidation.voucher.discountPercent ?? null,
            discountAmount: voucherValidation.voucher.discountAmount ?? null,
            maxUses: remainingUses,
            expiresAt: voucherValidation.voucher.expiresAt ?? null,
            metadata: null,
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
                voucherCode: voucherValidation.voucher.code,
                retryError,
              });
            }
          } else {
            console.error("[CHECKOUT_VOUCHER_BACKFILL_FAILED]", {
              voucherCode: voucherValidation.voucher.code,
              reason: syncResult.reason,
            });
          }
        }

        try {
          console.warn("[CHECKOUT_VOUCHER_PROVIDER_REJECTED_FALLBACK]", {
            courseId,
            userId: user.id,
            voucherCode: voucherValidation?.valid
              ? voucherValidation.voucher.code
              : null,
          });
          checkoutUrl = await createCheckout();
          return NextResponse.json({ url: checkoutUrl });
        } catch (fallbackError) {
          console.error("[CHECKOUT_FALLBACK_FULL_PRICE_ERROR]", {
            courseId,
            userId: user.id,
            voucherCode: voucherValidation?.valid
              ? voucherValidation.voucher.code
              : null,
            fallbackError,
          });
          return new NextResponse(copy.voucherNotConfigured, { status: 400 });
        }
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
        voucherCode: voucherValidation?.valid
          ? voucherValidation.voucher.code
          : null,
        error,
      });

      throw error;
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.log("[CHECKOUT_ERROR]", error);
    if (isInvalidJsonBodyError(error)) {
      return new NextResponse(copy.invalidRequest, { status: 400 });
    }
    if (isProviderCheckoutFailure(error)) {
      return new NextResponse(copy.paymentsUnavailable, { status: 503 });
    }
    return new NextResponse(copy.internalError, { status: 500 });
  }
}
