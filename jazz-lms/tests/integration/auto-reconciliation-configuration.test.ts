import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), existing: vi.fn(), upsert: vi.fn(), fetch: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/db', () => ({ db: { purchase: { findUnique: mocks.existing } } }));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.upsert }));

const actor = { id: 'configuration-buyer', email: 'configuration-buyer@example.test' };
const apiOrigin = 'https://configuration-provider.example.invalid';
const syntheticKey = 'synthetic-configuration-test-only';
const privateMarker = 'synthetic-private-provider-failure';

function providerResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function invoke() {
  return (await import('@/app/api/purchases/auto-reconcile/route')).POST();
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('DODO_PAYMENTS_API_KEY', undefined);
  vi.stubEnv('DODO_PRODUCT_ID', undefined);
  vi.stubEnv('DODO_API_BASE_URL', apiOrigin);
  vi.stubEnv('DODO_ENVIRONMENT', 'test_mode');
  mocks.getUser.mockResolvedValue({ data: { user: actor }, error: null });
  mocks.existing.mockResolvedValue(null);
  mocks.upsert.mockResolvedValue(undefined);
  // The real Dodo helpers run, but every fetch is intercepted before networking.
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited in configuration regression'); });
  vi.stubGlobal('fetch', mocks.fetch);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  try {
    for (const [input] of mocks.fetch.mock.calls) {
      const url = new URL(input instanceof Request ? input.url : String(input));
      expect(url.origin).toBe(apiOrigin);
    }
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  }
});

describe('automatic reconciliation with real provider configuration checks', () => {
  test.each([undefined, ' \t\n '])('real reader rejects absent or blank key %j before networking', async (key) => {
    vi.stubEnv('DODO_PAYMENTS_API_KEY', key);
    const { listDodoPaymentsForCustomer } = await import('@/lib/payments/providers/dodo');
    await expect(listDodoPaymentsForCustomer({ email: actor.email }))
      .rejects.toThrow('Missing DODO_PAYMENTS_API_KEY');
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.existing).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  test.each([undefined, ' \t\n '])('authenticated missing-key request returns explicit503 without provider work for %j', async (key) => {
    vi.stubEnv('DODO_PAYMENTS_API_KEY', key);
    const dodo = await import('@/lib/payments/providers/dodo');
    const list = vi.spyOn(dodo, 'listDodoPaymentsForCustomer');
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ reason: 'provider_unavailable', provider: 'dodo' });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(list).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.existing).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  test('unauthenticated missing-key request stays401 before provider or database work', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const dodo = await import('@/lib/payments/providers/dodo');
    const list = vi.spyOn(dodo, 'listDodoPaymentsForCustomer');
    const response = await invoke();
    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.existing).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  test('configured historical payment is reconciled without a current product ID', async () => {
    vi.stubEnv('DODO_PAYMENTS_API_KEY', ` ${syntheticKey} `);
    const payment = {
      payment_id: 'configuration-payment', status: 'succeeded', currency: 'EUR', total_amount: 3200,
      customer: { customer_id: 'configuration-customer', email: actor.email },
      metadata: { userId: actor.id, courseId: 'historical-course' },
    };
    mocks.fetch.mockResolvedValueOnce(providerResponse({ items: [payment.customer] }))
      .mockResolvedValueOnce(providerResponse({ items: [payment] }))
      .mockResolvedValueOnce(providerResponse(payment));
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ unlocked: 1, scanned: 1, unlockedCourseIds: ['historical-course'] });
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(new URL(mocks.fetch.mock.calls[0][0]).pathname).toBe('/customers');
    expect(new URL(mocks.fetch.mock.calls[1][0]).pathname).toBe('/payments');
    expect(new URL(mocks.fetch.mock.calls[2][0]).pathname).toBe('/payments/configuration-payment');
    for (const [, options] of mocks.fetch.mock.calls) {
      expect(options.headers.Authorization).toBe(`Bearer ${syntheticKey}`);
    }
    expect(mocks.existing).toHaveBeenCalledOnce();
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      userId: actor.id, courseId: 'historical-course', providerReferenceId: 'dodo-pay:configuration-payment',
      finalPrice: 32, paymentCurrency: 'EUR', paymentAmountMinor: '3200',
    }));
    expect(console.error).not.toHaveBeenCalled();
  });

  test('configured provider failure retains500 and safe diagnostics without granting access', async () => {
    vi.stubEnv('DODO_PAYMENTS_API_KEY', syntheticKey);
    mocks.fetch.mockResolvedValueOnce(providerResponse({ detail: privateMarker }, 503));
    const response = await invoke();
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Error interno');
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.existing).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledExactlyOnceWith('[AUTO_RECONCILE_ERROR]', { category: 'unexpected' });
  });
});
