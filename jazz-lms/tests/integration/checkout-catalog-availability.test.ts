// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), course: vi.fn(), purchase: vi.fn(), user: vi.fn(), upsert: vi.fn(),
  transaction: vi.fn(), provider: vi.fn(), voucher: vi.fn(), synchronize: vi.fn(), grant: vi.fn(), fetch: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: mocks.user }, course: { findUnique: mocks.course },
  purchase: { findUnique: mocks.purchase, upsert: mocks.upsert }, $transaction: mocks.transaction } }));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.grant }));
vi.mock('@/lib/payments/provider', () => ({ getPaymentProvider: () => 'dodo', isActivePaymentProviderConfigured: () => true,
  createProviderCheckout: mocks.provider, getProviderVoucherReferencePrefix: () => 'dodo-voucher' }));
vi.mock('@/lib/payments/providers/dodo', () => ({ isDodoWebhookConfigured: () => true }));
vi.mock('@/lib/vouchers', () => ({ validateVoucherForCourse: mocks.voucher }));
vi.mock('@/lib/voucher-provider-sync', () => ({ ensureVoucherDiscountSynced: mocks.synchronize }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));

function request(language = 'en', voucher = false) {
  return new Request('https://app.synthetic.example/api/checkout', { method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://app.synthetic.example' },
    body: JSON.stringify({ courseId: 'synthetic-course', source: 'dashboard', language, ...(voucher ? { voucherCode: 'TESTSAVE' } : {}) }) });
}
async function invoke(language = 'en', voucher = false) {
  return (await import('@/app/api/checkout/route')).POST(request(language, voucher));
}
function observed(response: Response) {
  return { status: response.status, upserts: mocks.upsert.mock.calls.length, grants: mocks.grant.mock.calls.length,
    providerCalls: mocks.provider.mock.calls.length, voucherCalls: mocks.voucher.mock.calls.length,
    synchronizations: mocks.synchronize.mock.calls.length, transactions: mocks.transaction.mock.calls.length };
}
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.synthetic.example');
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'synthetic-owner', email: 'synthetic@example.test' } } });
  mocks.course.mockResolvedValue({ id: 'synthetic-course', title: 'Synthetic course', price: 80 });
  mocks.purchase.mockResolvedValue(null); mocks.user.mockResolvedValue({ role: 'USER' });
  mocks.transaction.mockImplementation(async (callback) => callback({ purchase: { upsert: mocks.upsert } }));
  mocks.upsert.mockResolvedValue({ id: 'synthetic-purchase' }); mocks.grant.mockResolvedValue(undefined);
  mocks.provider.mockResolvedValue('https://checkout.synthetic.example/session');
  mocks.voucher.mockResolvedValue({ valid: true, isFree: false, originalPrice: 80, discount: 8, finalPrice: 72,
    voucher: { id: 'synthetic-voucher', code: 'TESTSAVE', providerDiscountCode: 'TESTSAVE', type: 'DISCOUNT_PERCENT', discountPercent: 10 } });
  mocks.fetch.mockImplementation(() => { throw new Error('Network is prohibited'); }); vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, '0', '80', ''])('unknown or malformed catalog price %j rejects before any grant/provider/voucher work', async (price) => {
  mocks.course.mockResolvedValue({ id: 'synthetic-course', title: 'Synthetic course', price });
  const response = await invoke('en', true);
  expect(observed(response)).toEqual({ status: 503, upserts: 0, grants: 0, providerCalls: 0,
    voucherCalls: 0, synchronizations: 0, transactions: 0 });
});
test('unavailable price failure follows the chosen four-language response without any financial side effect', async () => {
  mocks.course.mockResolvedValue({ id: 'synthetic-course', title: 'Synthetic course', price: null });
  const messages = new Set<string>();
  for (const language of ['es', 'en', 'fr', 'pt']) {
    const response = await invoke(language); expect(response.status).toBe(503);
    const message = await response.text(); expect(message.length).toBeGreaterThan(0); messages.add(message);
  }
  expect(messages.size).toBe(4);
  expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
});
test('control genuine numeric zero keeps the existing scoped free-course entitlement', async () => {
  mocks.course.mockResolvedValue({ id: 'synthetic-course', title: 'Synthetic course', price: 0 });
  const response = await invoke(); expect(response.status).toBe(200);
  expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
    where: { userId_courseId: { userId: 'synthetic-owner', courseId: 'synthetic-course' } },
    update: { voucherId: null, originalPrice: 0, finalPrice: 0, discountAmount: 0 },
    create: { userId: 'synthetic-owner', courseId: 'synthetic-course', voucherId: null, originalPrice: 0, finalPrice: 0, discountAmount: 0 },
  });
  expect(mocks.provider).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
});
test.each([29.99, 80])('control positive catalog price %j keeps existing provider metadata29.99 policy unchanged', async (price) => {
  mocks.course.mockResolvedValue({ id: 'synthetic-course', title: 'Synthetic course', price });
  const response = await invoke(); expect(response.status).toBe(200);
  expect(mocks.provider).toHaveBeenCalledOnce();
  expect(mocks.provider.mock.calls[0][0].customData.originalPrice).toBe('29.99');
  expect(mocks.upsert).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
});
test('control unauthenticated remains401 before course lookup or price processing', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  const response = await invoke(); expect(response.status).toBe(401);
  expect(mocks.course).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
});
