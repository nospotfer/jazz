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
vi.mock('@/lib/vouchers', () => ({ validateVoucherForCourse: mocks.voucher,
  lockPublishedCourseForGrant: vi.fn(async () => undefined) }));
vi.mock('@/lib/voucher-provider-sync', () => ({ ensureVoucherDiscountSynced: mocks.synchronize }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));

const actorId = 'publication-synthetic-student';
const courseId = 'publication-synthetic-course';
let course: { id: string; title: string; price: number; isPublished: boolean } | null;
function request(voucher = false) {
  return new Request('https://app.synthetic.example/api/checkout', { method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://app.synthetic.example' },
    body: JSON.stringify({ courseId, source: 'dashboard', language: 'en', ...(voucher ? { voucherCode: 'SYNTHETICFULL' } : {}) }) });
}
async function invoke(voucher = false) { return (await import('@/app/api/checkout/route')).POST(request(voucher)); }
function effects(response: Response) {
  return { status: response.status, transactions: mocks.transaction.mock.calls.length, upserts: mocks.upsert.mock.calls.length,
    grants: mocks.grant.mock.calls.length, providerCalls: mocks.provider.mock.calls.length,
    voucherCalls: mocks.voucher.mock.calls.length, synchronizations: mocks.synchronize.mock.calls.length };
}
const denied = { status: 404, transactions: 0, upserts: 0, grants: 0, providerCalls: 0, voucherCalls: 0, synchronizations: 0 };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.synthetic.example');
  course = { id: courseId, title: 'Synthetic publication fixture', price: 80, isPublished: true };
  mocks.getUser.mockResolvedValue({ data: { user: { id: actorId, email: 'publication@example.test' } } });
  mocks.user.mockResolvedValue({ role: 'USER' }); mocks.purchase.mockResolvedValue(null);
  mocks.course.mockImplementation(async ({ where }: { where: { id: string; isPublished?: boolean } }) => {
    return course && course.id === where.id && (where.isPublished === undefined || where.isPublished === course.isPublished) ? course : null;
  });
  mocks.transaction.mockImplementation(async (callback) => callback({ purchase: { upsert: mocks.upsert } }));
  mocks.upsert.mockResolvedValue({ id: 'publication-synthetic-purchase' }); mocks.grant.mockResolvedValue(undefined);
  mocks.provider.mockResolvedValue('https://checkout.synthetic.example/session');
  mocks.voucher.mockResolvedValue({ valid: true, isFree: true, originalPrice: 80, discount: 80, finalPrice: 0,
    voucher: { id: 'publication-synthetic-voucher', code: 'SYNTHETICFULL', providerDiscountCode: 'SYNTHETICFULL', type: 'FULL_ACCESS' } });
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited'); }); vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('ordinary authenticated student cannot acquire an unpublished zero-price course', async () => {
  course = { ...course!, isPublished: false, price: 0 };
  const response = await invoke(); expect(effects(response)).toEqual(denied);
  expect(await response.text()).toBe('Course not found');
});
test('ordinary authenticated student cannot create provider checkout for an unpublished paid course', async () => {
  course = { ...course!, isPublished: false };
  const response = await invoke(); expect(effects(response)).toEqual(denied);
});
test('unpublished paid course cannot gain full-voucher entitlement or consume voucher work', async () => {
  course = { ...course!, isPublished: false };
  const response = await invoke(true); expect(effects(response)).toEqual(denied);
});
test('admin role does not create a separate draft-course checkout path', async () => {
  mocks.user.mockResolvedValue({ role: 'SUPER_ADMIN' }); course = { ...course!, isPublished: false, price: 0 };
  const response = await invoke(); expect(effects(response)).toEqual(denied);
});
test('published zero-price course retains the verified actor and exact course free grant', async () => {
  course = { ...course!, price: 0 }; const response = await invoke(); expect(response.status).toBe(200);
  expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
    where: { userId_courseId: { userId: actorId, courseId } },
    update: { voucherId: null, originalPrice: 0, finalPrice: 0, discountAmount: 0 },
    create: { userId: actorId, courseId, voucherId: null, originalPrice: 0, finalPrice: 0, discountAmount: 0 },
  });
  expect(mocks.provider).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
});
test('published paid course retains quote provenance and actor-course identity', async () => {
  const response = await invoke(); expect(response.status).toBe(200); expect(mocks.provider).toHaveBeenCalledOnce();
  expect(mocks.provider.mock.calls[0][0].customData).toMatchObject({ userId: actorId, courseId,
    pricingProvenance: 'catalog_quote_v1', quotedOriginalPrice: '80', quotedDiscount: '0', quotedFinalPrice: '80' });
  expect(mocks.provider.mock.calls[0][0].customData.originalPrice).toBeUndefined();
  expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
});
test('published admin course checkout retains the same ordinary provider path', async () => {
  mocks.user.mockResolvedValue({ role: 'SUPER_ADMIN' });
  const response = await invoke(); expect(response.status).toBe(200); expect(mocks.provider).toHaveBeenCalledOnce();
  expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
});
test('missing course retains404 before all financial work', async () => {
  course = null; const response = await invoke(true); expect(effects(response)).toEqual(denied);
});
test('unauthenticated draft request remains401 before catalog or purchase reads', async () => {
  course = { ...course!, isPublished: false }; mocks.getUser.mockResolvedValue({ data: { user: null } });
  const response = await invoke(); expect(response.status).toBe(401);
  expect(mocks.course).not.toHaveBeenCalled(); expect(mocks.purchase).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
});
