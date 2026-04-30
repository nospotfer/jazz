import { createDodoDiscount, isDodoConfigured } from '@/lib/payments/providers/dodo';

type VoucherMetadata = Record<string, unknown>;

export type VoucherSyncRecord = {
  id: string;
  code: string;
  type: 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number | null;
  expiresAt: Date | null;
  metadata?: unknown;
};

function normalizeMetadata(metadata: unknown): VoucherMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return { ...(metadata as VoucherMetadata) };
}

function toUpperCode(code: string) {
  return code.trim().toUpperCase();
}

function readProviderDiscountCode(metadata: VoucherMetadata): string | null {
  const providerCode = typeof metadata.providerDiscountCode === 'string'
    ? metadata.providerDiscountCode.trim()
    : '';
  if (providerCode) {
    return providerCode;
  }

  const dodoCode = typeof metadata.dodoDiscountCode === 'string'
    ? metadata.dodoDiscountCode.trim()
    : '';
  if (dodoCode) {
    return dodoCode;
  }

  return null;
}

export async function ensureVoucherDiscountSynced(voucher: VoucherSyncRecord): Promise<{
  ok: boolean;
  metadata: VoucherMetadata;
  reason?: string;
}> {
  const baseMetadata = normalizeMetadata(voucher.metadata);
  const providerDiscountCode = readProviderDiscountCode(baseMetadata) || toUpperCode(voucher.code);

  // FREE_ACCESS é resolvido inteiramente pelo app (sem cobrança).
  // Sem Dodo configurado, mantém o stamp local.
  if (voucher.type === 'FREE_ACCESS' || !isDodoConfigured()) {
    return {
      ok: true,
      metadata: {
        ...baseMetadata,
        providerDiscountCode,
        dodoDiscountCode: providerDiscountCode,
        providerDiscountSyncedAt: new Date().toISOString(),
        providerDiscountSyncStatus: voucher.type === 'FREE_ACCESS' ? 'not_required' : 'skipped_no_provider',
        providerDiscountSyncProvider: 'dodo',
        providerDiscountSyncError: null,
      },
    };
  }

  let dodoResult: Awaited<ReturnType<typeof createDodoDiscount>> | null = null;

  if (voucher.type === 'DISCOUNT_PERCENT' && voucher.discountPercent && voucher.discountPercent > 0) {
    // Dodo recebe basis points (20% => 2000).
    const basisPoints = Math.round(voucher.discountPercent * 100);
    dodoResult = await createDodoDiscount({
      code: providerDiscountCode,
      type: 'percentage',
      amount: basisPoints,
      usageLimit: voucher.maxUses ?? null,
      expiresAt: voucher.expiresAt ?? null,
    });
  } else if (voucher.type === 'DISCOUNT_FIXED' && voucher.discountAmount && voucher.discountAmount > 0) {
    // Dodo flat usa USD cents.
    const cents = Math.round(voucher.discountAmount * 100);
    dodoResult = await createDodoDiscount({
      code: providerDiscountCode,
      type: 'flat',
      amount: cents,
      usageLimit: voucher.maxUses ?? null,
      expiresAt: voucher.expiresAt ?? null,
    });
  }

  if (!dodoResult) {
    return {
      ok: true,
      metadata: {
        ...baseMetadata,
        providerDiscountCode,
        dodoDiscountCode: providerDiscountCode,
        providerDiscountSyncedAt: new Date().toISOString(),
        providerDiscountSyncStatus: 'skipped_no_amount',
        providerDiscountSyncProvider: 'dodo',
        providerDiscountSyncError: null,
      },
    };
  }

  return {
    ok: dodoResult.ok,
    reason: dodoResult.reason,
    metadata: {
      ...baseMetadata,
      providerDiscountCode,
      dodoDiscountCode: providerDiscountCode,
      providerDiscountId: dodoResult.discountId ?? null,
      providerDiscountSyncedAt: new Date().toISOString(),
      providerDiscountSyncStatus: dodoResult.ok ? 'synced' : 'failed',
      providerDiscountSyncProvider: 'dodo',
      providerDiscountSyncError: dodoResult.ok ? null : dodoResult.reason ?? 'unknown',
    },
  };
}

export async function removeVoucherDiscountSync(voucher: VoucherSyncRecord): Promise<{
  ok: boolean;
  metadata: VoucherMetadata;
  reason?: string;
}> {
  const baseMetadata = normalizeMetadata(voucher.metadata);

  return {
    ok: true,
    metadata: {
      ...baseMetadata,
      providerDiscountCode: null,
      dodoDiscountCode: null,
      providerDiscountSyncedAt: new Date().toISOString(),
      providerDiscountSyncStatus: 'deleted',
      providerDiscountSyncProvider: 'dodo',
      providerDiscountSyncError: null,
    },
  };
}

export function getVoucherProviderDiscountCode(metadata: unknown, fallbackVoucherCode: string): string {
  const baseMetadata = normalizeMetadata(metadata);
  const providerCode = readProviderDiscountCode(baseMetadata);

  return providerCode || toUpperCode(fallbackVoucherCode);
}
