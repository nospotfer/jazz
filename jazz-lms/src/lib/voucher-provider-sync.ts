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

  return {
    ok: true,
    metadata: {
      ...baseMetadata,
      providerDiscountCode,
      dodoDiscountCode: providerDiscountCode,
      providerDiscountSyncedAt: new Date().toISOString(),
      providerDiscountSyncStatus: 'synced',
      providerDiscountSyncProvider: 'dodo',
      providerDiscountSyncError: null,
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
