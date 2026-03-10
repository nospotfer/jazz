import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';

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
    const voucher = await prisma.voucherCode.update({
      where: { id: params.voucherId },
      data: { isActive },
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
