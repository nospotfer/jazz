import { beforeEach, expect, test, vi } from 'vitest';
import { getEnrollmentsTimeseries, getOverview, getRevenueTimeseries, resolveRange } from '@/lib/admin/metrics-db';

const mocks = vi.hoisted(() => ({ purchases: vi.fn(), aggregate: vi.fn(), count: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: (callback: () => unknown) => callback }));
vi.mock('@/lib/db', () => ({ db: {
  purchase: { findMany: mocks.purchases, aggregate: mocks.aggregate, count: mocks.count },
  user: { count: mocks.count }, voucherRedemption: { count: mocks.count },
  lessonQuizSummary: { count: mocks.count }, userProgress: { count: mocks.count },
} }));

const range = resolveRange('7d', new Date('2026-10-14T12:00:00Z'));
function row(currency: string | null, minor: string | null, legacy = 29.90) {
  return { createdAt: new Date('2026-10-13T12:00:00Z'), paymentCurrency: currency,
    paymentAmountMinor: minor, finalPrice: legacy };
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.count.mockResolvedValue(0);
  // The old aggregate really combines currencies and legacy unknowns. It must no longer be used.
  mocks.aggregate.mockResolvedValue({ _sum: { finalPrice: 3123.71 } });
  mocks.purchases.mockImplementation(async ({ where }) =>
    where.createdAt.gte.getTime() === range.from.getTime()
      ? [row('EUR', '1234'), row('EUR', '766'), row('JPY', '2990'), row('KWD', '1234'), row(null, null, 80)]
      : [row('EUR', '1000'), row('JPY', '1495')]);
});

test('overview separates exact currency totals and never labels old floats with a new currency', async () => {
  const overview = await getOverview(range);
  expect(overview.revenue).toEqual({ byCurrency: [
    { currency: 'EUR', amountMinor: '2000', value: 20, delta: 1 },
    { currency: 'JPY', amountMinor: '2990', value: 2990, delta: 1 },
    { currency: 'KWD', amountMinor: '1234', value: 1.234, delta: null },
  ], unavailableCount: 1 });
  expect(mocks.aggregate).not.toHaveBeenCalled();
});

test('average ticket uses paid records within each currency and rounds only at its own minor unit', async () => {
  const overview = await getOverview(range);
  expect(overview.averageTicket).toEqual({ byCurrency: [
    { currency: 'EUR', amountMinor: '1000', value: 10, delta: 0 },
    { currency: 'JPY', amountMinor: '2990', value: 2990, delta: 1 },
    { currency: 'KWD', amountMinor: '1234', value: 1.234, delta: null },
  ], unavailableCount: 1 });
});

test('real zero is kept and unknown, unsupported, negative and malformed facts are counted separately', async () => {
  mocks.purchases.mockResolvedValue([row('EUR', '0'), row(null, '0', 0), row('ZZZ', '100'),
    row('EUR', '-1'), row('EUR', '1.5'), row('EUR', null), row(null, null, 80)]);
  const overview = await getOverview(range);
  expect(overview.revenue).toEqual({ byCurrency: [
    { currency: 'EUR', amountMinor: '0', value: 0, delta: null },
  ], unavailableCount: 6 });
  expect(overview.averageTicket).toEqual({ byCurrency: [], unavailableCount: 6 });
});

test('huge exact sums survive JSON serialization without a rounded numerical projection', async () => {
  mocks.purchases.mockResolvedValue([row('JPY', '9007199254740992'), row('JPY', '1')]);
  const overview = await getOverview(range);
  expect(overview.revenue.byCurrency).toEqual([
    { currency: 'JPY', amountMinor: '9007199254740993', value: null, delta: null, comparisonUnavailable: true },
  ]);
  expect(JSON.parse(JSON.stringify(overview)).revenue.byCurrency[0].amountMinor).toBe('9007199254740993');
});

test('empty records produce no invented zero-currency totals or unknown records', async () => {
  mocks.purchases.mockResolvedValue([]);
  const overview = await getOverview(range);
  expect(overview.revenue).toEqual({ byCurrency: [], unavailableCount: 0 });
  expect(overview.averageTicket).toEqual({ byCurrency: [], unavailableCount: 0 });
  expect(overview.enrollments).toEqual({ value: 0, delta: null });
});

test('timeseries keeps separate exact buckets for JPY, EUR and KWD', async () => {
  const revenue = await getRevenueTimeseries(range);
  expect(revenue.unavailableCount).toBe(1);
  expect(revenue.series.map((series) => series.currency)).toEqual(['EUR', 'JPY', 'KWD']);
  expect(revenue.series.map((series) => series.points.find((point) => point.bucket === '2026-10-13'))).toEqual([
    { bucket: '2026-10-13', amountMinor: '2000', value: 20 },
    { bucket: '2026-10-13', amountMinor: '2990', value: 2990 },
    { bucket: '2026-10-13', amountMinor: '1234', value: 1.234 },
  ]);
  expect(revenue.series.every((series) => series.points.length === 7)).toBe(true);
});

test('enrollment counts use exact positive and zero facts before conflicting legacy floats', async () => {
  mocks.purchases.mockResolvedValue([
    { ...row('JPY', '100', 0), voucherId: null },
    { ...row('EUR', '0', 10), voucherId: 'synthetic-free' },
    { ...row(null, null, 12), voucherId: null },
    { ...row(null, '-1', 12), voucherId: null },
  ]);
  const buckets = await getEnrollmentsTimeseries(range);
  expect(buckets.find((bucket) => bucket.bucket === '2026-10-13')).toEqual({
    bucket: '2026-10-13', paid: 2, voucher: 1, total: 3,
  });
});
