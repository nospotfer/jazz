import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), permission: vi.fn(), user: vi.fn(), course: vi.fn(),
  existing: vi.fn(), list: vi.fn(), retrieve: vi.fn(), upsert: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/admin-api', () => ({ ensureAdminApiPermission: mocks.permission }));
vi.mock('@/lib/db', () => ({ db: {
  user: { findFirst: mocks.user }, course: { findUnique: mocks.course },
  purchase: { findUnique: mocks.existing },
} }));
vi.mock('@/lib/payments/providers/dodo', () => ({
  listDodoPaymentsForCustomer: mocks.list, retrieveDodoPayment: mocks.retrieve,
}));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.upsert }));

const payment = (extra: Record<string, unknown> = {}) => ({
  payment_id: 'pay_1', status: 'succeeded', total_amount: 3200, currency: 'EUR',
  customer: { email: 'buyer@example.test' },
  metadata: { userId: 'buyer', courseId: 'course-1', originalPrice: '30', voucherCode: 'LOCAL10', providerDiscountCode: 'REMOTE10' },
  ...extra,
});
async function invoke(kind: 'auto' | 'admin', body: unknown = { email: 'buyer@example.test', courseId: 'course-1' }) {
  if (kind === 'auto') return (await import('@/app/api/purchases/auto-reconcile/route')).POST();
  return (await import('@/app/api/admin/users/reconcile-purchase/route')).POST(new Request('http://localhost/api/admin/users/reconcile-purchase', {
    method: 'POST', body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('DODO_PAYMENTS_API_KEY', 'synthetic-reconciliation-route-key');
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'buyer', email: 'buyer@example.test' } } });
  mocks.permission.mockResolvedValue({ ok: true, userId: 'admin' });
  mocks.user.mockResolvedValue({ id: 'buyer', email: 'buyer@example.test' });
  mocks.course.mockResolvedValue({ id: 'course-1' });
  mocks.existing.mockResolvedValue(null);
  mocks.list.mockResolvedValue([payment()]);
  mocks.retrieve.mockResolvedValue(payment({ discounts: [{ code: 'REMOTE10', discount_id: 'discount_1' }] }));
  mocks.upsert.mockResolvedValue(undefined);
});

afterEach(() => vi.unstubAllEnvs());

for (const kind of ['auto', 'admin'] as const) {
  describe(`${kind} reconciliation`, () => {
    test('requires authorization before database/provider work', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null } });
      mocks.permission.mockResolvedValue({ ok: false, response: new Response('Forbidden', { status: 403 }) });
      expect((await invoke(kind)).status).toBe(kind === 'auto' ? 401 : 403);
      expect(mocks.list).not.toHaveBeenCalled();
      expect(mocks.user).not.toHaveBeenCalled();
      expect(mocks.upsert).not.toHaveBeenCalled();
    });

    test('fetches actual applied coupon detail, including tax-inclusive totals', async () => {
      const response = await invoke(kind);
      expect(response.status).toBe(200);
      expect(mocks.retrieve).toHaveBeenCalledWith('pay_1');
      expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'buyer', courseId: 'course-1', providerReferenceId: 'dodo-pay:pay_1',
        originalPrice: null, finalPrice: 32, discountAmount: null,
        localVoucherCode: 'LOCAL10', providerDiscountCode: 'REMOTE10', providerDiscountId: 'discount_1',
      }));
    });

    test('does not consume a removed coupon from stale checkout metadata', async () => {
      mocks.retrieve.mockResolvedValue(payment());
      expect((await invoke(kind)).status).toBe(200);
      expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
        localVoucherCode: null, providerDiscountCode: null, providerDiscountId: null,
      }));
    });

    test.each([
      { refund_status: 'full' }, { refunds: [{ status: 'succeeded' }] },
      { dispute_status: 'dispute_opened' }, { disputes: [{ status: 'dispute_lost' }] },
      { disputes: [{}] }, { status: 'processing' },
      { metadata: { userId: 'other', courseId: 'course-1' } },
      { metadata: { courseId: 'course-1' }, customer: { email: 'other@example.test' } },
      { metadata: { userId: 'buyer', courseId: 'other-course' } }, { payment_id: 'other-payment' },
    ])('rechecks detail identity, course and reversal eligibility before granting', async (detail) => {
      mocks.retrieve.mockResolvedValue(payment(detail));
      const response = await invoke(kind);
      expect(response.status).toBe(kind === 'auto' ? 200 : 404);
      expect(mocks.upsert).not.toHaveBeenCalled();
    });

    test('does not fetch detail or grant when the list already reports a reversal', async () => {
      mocks.list.mockResolvedValue([payment({ refund_status: 'partial' })]);
      expect((await invoke(kind)).status).toBe(kind === 'auto' ? 200 : 404);
      expect(mocks.retrieve).not.toHaveBeenCalled();
      expect(mocks.upsert).not.toHaveBeenCalled();
    });

    test('skips a revoked ledger entry without reporting a grant', async () => {
      const error = new Error('revoked'); error.name = 'DodoPaymentRevokedError';
      mocks.upsert.mockRejectedValue(error);
      const response = await invoke(kind);
      expect(response.status).toBe(kind === 'auto' ? 200 : 404);
      if (kind === 'auto') expect(await response.json()).toMatchObject({ unlocked: 0 });
    });

    test('does not refetch a snapshot or alter an existing purchase', async () => {
      mocks.existing.mockResolvedValue({ id: 'purchase_1' });
      expect((await invoke(kind)).status).toBe(200);
      expect(mocks.retrieve).not.toHaveBeenCalled();
      expect(mocks.upsert).not.toHaveBeenCalled();
    });
  });
}

describe('admin request validation and direct lookup', () => {
  test.each([null, [], { email: 12, courseId: 'course-1' }, { email: 'buyer@example.test', courseId: {} },
    { email: 'buyer@example.test', courseId: 'course-1', paymentId: 12 }])('rejects malformed typed input', async (body) => {
    expect((await invoke('admin', body)).status).toBe(400);
    expect(mocks.user).not.toHaveBeenCalled();
  });

  test('uses explicit payment detail once and still verifies its owner', async () => {
    mocks.retrieve.mockResolvedValue(payment({ metadata: { userId: 'other', courseId: 'course-1' } }));
    const response = await invoke('admin', { email: 'buyer@example.test', courseId: 'course-1', paymentId: 'pay_1' });
    expect(response.status).toBe(404);
    expect(mocks.retrieve).toHaveBeenCalledOnce();
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
