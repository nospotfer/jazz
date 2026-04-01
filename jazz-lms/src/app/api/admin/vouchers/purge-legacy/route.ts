import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { isLegacyVoucherCode } from '@/lib/voucher-artists';
import { removeVoucherDiscountSync } from '@/lib/voucher-provider-sync';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

type PurgePayload = {
  force?: boolean;
};

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await req.json().catch(() => ({}))) as PurgePayload;
    const force = body.force === true;

    if (!force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required',
          message: 'Envía force=true para confirmar la limpieza de cupones legados.',
        },
        { status: 400 }
      );
    }

    const prisma = db;
    const vouchers = await prisma.voucherCode.findMany({
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
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const legacyVouchers = vouchers.filter((voucher) => isLegacyVoucherCode(voucher.code));

    if (!legacyVouchers.length) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No hay cupones legados para eliminar.',
      });
    }

    const deletedIds = legacyVouchers.map((voucher) => voucher.id);
    const providerSyncResults = await Promise.all(
      legacyVouchers.map((voucher) =>
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
      .map((result, index) => ({ result, code: legacyVouchers[index]?.code }))
      .filter((entry) => !entry.result.ok)
      .map((entry) => `${entry.code}: ${entry.result.reason || 'sync remove failed'}`);

    const affectedBatchIds = Array.from(
      new Set(
        legacyVouchers
              .map((voucher) => voucher.batchId)
          .filter((value: string | null) => Boolean(value))
      )
    ) as string[];

            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.voucherCode.deleteMany({
        where: {
          id: {
            in: deletedIds,
          },
        },
      });

      for (const batchId of affectedBatchIds) {
        const batchCount = await tx.voucherCode.count({
          where: {
            batchId,
          },
        });

        if (batchCount === 0) {
          await tx.voucherBatch.delete({
            where: {
              id: batchId,
            },
          });
          continue;
        }

        await tx.voucherBatch.update({
          where: {
            id: batchId,
          },
          data: {
            quantity: batchCount,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedIds.length,
      providerSyncWarnings,
      message: `Se eliminaron ${deletedIds.length} cupon(es) legado(s).`,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_PURGE_LEGACY_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Error al limpiar cupones legados.',
      },
      { status: 500 }
    );
  }
}
