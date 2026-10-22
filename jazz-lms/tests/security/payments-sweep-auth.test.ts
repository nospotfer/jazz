import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userFindMany: vi.fn(),
  purchaseFindUnique: vi.fn(),
  listDodoPaymentsForCustomer: vi.fn(),
  retrieveDodoPayment: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findMany: mocks.userFindMany },
    purchase: { findUnique: mocks.purchaseFindUnique },
  },
}));
vi.mock('@/lib/payments/providers/dodo', () => ({
  listDodoPaymentsForCustomer: mocks.listDodoPaymentsForCustomer,
  retrieveDodoPayment: mocks.retrieveDodoPayment,
}));
vi.mock('@/lib/course-purchase-sync', () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
}));

import { GET } from '@/app/api/cron/payments-sweep/route';

describe('payment sweep authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Reflect.deleteProperty(globalThis, "__jazzPaymentSweepStateV1");
    mocks.userFindMany.mockResolvedValue([{ id: 'student-1', email: 'student@example.test' }]);
    mocks.listDodoPaymentsForCustomer.mockResolvedValue([]);
    mocks.retrieveDodoPayment.mockImplementation(async (id: string) =>
      (await mocks.listDodoPaymentsForCustomer.mock.results.at(-1)?.value)?.find((payment: { id?: string }) => payment.id === id) ?? null,
    );
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test.each<{ label: string; secret: string | undefined; headers: Record<string, string> }>([
    { label: 'missing secret', secret: undefined, headers: { 'x-vercel-cron': '1' } },
    { label: 'empty secret', secret: '', headers: { 'x-vercel-cron': '1' } },
    { label: 'blank secret', secret: '   ', headers: { 'x-vercel-cron': '1' } },
    { label: 'spoofed Vercel header', secret: 'test-cron-secret', headers: { 'x-vercel-cron': '1' } },
    { label: 'missing bearer', secret: 'test-cron-secret', headers: {} },
    { label: 'incorrect bearer with spoofed Vercel header', secret: 'test-cron-secret', headers: { 'x-vercel-cron': '1', authorization: 'Bearer wrong-secret' } },
    { label: 'bearer without configured secret', secret: undefined, headers: { authorization: 'Bearer undefined' } },
  ])('denies $label before any database or provider work', async ({ secret, headers }) => {
    vi.stubEnv('CRON_SECRET', secret);
    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', { headers }));

    expect(response.status).toBe(401);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
    expect(mocks.purchaseFindUnique).not.toHaveBeenCalled();
    expect(mocks.listDodoPaymentsForCustomer).not.toHaveBeenCalled();
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test.each([false, true])('runs the sweep with a valid bearer (Vercel header present: %s)', async (vercelHeader) => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    const headers: Record<string, string> = { authorization: 'Bearer test-cron-secret' };
    if (vercelHeader) headers['x-vercel-cron'] = '1';

    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', { headers }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true, complete: true, passComplete: true, hasMore: false, reason: null,
      usersScanned: 1, paymentsScanned: 0, unlocked: 0, failures: 0, pendingUsers: 0,
      coverage: "recent_eligible_users", state: "process_local",
    });
    expect(mocks.userFindMany).toHaveBeenCalledOnce();
    expect(mocks.listDodoPaymentsForCustomer).toHaveBeenCalledOnce();
    expect(mocks.listDodoPaymentsForCustomer).toHaveBeenCalledWith({
      email: 'student@example.test', sinceISO: expect.any(String), pageSize: 50, signal: expect.any(AbortSignal),
    });
  });

  test.each([
    { label: 'another customer without owner metadata', payment: { customer: { email: 'other@example.test' } } },
    { label: 'an owner metadata mismatch', payment: { metadata: { courseId: 'course-1', userId: 'other-student' }, customer: { email: 'student@example.test' } } },
    { label: 'missing owner and customer identity', payment: {} },
    { label: 'a refunded succeeded payment', payment: { refund_status: 'succeeded', customer: { email: 'student@example.test' } } },
    { label: 'a payment with a completed refund', payment: { refunds: [{ status: 'succeeded' }], customer: { email: 'student@example.test' } } },
    { label: 'an active dispute', payment: { dispute_status: 'dispute_opened', customer: { email: 'student@example.test' } } },
    { label: 'a failed payment', payment: { status: 'failed', customer: { email: 'student@example.test' } } },
  ])('never grants access for $label', async ({ payment }) => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    mocks.listDodoPaymentsForCustomer.mockResolvedValue([
      { id: 'payment-1', status: 'succeeded', metadata: { courseId: 'course-1' }, ...payment },
    ]);

    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ paymentsScanned: 1, unlocked: 0, failures: 0 });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('grants an eligible paid course to the verified payment owner', async () => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    mocks.listDodoPaymentsForCustomer.mockResolvedValue([
      { id: 'payment-1', status: 'succeeded', amount: 3000, currency: 'EUR', customer: { email: 'student@example.test' }, metadata: { courseId: 'course-1', userId: 'student-1' } },
    ]);

    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ paymentsScanned: 1, unlocked: 1, failures: 0 });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledOnce();
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'student-1', courseId: 'course-1', providerReferenceId: 'dodo-pay:payment-1', finalPrice: 30,
      paymentCurrency: 'EUR', paymentAmountMinor: '3000',
    }));
  });

  test('skips a webhook-revoked payment and keeps processing other purchases', async () => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    mocks.listDodoPaymentsForCustomer.mockResolvedValue([
      { id: 'revoked-payment', status: 'succeeded', customer: { email: 'student@example.test' }, metadata: { courseId: 'course-revoked' } },
      { id: 'valid-payment', status: 'succeeded', customer: { email: 'student@example.test' }, metadata: { courseId: 'course-valid' } },
    ]);
    const revokedError = new Error('Payment has been revoked');
    revokedError.name = 'DodoPaymentRevokedError';
    mocks.upsertCoursePurchaseFromProvider.mockRejectedValueOnce(revokedError);

    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ paymentsScanned: 2, unlocked: 1, failures: 0 });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledTimes(2);
    expect(mocks.upsertCoursePurchaseFromProvider.mock.calls[1][0]).toMatchObject({ courseId: 'course-valid' });
  });

  test.each([false, true])('voucher accounting requires an actual provider discount snapshot (present: %s)', async (snapshot) => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    mocks.listDodoPaymentsForCustomer.mockResolvedValue([{
      id: 'payment-1', status: 'succeeded', customer: { email: 'student@example.test' }, amount: 2700,
      metadata: { courseId: 'course-1', voucherCode: 'LOCAL10', providerDiscountCode: 'REMOTE10', originalPrice: '30' },
      ...(snapshot ? { discounts: [{ code: 'REMOTE10', discount_id: 'actual-discount-id' }] } : {}),
    }]);

    const response = await GET(new Request('https://example.test/api/cron/payments-sweep', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ unlocked: 1 });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(expect.objectContaining({
      localVoucherCode: snapshot ? 'LOCAL10' : null,
      providerDiscountCode: snapshot ? 'REMOTE10' : null,
      providerDiscountId: snapshot ? 'actual-discount-id' : null,
    }));
  });
});
