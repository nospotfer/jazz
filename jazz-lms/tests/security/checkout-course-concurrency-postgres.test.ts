import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const session = vi.hoisted(() => ({ user: null as { id: string; email: string } | null }));
const forbidden = vi.hoisted(() => ({ provider: vi.fn(), fetch: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: session.user } }) } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/payments/provider', () => ({ getPaymentProvider: () => 'dodo', isActivePaymentProviderConfigured: () => true, createProviderCheckout: forbidden.provider, getProviderVoucherReferencePrefix: () => 'dodo-voucher' }));
vi.mock('@/lib/payments/providers/dodo', () => ({ isDodoWebhookConfigured: () => true }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));

// Real route, validator, purchase sync and SQL. No remote or ambient DB fallback.
const target = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-checkout-concurrency-${randomUUID()}`;
const actor = { id: `${prefix}-actor`, email: `${prefix}@example.test` };
const zeroId = `${prefix}-zero`, paidId = `${prefix}-paid`;
const courseIds = [zeroId, paidId];
const voucherId = `${prefix}-voucher`, voucherCode = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
let db: typeof import('@/lib/db')['db'];
let administrator: PrismaClient;
let POST: typeof import('@/app/api/checkout/route')['POST'];
function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  return { wait, release };
}
let scheduling: { courseId: string; readNumber: number; reads: number; entered: ReturnType<typeof gate>; resume: ReturnType<typeof gate> } | null = null;
async function bounded(wait: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { await Promise.race([wait, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Checkout fixture scheduling timed out')), 3_000); })]); }
  finally { if (timer) clearTimeout(timer); }
}
const purchaseScope = { userId: actor.id, courseId: { in: courseIds } };
async function snapshot() {
  return {
    purchases: await db.purchase.count({ where: purchaseScope }),
    discounts: await db.discountApplied.count({ where: { purchase: purchaseScope } }),
    redemptions: await db.voucherRedemption.count({ where: { voucherId, userId: actor.id } }),
    uses: (await db.voucherCode.findUniqueOrThrow({ where: { id: voucherId } })).currentUses,
  };
}
function request(courseId: string, voucher = false) {
  return new Request(`https://checkout-concurrency.example.test/api/checkout?${new URLSearchParams({ expectedUserId: actor.id })}`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://checkout-concurrency.example.test' },
    body: JSON.stringify({ courseId, source: 'dashboard', language: 'en', ...(voucher ? { voucherCode } : {}) }),
  });
}
async function cleanup(removeParents = false) {
  await db.$transaction(async tx => {
    await tx.voucherRedemption.deleteMany({ where: { voucherId, userId: actor.id } });
    await tx.purchase.deleteMany({ where: purchaseScope });
    if (removeParents) {
      await tx.voucherCode.deleteMany({ where: { id: voucherId } });
      await tx.course.deleteMany({ where: { id: { in: courseIds } } });
      await tx.user.deleteMany({ where: { id: actor.id } });
    } else await tx.voucherCode.update({ where: { id: voucherId }, data: { currentUses: 0 } });
  });
}

describe.skipIf(!target)('checkout grants and concurrent course edits on disposable PostgreSQL', () => {
  beforeAll(async () => {
    const url = new URL(target!);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/jazz_maintenance' || url.username !== 'postgres' || url.password || url.search || url.hash) throw new Error('Only disposable 127.0.0.1:55432/jazz_maintenance is allowed');
    vi.stubEnv('DATABASE_URL', target!); vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://checkout-concurrency.example.test');
    forbidden.fetch.mockImplementation(() => { throw new Error('Remote traffic is prohibited in checkout SQL checks'); }); vi.stubGlobal('fetch', forbidden.fetch);
    db = (await import('@/lib/db')).db;
    administrator = new PrismaClient({ datasources: { db: { url: target! } }, log: [] });
    db.$use(async (params, next) => {
      const pending = scheduling;
      const result = await next(params);
      if (pending && params.model === 'Course' && params.action === 'findUnique' && params.args?.where?.id === pending.courseId && ++pending.reads === pending.readNumber) {
        pending.entered.release();
        await bounded(pending.resume.wait);
        if (scheduling === pending) scheduling = null;
      }
      return result;
    });
    POST = (await import('@/app/api/checkout/route')).POST;
    await db.user.create({ data: { ...actor, role: 'USER' } });
    await db.course.createMany({ data: [{ id: zeroId, title: 'Disposable zero-price course', price: 0, isPublished: true }, { id: paidId, title: 'Disposable voucher course', price: 80, isPublished: true }] });
    await db.voucherCode.create({ data: { id: voucherId, code: voucherCode, type: 'FREE_ACCESS', courseId: paidId, isActive: true, maxUses: 5, currentUses: 0, maxUsesPerUser: 1 } });
  });
  beforeEach(async () => {
    vi.clearAllMocks(); session.user = actor; scheduling = null;
    await cleanup();
    await db.course.update({ where: { id: zeroId }, data: { price: 0, isPublished: true } });
    await db.course.update({ where: { id: paidId }, data: { price: 80, isPublished: true } });
  });
  afterAll(async () => {
    scheduling?.resume.release();
    if (db) { await cleanup(true); await db.$disconnect(); delete globalThis.prisma; }
    await administrator?.$disconnect(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  for (const [label, courseId, readNumber, change, voucher, status] of [
    ['zero course becomes paid', zeroId, 1, { price: 80 }, false, 409],
    ['voucher course becomes unpublished', paidId, 2, { isPublished: false }, true, 404],
    ['voucher price becomes unavailable', paidId, 2, { price: null }, true, 503],
    ['voucher catalog price changes', paidId, 2, { price: 90 }, true, 409],
  ] as const) test(`${label} cannot persist a stale checkout grant`, async ({ task }) => {
    const pending = { courseId, readNumber, reads: 0, entered: gate(), resume: gate() }; scheduling = pending;
    const responsePromise = POST(request(courseId, voucher));
    try { await bounded(pending.entered.wait); await administrator.course.update({ where: { id: courseId }, data: change }); }
    finally { pending.resume.release(); }
    const response = await responsePromise;
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { checkoutCourseConcurrencySnapshot: observed });
    expect(observed).toEqual({ status, persisted: { purchases: 0, discounts: 0, redemptions: 0, uses: 0 } });
    expect(forbidden.provider).not.toHaveBeenCalled(); expect(forbidden.fetch).not.toHaveBeenCalled();
  });
  for (const [courseId, voucher] of [[zeroId, false], [paidId, true]] as const) test(`unchanged course retains a real grant (voucher=${voucher})`, async ({ task }) => {
    const response = await POST(request(courseId, voucher));
    const observed = { status: response.status, persisted: await snapshot() };
    Object.assign(task.meta, { checkoutCourseConcurrencySnapshot: observed });
    expect(observed).toEqual({ status: 200, persisted: { purchases: 1, discounts: voucher ? 1 : 0, redemptions: voucher ? 1 : 0, uses: voucher ? 1 : 0 } });
    const purchase = await db.purchase.findUniqueOrThrow({ where: { userId_courseId: { userId: actor.id, courseId } } });
    expect(purchase).toMatchObject({ originalPrice: voucher ? 80 : 0, discountAmount: voucher ? 80 : 0, finalPrice: 0 });
    expect(forbidden.provider).not.toHaveBeenCalled(); expect(forbidden.fetch).not.toHaveBeenCalled();
  });
});
