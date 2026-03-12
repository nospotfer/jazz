import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

const STRIPE_METADATA_KEY = 'stripeVoucher';

export type StripeVoucherMetadata = {
  couponId: string;
  promotionCodeId: string;
};

export type VoucherSyncPayload = {
  id: string;
  code: string;
  type: 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FREE_ACCESS' | string;
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderValue: number | null;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: Date | null;
  metadata: unknown;
};

type SyncVoucherOptions = {
  desiredActive?: boolean;
  createIfMissing?: boolean;
};

function getStripeClient() {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to sync vouchers.');
  }

  return stripe;
}

function toUpperVoucherCode(code: string) {
  return code.trim().toUpperCase();
}

function toUnixTimestamp(value: Date | null) {
  if (!value) {
    return undefined;
  }

  return Math.floor(value.getTime() / 1000);
}

function toStripeCents(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.max(1, Math.round(value * 100));
}

export function readStripeVoucherMetadata(rawMetadata: unknown): StripeVoucherMetadata | null {
  if (!rawMetadata || typeof rawMetadata !== 'object' || Array.isArray(rawMetadata)) {
    return null;
  }

  const root = rawMetadata as Record<string, unknown>;
  const stripeVoucher = root[STRIPE_METADATA_KEY];
  if (!stripeVoucher || typeof stripeVoucher !== 'object' || Array.isArray(stripeVoucher)) {
    return null;
  }

  const value = stripeVoucher as Record<string, unknown>;
  const couponId = typeof value.couponId === 'string' ? value.couponId.trim() : '';
  const promotionCodeId = typeof value.promotionCodeId === 'string' ? value.promotionCodeId.trim() : '';

  if (!couponId || !promotionCodeId) {
    return null;
  }

  return {
    couponId,
    promotionCodeId,
  };
}

export function mergeStripeVoucherMetadata(
  rawMetadata: unknown,
  stripeVoucherMetadata: StripeVoucherMetadata
): Record<string, unknown> {
  const metadataRoot =
    rawMetadata && typeof rawMetadata === 'object' && !Array.isArray(rawMetadata)
      ? { ...(rawMetadata as Record<string, unknown>) }
      : {};

  metadataRoot[STRIPE_METADATA_KEY] = stripeVoucherMetadata;
  return metadataRoot;
}

async function findPromotionCodeByCode(code: string) {
  const stripeClient = getStripeClient();
  const normalizedCode = toUpperVoucherCode(code);

  const response = await stripeClient.promotionCodes.list({
    code: normalizedCode,
    limit: 20,
  });

  return response.data.find((item) => item.code?.trim().toUpperCase() === normalizedCode) || null;
}

function buildCouponCreateParams(voucher: VoucherSyncPayload): Stripe.CouponCreateParams {
  const redeemBy = toUnixTimestamp(voucher.expiresAt);

  if (voucher.type === 'DISCOUNT_FIXED') {
    const amountOff = toStripeCents(voucher.discountAmount);
    if (!amountOff) {
      throw new Error(`Voucher ${voucher.code} has invalid fixed discount amount.`);
    }

    return {
      currency: 'eur',
      amount_off: amountOff,
      duration: 'once',
      name: voucher.code,
      redeem_by: redeemBy,
      metadata: {
        source: 'admin-voucher',
        voucherId: voucher.id,
        voucherCode: toUpperVoucherCode(voucher.code),
      },
    };
  }

  const percentOff = voucher.type === 'FREE_ACCESS' ? 100 : voucher.discountPercent;
  if (percentOff === null || !Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
    throw new Error(`Voucher ${voucher.code} has invalid percent discount.`);
  }

  return {
    percent_off: percentOff,
    duration: 'once',
    name: voucher.code,
    redeem_by: redeemBy,
    metadata: {
      source: 'admin-voucher',
      voucherId: voucher.id,
      voucherCode: toUpperVoucherCode(voucher.code),
    },
  };
}

function buildPromotionCodeCreateParams(
  voucher: VoucherSyncPayload,
  couponId: string,
  active: boolean
): Stripe.PromotionCodeCreateParams {
  const expiresAt = toUnixTimestamp(voucher.expiresAt);
  const minimumAmount = toStripeCents(voucher.minOrderValue);

  return {
    coupon: couponId,
    code: toUpperVoucherCode(voucher.code),
    active,
    max_redemptions: voucher.maxUses && voucher.maxUses > 0 ? voucher.maxUses : undefined,
    expires_at: expiresAt,
    restrictions: minimumAmount
      ? {
          minimum_amount: minimumAmount,
          minimum_amount_currency: 'eur',
        }
      : undefined,
    metadata: {
      source: 'admin-voucher',
      voucherId: voucher.id,
      voucherCode: toUpperVoucherCode(voucher.code),
    },
  };
}

export async function syncVoucherPromotionCode(
  voucher: VoucherSyncPayload,
  options: SyncVoucherOptions = {}
): Promise<StripeVoucherMetadata | null> {
  const stripeClient = getStripeClient();
  const desiredActive = options.desiredActive ?? voucher.isActive;
  const createIfMissing = options.createIfMissing ?? true;

  const existingMetadata = readStripeVoucherMetadata(voucher.metadata);
  let promotionCode: Stripe.PromotionCode | null = null;

  if (existingMetadata?.promotionCodeId) {
    try {
      promotionCode = await stripeClient.promotionCodes.retrieve(existingMetadata.promotionCodeId);
    } catch {
      promotionCode = null;
    }
  }

  if (!promotionCode) {
    promotionCode = await findPromotionCodeByCode(voucher.code);
  }

  if (!promotionCode && !createIfMissing) {
    return null;
  }

  if (!promotionCode) {
    const coupon = await stripeClient.coupons.create(buildCouponCreateParams(voucher));
    promotionCode = await stripeClient.promotionCodes.create(
      buildPromotionCodeCreateParams(voucher, coupon.id, desiredActive)
    );
  }

  if (promotionCode.active !== desiredActive) {
    promotionCode = await stripeClient.promotionCodes.update(promotionCode.id, {
      active: desiredActive,
    });
  }

  return {
    couponId: typeof promotionCode.coupon === 'string' ? promotionCode.coupon : promotionCode.coupon.id,
    promotionCodeId: promotionCode.id,
  };
}
