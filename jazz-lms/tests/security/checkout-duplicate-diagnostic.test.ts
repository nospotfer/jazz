// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), user: vi.fn(), course: vi.fn(), purchase: vi.fn(),
  provider: vi.fn(), grant: vi.fn(), upsert: vi.fn(), fetch: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: mocks.user }, course: { findUnique: mocks.course },
  purchase: { findUnique: mocks.purchase, upsert: mocks.upsert } } }));
vi.mock('@/lib/payments/provider', () => ({ getPaymentProvider: () => 'dodo', isActivePaymentProviderConfigured: () => true,
  createProviderCheckout: mocks.provider, getProviderVoucherReferencePrefix: () => 'dodo-voucher' }));
vi.mock('@/lib/payments/providers/dodo', () => ({ isDodoWebhookConfigured: () => true }));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.grant }));
vi.mock('@/lib/vouchers', () => ({ validateVoucherForCourse: vi.fn() }));
vi.mock('@/lib/voucher-provider-sync', () => ({ ensureVoucherDiscountSynced: vi.fn() }));
vi.mock('@/lib/test-mode', () => ({ isLocalTestRequest: () => false }));

const actorId = 'synthetic-private-log-owner';
const courseId = 'synthetic-private-log-course';
const purchaseId = 'synthetic-private-log-purchase';
const role = 'SUPER_ADMIN';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: actorId, email: 'synthetic@example.test' } } });
  mocks.user.mockResolvedValue({ role }); mocks.course.mockResolvedValue({ id: courseId, title: 'Synthetic course', price: 80 });
  mocks.purchase.mockResolvedValue({ id: purchaseId });
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited'); }); vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('authenticated duplicate keeps400 and a finite diagnostic without account/purchase/role correlation', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const request = new Request('https://app.synthetic.example/api/checkout', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId, language: 'en' }) });
  const response = await (await import('@/app/api/checkout/route')).POST(request);
  const output = JSON.stringify(warning.mock.calls);
  expect({ status: response.status, eventPresent: output.includes('[CHECKOUT_ALREADY_PURCHASED]'),
    leakedSyntheticTokens: [actorId, courseId, purchaseId, role].filter((value) => output.includes(value)) })
    .toEqual({ status: 400, eventPresent: true, leakedSyntheticTokens: [] });
  expect(await response.text()).toBe('Course already purchased');
  expect(mocks.getUser).toHaveBeenCalledOnce();
  expect(mocks.purchase).toHaveBeenCalledWith({ where: { userId_courseId: { userId: actorId, courseId } } });
  expect(mocks.provider).not.toHaveBeenCalled(); expect(mocks.grant).not.toHaveBeenCalled();
  expect(mocks.upsert).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
});
