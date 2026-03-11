import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { syncVoucherPromotionCode } from '@/lib/stripe-voucher-sync';

export const runtime = 'nodejs';

type BulkDeletePayload = {
  voucherIds?: string[];
  batchId?: string;
};

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await req.json()) as BulkDeletePayload;
    const voucherIds = Array.isArray(body.voucherIds)
      ? body.voucherIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : [];
    const batchId = typeof body.batchId === 'string' && body.batchId.trim().length > 0
      ? body.batchId.trim()
      : null;

    if (!voucherIds.length && !batchId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload',
          message: 'Debes enviar voucherIds o batchId.',
        },
        { status: 400 }
      );
    }

    const prisma = db as any;
    const where = batchId
      ? { batchId }
      : {
          id: {
            in: voucherIds,
          },
        };

    const candidates = await prisma.voucherCode.findMany({
      where,
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

    if (!candidates.length) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        blockedCount: 0,
        blockedCodes: [] as string[],
        message: 'No se encontraron vouchers para eliminar.',
      });
    }

    const blocked = candidates.filter((voucher: any) =>
      voucher.currentUses > 0 || voucher._count.redemptions > 0
    );
    const deletable = candidates.filter((voucher: any) =>
      voucher.currentUses === 0 && voucher._count.redemptions === 0
    );

    for (const voucher of deletable) {
      await syncVoucherPromotionCode(voucher, {
        desiredActive: false,
        createIfMissing: false,
      });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      if (deletable.length) {
        await tx.voucherCode.deleteMany({
          where: {
            id: {
              in: deletable.map((voucher: any) => voucher.id),
            },
          },
        });
      }

      const affectedBatchIds = Array.from(
        new Set(
          candidates
            .map((voucher: any) => voucher.batchId)
            .filter((value: string | null) => Boolean(value))
        )
      ) as string[];

      for (const currentBatchId of affectedBatchIds) {
        const batchCount = await tx.voucherCode.count({
          where: {
            batchId: currentBatchId,
          },
        });

        await tx.voucherBatch.update({
          where: {
            id: currentBatchId,
          },
          data: {
            quantity: batchCount,
          },
        });
      }

      return {
        deletedCount: deletable.length,
        blockedCount: blocked.length,
        blockedCodes: blocked.map((voucher: any) => voucher.code),
        message:
          blocked.length > 0
            ? `Se eliminaron ${deletable.length} voucher(s). ${blocked.length} no se pudieron eliminar por uso.`
            : `Se eliminaron ${deletable.length} voucher(s).`,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_BULK_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Error al eliminar vouchers.' },
      { status: 500 }
    );
  }
}
