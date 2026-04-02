import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

type RevertPayload = {
  voucherCode?: string;
  courseId?: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await req.json().catch(() => ({}))) as RevertPayload;
    const voucherCode = payload.voucherCode?.trim().toUpperCase() || null;
    const courseId = payload.courseId?.trim() || null;
    const targetUserId = payload.userId?.trim() || auth.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Bad request', message: 'Usuário inválido para reversão.' },
        { status: 400 }
      );
    }

    const prisma = db;
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: targetUserId,
        ...(courseId ? { courseId } : {}),
        ...(voucherCode
          ? {
              voucher: {
                code: voucherCode,
              },
            }
          : {}),
      },
      include: {
        voucher: {
          select: {
            id: true,
            code: true,
            currentUses: true,
          },
        },
        redemption: {
          select: {
            id: true,
            voucherId: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Nenhuma compra com voucher encontrada para reversão.',
        },
        { status: 404 }
      );
    }

    const reverted = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const redemption = purchase.redemption
        ? purchase.redemption
        : await tx.voucherRedemption.findFirst({
            where: {
              purchaseId: purchase.id,
            },
            select: {
              id: true,
              voucherId: true,
            },
          });

      const voucherId = redemption?.voucherId || purchase.voucherId || null;
      if (voucherId) {
        const voucher = await tx.voucherCode.findUnique({
          where: { id: voucherId },
          select: {
            currentUses: true,
          },
        });

        if (voucher) {
          await tx.voucherCode.update({
            where: { id: voucherId },
            data: {
              currentUses: Math.max(0, voucher.currentUses - 1),
            },
          });
        }
      }

      await tx.discountApplied.deleteMany({
        where: {
          purchaseId: purchase.id,
        },
      });

      await tx.voucherRedemption.deleteMany({
        where: {
          purchaseId: purchase.id,
        },
      });

      await tx.purchase.delete({
        where: {
          id: purchase.id,
        },
      });

      return {
        purchaseId: purchase.id,
        voucherCode: purchase.voucher?.code || null,
        userId: purchase.userId,
        courseId: purchase.courseId,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Uso de voucher revertido com sucesso.',
      reverted,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHER_REVERT_TEST_USE_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Erro ao reverter uso de voucher de teste.',
      },
      { status: 500 }
    );
  }
}
