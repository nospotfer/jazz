import { describe, expect, test } from 'vitest';
import {
  getVoucherArtistFromCode,
  isInternalVoucherCode,
  isLegacyVoucherCode,
  VOUCHER_ARTIST_TIERS,
} from '@/lib/voucher-artists';

/**
 * Contract tests for the compact voucher code format (exactly 10 chars).
 *
 * Format rules:
 *   - Artist codes:  {shortKey:3}{discount:2-3}{sequence:2}{random:2-3}
 *                    -> 10 chars (discount 10..90)  | 10 chars (discount 100)
 *   - Generic codes: {prefix:2-4}{random:6-8} -> exactly 10 chars total
 *   - Internal admin test code: ADMIN99TEST (11 chars, legacy exception)
 */
describe('voucher code length contract (10 chars)', () => {
  test('every artist shortKey is exactly 3 alphabetic characters and unique', () => {
    const shortKeys = VOUCHER_ARTIST_TIERS.map((a) => a.shortKey);
    for (const key of shortKeys) {
      expect(key).toMatch(/^[A-Z]{3}$/);
    }
    expect(new Set(shortKeys).size).toBe(shortKeys.length);
  });

  test('artist code format is exactly 10 characters for every tier', () => {
    for (const artist of VOUCHER_ARTIST_TIERS) {
      const disc = String(artist.discountPercent);
      const randomLen = artist.discountPercent >= 100 ? 2 : 3;
      const expectedLength = artist.shortKey.length + disc.length + 2 + randomLen;
      expect(expectedLength).toBe(10);

      const sample = `${artist.shortKey}${disc}01${'0'.repeat(randomLen)}`;
      expect(sample.length).toBe(10);
      const parsed = getVoucherArtistFromCode(sample);
      expect(parsed?.artist.shortKey).toBe(artist.shortKey);
    }
  });

  test('internal ADMIN99TEST code is recognized (legacy exception)', () => {
    expect(isInternalVoucherCode('ADMIN99TEST')).toBe(true);
    expect(isLegacyVoucherCode('ADMIN99TEST')).toBe(false);
    expect('ADMIN99TEST'.length).toBe(11);
  });

  test('rejects old-format codes as legacy (pre 2026-04 format)', () => {
    expect(isLegacyVoucherCode('LOUISARMSTRONG100010123')).toBe(true);
    expect(isLegacyVoucherCode('JAZZ-ABCD1234')).toBe(true);
  });
});
