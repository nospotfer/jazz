import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { mergeStripeVoucherMetadata, syncVoucherPromotionCode } from '@/lib/stripe-voucher-sync';

export const runtime = 'nodejs';

const VOUCHER_TYPES = ['FREE_ACCESS', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED'] as const;
type VoucherType = (typeof VOUCHER_TYPES)[number];

function randomToken(size = 6) {
  return crypto.randomBytes(size).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, size);
}

function buildVoucherCode(prefix: string) {
  return `${prefix}-${randomToken(8)}`;
}

function sanitizeBaseCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
}

function buildSequentialCode(baseCode: string, index: number) {
  return `${baseCode}${String(index).padStart(2, '0')}`;
}

function extractSequentialIndex(code: string, baseCode: string) {
  if (!code.startsWith(baseCode)) {
    return null;
  }

  const suffix = code.slice(baseCode.length);
  if (suffix.length < 2) {
    return null;
  }

  if (!/^\d+$/.test(suffix)) {
    return null;
  }

  const parsed = Number(suffix);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
    const deterministicBaseCode = body.deterministicBaseCode ? sanitizeBaseCode(String(body.deterministicBaseCode)) : null;

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
    const prisma = db as any;

    let codes: string[] = [];

    if (deterministicBaseCode) {
      const existingCodes = await prisma.voucherCode.findMany({
        where: {
          code: {
            startsWith: deterministicBaseCode,
          },
        },
        select: {
          code: true,
        },
      });

      const usedIndexes = new Set<number>();
      for (const item of existingCodes) {
        const value = extractSequentialIndex(item.code, deterministicBaseCode);
        if (value !== null) {
          usedIndexes.add(value);
        }
      }

      const generatedIndexes: number[] = [];
      let candidateIndex = 1;

      while (generatedIndexes.length < count) {
        if (!usedIndexes.has(candidateIndex)) {
          generatedIndexes.push(candidateIndex);
          usedIndexes.add(candidateIndex);
        }
        candidateIndex += 1;
      }

      codes = generatedIndexes.map((index) => buildSequentialCode(deterministicBaseCode, index));
    } else {
      const generatedCodes = new Set<string>();
      while (generatedCodes.size < count) {
        generatedCodes.add(buildVoucherCode(prefix || 'JAZZ'));
      }

      codes = Array.from(generatedCodes);
    }

    const plannedVouchers = codes.map((code) => ({ id: crypto.randomUUID(), code }));

    const stripeMetadataByCode = new Map<string, Record<string, unknown>>();
    for (const voucher of plannedVouchers) {
      const stripeMetadata = await syncVoucherPromotionCode(
        {
          id: voucher.id,
          code: voucher.code,
          type,
          discountPercent,
          discountAmount,
          minOrderValue,
          maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
          isActive: true,
          expiresAt,
          metadata,
        },
        {
          desiredActive: true,
          createIfMissing: true,
        }
      );

      if (!stripeMetadata) {
        throw new Error(`Stripe sync returned empty metadata for voucher ${voucher.code}.`);
      }

      stripeMetadataByCode.set(voucher.code, mergeStripeVoucherMetadata(metadata, stripeMetadata));
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const batch = await tx.voucherBatch.create({
        data: {
          name: batchName,
          codePrefix: deterministicBaseCode || prefix || 'JAZZ',
          quantity: count,
          createdBy: auth.userId,
          metadata,
        },
      });

      const vouchers = await Promise.all(
        plannedVouchers.map((voucher) =>
          tx.voucherCode.create({
            data: {
              id: voucher.id,
              code: voucher.code,
              type,
              courseId,
              batchId: batch.id,
              discountPercent: type === 'DISCOUNT_PERCENT' ? discountPercent : null,
              discountAmount: type === 'DISCOUNT_FIXED' ? discountAmount : null,
              minOrderValue,
              maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
              maxUsesPerUser,
              expiresAt,
              metadata: stripeMetadataByCode.get(voucher.code) ?? metadata,
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
