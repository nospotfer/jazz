import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
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
let administrator: PrismaClient;
function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}
let initialReadGate: { entered: ReturnType<typeof gate>; resume: ReturnType<typeof gate> } | null = null;
let purchaseWriteGate: { entered: ReturnType<typeof gate>; resume: ReturnType<typeof gate> } | null = null;

async function boundedGate(wait: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([wait, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Isolated voucher scheduling gate timed out')), 3_000);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
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
    administrator = new PrismaClient({ datasources: { db: { url: target! } }, log: [] });
    // Only schedule this fixture's actual SQL. No result or query is mocked.
    db.$use(async (params, next) => {
      const ownLookup = params.model === 'Purchase' && params.action === 'findUnique' &&
        params.args?.where?.userId_courseId?.userId === actor.id;
      if (ownLookup && initialReadGate) {
        const pending = initialReadGate;
        const result = await next(params);
        pending.entered.release();
        await pending.resume.wait;
        if (initialReadGate === pending) initialReadGate = null;
        return result;
      }
      const ownCreate = params.model === 'Purchase' && params.action === 'create' &&
        params.args?.data?.userId === actor.id && params.args?.data?.courseId === paidCourse;
      if (ownCreate && purchaseWriteGate) {
        const pending = purchaseWriteGate;
        pending.entered.release();
        await pending.resume.wait;
        if (purchaseWriteGate === pending) purchaseWriteGate = null;
      }
      return next(params);
    });
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
    await db.course.update({ where: { id: paidCourse }, data: { price: 80, isPublished: true } });
    await db.course.update({ where: { id: zeroCourse }, data: { price: 0, isPublished: true } });
    expect(await snapshot()).toEqual({ purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 });
  });
  afterAll(async () => {
    if (db) {
      await cleanOwnLearningFreeFixtures(true);
      await db.$disconnect();
      delete globalThis.prisma;
    }
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
    await administrator?.$disconnect();
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

  for (const [label, edit, status, reason] of [
    ['unpublished', { isPublished: false }, 400, 'Course not found'],
    ['unavailable price', { price: null }, 503, 'Price unavailable'],
    ['changed known price', { price: 90 }, 409, 'Quote changed'],
  ] as const) test(`administrator ${label} after validation cannot persist a stale grant`, async ({ task }) => {
    const held = { entered: gate(), resume: gate() };
    initialReadGate = held;
    const pending = POST(request(paidCourse));
    try {
      await boundedGate(held.entered.wait);
      await administrator.course.update({ where: { id: paidCourse }, data: edit });
    } finally { held.resume.release(); }
    const response = await pending;
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { voucherCourseRaceSnapshot: observed });
    expect(observed).toEqual({ status, persisted: { purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 } });
    const body = await response.json();
    expect(body.reason ?? body.error).toBe(reason);
    if (reason === 'Quote changed') {
      // A fresh request sees the new exact price and remains a legitimate grant.
      const retried = await POST(request(paidCourse));
      expect(retried.status).toBe(200);
      const purchase = await db.purchase.findUniqueOrThrow({ where: { userId_courseId: { userId: actor.id, courseId: paidCourse } }, include: { discount: true } });
      expect(purchase).toMatchObject({ originalPrice: 90, discountAmount: 90, finalPrice: 0 });
      expect(purchase.discount).toMatchObject({ originalPrice: 90, discountAmount: 90, finalPrice: 0 });
      expect(await snapshot()).toEqual({ purchases: 1, discounts: 1, redemptions: 1, voucherUses: 1 });
    }
    expect(auth.fetch).not.toHaveBeenCalled();
  });

  test('zero-to-paid edit after validation cannot persist zero accounting', async ({ task }) => {
    const held = { entered: gate(), resume: gate() };
    initialReadGate = held;
    const pending = POST(request(zeroCourse));
    try {
      await boundedGate(held.entered.wait);
      await administrator.course.update({ where: { id: zeroCourse }, data: { price: 80 } });
    } finally { held.resume.release(); }
    const response = await pending;
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { voucherCourseRaceSnapshot: observed });
    expect(observed).toEqual({ status: 409, persisted: { purchases: 0, discounts: 0, redemptions: 0, voucherUses: 0 } });
    expect((await response.json()).reason).toBe('Quote changed');
  });

  test('course remains locked through the actual purchase transaction; edit works after commit', async ({ task }) => {
    const held = { entered: gate(), resume: gate() };
    purchaseWriteGate = held;
    const pending = POST(request(paidCourse));
    let blocked = false;
    try {
      await boundedGate(held.entered.wait);
      try {
        await administrator.$transaction(async (tx) => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '250ms'`;
          await tx.$executeRaw`UPDATE "Course" SET "isPublished" = FALSE WHERE id = ${paidCourse}`;
        });
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
        const meta = error && typeof error === 'object' && 'meta' in error ? error.meta : undefined;
        const databaseCode = meta && typeof meta === 'object' && 'code' in meta ? meta.code : undefined;
        blocked = code === 'P2010' && databaseCode === '55P03';
      }
    } finally { held.resume.release(); }
    const response = await pending;
    const observed = { status: response.status, administratorEditBlocked: blocked, coursePublished: (await db.course.findUniqueOrThrow({ where: { id: paidCourse } })).isPublished, persisted: await snapshot() };
    Object.assign(task.meta, { voucherCourseRaceSnapshot: observed });
    expect(observed).toEqual({ status: 200, administratorEditBlocked: true, coursePublished: true, persisted: { purchases: 1, discounts: 1, redemptions: 1, voucherUses: 1 } });
    const edited = await administrator.course.update({ where: { id: paidCourse }, data: { isPublished: false } });
    expect(edited.isPublished).toBe(false);
    expect(auth.fetch).not.toHaveBeenCalled();
  });
});
