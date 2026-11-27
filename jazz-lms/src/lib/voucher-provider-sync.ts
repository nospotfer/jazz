import { createDodoDiscount, disableDodoDiscount, isDodoConfigured } from '@/lib/payments/providers/dodo';

type VoucherMetadata = Record<string, unknown>;

export type VoucherSyncRecord = {
  id: string;
  code: string;
  type: 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';
  discountPercent: number | null;
  discountAmount: number | null;
  maxUses: number | null;
  maxUsesPerUser?: number;
  minOrderValue?: number | null;
  isActive?: boolean;
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

  if (voucher.isActive === false) return removeVoucherDiscountSync(voucher);

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
      perCustomerUsageLimit: Math.min(voucher.maxUsesPerUser ?? 1, voucher.maxUses ?? Infinity),
      minimumSubtotal: Math.round((voucher.minOrderValue ?? 0) * 100),
      expiresAt: voucher.expiresAt ?? null,
      voucherId: voucher.id,
      discountId: typeof baseMetadata.providerDiscountId === 'string' ? baseMetadata.providerDiscountId : null,
    });
  } else if (voucher.type === 'DISCOUNT_FIXED' && voucher.discountAmount && voucher.discountAmount > 0) {
    // The course and fixed discounts are priced in EUR.
    const cents = Math.round(voucher.discountAmount * 100);
    dodoResult = await createDodoDiscount({
      code: providerDiscountCode,
      type: 'flat',
      amount: cents,
      usageLimit: voucher.maxUses ?? null,
      perCustomerUsageLimit: Math.min(voucher.maxUsesPerUser ?? 1, voucher.maxUses ?? Infinity),
      minimumSubtotal: Math.round((voucher.minOrderValue ?? 0) * 100),
      expiresAt: voucher.expiresAt ?? null,
      voucherId: voucher.id,
      discountId: typeof baseMetadata.providerDiscountId === 'string' ? baseMetadata.providerDiscountId : null,
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
      providerDiscountId: dodoResult.discountId ?? baseMetadata.providerDiscountId ?? null,
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
  const providerDiscountCode = readProviderDiscountCode(baseMetadata) || toUpperCode(voucher.code);
  const result: Awaited<ReturnType<typeof disableDodoDiscount>> = voucher.type === 'FREE_ACCESS'
    ? { ok: true, reason: 'not_required' }
    : await disableDodoDiscount({
        code: providerDiscountCode,
        voucherId: voucher.id,
        discountId: typeof baseMetadata.providerDiscountId === 'string' ? baseMetadata.providerDiscountId : null,
      });

  return {
    ok: result.ok,
    reason: result.reason,
    metadata: {
      ...baseMetadata,
      providerDiscountCode,
      dodoDiscountCode: providerDiscountCode,
      providerDiscountId: result.discountId ?? baseMetadata.providerDiscountId ?? null,
      providerDiscountSyncedAt: new Date().toISOString(),
      providerDiscountSyncStatus: result.ok ? 'disabled' : 'failed',
      providerDiscountSyncProvider: 'dodo',
      providerDiscountSyncError: result.ok ? null : result.reason ?? 'unknown',
    },
  };
}

export function getVoucherProviderDiscountCode(metadata: unknown, fallbackVoucherCode: string): string {
  const baseMetadata = normalizeMetadata(metadata);
  const providerCode = readProviderDiscountCode(baseMetadata);

  return providerCode || toUpperCode(fallbackVoucherCode);
}
