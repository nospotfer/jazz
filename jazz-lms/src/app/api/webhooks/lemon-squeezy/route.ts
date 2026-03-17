import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyLemonSignature } from '@/lib/lemon-squeezy';
import {
  revertCoursePurchaseByProviderReferenceId,
  upsertCoursePurchaseFromProvider,
} from '@/lib/course-purchase-sync';

export const runtime = 'nodejs';

type LooseObject = Record<string, unknown>;

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

  const payloadMeta = asObject(root.payload_meta);
  const payloadCustomData = asObject(payloadMeta.custom_data);
  if (Object.keys(payloadCustomData).length > 0) {
    return payloadCustomData;
  }

  const data = asObject(root.data);
  const attributes = asObject(data.attributes);
  const attributeCustomData = asObject(attributes.custom_data);
  if (Object.keys(attributeCustomData).length > 0) {
    return attributeCustomData;
  }

  return {};
}

async function handleOrderCreated(payload: LooseObject) {
  const data = asObject(payload.data);
  const attributes = asObject(data.attributes);
  const providerReferenceId = resolveProviderReferenceId(data, attributes);

  if (!providerReferenceId) {
    return new NextResponse('Webhook Error: Missing Lemon order id', { status: 400 });
  }

  const customData = resolveCustomData(payload);
  const userId = asString(customData.userId) ?? asString(attributes.user_id);
  const courseId = asString(customData.courseId);
  const purchaseType = asString(customData.purchaseType) ?? 'course';

  if (purchaseType !== 'course' || !userId || !courseId) {
    return new NextResponse('Webhook Error: Missing or invalid custom metadata', { status: 400 });
  }

  const subtotalAmount =
    toMoney(attributes.subtotal) || toMoney(attributes.subtotal_formatted) || toMoney(customData.originalPrice);
  const totalAmount = toMoney(attributes.total) || toMoney(attributes.total_formatted) || subtotalAmount;
  const discountAmount = Number(Math.max(0, subtotalAmount - totalAmount).toFixed(2));
  const voucherCode = asString(customData.voucherCode) ?? asString(attributes.discount_code);

  await upsertCoursePurchaseFromProvider({
    userId,
    courseId,
    providerReferenceId,
    originalPrice: subtotalAmount,
    discountAmount,
    finalPrice: totalAmount,
    voucherCode,
  });

  return new NextResponse(null, { status: 200 });
}

async function handleOrderRefunded(payload: LooseObject) {
  const data = asObject(payload.data);
  const attributes = asObject(data.attributes);

  const orderId = asString(attributes.order_id) ?? asString(data.id);
  if (!orderId) {
    return new NextResponse('Webhook Error: Missing Lemon refunded order id', { status: 400 });
  }

  await revertCoursePurchaseByProviderReferenceId(`ls-order:${orderId}`);
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = (await headers()).get('x-signature');

  if (!verifyLemonSignature(rawBody, signature)) {
    return new NextResponse('Webhook Error: Invalid Lemon signature', { status: 401 });
  }

  let payload: LooseObject;
  try {
    payload = JSON.parse(rawBody) as LooseObject;
  } catch {
    return new NextResponse('Webhook Error: Invalid JSON', { status: 400 });
  }

  const meta = asObject(payload.meta);
  const eventName = asString(meta.event_name);

  if (!eventName) {
    return new NextResponse('Webhook Error: Missing event name', { status: 400 });
  }

  if (eventName === 'order_created') {
    return handleOrderCreated(payload);
  }

  if (eventName === 'order_refunded') {
    return handleOrderRefunded(payload);
  }

  return new NextResponse(null, { status: 200 });
}
