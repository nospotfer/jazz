import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), getUser: vi.fn(), transaction: vi.fn(),
  purchase: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  voucherRedemption: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
  voucherCode: { findUnique: vi.fn(), update: vi.fn() },
  discountApplied: { count: vi.fn(), deleteMany: vi.fn() },
  userProgress: { count: vi.fn(), deleteMany: vi.fn() },
  lessonPurchase: { count: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock('@/lib/admin-api', () => ({ ensureAdminApiPermission: mocks.admin }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/db', () => ({ db: {
  purchase: mocks.purchase, voucherRedemption: mocks.voucherRedemption, voucherCode: mocks.voucherCode,
  discountApplied: mocks.discountApplied, userProgress: mocks.userProgress, lessonPurchase: mocks.lessonPurchase,
  $transaction: mocks.transaction,
} }));

const models = {
  purchase: mocks.purchase, voucherRedemption: mocks.voucherRedemption, voucherCode: mocks.voucherCode,
  discountApplied: mocks.discountApplied, userProgress: mocks.userProgress, lessonPurchase: mocks.lessonPurchase,
};
const scopes = { userId: 'fixture-user', courseId: 'fixture-course', voucherCode: 'FIXTURE-VOUCHER' };
const routes = [
  ['admin reset', '/api/admin/vouchers/reset-user-state', () => import('@/app/api/admin/vouchers/reset-user-state/route')],
  ['admin revert', '/api/admin/vouchers/revert-test-use', () => import('@/app/api/admin/vouchers/revert-test-use/route')],
  ['self reset', '/api/dev/reset-test-purchases', () => import('@/app/api/dev/reset-test-purchases/route')],
] as const;
const request = (path: string, body: object = scopes, origin = 'http://localhost:3000') =>
  new Request(`${origin}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', host: 'localhost:3000', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('ENABLE_LOCAL_TEST_RESETS', '1');
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres@127.0.0.1:55432/jazz_maintenance');
  mocks.admin.mockResolvedValue({ ok: true, userId: 'fixture-admin' });
  mocks.getUser.mockResolvedValue({ data: { user: { id: scopes.userId } } });
  mocks.purchase.findMany.mockResolvedValue([{ id: 'fixture-purchase' }]);
  mocks.purchase.findFirst.mockResolvedValue({
    id: 'fixture-purchase', userId: scopes.userId, courseId: scopes.courseId, voucherId: 'fixture-voucher',
    voucher: { id: 'fixture-voucher', code: scopes.voucherCode, currentUses: 3 },
    redemption: { id: 'fixture-redemption', voucherId: 'fixture-voucher' },
  });
  mocks.voucherRedemption.findMany.mockResolvedValue([{ voucherId: 'fixture-voucher' }]);
  mocks.voucherCode.findUnique.mockResolvedValue({ currentUses: 3 });
  for (const model of [mocks.purchase, mocks.voucherRedemption, mocks.discountApplied, mocks.userProgress, mocks.lessonPurchase]) {
    model.count.mockResolvedValue(1);
    model.deleteMany.mockResolvedValue({ count: 1 });
  }
  mocks.transaction.mockImplementation(async (callback: (tx: typeof models) => Promise<unknown>) => callback(models));
});
afterEach(() => vi.unstubAllEnvs());

describe.each(routes)('%s fixture-only boundary', (_label, path, load) => {
  test.each(['production', 'remote database', 'remote request', 'disabled flag'])('rejects %s before auth or database access', async condition => {
    let origin = 'http://localhost:3000';
    if (condition === 'production') vi.stubEnv('NODE_ENV', 'production');
    if (condition === 'remote database') vi.stubEnv('DATABASE_URL', 'postgresql://fixture@production.example.test:5432/postgres');
    if (condition === 'remote request') origin = 'https://remote.example.test';
    if (condition === 'disabled flag') vi.stubEnv('ENABLE_LOCAL_TEST_RESETS', '0');
    const response = await (await load()).POST(request(path, { ...scopes, dryRun: false }, origin));
    expect(response.status).toBe(404);
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.purchase.findMany).not.toHaveBeenCalled();
    expect(mocks.purchase.findFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  test('defaults to a read-only plan even with a matching purchase', async () => {
    const response = await (await load()).POST(request(path));
    expect(response.status).toBe(200);
    expect((await response.json()).dryRun).toBe(true);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.purchase.deleteMany).not.toHaveBeenCalled();
    expect(mocks.voucherCode.update).not.toHaveBeenCalled();
  });

  test('missing course never falls back to all courses', async () => {
    const response = await (await load()).POST(request(path, { userId: scopes.userId, voucherCode: scopes.voucherCode, dryRun: false }));
    expect(response.status).toBe(400);
    expect(mocks.purchase.findMany).not.toHaveBeenCalled();
    expect(mocks.purchase.findFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

test('admin reset requires an explicit target user instead of falling back to the actor', async () => {
  const response = await (await routes[0][2]()).POST(request(routes[0][1], { courseId: scopes.courseId, dryRun: false }));
  expect(response.status).toBe(400);
  expect(mocks.purchase.findMany).not.toHaveBeenCalled();
});

test('admin revert requires explicit user and voucher targets', async () => {
  for (const body of [{ courseId: scopes.courseId }, { userId: scopes.userId, courseId: scopes.courseId }]) {
    const response = await (await routes[1][2]()).POST(request(routes[1][1], { ...body, dryRun: false }));
    expect(response.status).toBe(400);
  }
  expect(mocks.purchase.findFirst).not.toHaveBeenCalled();
});

test('explicit local admin reset scopes purchase and progress mutations to the selected user/course', async () => {
  const response = await (await routes[0][2]()).POST(request(routes[0][1], { ...scopes, dryRun: false }));
  expect(response.status).toBe(200);
  expect((await response.json()).dryRun).toBe(false);
  expect(mocks.purchase.findMany).toHaveBeenCalledWith({ where: {
    userId: scopes.userId, courseId: scopes.courseId,
  }, select: { id: true } });
  const where = { userId: scopes.userId, lesson: { chapter: { courseId: scopes.courseId } } };
  expect(mocks.userProgress.deleteMany).toHaveBeenCalledWith({ where });
  expect(mocks.lessonPurchase.deleteMany).toHaveBeenCalledWith({ where });
});

test('explicit local voucher reversal requires the matching voucher/user/course and updates only that purchase', async () => {
  const response = await (await routes[1][2]()).POST(request(routes[1][1], { ...scopes, dryRun: false }));
  expect(response.status).toBe(200);
  expect((await response.json()).dryRun).toBe(false);
  expect(mocks.purchase.findFirst.mock.calls[0][0].where).toEqual({
    userId: scopes.userId, courseId: scopes.courseId, voucher: { code: scopes.voucherCode },
  });
  expect(mocks.purchase.delete).toHaveBeenCalledWith({ where: { id: 'fixture-purchase' } });
  expect(mocks.voucherCode.update).toHaveBeenCalledWith({ where: { id: 'fixture-voucher' }, data: { currentUses: 2 } });
});

test('self reset cannot target a different authenticated user', async () => {
  const response = await (await routes[2][2]()).POST(request(routes[2][1], { ...scopes, userId: 'another-user', dryRun: false }));
  expect(response.status).toBe(403);
  expect(mocks.transaction).not.toHaveBeenCalled();
});

test('explicit local self reset retains unrelated course data and orphan redemptions in its filters', async () => {
  const response = await (await routes[2][2]()).POST(request(routes[2][1], { courseId: scopes.courseId, dryRun: false }));
  expect(response.status).toBe(200);
  expect((await response.json()).dryRun).toBe(false);
  expect(mocks.voucherRedemption.deleteMany).toHaveBeenCalledWith({ where: {
    userId: scopes.userId, purchase: { courseId: scopes.courseId },
  } });
  expect(mocks.purchase.deleteMany).toHaveBeenCalledWith({ where: { userId: scopes.userId, courseId: scopes.courseId } });
  expect(mocks.userProgress.deleteMany).toHaveBeenCalledWith({ where: {
    userId: scopes.userId, lesson: { chapter: { courseId: scopes.courseId } },
  } });
});
