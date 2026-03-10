import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';

const VOUCHER_TYPES = ['FREE_ACCESS', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED'] as const;
type VoucherType = (typeof VOUCHER_TYPES)[number];

function randomToken(size = 6) {
  return crypto.randomBytes(size).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, size);
}

function buildVoucherCode(prefix: string) {
  return `${prefix}-${randomToken(8)}`;
}

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const type = String(body.type || '').toUpperCase() as VoucherType;
    const courseId = body.courseId ? String(body.courseId) : null;
    const count = Math.min(500, Math.max(1, Number(body.count || 1)));
    const maxUses = body.maxUses === null || body.maxUses === undefined ? 1 : Number(body.maxUses);
    const maxUsesPerUser = Math.max(1, Number(body.maxUsesPerUser || 1));
    const expiresInDays = body.expiresInDays === null || body.expiresInDays === undefined
      ? null
      : Number(body.expiresInDays);
    const discountPercent = body.discountPercent === null || body.discountPercent === undefined
      ? null
      : Number(body.discountPercent);
    const discountAmount = body.discountAmount === null || body.discountAmount === undefined
      ? null
      : Number(body.discountAmount);
    const minOrderValue = body.minOrderValue === null || body.minOrderValue === undefined
      ? null
      : Number(body.minOrderValue);
    const prefix = String(body.prefix || 'JAZZ').trim().toUpperCase().slice(0, 12).replace(/[^A-Z0-9]/g, '');
    const batchName = body.batchName ? String(body.batchName) : null;

    if (!VOUCHER_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type', message: 'Tipo de voucher inválido.' },
        { status: 400 }
      );
    }

    if (type === 'DISCOUNT_PERCENT' && (discountPercent === null || discountPercent <= 0 || discountPercent > 100)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discountPercent', message: 'Percentual deve ser entre 0 e 100.' },
        { status: 400 }
      );
    }

    if (type === 'DISCOUNT_FIXED' && (discountAmount === null || discountAmount <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discountAmount', message: 'Valor fixo deve ser maior que zero.' },
        { status: 400 }
      );
    }

    const expiresAt = expiresInDays && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const metadata = typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : null;

    const generatedCodes = new Set<string>();
    while (generatedCodes.size < count) {
      generatedCodes.add(buildVoucherCode(prefix || 'JAZZ'));
    }

    const codes = Array.from(generatedCodes);

    const prisma = db as any;
    const result = await prisma.$transaction(async (tx: any) => {
      const batch = await tx.voucherBatch.create({
        data: {
          name: batchName,
          codePrefix: prefix || 'JAZZ',
          quantity: count,
          createdBy: auth.userId,
          metadata,
        },
      });

      const vouchers = await Promise.all(
        codes.map((code) =>
          tx.voucherCode.create({
            data: {
              code,
              type,
              courseId,
              batchId: batch.id,
              discountPercent: type === 'DISCOUNT_PERCENT' ? discountPercent : null,
              discountAmount: type === 'DISCOUNT_FIXED' ? discountAmount : null,
              minOrderValue,
              maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
              maxUsesPerUser,
              expiresAt,
              metadata,
            },
            select: {
              id: true,
              code: true,
              expiresAt: true,
              type: true,
            },
          })
        )
      );

      return { batch, vouchers };
    });

    return NextResponse.json({
      success: true,
      created: result.vouchers.length,
      batchId: result.batch.id,
      vouchers: result.vouchers,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_GENERATE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao gerar vouchers.' },
      { status: 500 }
    );
  }
}
