import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyLemonSignature } from '@/lib/lemon-squeezy';
import { db } from '@/lib/db';
import {
  revertCoursePurchaseByProviderReferenceId,
  upsertCoursePurchaseFromProvider,
} from '@/lib/course-purchase-sync';

export const runtime = 'nodejs';

type LooseObject = Record<string, unknown>;

type WebhookErrorCode =
  | 'invalid_signature'
  | 'invalid_json'
  | 'missing_event_name'
  | 'missing_order_id'
  | 'invalid_metadata'
  | 'missing_refunded_order_id'
  | 'processing_failed';

function webhookError(
  status: number,
  code: WebhookErrorCode,
  message: string,
  details?: Record<string, unknown>
) {
  const includeDetails = process.env.NODE_ENV !== 'production';

  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(includeDetails && details ? { details } : {}),
      },
    },
    { status }
  );
}

function asObject(value: unknown): LooseObject {
  return value && typeof value === 'object' ? (value as LooseObject) : {};
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
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
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
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

  if (typeof value === 'string' && value.includes('.')) {
    return Number(parsed.toFixed(2));
  }

  if (parsed > 1000) {
    return Number((parsed / 100).toFixed(2));
  }

  return Number(parsed.toFixed(2));
}

function resolveProviderReferenceId(data: LooseObject, attributes: LooseObject): string | null {
  const orderId = asString(data.id) ?? asString(attributes.order_id) ?? asString(attributes.identifier);
  if (!orderId) {
    return null;
  }

  return `ls-order:${orderId}`;
}

function resolveCustomData(root: LooseObject): LooseObject {
  const meta = asObject(root.meta);
  const customData = asObject(meta.custom_data);
  if (Object.keys(customData).length > 0) {
    return customData;
  }

  const metaCustom = asObject(meta.custom);
  if (Object.keys(metaCustom).length > 0) {
    return metaCustom;
  }

  const payloadMeta = asObject(root.payload_meta);
  const payloadCustomData = asObject(payloadMeta.custom_data);
  if (Object.keys(payloadCustomData).length > 0) {
    return payloadCustomData;
  }

  const payloadCustom = asObject(payloadMeta.custom);
  if (Object.keys(payloadCustom).length > 0) {
    return payloadCustom;
  }

  const data = asObject(root.data);
  const attributes = asObject(data.attributes);

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
  const orderDataCustomData = asObject(orderData.custom_data);
  if (Object.keys(orderDataCustomData).length > 0) {
    return orderDataCustomData;
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

  const attributeCustomData = asObject(attributes.custom_data);
  if (Object.keys(attributeCustomData).length > 0) {
    return attributeCustomData;
  }

  return {};
}

async function resolveUserIdFallback(orderUserEmail: string | null): Promise<string | null> {
  if (!orderUserEmail) {
    return null;
  }

  const user = await db.user.findFirst({
    where: {
      email: {
        equals: orderUserEmail,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
    },
  });

  return user?.id ?? null;
}

async function resolveCourseIdFallback(): Promise<string | null> {
  const publishedCourses = await db.course.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
    },
    take: 2,
  });

  if (publishedCourses.length === 1) {
    return publishedCourses[0].id;
  }

  return null;
}

async function handleOrderCreated(payload: LooseObject) {
  const data = asObject(payload.data);
  const attributes = asObject(data.attributes);
  const providerReferenceId = resolveProviderReferenceId(data, attributes);
  const meta = asObject(payload.meta);

  if (!providerReferenceId) {
    console.warn('[LEMON_WEBHOOK_ORDER_CREATED_MISSING_ID]', {
      event: 'order_created',
      dataId: asString(data.id),
      identifier: asString(attributes.identifier),
      webhookId: asString(meta.webhook_id),
    });
    return webhookError(400, 'missing_order_id', 'Missing Lemon order id', {
      eventName: 'order_created',
      dataId: asString(data.id),
      identifier: asString(attributes.identifier),
      webhookId: asString(meta.webhook_id),
    });
  }

  const customData = resolveCustomData(payload);
  const orderUserEmail = asString(attributes.user_email)?.toLowerCase() ?? null;
  const userIdFromMetadata = readCustomString(customData, 'userId', 'user_id') ?? asString(attributes.user_id);
  const courseIdFromMetadata = readCustomString(customData, 'courseId', 'course_id');
  const purchaseType = readCustomString(customData, 'purchaseType', 'purchase_type') ?? 'course';

  const userId = userIdFromMetadata ?? (await resolveUserIdFallback(orderUserEmail));
  const courseId = courseIdFromMetadata ?? (await resolveCourseIdFallback());

  if (userId && !userIdFromMetadata && orderUserEmail) {
    console.info('[LEMON_WEBHOOK_ORDER_CREATED_USER_FALLBACK]', {
      providerReferenceId,
      orderUserEmail,
      resolvedUserId: userId,
    });
  }

  if (courseId && !courseIdFromMetadata) {
    console.info('[LEMON_WEBHOOK_ORDER_CREATED_COURSE_FALLBACK]', {
      providerReferenceId,
      resolvedCourseId: courseId,
    });
  }

  if (purchaseType !== 'course' || !userId || !courseId) {
    console.warn('[LEMON_WEBHOOK_ORDER_CREATED_INVALID_METADATA]', {
      event: 'order_created',
      providerReferenceId,
      purchaseType,
      userId,
      courseId,
      customDataKeys: Object.keys(customData),
      webhookId: asString(meta.webhook_id),
    });
    return webhookError(400, 'invalid_metadata', 'Missing or invalid custom metadata', {
      eventName: 'order_created',
      providerReferenceId,
      purchaseType,
      userId,
      courseId,
      customDataKeys: Object.keys(customData),
      webhookId: asString(meta.webhook_id),
    });
  }

  const subtotalAmount =
    toMoney(attributes.subtotal) || toMoney(attributes.subtotal_formatted) || toMoney(customData.originalPrice);
  const totalAmount = toMoney(attributes.total) || toMoney(attributes.total_formatted) || subtotalAmount;
  const discountAmount = Number(Math.max(0, subtotalAmount - totalAmount).toFixed(2));
  const voucherCode = readCustomString(customData, 'voucherCode', 'voucher_code');
  const providerDiscountCode =
    asString(attributes.discount_code) ?? readCustomString(customData, 'providerDiscountCode', 'provider_discount_code');

  await upsertCoursePurchaseFromProvider({
    userId,
    courseId,
    providerReferenceId,
    originalPrice: subtotalAmount,
    discountAmount,
    finalPrice: totalAmount,
    localVoucherCode: voucherCode,
    providerDiscountCode,
  });

  console.info('[LEMON_WEBHOOK_ORDER_CREATED_UPSERTED]', {
    providerReferenceId,
    userId,
    courseId,
    subtotalAmount,
    totalAmount,
    discountAmount,
    voucherCode,
  });

  return new NextResponse(null, { status: 200 });
}

async function handleOrderRefunded(payload: LooseObject) {
  const data = asObject(payload.data);
  const attributes = asObject(data.attributes);
  const meta = asObject(payload.meta);

  const orderId = asString(attributes.order_id) ?? asString(data.id);
  if (!orderId) {
    return webhookError(400, 'missing_refunded_order_id', 'Missing Lemon refunded order id', {
      eventName: 'order_refunded',
      dataId: asString(data.id),
      webhookId: asString(meta.webhook_id),
    });
  }

  await revertCoursePurchaseByProviderReferenceId(`ls-order:${orderId}`);
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = (await headers()).get('x-signature');

  if (!verifyLemonSignature(rawBody, signature)) {
    console.warn('[LEMON_WEBHOOK_INVALID_SIGNATURE]', {
      hasSignature: Boolean(signature),
      payloadLength: rawBody.length,
    });
    return webhookError(401, 'invalid_signature', 'Invalid Lemon signature', {
      hasSignature: Boolean(signature),
      payloadLength: rawBody.length,
    });
  }

  let payload: LooseObject;
  try {
    payload = JSON.parse(rawBody) as LooseObject;
  } catch {
    console.warn('[LEMON_WEBHOOK_INVALID_JSON]');
    return webhookError(400, 'invalid_json', 'Invalid JSON');
  }

  const meta = asObject(payload.meta);
  const eventName = asString(meta.event_name);
  const webhookId = asString(meta.webhook_id);

  console.info('[LEMON_WEBHOOK_RECEIVED]', {
    eventName,
    webhookId,
    payloadLength: rawBody.length,
  });

  if (!eventName) {
    console.warn('[LEMON_WEBHOOK_MISSING_EVENT_NAME]', { webhookId });
    return webhookError(400, 'missing_event_name', 'Missing event name', {
      webhookId,
    });
  }

  try {
    if (eventName === 'order_created') {
      return await handleOrderCreated(payload);
    }

    if (eventName === 'order_refunded') {
      return await handleOrderRefunded(payload);
    }
  } catch (error) {
    console.error('[LEMON_WEBHOOK_PROCESSING_ERROR]', {
      eventName,
      webhookId,
      error,
    });
    return webhookError(500, 'processing_failed', 'Webhook processing failed', {
      eventName,
      webhookId,
      message: error instanceof Error ? error.message : String(error ?? ''),
    });
  }

  return new NextResponse(null, { status: 200 });
}
