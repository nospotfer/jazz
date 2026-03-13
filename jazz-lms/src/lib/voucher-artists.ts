export type VoucherArtistTier = {
  name: string;
  key: string;
  discountPercent: number;
};

export const VOUCHER_ARTIST_TIERS: VoucherArtistTier[] = [
  { name: 'Louis Armstrong', key: 'LOUISARMSTRONG', discountPercent: 100 },
  { name: 'Frank Sinatra', key: 'FRANKSINATRA', discountPercent: 90 },
  { name: 'Ella Fitzgerald', key: 'ELLAFITZGERALD', discountPercent: 80 },
  { name: 'Billie Holiday', key: 'BILLIEHOLIDAY', discountPercent: 70 },
  { name: 'Nat King Cole', key: 'NATKINGCOLE', discountPercent: 60 },
  { name: 'Bing Crosby', key: 'BINGCROSBY', discountPercent: 50 },
  { name: 'Cab Calloway', key: 'CABCALLOWAY', discountPercent: 40 },
  { name: 'Sarah Vaughan', key: 'SARAHVAUGHAN', discountPercent: 30 },
  { name: 'Bessie Smith', key: 'BESSIESMITH', discountPercent: 20 },
  { name: 'Peggy Lee', key: 'PEGGYLEE', discountPercent: 10 },
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
    const pattern = new RegExp(`^${artist.key}${artist.discountPercent}(\\d{2,})(\\d{4})$`);
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

export function isLegacyVoucherCode(code: string) {
  return getVoucherArtistFromCode(code) === null;
}
