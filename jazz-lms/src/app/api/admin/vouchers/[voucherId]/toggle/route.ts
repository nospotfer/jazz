import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { mergeStripeVoucherMetadata, syncVoucherPromotionCode } from '@/lib/stripe-voucher-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { voucherId: string } }
) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const { isActive } = await req.json();
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload', message: 'isActive deve ser booleano.' },
        { status: 400 }
      );
    }

    const prisma = db as any;
    const currentVoucher = await prisma.voucherCode.findUnique({
      where: { id: params.voucherId },
      select: {
        id: true,
        code: true,
        type: true,
        discountPercent: true,
        discountAmount: true,
        minOrderValue: true,
        maxUses: true,
        isActive: true,
        expiresAt: true,
        metadata: true,
      },
    });

    if (!currentVoucher) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Voucher no encontrado.' },
        { status: 404 }
      );
    }

    const stripeMetadata = await syncVoucherPromotionCode(
      {
        ...currentVoucher,
        isActive,
      },
      {
        desiredActive: isActive,
        createIfMissing: true,
      }
    );

    if (!stripeMetadata) {
      throw new Error(`Stripe sync returned empty metadata for voucher ${currentVoucher.code}.`);
    }

    const voucher = await prisma.voucherCode.update({
      where: { id: params.voucherId },
      data: {
        isActive,
        metadata: mergeStripeVoucherMetadata(currentVoucher.metadata, stripeMetadata),
      },
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, voucher });
  } catch (error) {
    console.error('[ADMIN_VOUCHER_TOGGLE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao atualizar voucher.' },
      { status: 500 }
    );
  }
}
