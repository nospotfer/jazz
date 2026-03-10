import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { voucherId: string } }
) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.read');
    if (!auth.ok) {
      return auth.response;
    }

    const prisma = db as any;
    const voucher = await prisma.voucherCode.findUnique({
      where: { id: params.voucherId },
      include: {
        course: {
          select: { id: true, title: true },
        },
        batch: {
          select: { id: true, name: true, codePrefix: true },
        },
        redemptions: {
          orderBy: { redeemedAt: 'desc' },
          include: {
            purchase: {
              select: {
                id: true,
                originalPrice: true,
                finalPrice: true,
                discountAmount: true,
                createdAt: true,
              },
            },
          },
          take: 200,
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Voucher não encontrado.' },
        { status: 404 }
      );
    }

    const userIds: string[] = Array.from(new Set(voucher.redemptions.map((item: any) => String(item.userId))));
    const users = userIds.length
      ? await db.user.findMany({
          where: {
            id: { in: userIds },
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })
      : [];

    const usersMap = new Map(users.map((user) => [user.id, user]));
    const redemptions = voucher.redemptions.map((redemption: any) => ({
      ...redemption,
      user: usersMap.get(redemption.userId) || null,
    }));

    return NextResponse.json({
      success: true,
      voucher: {
        ...voucher,
        redemptions,
      },
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHER_DETAIL_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao carregar voucher.' },
      { status: 500 }
    );
  }
}
