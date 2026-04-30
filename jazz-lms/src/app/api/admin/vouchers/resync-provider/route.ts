import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { ensureVoucherDiscountSynced } from '@/lib/voucher-provider-sync';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Payload = {
  onlyActive?: boolean;
  onlyUnsynced?: boolean;
};

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await req.json().catch(() => ({}))) as Payload;
    const onlyActive = body.onlyActive !== false; // default true
    const onlyUnsynced = body.onlyUnsynced === true;

    const where: Prisma.VoucherCodeWhereInput = {
      type: { in: ['DISCOUNT_PERCENT', 'DISCOUNT_FIXED'] },
    };
    if (onlyActive) {
      where.isActive = true;
    }

    const vouchers = await db.voucherCode.findMany({
      where,
      select: {
        id: true,
        code: true,
        type: true,
        discountPercent: true,
        discountAmount: true,
        maxUses: true,
        currentUses: true,
        expiresAt: true,
        metadata: true,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const failures: Array<{ code: string; reason: string }> = [];

    for (const voucher of vouchers) {
      const meta =
        voucher.metadata && typeof voucher.metadata === 'object' && !Array.isArray(voucher.metadata)
          ? (voucher.metadata as Record<string, unknown>)
          : {};
      if (onlyUnsynced && meta.providerDiscountSyncStatus === 'synced') {
        skipped += 1;
        continue;
      }

      const remainingUses =
        voucher.maxUses !== null && voucher.maxUses !== undefined
          ? Math.max(1, voucher.maxUses - voucher.currentUses)
          : null;

      const result = await ensureVoucherDiscountSynced({
        id: voucher.id,
        code: voucher.code,
        type: voucher.type as 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED',
        discountPercent: voucher.discountPercent,
        discountAmount: voucher.discountAmount,
        maxUses: remainingUses,
        expiresAt: voucher.expiresAt,
        metadata: voucher.metadata,
      });

      await db.voucherCode.update({
        where: { id: voucher.id },
        data: {
          metadata: (result.metadata ?? Prisma.JsonNull) as
            | Prisma.InputJsonValue
            | typeof Prisma.JsonNull,
        },
      });

      if (result.ok) {
        synced += 1;
      } else {
        failed += 1;
        failures.push({ code: voucher.code, reason: result.reason ?? 'unknown' });
      }
    }

    return NextResponse.json({
      success: true,
      total: vouchers.length,
      synced,
      failed,
      skipped,
      failures,
    });
  } catch (error) {
    console.error('[VOUCHER_RESYNC_PROVIDER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Error al re-sincronizar vouchers.' },
      { status: 500 }
    );
  }
}
