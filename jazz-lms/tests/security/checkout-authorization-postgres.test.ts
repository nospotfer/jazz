import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const principal = vi.hoisted(() => ({ user: null as { id: string; email: string } | null }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: principal.user } }) } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
const prohibited = vi.hoisted(() => ({ provider: vi.fn(), voucher: vi.fn(), grant: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/payments/provider', () => ({ getPaymentProvider: () => 'dodo', isActivePaymentProviderConfigured: () => true, createProviderCheckout: prohibited.provider, getProviderVoucherReferencePrefix: () => 'dodo-voucher' }));
vi.mock('@/lib/payments/providers/dodo', () => ({ isDodoWebhookConfigured: () => true }));
vi.mock('@/lib/vouchers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/vouchers')>(),
  validateVoucherForCourse: prohibited.voucher,
}));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: prohibited.grant }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));

// Never inherit DATABASE_URL. Only the established disposable loopback DB is allowed.
const target = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-checkout-authority-${randomUUID()}`;
const actor = { id: `${prefix}-actor`, email: `${prefix}-actor@example.test` };
const other = { id: `${prefix}-other`, email: `${prefix}-other@example.test` };
const draftId = `${prefix}-draft`, publishedId = `${prefix}-published`;
let db: typeof import('@/lib/db')['db'];
let POST: typeof import('@/app/api/checkout/route')['POST'];
const scopedPurchases = { courseId: { in: [draftId, publishedId] }, userId: { in: [actor.id, other.id] } };
function request(courseId: string, expectedUserId: string) {
  return new Request(`https://checkout-isolated.example.test/api/checkout?${new URLSearchParams({ expectedUserId })}`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://checkout-isolated.example.test' },
    body: JSON.stringify({ courseId, source: 'dashboard', language: 'en' }),
  });
}

describe.skipIf(!target)('checkout publication and owner intent on isolated PostgreSQL', () => {
  beforeAll(async () => {
    const url = new URL(target!);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/jazz_maintenance' || url.username !== 'postgres') {
      throw new Error('Checkout checks require disposable 127.0.0.1:55432/jazz_maintenance');
    }
    vi.stubEnv('DATABASE_URL', target!); vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://checkout-isolated.example.test');
    db = (await import('@/lib/db')).db;
    POST = (await import('@/app/api/checkout/route')).POST;
    await db.user.createMany({ data: [{ ...actor, role: 'USER' }, { ...other, role: 'USER' }] });
    await db.course.createMany({ data: [
      { id: draftId, title: 'Isolated unpublished free course', price: 0, isPublished: false },
      { id: publishedId, title: 'Isolated published free course', price: 0, isPublished: true },
    ] });
  });
  beforeEach(async () => {
    vi.clearAllMocks(); principal.user = actor;
    prohibited.fetch.mockImplementation(() => { throw new Error('External network is prohibited'); }); vi.stubGlobal('fetch', prohibited.fetch);
    await db.purchase.deleteMany({ where: scopedPurchases });
  });
  afterAll(async () => {
    if (db) {
      await db.purchase.deleteMany({ where: scopedPurchases });
      await db.course.deleteMany({ where: { id: { in: [draftId, publishedId] } } });
      await db.user.deleteMany({ where: { id: { in: [actor.id, other.id] } } });
      await db.$disconnect(); delete globalThis.prisma;
    }
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  test('unpublished zero-price course never persists an entitlement for an ordinary student', async () => {
    const response = await POST(request(draftId, actor.id));
    expect({ status: response.status, persisted: await db.purchase.count({ where: scopedPurchases }) }).toEqual({ status: 404, persisted: 0 });
    expect(prohibited.provider).not.toHaveBeenCalled(); expect(prohibited.grant).not.toHaveBeenCalled(); expect(prohibited.fetch).not.toHaveBeenCalled();
  });
  test('stale verified cookie cannot persist a free grant for either actor after browser intent changes', async () => {
    const response = await POST(request(publishedId, other.id));
    expect({ status: response.status, persisted: await db.purchase.count({ where: scopedPurchases }) }).toEqual({ status: 409, persisted: 0 });
    expect(prohibited.provider).not.toHaveBeenCalled(); expect(prohibited.voucher).not.toHaveBeenCalled(); expect(prohibited.fetch).not.toHaveBeenCalled();
  });
  test('matching owner retains a real published zero-price grant with exact owner/course/accounting', async () => {
    const response = await POST(request(publishedId, actor.id)); expect(response.status).toBe(200);
    const purchases = await db.purchase.findMany({ where: scopedPurchases }); expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({ userId: actor.id, courseId: publishedId, originalPrice: 0, finalPrice: 0, discountAmount: 0, voucherId: null });
    expect(prohibited.provider).not.toHaveBeenCalled(); expect(prohibited.grant).not.toHaveBeenCalled(); expect(prohibited.fetch).not.toHaveBeenCalled();
  });
  test('a declared owner cannot authenticate or persist a purchase without a verified session', async () => {
    principal.user = null; const response = await POST(request(publishedId, actor.id));
    expect({ status: response.status, persisted: await db.purchase.count({ where: scopedPurchases }) }).toEqual({ status: 401, persisted: 0 });
    expect(prohibited.provider).not.toHaveBeenCalled(); expect(prohibited.fetch).not.toHaveBeenCalled();
  });
});
