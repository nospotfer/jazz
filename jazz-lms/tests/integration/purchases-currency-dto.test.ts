import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { GET } from '@/app/api/purchases/route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), purchases: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { purchase: { findMany: mocks.purchases } } }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
beforeEach(() => {
  vi.resetAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: 'synthetic-currency-owner' } } });
  mocks.fetch.mockImplementation(() => { throw new Error('External traffic prohibited in closed currency DTO fixture'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

test.each([
  ['EUR', '2990', 80, 29.9, 'EUR', '2990'],
  ['JPY', '2990', 80, 2990, 'JPY', '2990'],
  ['KWD', '1234', 80, 1.234, 'KWD', '1234'],
  ['IQD', '1234', 80, 1.234, 'IQD', '1234'],
  ['MGA', '1234', 80, 12.34, 'MGA', '1234'],
  ['JPY', '9007199254740993', 80, null, 'JPY', '9007199254740993'],
  [null, null, 80, 80, null, null],
  ['EUR', null, 80, 80, null, null],
  [null, '1234', 80, 80, null, '1234'],
  ['ZZZ', '1234', null, null, null, '1234'],
  [null, '0', 80, 0, null, '0'],
  ['KWD', '0', 80, 0, 'KWD', '0'],
  ['EUR', '-1', 80, 80, null, null],
  [null, null, null, null, null, null],
] as const)('GET emits exact or honest legacy facts for %s/%s/legacy%j', async (storedCurrency, storedMinor, legacy, amount, currency, amountMinor) => {
  mocks.purchases.mockResolvedValue([{ id: 'synthetic-currency-purchase', course: { title: 'Synthetic currency course' },
    finalPrice: legacy, paymentCurrency: storedCurrency, paymentAmountMinor: storedMinor,
    createdAt: new Date('2026-10-13T12:00:00Z') }]);
  const response = await GET(new Request('http://localhost/api/purchases?expectedUserId=synthetic-currency-owner'));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([{ id: 'synthetic-currency-purchase', itemType: 'Curso', itemTitle: 'Synthetic currency course',
    amount, amountMinor, currency, createdAt: '2026-10-13T12:00:00.000Z' }]);
  expect(mocks.purchases).toHaveBeenCalledExactlyOnceWith({ where: { userId: 'synthetic-currency-owner' },
    include: { course: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
});

test('GET currency data still rejects unverified identity before querying purchases', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  const response = await GET(new Request('http://localhost/api/purchases'));
  expect(response.status).toBe(401); expect(mocks.purchases).not.toHaveBeenCalled();
});

test.each(['synthetic-other-owner', ''])('GET currency data rejects stale or blank owner hint %j before querying', async (hint) => {
  const response = await GET(new Request(`http://localhost/api/purchases?expectedUserId=${hint}`));
  expect(response.status).toBe(409); expect(mocks.purchases).not.toHaveBeenCalled();
});
