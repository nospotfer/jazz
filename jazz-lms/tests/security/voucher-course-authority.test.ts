import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), course: vi.fn(), voucher: vi.fn(), redemptionCount: vi.fn(),
  purchaseLookup: vi.fn(), transaction: vi.fn(), lock: vi.fn(), latestVoucher: vi.fn(),
  latestRedemptionCount: vi.fn(), purchaseCreate: vi.fn(), discountCreate: vi.fn(),
  redemptionCreate: vi.fn(), voucherUpdate: vi.fn(), voucherUpdateMany: vi.fn(),
  rateLimit: vi.fn(), fetch: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: {
  course: { findUnique: mocks.course }, voucherCode: { findFirst: mocks.voucher },
  voucherRedemption: { count: mocks.redemptionCount }, purchase: { findUnique: mocks.purchaseLookup },
  $transaction: mocks.transaction,
} }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.rateLimit, createRateLimitHeaders: () => ({}) }));

// These imports intentionally retain the real validator and real route handlers.
import { validateVoucherForCourse } from '@/lib/vouchers';
import { POST as redeem } from '@/app/api/vouchers/redeem/route';
import { POST as validate } from '@/app/api/vouchers/validate/route';

const actor = { id: 'verified-voucher-actor' };
const courseId = 'published-voucher-course';
const voucherCode = 'JAZZFREE';
const voucher = {
  id: 'synthetic-free-voucher', code: voucherCode, type: 'FREE_ACCESS',
  discountPercent: 100, discountAmount: null, minOrderValue: null,
  maxUses: 5, currentUses: 0, maxUsesPerUser: 1,
  isActive: true, expiresAt: null, courseId, metadata: null,
};
let course: { id: string; price: unknown; isPublished?: unknown } | null;

const tx = {
  $executeRaw: mocks.lock,
  voucherCode: { findUnique: mocks.latestVoucher, update: mocks.voucherUpdate, updateMany: mocks.voucherUpdateMany },
  voucherRedemption: { count: mocks.latestRedemptionCount, create: mocks.redemptionCreate },
  purchase: { create: mocks.purchaseCreate }, discountApplied: { create: mocks.discountCreate },
};

function request(kind: 'redeem' | 'validate', query = '', body?: string) {
  return new Request(`https://voucher-isolated.example.test/api/vouchers/${kind}${query}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: body ?? JSON.stringify(kind === 'redeem' ? { courseId, voucherCode } : { courseId, code: voucherCode }),
  });
}

function expectNoVoucherWorkOrGrant() {
  expect(mocks.voucher).not.toHaveBeenCalled();
  expect(mocks.redemptionCount).not.toHaveBeenCalled();
  expect(mocks.purchaseLookup).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.purchaseCreate).not.toHaveBeenCalled();
  expect(mocks.discountCreate).not.toHaveBeenCalled();
  expect(mocks.redemptionCreate).not.toHaveBeenCalled();
  expect(mocks.voucherUpdateMany).not.toHaveBeenCalled();
  expect(mocks.fetch).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  course = { id: courseId, price: 80, isPublished: true };
  mocks.course.mockImplementation(async ({ where, select }: { where: { id: string }; select: Record<string, boolean> }) => {
    if (!course || where.id !== course.id) return null;
    return Object.fromEntries(Object.keys(select).map((field) => [field, course![field as keyof NonNullable<typeof course>]]));
  });
  mocks.getUser.mockResolvedValue({ data: { user: actor }, error: null });
  mocks.voucher.mockResolvedValue(voucher);
  mocks.redemptionCount.mockResolvedValue(0);
  mocks.purchaseLookup.mockResolvedValue(null);
  mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  mocks.latestVoucher.mockResolvedValue(voucher);
  mocks.latestRedemptionCount.mockResolvedValue(0);
  mocks.purchaseCreate.mockResolvedValue({ id: 'synthetic-voucher-purchase' });
  mocks.voucherUpdateMany.mockResolvedValue({ count: 1 });
  mocks.rateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0, remaining: 10, limit: 30 });
  mocks.fetch.mockImplementation(() => { throw new Error('External network is forbidden in voucher authority checks'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe('real voucher validator requires a published course with a known catalog price', () => {
  test.each([
    ['NULL', null], ['missing', undefined], ['negative', -1], ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY], ['negative Infinity', Number.NEGATIVE_INFINITY],
    ['numeric string', '80'], ['boolean', false],
  ])('%s price never becomes a free/full voucher quote', async (_label, price) => {
    course = { ...course!, price };
    expect(await validateVoucherForCourse({ code: voucherCode, courseId, userId: actor.id }))
      .toMatchObject({ valid: false, error: 'Price unavailable' });
    expectNoVoucherWorkOrGrant();
  });

  test.each(['validate', 'redeem'] as const)('%s returns503 for unavailable price before voucher/purchase work', async (kind) => {
    course = { ...course!, price: null };
    const response = await (kind === 'validate' ? validate : redeem)(request(kind));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ [kind === 'validate' ? 'valid' : 'success']: false, error: 'Price unavailable' });
    expectNoVoucherWorkOrGrant();
  });

  test.each([
    ['draft', false], ['missing publication', undefined], ['NULL publication', null],
  ])('%s rejects validation and redemption before voucher discovery', async (_label, isPublished) => {
    course = { ...course!, isPublished };
    for (const kind of ['validate', 'redeem'] as const) {
      const response = await (kind === 'validate' ? validate : redeem)(request(kind));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: 'Course not found' });
    }
    expectNoVoucherWorkOrGrant();
  });

  test('missing course retains400 and never begins voucher or grant work', async () => {
    course = null;
    const response = await redeem(request('redeem'));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: 'Course not found' });
    expectNoVoucherWorkOrGrant();
  });
});

describe('redeem compares optional owner intent after authentication and before body/database work', () => {
  test.each([
    '?expectedUserId=previous-owner', '?expectedUserId=', '?expectedUserId=%20%20',
    `?expectedUserId=${actor.id}&expectedUserId=${actor.id}`, `?expectedUserId=%20${actor.id}%20`,
  ])('stale/malformed owner%s cannot redeem for the cookie actor', async (query) => {
    const response = await redeem(request('redeem', query));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Session changed' });
    expect(mocks.course).not.toHaveBeenCalled();
    expectNoVoucherWorkOrGrant();
  });

  test('stale intent rejects before parsing an invalid body', async () => {
    const response = await redeem(request('redeem', '?expectedUserId=previous-owner', 'not JSON'));
    expect(response.status).toBe(409);
    expect(mocks.course).not.toHaveBeenCalled();
    expectNoVoucherWorkOrGrant();
  });

  test('owner hint cannot authenticate an absent server user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await redeem(request('redeem', `?expectedUserId=${actor.id}`, 'not JSON'));
    expect(response.status).toBe(401);
    expect(mocks.course).not.toHaveBeenCalled();
    expectNoVoucherWorkOrGrant();
  });

  test('anonymous validation stays available without interpreting an owner hint as authorization', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await validate(request('validate', '?expectedUserId=ignored-anonymous-hint'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ valid: true, originalPrice: 80, discount: 80, finalPrice: 0, isFree: true });
    expect(mocks.redemptionCount).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

describe('published numeric pricing and atomic voucher limits remain compatible', () => {
  test.each([0, 80])('matching actor can redeem real published price%s with exact accounting', async (price) => {
    course = { ...course!, price };
    const response = await redeem(request('redeem', `?expectedUserId=${actor.id}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, accessGranted: true, redirectUrl: '/dashboard' });
    expect(mocks.purchaseCreate).toHaveBeenCalledWith({ data: {
      userId: actor.id, courseId, voucherId: voucher.id, originalPrice: price, finalPrice: 0, discountAmount: price,
    } });
    expect(mocks.discountCreate).toHaveBeenCalledWith({ data: {
      purchaseId: 'synthetic-voucher-purchase', voucherId: voucher.id, originalPrice: price, discountAmount: price, finalPrice: 0,
    } });
    expect(mocks.redemptionCreate).toHaveBeenCalledOnce();
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.voucherUpdateMany).toHaveBeenCalledWith({ where: { id: voucher.id, currentUses: { lt: 5 } }, data: { currentUses: { increment: 1 } } });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test('legacy caller without an owner hint still redeems using verified cookie identity', async () => {
    expect((await redeem(request('redeem'))).status).toBe(200);
    expect(mocks.purchaseCreate.mock.calls[0][0].data.userId).toBe(actor.id);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test('percentage validation retains positive quote but cannot enter full-voucher redemption', async () => {
    mocks.voucher.mockResolvedValue({ ...voucher, type: 'DISCOUNT_PERCENT', discountPercent: 20 });
    const quote = await validate(request('validate'));
    expect(quote.status).toBe(200);
    expect(await quote.json()).toMatchObject({ valid: true, originalPrice: 80, discount: 16, finalPrice: 64, isFree: false });
    const redemption = await redeem(request('redeem'));
    expect(redemption.status).toBe(400);
    expect(await redemption.json()).toMatchObject({ error: 'Voucher type mismatch' });
    expect(mocks.purchaseCreate).not.toHaveBeenCalled();
  });

  test.each(['global', 'per-user'] as const)('locked %s usage limit still prevents a grant after initial validation', async (limit) => {
    if (limit === 'global') mocks.latestVoucher.mockResolvedValue({ ...voucher, currentUses: 5 });
    else mocks.latestRedemptionCount.mockResolvedValue(1);
    const response = await redeem(request('redeem'));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false, error: 'Redeem failed', reason: limit === 'global' ? 'Max uses reached' : 'Max uses per user reached' });
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.purchaseCreate).not.toHaveBeenCalled();
    expect(mocks.redemptionCreate).not.toHaveBeenCalled();
  });

  test('existing access remains409 without another transaction or voucher use', async () => {
    mocks.purchaseLookup.mockResolvedValue({ id: 'existing-entitlement' });
    const response = await redeem(request('redeem'));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: 'Already purchased' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  test('missing parameters and validation rate limiting keep their existing contracts', async () => {
    const missing = await validate(request('validate', '', '{}'));
    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({ error: 'Missing parameters' });
    expect(mocks.course).not.toHaveBeenCalled();
    mocks.rateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 60, limit: 30, remaining: 0 });
    const limited = await validate(request('validate'));
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({ error: 'Too many attempts' });
    expect(mocks.course).not.toHaveBeenCalled();
  });
});
