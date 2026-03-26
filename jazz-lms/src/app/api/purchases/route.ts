import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/provider";
import { retrieveDodoPayment } from "@/lib/payments/providers/dodo";
import {
  asObject as asDodoObject,
  extractDodoPricing,
  normalizeDodoEventKind,
  readCustomString as readDodoCustomString,
  resolveDodoCheckoutAttemptId,
  resolveDodoCustomerEmail,
  resolveDodoEventType,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  type LooseObject as DodoLooseObject,
} from "@/lib/payments/providers/dodo-events";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type LooseObject = Record<string, unknown>;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

function isDodoApiError(error: unknown): boolean {
  const message = toErrorMessage(error);
  return (
    message.includes("Dodo payment retrieve failed") ||
    message.includes("Dodo checkout create failed")
  );
}

function asObject(value: unknown): LooseObject {
  return value && typeof value === "object" ? (value as LooseObject) : {};
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function reconcileDodoFromWebhookEvents(input: {
  userId: string;
  userEmail: string | null;
  courseId: string;
  checkoutAttemptId: string | null;
  paymentId: string | null;
}) {
  const prisma = db as any;
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const events = (await prisma.paymentWebhookEvent.findMany({
    where: {
      provider: "dodo",
      status: "PROCESSED",
      createdAt: {
        gte: thirtyMinutesAgo,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      eventId: true,
      payload: true,
    },
  })) as Array<{ eventId: string; payload: unknown }>;

  const expectedProviderReferenceId = input.paymentId
    ? `dodo-pay:${input.paymentId}`
    : null;

  const matchingEvent = events.find((event) => {
    const payload = asDodoObject(event.payload) as DodoLooseObject;
    const eventType = resolveDodoEventType(payload);
    if (normalizeDodoEventKind(eventType) !== "paid") {
      return false;
    }

    const providerReferenceId = resolveDodoProviderReferenceId(payload);
    if (!providerReferenceId) {
      return false;
    }

    if (
      expectedProviderReferenceId &&
      providerReferenceId !== expectedProviderReferenceId
    ) {
      return false;
    }

    const metadata = resolveDodoMetadata(payload);
    const metadataCourseId = readDodoCustomString(
      metadata,
      "courseId",
      "course_id",
    );
    if (!metadataCourseId || metadataCourseId !== input.courseId) {
      return false;
    }

    const metadataUserId = readDodoCustomString(metadata, "userId", "user_id");
    if (metadataUserId && metadataUserId !== input.userId) {
      return false;
    }

    if (!metadataUserId && input.userEmail) {
      const payloadEmail = resolveDodoCustomerEmail(payload);
      if (!payloadEmail || payloadEmail !== input.userEmail) {
        return false;
      }
    }

    if (input.checkoutAttemptId) {
      const eventAttemptId = resolveDodoCheckoutAttemptId(payload);
      if (!eventAttemptId || eventAttemptId !== input.checkoutAttemptId) {
        return false;
      }
    }

    return true;
  });

  if (!matchingEvent) {
    return null;
  }

  const payload = asDodoObject(matchingEvent.payload) as DodoLooseObject;
  const metadata = resolveDodoMetadata(payload);
  const providerReferenceId = resolveDodoProviderReferenceId(payload);

  if (!providerReferenceId) {
    return null;
  }

  const { subtotalAmount, totalAmount, discountAmount } =
    extractDodoPricing(payload);

  await upsertCoursePurchaseFromProvider({
    userId: input.userId,
    courseId: input.courseId,
    providerReferenceId,
    originalPrice: subtotalAmount,
    discountAmount,
    finalPrice: totalAmount,
    localVoucherCode: readDodoCustomString(
      metadata,
      "voucherCode",
      "voucher_code",
    ),
    providerDiscountCode: readDodoCustomString(
      metadata,
      "providerDiscountCode",
      "provider_discount_code",
      "discountCode",
      "discount_code",
    ),
  });

  return {
    providerReferenceId,
    source: "reconciled_dodo_event",
  };
}

async function reconcileDodoFromPaymentApi(input: {
  userId: string;
  userEmail: string | null;
  courseId: string;
  checkoutAttemptId: string | null;
  paymentId: string | null;
}) {
  if (!input.paymentId) {
    return null;
  }

  const payment = await retrieveDodoPayment(input.paymentId);
  if (!payment) {
    return null;
  }

  const paymentPayload = {
    type: `payment.${String(payment.status ?? "unknown").toLowerCase()}`,
    id: payment.id,
    data: {
      payment,
      customer: asDodoObject(payment.customer),
      customer_email: payment.customer_email,
      amount: payment.amount,
      subtotal_amount: payment.subtotal_amount,
      total_amount: payment.total_amount,
      metadata: asDodoObject(payment.metadata),
    },
    metadata: asDodoObject(payment.metadata),
  } as DodoLooseObject;

  const paymentEventType = resolveDodoEventType(paymentPayload);
  if (normalizeDodoEventKind(paymentEventType) !== "paid") {
    return null;
  }

  const metadata = resolveDodoMetadata(paymentPayload);
  const metadataCourseId = readDodoCustomString(
    metadata,
    "courseId",
    "course_id",
  );
  if (!metadataCourseId || metadataCourseId !== input.courseId) {
    return null;
  }

  const metadataUserId = readDodoCustomString(metadata, "userId", "user_id");
  if (metadataUserId && metadataUserId !== input.userId) {
    return null;
  }

  if (!metadataUserId && input.userEmail) {
    const paymentEmail = resolveDodoCustomerEmail(paymentPayload);
    if (!paymentEmail || paymentEmail !== input.userEmail) {
      return null;
    }
  }

  if (input.checkoutAttemptId) {
    const paymentAttemptId = resolveDodoCheckoutAttemptId(paymentPayload);
    if (!paymentAttemptId || paymentAttemptId !== input.checkoutAttemptId) {
      return null;
    }
  }

  const providerReferenceId =
    resolveDodoProviderReferenceId(paymentPayload) ??
    (payment.id ? `dodo-pay:${payment.id}` : null);
  if (!providerReferenceId) {
    return null;
  }

  const { subtotalAmount, totalAmount, discountAmount } =
    extractDodoPricing(paymentPayload);

  await upsertCoursePurchaseFromProvider({
    userId: input.userId,
    courseId: input.courseId,
    providerReferenceId,
    originalPrice: subtotalAmount,
    discountAmount,
    finalPrice: totalAmount,
    localVoucherCode: readDodoCustomString(
      metadata,
      "voucherCode",
      "voucher_code",
    ),
    providerDiscountCode: readDodoCustomString(
      metadata,
      "providerDiscountCode",
      "provider_discount_code",
      "discountCode",
      "discount_code",
    ),
  });

  return {
    providerReferenceId,
    source: "reconciled_dodo_api",
  };
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const purchases = await db.purchase.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = purchases.map((p) => ({
      id: p.id,
      itemType: "Curso",
      itemTitle: p.course.title,
      amount: p.finalPrice ?? p.course.price ?? 0,
      createdAt: p.createdAt.toISOString(),
      currency: "EUR",
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log("[PURCHASES_GET_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LooseObject;
    const action = asString(body.action);

    if (action !== "reconcile") {
      return new NextResponse("Solicitud inválida", { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const courseId = asString(body.courseId);
    if (!courseId) {
      return new NextResponse("Solicitud inválida", { status: 400 });
    }

    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
      select: { id: true },
    });

    if (existingPurchase) {
      return NextResponse.json({ purchased: true, source: "database" });
    }

    const paymentProvider = getPaymentProvider();

    const checkoutAttemptId =
      asString(body.checkoutAttemptId) ??
      asString(body.checkout_attempt_id) ??
      asString(body.attemptId) ??
      asString(body.attempt_id);

    const dodoPaymentId =
      asString(body.paymentId) ??
      asString(body.payment_id) ??
      asString(body.orderId) ??
      asString(body.order_id);

    if (paymentProvider === "dodo") {
      const dodoReconcile = await reconcileDodoFromWebhookEvents({
        userId: user.id,
        userEmail: user.email?.trim().toLowerCase() ?? null,
        courseId,
        checkoutAttemptId,
        paymentId: dodoPaymentId,
      });

      if (dodoReconcile) {
        return NextResponse.json({
          purchased: true,
          source: dodoReconcile.source,
          providerReferenceId: dodoReconcile.providerReferenceId,
        });
      }

      let dodoApiReconcile: {
        providerReferenceId: string;
        source: string;
      } | null = null;
      try {
        dodoApiReconcile = await reconcileDodoFromPaymentApi({
          userId: user.id,
          userEmail: user.email?.trim().toLowerCase() ?? null,
          courseId,
          checkoutAttemptId,
          paymentId: dodoPaymentId,
        });
      } catch (error) {
        if (isDodoApiError(error)) {
          console.error("[PURCHASES_RECONCILE_DODO_PROVIDER_UNAVAILABLE]", {
            userId: user.id,
            courseId,
            paymentId: dodoPaymentId,
            message: toErrorMessage(error),
          });

          return NextResponse.json(
            {
              purchased: false,
              reason: "provider_unavailable",
              provider: "dodo",
            },
            { status: 503 },
          );
        }

        throw error;
      }

      if (dodoApiReconcile) {
        return NextResponse.json({
          purchased: true,
          source: dodoApiReconcile.source,
          providerReferenceId: dodoApiReconcile.providerReferenceId,
        });
      }

      return NextResponse.json(
        {
          purchased: false,
          reason: "pending_webhook",
          provider: "dodo",
        },
        { status: 202 },
      );
    }

    return NextResponse.json(
      {
        purchased: false,
        reason: "payments_unavailable",
      },
      { status: 503 },
    );
  } catch (error) {
    console.log("[PURCHASES_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
