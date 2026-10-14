// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), course: vi.fn(), purchase: vi.fn(), user: vi.fn(), upsert: vi.fn(), transaction: vi.fn(), provider: vi.fn(), voucher: vi.fn(), synchronize: vi.fn(), grant: vi.fn(), fetch: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: mocks.user }, course: { findUnique: mocks.course }, purchase: { findUnique: mocks.purchase, upsert: mocks.upsert }, $transaction: mocks.transaction } }));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.grant }));
vi.mock('@/lib/payments/provider', () => ({ getPaymentProvider: () => 'dodo', isActivePaymentProviderConfigured: () => true, createProviderCheckout: mocks.provider, getProviderVoucherReferencePrefix: () => 'dodo-voucher' }));
vi.mock('@/lib/payments/providers/dodo', () => ({ isDodoWebhookConfigured: () => true }));
vi.mock('@/lib/vouchers', () => ({ validateVoucherForCourse: mocks.voucher }));
vi.mock('@/lib/voucher-provider-sync', () => ({ ensureVoucherDiscountSynced: mocks.synchronize }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));
const actor = { id: 'verified-cookie-owner', email: 'cookie-owner@example.test' };
const course = { id: 'published-synthetic-course', title: 'Synthetic course', isPublished: true, price: 80 };
async function invoke(query = '') {
  const req = new Request('https://app.synthetic.example/api/checkout' + query, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://app.synthetic.example' }, body: JSON.stringify({ courseId: course.id, source: 'dashboard', language: 'en' }) });
  return (await import('@/app/api/checkout/route')).POST(req);
}
function activity(response: Response) { return { status: response.status, users: mocks.user.mock.calls.length, courses: mocks.course.mock.calls.length, purchases: mocks.purchase.mock.calls.length, transactions: mocks.transaction.mock.calls.length, upserts: mocks.upsert.mock.calls.length, grants: mocks.grant.mock.calls.length, providerCalls: mocks.provider.mock.calls.length, voucherCalls: mocks.voucher.mock.calls.length, synchronizations: mocks.synchronize.mock.calls.length }; }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.synthetic.example');
  mocks.getUser.mockResolvedValue({ data: { user: actor } }); mocks.course.mockResolvedValue(course); mocks.purchase.mockResolvedValue(null); mocks.user.mockResolvedValue({ role: 'USER' });
  mocks.transaction.mockImplementation(async (callback) => callback({ purchase: { upsert: mocks.upsert } })); mocks.upsert.mockResolvedValue({ id: 'synthetic-purchase' }); mocks.provider.mockResolvedValue('https://checkout.synthetic.example/session');
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited'); }); vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
test.each([0, 80])('a new owner intent with stale verified cookie cannot create free or paid checkout for price%s', async (price) => {
  mocks.course.mockResolvedValue({ ...course, price }); const response = await invoke('?expectedUserId=captured-browser-owner');
  expect(activity(response)).toEqual({ status: 409, users: 0, courses: 0, purchases: 0, transactions: 0, upserts: 0, grants: 0, providerCalls: 0, voucherCalls: 0, synchronizations: 0 });
  expect(await response.json()).toEqual({ error: 'Session changed' }); expect(mocks.getUser).toHaveBeenCalledOnce();
});
test.each(['?expectedUserId=%20%20', '?expectedUserId=verified-cookie-owner&expectedUserId=verified-cookie-owner'])('malformed or ambiguous declared checkout owner%s rejects before owner data/work', async (query) => {
  const response = await invoke(query); expect(activity(response)).toEqual({ status: 409, users: 0, courses: 0, purchases: 0, transactions: 0, upserts: 0, grants: 0, providerCalls: 0, voucherCalls: 0, synchronizations: 0 }); expect(await response.json()).toEqual({ error: 'Session changed' });
});
test('control matching owner preserves a genuine published-free grant to the verified cookie owner', async () => {
  mocks.course.mockResolvedValue({ ...course, price: 0 }); const response = await invoke('?expectedUserId=' + actor.id); expect(response.status).toBe(200); expect(mocks.upsert).toHaveBeenCalledOnce(); expect(mocks.upsert.mock.calls[0][0].create.userId).toBe(actor.id); expect(mocks.provider).not.toHaveBeenCalled();
});
test('control matching owner preserves provider checkout and its verified-owner metadata', async () => {
  const response = await invoke('?expectedUserId=' + actor.id); expect(response.status).toBe(200); expect(mocks.provider).toHaveBeenCalledOnce(); expect(mocks.provider.mock.calls[0][0].customData.userId).toBe(actor.id); expect(mocks.upsert).not.toHaveBeenCalled();
});
test('control legacy omitted hint still authenticates and creates checkout for the verified cookie owner', async () => {
  const response = await invoke(); expect(response.status).toBe(200); expect(mocks.provider).toHaveBeenCalledOnce(); expect(mocks.provider.mock.calls[0][0].customData.userId).toBe(actor.id);
});
test('control declared owner never authenticates an unauthenticated request', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } }); const response = await invoke('?expectedUserId=' + actor.id); expect(response.status).toBe(401); expect(mocks.user).not.toHaveBeenCalled(); expect(mocks.course).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
});
