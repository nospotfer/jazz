import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Stripe webhook route tests.
 * Uses vi.doMock + vi.resetModules to ensure clean module state per test.
 */

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockHeaders(signatureValue: string | null) {
    vi.doMock('next/headers', () => ({
      headers: vi.fn().mockResolvedValue({
        get: (name: string) => (name === 'Stripe-Signature' ? signatureValue : null),
      }),
    }));
  }

  function mockStripe(overrides?: Record<string, unknown>) {
    vi.doMock('@/lib/stripe', () => ({
      stripe: overrides ?? {
        webhooks: { constructEvent: vi.fn() },
      },
    }));
  }

  function mockDb(purchaseUpsert = vi.fn(), lessonPurchaseUpsert = vi.fn()) {
    vi.doMock('@/lib/db', () => ({
      db: {
        purchase: { upsert: purchaseUpsert },
        lessonPurchase: { upsert: lessonPurchaseUpsert },
      },
    }));
  }

  function makeReq() {
    return new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
  }

  test('returns 503 when stripe is not configured', async () => {
    vi.doMock('@/lib/stripe', () => ({ stripe: null }));
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(503);
  });

  test('returns 400 when Stripe-Signature header is missing', async () => {
    mockStripe();
    mockHeaders(null);
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Missing Stripe-Signature');
  });

  test('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    mockStripe();
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(500);
    expect(await response.text()).toContain('Missing STRIPE_WEBHOOK_SECRET');
  });

  test('returns 400 when signature verification fails', async () => {
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => { throw new Error('Invalid signature'); }),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Invalid signature');
  });

  test('creates course purchase on checkout.session.completed', async () => {
    const purchaseUpsert = vi.fn().mockResolvedValue({ id: 'p1' });
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'checkout.session.completed',
            data: { object: { metadata: { userId: 'u1', courseId: 'c1', purchaseType: 'course' } } },
          })),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb(purchaseUpsert);

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(200);
    expect(purchaseUpsert).toHaveBeenCalledTimes(1);
  });

  test('creates lesson purchase when purchaseType is lesson', async () => {
    const lessonPurchaseUpsert = vi.fn().mockResolvedValue({ id: 'lp1' });
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'checkout.session.completed',
            data: {
              object: {
                metadata: { userId: 'u1', courseId: 'c1', lessonId: 'l1', purchaseType: 'lesson' },
              },
            },
          })),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb(vi.fn(), lessonPurchaseUpsert);

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(200);
    expect(lessonPurchaseUpsert).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when metadata is missing', async () => {
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'checkout.session.completed',
            data: { object: { metadata: {} } },
          })),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(400);
  });

  test('returns 400 when lesson purchaseType missing lessonId', async () => {
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'checkout.session.completed',
            data: {
              object: {
                metadata: { userId: 'u1', courseId: 'c1', purchaseType: 'lesson' },
              },
            },
          })),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(400);
  });

  test('returns 200 for unhandled event types', async () => {
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        webhooks: {
          constructEvent: vi.fn(() => ({
            type: 'payment_intent.succeeded',
            data: { object: {} },
          })),
        },
      },
    }));
    mockHeaders('sig_test');
    mockDb();

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Unhandled event type');
  });
});
