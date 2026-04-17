import { describe, expect, test } from 'vitest';
import { bucketize, computeDelta, isRangeKey, resolveRange } from '@/lib/admin/metrics-db';

describe('metrics-db helpers', () => {
  test('isRangeKey accepts canonical keys and rejects others', () => {
    expect(isRangeKey('7d')).toBe(true);
    expect(isRangeKey('30d')).toBe(true);
    expect(isRangeKey('90d')).toBe(true);
    expect(isRangeKey('12m')).toBe(true);
    expect(isRangeKey('24h')).toBe(false);
    expect(isRangeKey(null)).toBe(false);
    expect(isRangeKey(undefined)).toBe(false);
    expect(isRangeKey(42)).toBe(false);
  });

  test('resolveRange 30d returns a 30-day window and matching previous', () => {
    const now = new Date('2026-04-17T12:00:00Z');
    const range = resolveRange('30d', now);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    expect(range.key).toBe('30d');
    expect(range.granularity).toBe('day');

    const days = (range.to.getTime() - range.from.getTime()) / MS_PER_DAY;
    expect(days).toBe(30);
    expect(range.previousTo.getTime()).toBe(range.from.getTime());

    const prevDays = (range.previousTo.getTime() - range.previousFrom.getTime()) / MS_PER_DAY;
    expect(prevDays).toBe(30);
  });

  test('resolveRange 7d / 90d / 12m pick the expected granularities', () => {
    const now = new Date('2026-04-17T12:00:00Z');
    expect(resolveRange('7d', now).granularity).toBe('day');
    expect(resolveRange('90d', now).granularity).toBe('week');
    expect(resolveRange('12m', now).granularity).toBe('month');
  });

  test('computeDelta returns null for zero previous and a ratio otherwise', () => {
    expect(computeDelta(10, 0)).toBeNull();
    expect(computeDelta(10, 5)).toBe(1);
    expect(computeDelta(8, 10)).toBeCloseTo(-0.2);
    expect(computeDelta(Number.NaN, 1)).toBeNull();
  });

  test('bucketize seeds empty buckets for every day and sums values', () => {
    const now = new Date('2026-04-17T12:00:00Z');
    const range = resolveRange('7d', now);

    const items = [
      { date: new Date('2026-04-15T03:00:00Z'), value: 10 },
      { date: new Date('2026-04-15T20:00:00Z'), value: 5 },
      { date: new Date('2026-04-16T10:00:00Z'), value: 7 },
    ];

    const result = bucketize(
      items,
      (i) => i.date,
      (i) => i.value,
      range
    );

    // 7 dias com valor 0 semeados + acrescimo onde houve evento.
    expect(result).toHaveLength(7);
    expect(result.every((b) => /^\d{4}-\d{2}-\d{2}$/.test(b.bucket))).toBe(true);
    const byBucket = new Map(result.map((b) => [b.bucket, b.value]));
    expect(byBucket.get('2026-04-15')).toBe(15);
    expect(byBucket.get('2026-04-16')).toBe(7);
  });
});
