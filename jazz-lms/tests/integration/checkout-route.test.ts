import { beforeEach, describe, expect, test, vi } from 'vitest';

const APP_URL = 'https://app.example.com';

function createCheckoutRequest(body: Record<string, unknown>) {
  return new Request(`${APP_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: APP_URL },
    body: JSON.stringify(body),
  });
}

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  courseFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseUpsert: vi.fn(),
  cookies: vi.fn(),
  normalizeLanguage: vi.fn(),
  languageToStripeLocale: vi.fn(),
  getCourseTranslationBundle: vi.fn(),
  resolveCourseText: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    course: { findUnique: mocks.courseFindUnique },
    purchase: {
      findUnique: mocks.purchaseFindUnique,
      upsert: mocks.purchaseUpsert,
    },
    $transaction: async (callback: (tx: any) => Promise<any>) => callback({
      purchase: {
        upsert: mocks.purchaseUpsert,
      },
    }),
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: null,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('@/lib/language', () => ({
  normalizeLanguage: mocks.normalizeLanguage,
  languageToStripeLocale: mocks.languageToStripeLocale,
}));

vi.mock('@/lib/course-translations', () => ({
  getCourseTranslationBundle: mocks.getCourseTranslationBundle,
  resolveCourseText: mocks.resolveCourseText,
}));

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue('es');
    mocks.languageToStripeLocale.mockReturnValue('es');
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({ title: 'Curso', description: 'Desc' });
  });

  test('returns 400 for missing courseId', async () => {
    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({});

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 400 for unsupported payment method', async () => {
    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1', paymentMethod: 'pix' });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 400 when voucher code is sent to checkout API payload', async () => {
    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1', voucherCode: 'PROMO100' });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 401 when user is not authenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('returns 404 when course does not exist', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test('returns 400 when already purchased', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue({ id: 'c1', title: 'Curso', description: '', price: 10 });
    mocks.purchaseFindUnique.mockResolvedValue({ id: 'p1' });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('creates purchase immediately for free courses', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue({ id: 'c1', title: 'Curso', description: '', price: 0 });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.purchaseUpsert.mockResolvedValue({ id: 'p1' });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1', source: 'dashboard' });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain('/dashboard?purchase=success');
    expect(mocks.purchaseUpsert).toHaveBeenCalledTimes(1);
  });

  test('returns 503 when stripe is not configured for paid course', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue({ id: 'c1', title: 'Jazz', description: 'Desc', price: 29.99 });
    mocks.purchaseFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  test('returns 400 when user has no email', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: null } } });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('free course from course source redirects to course page', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue({ id: 'c1', title: 'Curso', description: '', price: 0 });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.purchaseUpsert.mockResolvedValue({ id: 'p1' });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1', source: 'course' });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain('/courses/c1?success=true');
  });

  test('returns 500 on unexpected error', async () => {
    mocks.getUser.mockRejectedValue(new Error('unexpected'));

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  test('returns 503 for localhost paid checkout when Stripe is not configured', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.courseFindUnique.mockResolvedValue({ id: 'c1', title: 'Jazz', description: 'Desc', price: 29.99 });
    mocks.purchaseFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ courseId: 'c1', source: 'dashboard' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(503);
  });
});

describe('POST /api/checkout (with Stripe)', () => {
  const stripeMocks = vi.hoisted(() => ({
    stripeCreate: vi.fn(),
    customersList: vi.fn(),
    customersCreate: vi.fn(),
  }));

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function setupCheckoutMocks(options: {
    stripeNull?: boolean;
    user?: Record<string, unknown> | null;
    course?: Record<string, unknown> | null;
    existingPurchase?: Record<string, unknown> | null;
    customers?: Array<Record<string, unknown>>;
    sessionUrl?: string;
  } = {}) {
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: options.user ?? { id: 'u1', email: 'user@test.com' } },
          }),
        },
      }),
    }));

    vi.doMock('@/lib/db', () => ({
      db: {
        course: { findUnique: vi.fn().mockResolvedValue(options.course ?? { id: 'c1', title: 'Jazz', description: 'Desc', price: 29.99 }) },
        purchase: {
          findUnique: vi.fn().mockResolvedValue(options.existingPurchase ?? null),
          create: vi.fn().mockResolvedValue({ id: 'p1' }),
          upsert: vi.fn().mockResolvedValue({ id: 'p1' }),
        },
        $transaction: async (callback: (tx: any) => Promise<any>) => callback({
          purchase: {
            upsert: vi.fn().mockResolvedValue({ id: 'p1' }),
          },
        }),
      },
    }));

    stripeMocks.customersList.mockResolvedValue({ data: options.customers ?? [{ id: 'cus_1' }] });
    stripeMocks.customersCreate.mockResolvedValue({ id: 'cus_new' });
    stripeMocks.stripeCreate.mockResolvedValue({ url: options.sessionUrl ?? 'https://checkout.stripe.com/session' });

    vi.doMock('@/lib/stripe', () => ({
      stripe: options.stripeNull
        ? null
        : {
            customers: { list: stripeMocks.customersList, create: stripeMocks.customersCreate },
            checkout: { sessions: { create: stripeMocks.stripeCreate } },
          },
    }));

    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({ get: vi.fn(() => undefined) }),
    }));

    vi.doMock('@/lib/language', () => ({
      normalizeLanguage: vi.fn().mockReturnValue('es'),
      languageToStripeLocale: vi.fn().mockReturnValue('es'),
    }));

    vi.doMock('@/lib/course-translations', () => ({
      getCourseTranslationBundle: vi.fn().mockResolvedValue({ courses: new Map() }),
      resolveCourseText: vi.fn().mockReturnValue({ title: 'Jazz Curso', description: 'Desc' }),
    }));

    vi.doMock('@/lib/pricing', () => ({
      DEFAULT_FULL_COURSE_PRICE_EUR: 29.99,
    }));
  }

  test('creates Stripe checkout session for paid course', async () => {
    setupCheckoutMocks();

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1', paymentMethod: 'card' });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/session');
    expect(stripeMocks.stripeCreate).toHaveBeenCalledTimes(1);
  });

  test('creates Stripe session with auto payment methods when no method specified', async () => {
    setupCheckoutMocks();

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/session');
  });

  test('uses Stripe customer_creation flow when no existing customer is found', async () => {
    setupCheckoutMocks({ customers: [] });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(stripeMocks.customersCreate).not.toHaveBeenCalled();
  });

  test('falls back to card-only when multi-method throws StripeInvalidRequestError', async () => {
    // Prepare a shared error class that both the mock and thrown error use
    class StripeInvalidRequestError extends Error {
      type = 'StripeInvalidRequestError';
      param: string;
      constructor(msg: string, param?: string) {
        super(msg);
        this.param = param ?? '';
      }
    }

    vi.doMock('stripe', () => {
      const StripeMod = Object.assign(function() {}, {
        errors: { StripeInvalidRequestError },
      });
      return { default: StripeMod, __esModule: true };
    });

    setupCheckoutMocks();
    let callCount = 0;
    stripeMocks.stripeCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new StripeInvalidRequestError('The payment method type "bizum" is not activated', 'payment_method_types');
      }
      return Promise.resolve({ url: 'https://checkout.stripe.com/fallback' });
    });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    const body = await res.json();

    // First call fails → fallback → second call succeeds
    expect(stripeMocks.stripeCreate).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/fallback');
  });

  test('returns 400 when even card-only fallback throws payment method error', async () => {
    // Shared error class
    class StripeInvalidRequestError extends Error {
      type = 'StripeInvalidRequestError';
      param: string;
      constructor(msg: string, param?: string) {
        super(msg);
        this.param = param ?? '';
      }
    }

    vi.doMock('stripe', () => {
      const StripeMod = Object.assign(function() {}, {
        errors: { StripeInvalidRequestError },
      });
      return { default: StripeMod, __esModule: true };
    });

    setupCheckoutMocks();
    // Both calls throw the same error
    stripeMocks.stripeCreate.mockImplementation(() => {
      throw new StripeInvalidRequestError('payment method not available', 'payment_method_types');
    });

    const { POST } = await import('@/app/api/checkout/route');
    const req = createCheckoutRequest({ courseId: 'c1' });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
