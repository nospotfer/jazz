import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import {
  listRecentLemonOrdersByEmail,
  retrieveLemonOrder,
} from "@/lib/lemon-squeezy";
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

function toErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function isPrismaSchemaMismatchError(error: unknown): boolean {
  const code = toErrorCode(error);
  if (code === "P2021" || code === "P2022") {
    return true;
  }

  const message = toErrorMessage(error).toLowerCase();

  return (
    message.includes("does not exist") ||
    message.includes("unknown column") ||
    message.includes("invalid column") ||
    message.includes("relation")
  );
}

function isLemonApiError(error: unknown): boolean {
  const message = toErrorMessage(error);
  return (
    message.includes("Lemon API failed") ||
    message.includes("Lemon checkout create failed")
  );
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

function readCustomString(data: LooseObject, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(data[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toMoney(value: unknown): number {
  const parsed = toNumber(value);
  if (parsed === null) {
    return 0;
  }

  if (typeof value === "string" && value.includes(".")) {
    return Number(parsed.toFixed(2));
  }

  if (parsed > 1000) {
    return Number((parsed / 100).toFixed(2));
  }

  return Number(parsed.toFixed(2));
}

function resolveOrderCustomData(attributes: LooseObject): LooseObject {
  const customData = asObject(attributes.custom_data);
  if (Object.keys(customData).length > 0) {
    return customData;
  }

  const checkoutData = asObject(attributes.checkout_data);
  const checkoutCustomData = asObject(checkoutData.custom_data);
  if (Object.keys(checkoutCustomData).length > 0) {
    return checkoutCustomData;
  }

  const checkoutCustom = asObject(checkoutData.custom);
  if (Object.keys(checkoutCustom).length > 0) {
    return checkoutCustom;
  }

  const firstOrderItem = asObject(attributes.first_order_item);
  const orderData = asObject(firstOrderItem.order_data);
  const orderCustomData = asObject(orderData.custom_data);
  if (Object.keys(orderCustomData).length > 0) {
    return orderCustomData;
  }

  const orderCheckoutData = asObject(orderData.checkout_data);
  const orderCheckoutCustomData = asObject(orderCheckoutData.custom_data);
  if (Object.keys(orderCheckoutCustomData).length > 0) {
    return orderCheckoutCustomData;
  }

  const orderCheckoutCustom = asObject(orderCheckoutData.custom);
  if (Object.keys(orderCheckoutCustom).length > 0) {
    return orderCheckoutCustom;
  }

  return {};
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

    const orderId =
      asString(body.orderId) ??
      asString(body.order_id) ??
      asString(body.lemonOrderId) ??
      asString(body.lemon_order_id);

    if (!process.env.LEMON_SQUEEZY_API_KEY?.trim()) {
      return NextResponse.json(
        { purchased: false, reason: "payments_unavailable" },
        { status: 503 },
      );
    }

    if (!orderId) {
      const currentUserEmail = user.email?.trim().toLowerCase() ?? null;

      if (!currentUserEmail) {
        return NextResponse.json(
          { purchased: false, reason: "pending_webhook" },
          { status: 202 },
        );
      }

      let recentOrders: Awaited<
        ReturnType<typeof listRecentLemonOrdersByEmail>
      > = [];

      try {
        recentOrders = await listRecentLemonOrdersByEmail({
          email: currentUserEmail,
          withinMinutes: 30,
        });
      } catch (error) {
        console.warn("[PURCHASES_RECONCILE_LIST_RECENT_FAILED]", {
          userId: user.id,
          courseId,
          message: toErrorMessage(error),
        });

        return NextResponse.json(
          { purchased: false, reason: "pending_webhook" },
          { status: 202 },
        );
      }

      const candidates = recentOrders.filter((order) => {
        const attributes = asObject(order.attributes);
        const orderStatus = asString(attributes.status)?.toLowerCase();
        if (orderStatus !== "paid") {
          return false;
        }

        const orderUserEmail = asString(attributes.user_email)?.toLowerCase();
        if (!orderUserEmail || orderUserEmail !== currentUserEmail) {
          return false;
        }

        const customData = resolveOrderCustomData(attributes);
        const customCourseId = readCustomString(
          customData,
          "courseId",
          "course_id",
        );
        if (!customCourseId || customCourseId !== courseId) {
          return false;
        }

        const customUserId = readCustomString(customData, "userId", "user_id");
        if (customUserId && customUserId !== user.id) {
          return false;
        }

        if (checkoutAttemptId) {
          const customCheckoutAttemptId = readCustomString(
            customData,
            "checkoutAttemptId",
            "checkout_attempt_id",
            "attemptId",
            "attempt_id",
          );

          if (
            !customCheckoutAttemptId ||
            customCheckoutAttemptId !== checkoutAttemptId
          ) {
            return false;
          }
        }

        return true;
      });

      let selectedOrder = candidates.length === 1 ? candidates[0] : null;

      if (!selectedOrder && checkoutAttemptId && candidates.length > 1) {
        selectedOrder = [...candidates].sort((left, right) => {
          const leftEpoch =
            Date.parse(asString(asObject(left.attributes).created_at) ?? "") ||
            0;
          const rightEpoch =
            Date.parse(asString(asObject(right.attributes).created_at) ?? "") ||
            0;
          return rightEpoch - leftEpoch;
        })[0];
      }

      if (!selectedOrder) {
        return NextResponse.json(
          { purchased: false, reason: "pending_webhook" },
          { status: 202 },
        );
      }

      const orderIdFromPayload = asString(selectedOrder.id);

      if (!orderIdFromPayload) {
        return NextResponse.json(
          { purchased: false, reason: "pending_webhook" },
          { status: 202 },
        );
      }

      const selectedAttributes = asObject(selectedOrder.attributes);
      const selectedCustomData = resolveOrderCustomData(selectedAttributes);

      const subtotalAmount =
        toMoney(selectedAttributes.subtotal) ||
        toMoney(selectedAttributes.subtotal_formatted) ||
        toMoney(selectedCustomData.originalPrice);
      const totalAmount =
        toMoney(selectedAttributes.total) ||
        toMoney(selectedAttributes.total_formatted) ||
        subtotalAmount;
      const discountAmount = Number(
        Math.max(0, subtotalAmount - totalAmount).toFixed(2),
      );
      const voucherCode = readCustomString(
        selectedCustomData,
        "voucherCode",
        "voucher_code",
      );
      const providerDiscountCode =
        asString(selectedAttributes.discount_code) ??
        readCustomString(
          selectedCustomData,
          "providerDiscountCode",
          "provider_discount_code",
        );

      try {
        await upsertCoursePurchaseFromProvider({
          userId: user.id,
          courseId,
          providerReferenceId: `ls-order:${orderIdFromPayload}`,
          originalPrice: subtotalAmount,
          discountAmount,
          finalPrice: totalAmount,
          localVoucherCode: voucherCode,
          providerDiscountCode,
        });
      } catch (error) {
        if (isPrismaSchemaMismatchError(error)) {
          console.error("[PURCHASES_RECONCILE_DB_SCHEMA_MISMATCH]", {
            userId: user.id,
            courseId,
            providerReferenceId: `ls-order:${orderIdFromPayload}`,
            message: toErrorMessage(error),
            code: toErrorCode(error),
          });

          return NextResponse.json(
            { purchased: false, reason: "database_schema_mismatch" },
            { status: 503 },
          );
        }

        throw error;
      }

      return NextResponse.json({
        purchased: true,
        source: "reconciled_recent_order",
        providerReferenceId: `ls-order:${orderIdFromPayload}`,
      });
    }

    let lemonOrder;

    try {
      lemonOrder = await retrieveLemonOrder(orderId);
    } catch (error) {
      if (isLemonApiError(error)) {
        console.error("[PURCHASES_RECONCILE_PROVIDER_UNAVAILABLE]", {
          userId: user.id,
          courseId,
          orderId,
          message: toErrorMessage(error),
        });

        return NextResponse.json(
          { purchased: false, reason: "provider_unavailable" },
          { status: 503 },
        );
      }

      throw error;
    }

    if (!lemonOrder) {
      return NextResponse.json(
        { purchased: false, reason: "order_not_found" },
        { status: 404 },
      );
    }

    const orderIdFromPayload = asString(lemonOrder.id) ?? orderId;
    const attributes = asObject(lemonOrder.attributes);
    const orderStatus = asString(attributes.status)?.toLowerCase() ?? "";

    if (orderStatus !== "paid") {
      return NextResponse.json(
        { purchased: false, reason: "order_not_paid" },
        { status: 409 },
      );
    }

    const orderUserEmail = asString(attributes.user_email)?.toLowerCase();
    const currentUserEmail = user.email?.trim().toLowerCase() ?? null;

    if (
      !orderUserEmail ||
      !currentUserEmail ||
      orderUserEmail !== currentUserEmail
    ) {
      return NextResponse.json(
        { purchased: false, reason: "order_user_mismatch" },
        { status: 403 },
      );
    }

    const customData = resolveOrderCustomData(attributes);
    const customCourseId = readCustomString(
      customData,
      "courseId",
      "course_id",
    );
    const customUserId = readCustomString(customData, "userId", "user_id");

    if (customCourseId && customCourseId !== courseId) {
      return NextResponse.json(
        { purchased: false, reason: "order_course_mismatch" },
        { status: 400 },
      );
    }

    if (customUserId && customUserId !== user.id) {
      return NextResponse.json(
        { purchased: false, reason: "order_user_metadata_mismatch" },
        { status: 403 },
      );
    }

    const subtotalAmount =
      toMoney(attributes.subtotal) ||
      toMoney(attributes.subtotal_formatted) ||
      toMoney(customData.originalPrice);
    const totalAmount =
      toMoney(attributes.total) ||
      toMoney(attributes.total_formatted) ||
      subtotalAmount;
    const discountAmount = Number(
      Math.max(0, subtotalAmount - totalAmount).toFixed(2),
    );
    const voucherCode = readCustomString(
      customData,
      "voucherCode",
      "voucher_code",
    );
    const providerDiscountCode =
      asString(attributes.discount_code) ??
      readCustomString(
        customData,
        "providerDiscountCode",
        "provider_discount_code",
      );

    try {
      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId: `ls-order:${orderIdFromPayload}`,
        originalPrice: subtotalAmount,
        discountAmount,
        finalPrice: totalAmount,
        localVoucherCode: voucherCode,
        providerDiscountCode,
      });
    } catch (error) {
      if (isPrismaSchemaMismatchError(error)) {
        console.error("[PURCHASES_RECONCILE_DB_SCHEMA_MISMATCH]", {
          userId: user.id,
          courseId,
          providerReferenceId: `ls-order:${orderIdFromPayload}`,
          message: toErrorMessage(error),
          code: toErrorCode(error),
        });

        return NextResponse.json(
          { purchased: false, reason: "database_schema_mismatch" },
          { status: 503 },
        );
      }

      throw error;
    }

    return NextResponse.json({
      purchased: true,
      source: "reconciled",
      providerReferenceId: `ls-order:${orderIdFromPayload}`,
    });
  } catch (error) {
    console.log("[PURCHASES_POST_ERROR]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
