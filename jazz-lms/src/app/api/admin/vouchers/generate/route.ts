import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import {
  getVoucherArtistByDiscount,
  getVoucherArtistByKey,
  VOUCHER_ARTIST_TIERS,
} from '@/lib/voucher-artists';
import { ensureVoucherDiscountSynced } from '@/lib/voucher-provider-sync';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VOUCHER_TYPES = ['FREE_ACCESS', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED'] as const;
type VoucherType = (typeof VOUCHER_TYPES)[number];

function randomToken(size: number) {
  if (size <= 0) return '';
  return crypto
    .randomBytes(size * 2)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, size);
}

// Generic voucher code: always 12 chars. Prefix clamped to 2-4 chars (default 'JAZZ').
function buildVoucherCode(prefix: string) {
  const safePrefix = (prefix || 'JAZZ').replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'JAZZ';
  const paddedPrefix = safePrefix.length < 2 ? (safePrefix + 'JAZZ').slice(0, 2) : safePrefix;
  return `${paddedPrefix}${randomToken(12 - paddedPrefix.length)}`;
}

function randomDigits(size = 3) {
  const max = 10 ** size;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(size, '0');
}

function extractArtistSequence(code: string, shortKey: string, discountPercent: number) {
  const normalizedCode = code.trim().toUpperCase();
  // New compact format: {shortKey:3}{discount:2-3}{sequence:2}{random:3}
  const pattern = new RegExp(`^${shortKey}${discountPercent}(\\d{2})\\d{3}$`);
  const match = normalizedCode.match(pattern);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Artist voucher code: 10-12 chars depending on discount digits.
// 2-digit discount (10..90) → 3+2+2+3 = 10 chars.
// 3-digit discount (100)    → 3+3+2+3 = 11 chars.
function buildArtistVoucherCode(shortKey: string, discountPercent: number, sequence: number) {
  const sequencePart = String(sequence).padStart(2, '0').slice(-2);
  return `${shortKey}${discountPercent}${sequencePart}${randomDigits(3)}`;
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
    const artistKeyRaw = typeof body.artistKey === 'string' ? body.artistKey : null;
    const selectedArtist = getVoucherArtistByKey(artistKeyRaw);

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

    if (type === 'DISCOUNT_PERCENT') {
      if (!selectedArtist) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid artist',
            message: 'Selecione um artista válido para vouchers percentuais.',
          },
          { status: 400 }
        );
      }

      if (selectedArtist.discountPercent !== discountPercent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid artist discount mapping',
            message: 'O desconto precisa seguir o percentual oficial do artista selecionado.',
          },
          { status: 400 }
        );
      }
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
    const prisma = db;

    let codes: string[] = [];

    if (type === 'DISCOUNT_PERCENT' && selectedArtist && discountPercent !== null) {
      const deterministicBaseCode = `${selectedArtist.shortKey}${discountPercent}`;
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

      let maxSequence = 0;
      for (const item of existingCodes) {
        const sequence = extractArtistSequence(item.code, selectedArtist.shortKey, discountPercent);
        if (sequence !== null && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }

      const generatedCodes = new Set<string>();
      for (let offset = 1; offset <= count; offset += 1) {
        const sequence = maxSequence + offset;
        if (sequence > 99) {
          return NextResponse.json(
            {
              success: false,
              error: 'Sequence limit reached',
              message:
                'Límite de 99 cupones por artista y descuento alcanzado. Elimina o archiva cupones antiguos antes de generar más.',
            },
            { status: 409 }
          );
        }
        let nextCode = buildArtistVoucherCode(selectedArtist.shortKey, discountPercent, sequence);

        while (generatedCodes.has(nextCode)) {
          nextCode = buildArtistVoucherCode(selectedArtist.shortKey, discountPercent, sequence);
        }

        generatedCodes.add(nextCode);
      }

      codes = Array.from(generatedCodes);
    } else {
      const generatedCodes = new Set<string>();
      while (generatedCodes.size < count) {
        generatedCodes.add(buildVoucherCode(prefix || 'JAZZ'));
      }

      codes = Array.from(generatedCodes);
    }

    const mappedArtistFromDiscount = getVoucherArtistByDiscount(discountPercent);
    const artistForMetadata = selectedArtist ?? mappedArtistFromDiscount;

    const normalizedMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? { ...(metadata as Record<string, unknown>) }
        : {};

    if (type === 'DISCOUNT_PERCENT' && artistForMetadata) {
      normalizedMetadata.voucherArtistKey = artistForMetadata.key;
      normalizedMetadata.voucherArtistShortKey = artistForMetadata.shortKey;
      normalizedMetadata.voucherArtistName = artistForMetadata.name;
      normalizedMetadata.voucherArtistDiscountPercent = artistForMetadata.discountPercent;
      normalizedMetadata.voucherCodeFormat = 'SHORTKEY_PERCENT_SEQ2_RAND3';
      normalizedMetadata.voucherArtistVersion = '2026-04-22';
    }

    const normalizedMetadataJson = normalizedMetadata as Prisma.InputJsonValue;

    const plannedVouchers = codes.map((code) => ({ id: crypto.randomUUID(), code }));

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.voucherBatch.create({
        data: {
          name: batchName || (artistForMetadata ? artistForMetadata.name : null),
          codePrefix: artistForMetadata ? `${artistForMetadata.key}${artistForMetadata.discountPercent}` : prefix || 'JAZZ',
          quantity: count,
          createdBy: auth.userId,
          metadata: normalizedMetadataJson,
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
              metadata: normalizedMetadataJson,
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

    const syncWarnings: string[] = [];
    let syncedWithProvider = 0;

    for (const createdVoucher of result.vouchers) {
      const syncResult = await ensureVoucherDiscountSynced({
        id: createdVoucher.id,
        code: createdVoucher.code,
        type,
        discountPercent: type === 'DISCOUNT_PERCENT' ? discountPercent : null,
        discountAmount: type === 'DISCOUNT_FIXED' ? discountAmount : null,
        maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
        expiresAt,
        metadata: normalizedMetadataJson,
      });

      await prisma.voucherCode.update({
        where: { id: createdVoucher.id },
        data: {
          metadata: (syncResult.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
        },
      });

      if (syncResult.ok) {
        syncedWithProvider += 1;
      } else {
        syncWarnings.push(`${createdVoucher.code}: ${syncResult.reason || 'sync failed'}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: result.vouchers.length,
      batchId: result.batch.id,
      syncedWithProvider,
      syncWarnings,
      artists: VOUCHER_ARTIST_TIERS,
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
