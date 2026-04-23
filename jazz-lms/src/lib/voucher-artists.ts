export type VoucherArtistTier = {
  name: string;
  key: string;
  shortKey: string;
  discountPercent: number;
};

export const VOUCHER_ARTIST_TIERS: VoucherArtistTier[] = [
  { name: 'Louis Armstrong', key: 'LOUISARMSTRONG', shortKey: 'LOU', discountPercent: 100 },
  { name: 'Frank Sinatra', key: 'FRANKSINATRA', shortKey: 'FRA', discountPercent: 90 },
  { name: 'Ella Fitzgerald', key: 'ELLAFITZGERALD', shortKey: 'ELL', discountPercent: 80 },
  { name: 'Billie Holiday', key: 'BILLIEHOLIDAY', shortKey: 'BIL', discountPercent: 70 },
  { name: 'Nat King Cole', key: 'NATKINGCOLE', shortKey: 'NAT', discountPercent: 60 },
  { name: 'Bing Crosby', key: 'BINGCROSBY', shortKey: 'BIN', discountPercent: 50 },
  { name: 'Cab Calloway', key: 'CABCALLOWAY', shortKey: 'CAB', discountPercent: 40 },
  { name: 'Sarah Vaughan', key: 'SARAHVAUGHAN', shortKey: 'SAR', discountPercent: 30 },
  { name: 'Bessie Smith', key: 'BESSIESMITH', shortKey: 'BES', discountPercent: 20 },
  { name: 'Peggy Lee', key: 'PEGGYLEE', shortKey: 'PEG', discountPercent: 10 },
];

const VOUCHER_ARTIST_BY_KEY = new Map(VOUCHER_ARTIST_TIERS.map((item) => [item.key, item]));
const VOUCHER_ARTIST_BY_DISCOUNT = new Map(VOUCHER_ARTIST_TIERS.map((item) => [item.discountPercent, item]));

export function normalizeVoucherArtistKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function getVoucherArtistByKey(key: string | null | undefined): VoucherArtistTier | null {
  if (!key) {
    return null;
  }

  return VOUCHER_ARTIST_BY_KEY.get(normalizeVoucherArtistKey(key)) ?? null;
}

export function getVoucherArtistByDiscount(discountPercent: number | null | undefined): VoucherArtistTier | null {
  if (discountPercent === null || discountPercent === undefined || !Number.isFinite(discountPercent)) {
    return null;
  }

  return VOUCHER_ARTIST_BY_DISCOUNT.get(Math.round(discountPercent)) ?? null;
}

export function getVoucherArtistFromCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  for (const artist of VOUCHER_ARTIST_TIERS) {
    // New compact format (10-12 chars): {shortKey:3}{discount:2-3}{sequence:2}{random:3}
    const pattern = new RegExp(`^${artist.shortKey}${artist.discountPercent}(\\d{2})(\\d{3})$`);
    const match = normalizedCode.match(pattern);

    if (!match) {
      continue;
    }

    const sequence = Number(match[1]);
    if (!Number.isFinite(sequence) || sequence <= 0) {
      continue;
    }

    return {
      artist,
      sequence,
      randomSuffix: match[2],
    };
  }

  return null;
}

// Internal/admin test codes (e.g. ADMIN99TEST) are intentionally preserved
// across legacy cleanups.
const INTERNAL_VOUCHER_CODE_PATTERN = /^ADMIN[A-Z0-9]{4,7}$/;

export function isInternalVoucherCode(code: string) {
  return INTERNAL_VOUCHER_CODE_PATTERN.test(code.trim().toUpperCase());
}

export function isLegacyVoucherCode(code: string) {
  if (isInternalVoucherCode(code)) {
    return false;
  }
  return getVoucherArtistFromCode(code) === null;
}
