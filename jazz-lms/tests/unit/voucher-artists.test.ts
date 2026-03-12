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
    expect(artistByDiscount?.key).toBe('LOUISARMSTRONG');
  });

  test('normalizes artist names to key format', () => {
    expect(normalizeVoucherArtistKey('Peggy Lee')).toBe('PEGGYLEE');
    expect(normalizeVoucherArtistKey('Élla-Fitzgerald')).toBe('ELLAFITZGERALD');
  });

  test('parses new voucher format and flags legacy codes', () => {
    const parsed = getVoucherArtistFromCode('LOUISARMSTRONG100010123');

    expect(parsed?.artist.key).toBe('LOUISARMSTRONG');
    expect(parsed?.sequence).toBe(1);
    expect(parsed?.randomSuffix).toBe('0123');

    expect(isLegacyVoucherCode('CDJLMS10001')).toBe(true);
    expect(isLegacyVoucherCode('LOUISARMSTRONG100010123')).toBe(false);
  });
});
