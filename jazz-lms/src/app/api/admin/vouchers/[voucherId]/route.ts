import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { syncVoucherPromotionCode } from '@/lib/stripe-voucher-sync';

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

export async function DELETE(
  _req: Request,
  { params }: { params: { voucherId: string } }
) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const prisma = db as any;
    const voucher = await prisma.voucherCode.findUnique({
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
        batchId: true,
        currentUses: true,
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Voucher no encontrado.' },
        { status: 404 }
      );
    }

    if (voucher.currentUses > 0 || voucher._count.redemptions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: `No se puede eliminar ${voucher.code} porque ya fue usado.`,
        },
        { status: 409 }
      );
    }

    await syncVoucherPromotionCode(voucher, {
      desiredActive: false,
      createIfMissing: false,
    });

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.voucherCode.delete({
        where: { id: voucher.id },
      });

      if (voucher.batchId) {
        const batchCount = await tx.voucherCode.count({
          where: {
            batchId: voucher.batchId,
          },
        });

        await tx.voucherBatch.update({
          where: {
            id: voucher.batchId,
          },
          data: {
            quantity: batchCount,
          },
        });
      }

      return {
        status: 'deleted' as const,
        code: voucher.code,
      };
    });

    return NextResponse.json({
      success: true,
      deletedCount: 1,
      message: `Voucher ${result.code} eliminado.`,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHER_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Error al eliminar voucher.' },
      { status: 500 }
    );
  }
}
