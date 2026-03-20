import {
  createLemonDiscount,
  deleteLemonDiscount,
  findLemonDiscountByCode,
  getLemonConfig,
  isLemonConfigured,
  retrieveLemonDiscount,
} from '@/lib/lemon-squeezy';

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

type VoucherMetadata = Record<string, unknown>;

type LemonSyncRef = {
  discountId: string;
  discountCode: string;
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

function getLemonRef(metadata: VoucherMetadata): LemonSyncRef | null {
  const discountId = typeof metadata.lemonDiscountId === 'string' ? metadata.lemonDiscountId.trim() : '';
  const discountCode = typeof metadata.lemonDiscountCode === 'string' ? metadata.lemonDiscountCode.trim() : '';

  if (!discountId || !discountCode) {
    return null;
  }

  return {
    discountId,
    discountCode,
  };
}

function buildDiscountAmount(voucher: VoucherSyncRecord): { amount: number; amountType: 'percent' | 'fixed' } {
  if (voucher.type === 'FREE_ACCESS') {
    return { amount: 100, amountType: 'percent' };
  }

  if (voucher.type === 'DISCOUNT_PERCENT') {
    const amount = Number.isFinite(Number(voucher.discountPercent)) ? Number(voucher.discountPercent) : 0;
    return {
      amount: Math.max(0, Math.min(100, Math.round(amount))),
      amountType: 'percent',
    };
  }

  const fixedAmount = Number.isFinite(Number(voucher.discountAmount)) ? Number(voucher.discountAmount) : 0;
  return {
    amount: Math.max(0, Math.round(fixedAmount * 100)),
    amountType: 'fixed',
  };
}

function buildSyncedMetadata(baseMetadata: VoucherMetadata, ref: LemonSyncRef): VoucherMetadata {
  return {
    ...baseMetadata,
    lemonDiscountId: ref.discountId,
    lemonDiscountCode: ref.discountCode,
    lemonDiscountSyncedAt: new Date().toISOString(),
    lemonDiscountSyncStatus: 'synced',
    lemonDiscountSyncError: null,
  };
}

function buildSyncErrorMetadata(baseMetadata: VoucherMetadata, error: unknown): VoucherMetadata {
  return {
    ...baseMetadata,
    lemonDiscountSyncStatus: 'error',
    lemonDiscountSyncError: error instanceof Error ? error.message : String(error),
    lemonDiscountSyncedAt: new Date().toISOString(),
  };
}

function buildUnsyncedMetadata(baseMetadata: VoucherMetadata): VoucherMetadata {
  return {
    ...baseMetadata,
    lemonDiscountId: null,
    lemonDiscountCode: null,
    lemonDiscountSyncStatus: 'deleted',
    lemonDiscountSyncError: null,
    lemonDiscountSyncedAt: new Date().toISOString(),
  };
}

export async function ensureVoucherDiscountSynced(voucher: VoucherSyncRecord): Promise<{
  ok: boolean;
  metadata: VoucherMetadata;
  reason?: string;
}> {
  const baseMetadata = normalizeMetadata(voucher.metadata);

  if (!isLemonConfigured()) {
    return {
      ok: false,
      reason: 'Lemon is not configured',
      metadata: buildSyncErrorMetadata(baseMetadata, new Error('Lemon is not configured')),
    };
  }

  const lemonConfig = getLemonConfig();
  const storeId = lemonConfig.storeId;
  const variantId = lemonConfig.variantId;

  if (!storeId) {
    return {
      ok: false,
      reason: 'Missing Lemon store id',
      metadata: buildSyncErrorMetadata(baseMetadata, new Error('Missing Lemon store id')),
    };
  }

  const voucherCode = toUpperCode(voucher.code);

  try {
    const existingRef = getLemonRef(baseMetadata);
    if (existingRef?.discountId) {
      const existing = await retrieveLemonDiscount(existingRef.discountId);
      if (existing) {
        return {
          ok: true,
          metadata: buildSyncedMetadata(baseMetadata, {
            discountId: existing.id,
            discountCode: existing.code,
          }),
        };
      }
    }

    const amount = buildDiscountAmount(voucher);

    let createdRef: LemonSyncRef;
    try {
      const created = await createLemonDiscount({
        storeId,
        variantId,
        name: `Voucher ${voucherCode}`,
        code: voucherCode,
        amount: amount.amount,
        amountType: amount.amountType,
        maxRedemptions: voucher.maxUses,
        expiresAt: voucher.expiresAt,
      });

      createdRef = {
        discountId: created.id,
        discountCode: created.code,
      };
    } catch (error) {
      const existingByCode = await findLemonDiscountByCode(storeId, voucherCode);
      if (!existingByCode) {
        throw error;
      }

      createdRef = {
        discountId: existingByCode.id,
        discountCode: existingByCode.code,
      };
    }

    return {
      ok: true,
      metadata: buildSyncedMetadata(baseMetadata, createdRef),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      metadata: buildSyncErrorMetadata(baseMetadata, error),
    };
  }
}

export async function removeVoucherDiscountSync(voucher: VoucherSyncRecord): Promise<{
  ok: boolean;
  metadata: VoucherMetadata;
  reason?: string;
}> {
  const baseMetadata = normalizeMetadata(voucher.metadata);
  const currentRef = getLemonRef(baseMetadata);

  if (!currentRef) {
    return {
      ok: true,
      metadata: buildUnsyncedMetadata(baseMetadata),
    };
  }

  if (!isLemonConfigured()) {
    return {
      ok: false,
      reason: 'Lemon is not configured',
      metadata: buildSyncErrorMetadata(baseMetadata, new Error('Lemon is not configured')),
    };
  }

  try {
    await deleteLemonDiscount(currentRef.discountId);

    return {
      ok: true,
      metadata: buildUnsyncedMetadata(baseMetadata),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      metadata: buildSyncErrorMetadata(baseMetadata, error),
    };
  }
}

export function getVoucherProviderDiscountCode(metadata: unknown, fallbackVoucherCode: string): string {
  const baseMetadata = normalizeMetadata(metadata);
  const lemonCode = typeof baseMetadata.lemonDiscountCode === 'string' ? baseMetadata.lemonDiscountCode.trim() : '';

  return lemonCode || toUpperCode(fallbackVoucherCode);
}
