import { describe, expect, test } from 'vitest';
import {
  getVoucherArtistFromCode,
  isInternalVoucherCode,
  isLegacyVoucherCode,
  VOUCHER_ARTIST_TIERS,
} from '@/lib/voucher-artists';

/**
 * Contract tests for the new compact voucher code format (10-12 chars).
 *
 * Format rules:
 *   - Artist codes:  {shortKey:3}{discount:2-3}{sequence:2}{random:3}
 *                    \u2192 10 chars (discount 10..90) | 11 chars (discount 100)
 *   - Generic codes: {prefix:2-4}{random:8-10} \u2192 exactly 12 chars total
 *   - Internal admin test code: ADMIN99TEST (11 chars)
 */
describe('voucher code length contract (10-12 chars)', () => {
  test('every artist shortKey is exactly 3 alphabetic characters and unique', () => {
    const shortKeys = VOUCHER_ARTIST_TIERS.map((a) => a.shortKey);
    for (const key of shortKeys) {
      expect(key).toMatch(/^[A-Z]{3}$/);
    }
    expect(new Set(shortKeys).size).toBe(shortKeys.length);
  });

  test('artist code format matches 10-12 character range for every tier', () => {
    for (const artist of VOUCHER_ARTIST_TIERS) {
      const disc = String(artist.discountPercent);
      // Sequence padded to 2 digits, random 3 digits \u2192 lengths:
      //   10 chars for 2-digit discounts, 11 chars for 3-digit discount.
      const expectedLength = artist.shortKey.length + disc.length + 2 + 3;
      expect(expectedLength).toBeGreaterThanOrEqual(10);
      expect(expectedLength).toBeLessThanOrEqual(12);

      const sample = `${artist.shortKey}${disc}01000`;
      expect(sample.length).toBe(expectedLength);
      const parsed = getVoucherArtistFromCode(sample);
      expect(parsed?.artist.shortKey).toBe(artist.shortKey);
    }
  });

  test('internal ADMIN99TEST code is recognized and exempt from legacy', () => {
    expect(isInternalVoucherCode('ADMIN99TEST')).toBe(true);
    expect(isLegacyVoucherCode('ADMIN99TEST')).toBe(false);
    expect('ADMIN99TEST'.length).toBe(11);
    expect('ADMIN99TEST'.length).toBeGreaterThanOrEqual(10);
    expect('ADMIN99TEST'.length).toBeLessThanOrEqual(12);
  });

  test('rejects old-format codes as legacy (pre 2026-04 format)', () => {
    expect(isLegacyVoucherCode('LOUISARMSTRONG100010123')).toBe(true);
    expect(isLegacyVoucherCode('JAZZ-ABCD1234')).toBe(true);
  });
});
