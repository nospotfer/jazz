import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { removeVoucherDiscountSync } from '@/lib/voucher-provider-sync';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BulkDeletePayload = {
  voucherIds?: string[];
  batchId?: string;
  force?: boolean;
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
    const force = body.force === true;

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

    const prisma = db;
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

    const blocked = force
      ? []
      : candidates.filter((voucher) => voucher.currentUses > 0 || voucher._count.redemptions > 0);
    const deletable = force
      ? candidates
      : candidates.filter((voucher) => voucher.currentUses === 0 && voucher._count.redemptions === 0);

    const providerSyncResults = await Promise.all(
      deletable.map((voucher) =>
        removeVoucherDiscountSync({
          id: voucher.id,
          code: voucher.code,
          type: voucher.type,
          discountPercent: voucher.discountPercent,
          discountAmount: voucher.discountAmount,
          maxUses: voucher.maxUses,
          expiresAt: voucher.expiresAt,
          metadata: voucher.metadata,
        })
      )
    );

    const providerSyncWarnings = providerSyncResults
      .map((result, index) => ({ result, code: deletable[index]?.code }))
      .filter((entry) => !entry.result.ok)
      .map((entry) => `${entry.code}: ${entry.result.reason || 'sync remove failed'}`);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (deletable.length) {
        await tx.voucherCode.deleteMany({
          where: {
            id: {
              in: deletable.map((voucher) => voucher.id),
            },
          },
        });
      }

      const affectedBatchIds = Array.from(
        new Set(
          candidates
            .map((voucher) => voucher.batchId)
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
        blockedCodes: blocked.map((voucher) => voucher.code),
        message:
          blocked.length > 0
            ? `Se eliminaron ${deletable.length} voucher(s). ${blocked.length} no se pudieron eliminar por uso.`
            : force
              ? `Se eliminaron ${deletable.length} voucher(s) en modo forzado.`
              : `Se eliminaron ${deletable.length} voucher(s).`,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
      providerSyncWarnings,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_BULK_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Error al eliminar vouchers.' },
      { status: 500 }
    );
  }
}
