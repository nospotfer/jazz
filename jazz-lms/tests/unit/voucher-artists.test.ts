import { describe, expect, test } from 'vitest';
import {
  getVoucherArtistByDiscount,
  getVoucherArtistByKey,
  getVoucherArtistFromCode,
  isLegacyVoucherCode,
  normalizeVoucherArtistKey,
} from '@/lib/voucher-artists';

describe('voucher artist mapping', () => {
  test('resolves artist by key and discount', () => {
    const artistByKey = getVoucherArtistByKey('louis armstrong');
    const artistByDiscount = getVoucherArtistByDiscount(100);

    expect(artistByKey?.key).toBe('LOUISARMSTRONG');
    expect(artistByKey?.shortKey).toBe('LOU');
    expect(artistByDiscount?.key).toBe('LOUISARMSTRONG');
    expect(artistByDiscount?.shortKey).toBe('LOU');
  });

  test('normalizes artist names to key format', () => {
    expect(normalizeVoucherArtistKey('Peggy Lee')).toBe('PEGGYLEE');
    expect(normalizeVoucherArtistKey('Élla-Fitzgerald')).toBe('ELLAFITZGERALD');
  });

  test('parses new compact voucher format and flags legacy codes', () => {
    // LOU + 100 + 01 (sequence) + 123 (random) = 11 chars
    const parsed = getVoucherArtistFromCode('LOU10001123');

    expect(parsed?.artist.key).toBe('LOUISARMSTRONG');
    expect(parsed?.artist.shortKey).toBe('LOU');
    expect(parsed?.sequence).toBe(1);
    expect(parsed?.randomSuffix).toBe('123');

    // Peggy Lee: PEG + 10 + 01 + 123 = 10 chars
    const peggy = getVoucherArtistFromCode('PEG1001123');
    expect(peggy?.artist.shortKey).toBe('PEG');
    expect(peggy?.sequence).toBe(1);

    expect(isLegacyVoucherCode('JAZZABCD1234')).toBe(true);
    expect(isLegacyVoucherCode('LOUISARMSTRONG100010123')).toBe(true);
    expect(isLegacyVoucherCode('LOU10001123')).toBe(false);
    // Internal admin test codes are exempt from legacy classification
    expect(isLegacyVoucherCode('ADMIN99TEST')).toBe(false);
  });
});
