import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getUser: vi.fn(), fetch: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: auth.getUser } }) }));

// This opt-in never falls back to ambient DATABASE_URL or any cloud project.
const target = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-voucher-authority-${randomUUID()}`;
const actor = { id: `${prefix}-actor`, email: `${prefix}-actor@example.test` };
const other = { id: `${prefix}-other`, email: `${prefix}-other@example.test` };
const nullCourse = `${prefix}-null`, draftCourse = `${prefix}-draft`;
const paidCourse = `${prefix}-paid`, zeroCourse = `${prefix}-zero`;
const courseIds = [nullCourse, draftCourse, paidCourse, zeroCourse];
const actorIds = [actor.id, other.id];
const voucherId = `${prefix}-voucher`, voucherCode = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
let db: typeof import('@/lib/db')['db'];
let POST: typeof import('@/app/api/vouchers/redeem/route')['POST'];
const purchaseScope = { courseId: { in: courseIds }, userId: { in: actorIds } };
const redemptionScope = { voucherId, userId: { in: actorIds } };

function request(courseId: string, expectedUserId = actor.id) {
  return new Request(`https://voucher-isolated.example.test/api/vouchers/redeem?${new URLSearchParams({ expectedUserId })}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId, voucherCode }),
  });
}

async function snapshot() {
  return {
    purchases: await db.purchase.count({ where: purchaseScope }),
    discounts: await db.discountApplied.count({ where: { purchase: purchaseScope } }),
    redemptions: await db.voucherRedemption.count({ where: redemptionScope }),
    voucherUses: (await db.voucherCode.findUniqueOrThrow({ where: { id: voucherId } })).currentUses,
  };
}

async function cleanOwnLearningFreeFixtures(removeParents = false) {
  await db.$transaction(async (tx) => {
    await tx.voucherRedemption.deleteMany({ where: redemptionScope });
    await tx.purchase.deleteMany({ where: purchaseScope }); // DiscountApplied cascades only from these purchases.
    if (removeParents) {
      await tx.voucherCode.deleteMany({ where: { id: voucherId } });
      await tx.course.deleteMany({ where: { id: { in: courseIds } } });
      await tx.user.deleteMany({ where: { id: { in: actorIds } } });
    } else {
      await tx.voucherCode.update({ where: { id: voucherId }, data: { currentUses: 0, maxUses: 5, maxUsesPerUser: 1 } });
    }
  });
}

describe.skipIf(!target)('real voucher validation and redemption on disposable PostgreSQL', () => {
  beforeAll(async () => {
    const url = new URL(target!);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/jazz_maintenance' || url.username !== 'postgres' || url.password || url.search || url.hash) {
      throw new Error('Voucher checks require disposable 127.0.0.1:55432/jazz_maintenance');
    }
    vi.stubEnv('DATABASE_URL', target!);
    auth.fetch.mockImplementation(() => { throw new Error('External network is prohibited in isolated voucher checks'); });
    vi.stubGlobal('fetch', auth.fetch);
    db = (await import('@/lib/db')).db;
    POST = (await import('@/app/api/vouchers/redeem/route')).POST;
    await db.$transaction(async (tx) => {
      await tx.user.createMany({ data: [{ ...actor, role: 'USER' }, { ...other, role: 'USER' }] });
      await tx.course.createMany({ data: [
        { id: nullCourse, title: 'Isolated unavailable-price course', price: null, isPublished: true },
        { id: draftCourse, title: 'Isolated draft course', price: 0, isPublished: false },
        { id: paidCourse, title: 'Isolated published course', price: 80, isPublished: true },
        { id: zeroCourse, title: 'Isolated published zero-price course', price: 0, isPublished: true },
      ] });
      await tx.voucherCode.create({ data: { id: voucherId, code: voucherCode, type: 'FREE_ACCESS', isActive: true, currentUses: 0, maxUses: 5, maxUsesPerUser: 1 } });
    });
  });
  beforeEach(async () => {
    vi.clearAllMocks();
    auth.getUser.mockResolvedValue({ data: { user: actor }, error: null });
    await cleanOwnLearningFreeFixtures();
    expect(await snapshot()).toEqual({ purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 });
  });
  afterAll(async () => {
    if (db) {
      await cleanOwnLearningFreeFixtures(true);
      await db.$disconnect();
      delete globalThis.prisma;
    }
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  test('NULL catalog price does not persist purchase, discount, redemption or usage', async ({ task }) => {
    const response = await POST(request(nullCourse));
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { voucherAuthoritySnapshot: observed });
    expect(observed).toEqual({ status: 503, persisted: { purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 } });
    expect(await response.json()).toMatchObject({ success: false, error: 'Price unavailable' });
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('draft zero-price course does not persist a full-voucher grant', async ({ task }) => {
    const response = await POST(request(draftCourse));
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { voucherAuthoritySnapshot: observed });
    expect(observed).toEqual({ status: 400, persisted: { purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 } });
    expect(await response.json()).toMatchObject({ error: 'Course not found' });
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('stale browser intent cannot persist a voucher grant for either actor', async ({ task }) => {
    const response = await POST(request(paidCourse, other.id));
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { voucherAuthoritySnapshot: observed });
    expect(observed).toEqual({ status: 409, persisted: { purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 } });
    expect(await response.json()).toEqual({ error: 'Session changed' });
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('matching published full-voucher grant persists one exact monetary/accounting snapshot', async () => {
    const response = await POST(request(paidCourse));
    expect(response.status).toBe(200);
    expect(await snapshot()).toEqual({ purchases: 1, discounts: 1, redemptions: 1, voucherUses: 1 });
    const purchase = await db.purchase.findUniqueOrThrow({ where: { userId_courseId: { userId: actor.id, courseId: paidCourse } }, include: { discount: true, redemption: true } });
    expect(purchase).toMatchObject({ userId: actor.id, courseId: paidCourse, voucherId, originalPrice: 80, discountAmount: 80, finalPrice: 0, providerReferenceId: null });
    expect(purchase.discount).toMatchObject({ purchaseId: purchase.id, voucherId, originalPrice: 80, discountAmount: 80, finalPrice: 0 });
    expect(purchase.redemption).toMatchObject({ userId: actor.id, voucherId, purchaseId: purchase.id });
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('two actors racing for a global single-use voucher persist exactly one complete grant', async () => {
    await db.voucherCode.update({ where: { id: voucherId }, data: { maxUses: 1 } });
    auth.getUser.mockResolvedValueOnce({ data: { user: actor }, error: null }).mockResolvedValueOnce({ data: { user: other }, error: null });
    const responses = await Promise.all([POST(request(paidCourse, actor.id)), POST(request(paidCourse, other.id))]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    const denied = responses.find((response) => response.status !== 200)!;
    expect([400, 409]).toContain(denied.status);
    const body = await denied.json();
    expect(body.reason ?? body.error).toBe('Max uses reached');
    expect(await snapshot()).toEqual({ purchases: 1, discounts: 1, redemptions: 1, voucherUses: 1 });
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('same actor racing across paid and real-zero courses cannot exceed per-user usage', async () => {
    const responses = await Promise.all([POST(request(paidCourse)), POST(request(zeroCourse))]);
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    const denied = responses.find((response) => response.status !== 200)!;
    expect([400, 409]).toContain(denied.status);
    const body = await denied.json();
    expect(body.reason ?? body.error).toBe('Max uses per user reached');
    expect(await snapshot()).toEqual({ purchases: 1, discounts: 1, redemptions: 1, voucherUses: 1 });
    expect(auth.fetch).not.toHaveBeenCalled();
  });
});
