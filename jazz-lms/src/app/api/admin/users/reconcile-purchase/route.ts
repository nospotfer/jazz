import { retrieveDodoReconciliationSnapshot } from '@/lib/payments/dodo-reconciliation';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { upsertCoursePurchaseFromProvider } from '@/lib/course-purchase-sync';
import { db } from '@/lib/db';
import {
  listDodoPaymentsForCustomer,
  retrieveDodoPayment,
} from '@/lib/payments/providers/dodo';
import {
  asObject,
  doesDodoPaymentBelongToUser,
  extractDodoPricing,
  isDodoPaymentGrantable,
  normalizeDodoEventKind,
  readCustomString,
  resolveDodoEventType,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  resolveDodoVoucherAccounting,
  type LooseObject,
} from '@/lib/payments/providers/dodo-events';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Body = {
  email?: string;
  courseId?: string;
  paymentId?: string;
};

export async function POST(req: Request) {
  const auth = await ensureAdminApiPermission('users.update');
  if (!auth.ok) {
    return auth.response;
  }

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
  const body = input as Body;
  if (typeof body.email !== 'string' || typeof body.courseId !== 'string' ||
      (body.paymentId !== undefined && (typeof body.paymentId !== 'string' || !body.paymentId.trim()))) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const courseId = body.courseId?.trim();
  if (!email || !courseId) {
    return NextResponse.json({ success: false, message: 'email + courseId requeridos' }, { status: 400 });
  }

  const user = await db.user.findFirst({ where: { email } });
  if (!user) {
    return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
  }

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ success: false, message: 'Curso no encontrado' }, { status: 404 });
  }

  const existing = await db.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ success: true, source: 'already_purchased' });
  }

  const candidates = body.paymentId
    ? [await retrieveDodoPayment(body.paymentId).catch(() => null)].filter(Boolean)
    : await listDodoPaymentsForCustomer({
        email,
        sinceISO: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        pageSize: 100,
      });

  for (const payment of candidates) {
    if (!payment) continue;
    if (!isDodoPaymentGrantable(payment)) continue;
    const paymentPayload = {
      type: `payment.${String(payment.status ?? 'unknown').toLowerCase()}`,
      id: payment.id,
      data: {
        payment,
        customer: asObject(payment.customer),
        customer_email: payment.customer_email,
        amount: payment.amount,
        subtotal_amount: payment.subtotal_amount,
        total_amount: payment.total_amount,
        metadata: asObject(payment.metadata),
      },
      metadata: asObject(payment.metadata),
    } as LooseObject;

    if (!doesDodoPaymentBelongToUser(paymentPayload, user.id, email)) continue;

    if (normalizeDodoEventKind(resolveDodoEventType(paymentPayload)) !== 'paid') {
      continue;
    }

    const metadata = resolveDodoMetadata(paymentPayload);
    const metadataCourseId = readCustomString(metadata, 'courseId', 'course_id');
    if (!metadataCourseId || metadataCourseId !== courseId) {
      continue;
    }

    const providerReferenceId =
      resolveDodoProviderReferenceId(paymentPayload) ??
      (payment.id ? `dodo-pay:${payment.id}` : null);
    if (!providerReferenceId) {
      continue;
    }

    // A manual payment ID already fetched detail; listings require that same
    // authoritative snapshot before granting access or consuming a voucher.
    const snapshot = body.paymentId ? paymentPayload : await retrieveDodoReconciliationSnapshot(payment);
    if (!snapshot || !doesDodoPaymentBelongToUser(snapshot, user.id, email) ||
        readCustomString(resolveDodoMetadata(snapshot), 'courseId', 'course_id') !== courseId) continue;
    const { subtotalAmount, totalAmount, discountAmount, paymentCurrency, paymentAmountMinor } = extractDodoPricing(snapshot);

    try {
      await upsertCoursePurchaseFromProvider({
        userId: user.id,
        courseId,
        providerReferenceId,
        originalPrice: subtotalAmount,
        finalPrice: totalAmount,
        discountAmount,
        paymentCurrency,
        paymentAmountMinor,
        ...resolveDodoVoucherAccounting(snapshot),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'DodoPaymentRevokedError') continue;
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: 'manual_admin_reconcile',
      providerReferenceId,
    });
  }

  return NextResponse.json(
    { success: false, message: 'Ningún pago paid coincide con courseId en metadata' },
    { status: 404 },
  );
}
