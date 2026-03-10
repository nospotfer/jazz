import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Security tests verify:
 * - Authentication enforcement on protected routes
 * - Authorization boundaries (role-based access)
 * - Input sanitization (SQL injection, XSS)
 * - Header security
 * - Sensitive data exposure
 */

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  ensureTables: vi.fn(),
  queryRawUnsafe: vi.fn(),
  purchaseFindMany: vi.fn(),
  purchaseFindFirst: vi.fn(),
  findUser: vi.fn(),
  findCourses: vi.fn(),
  findLessonPurchases: vi.fn(),
  isAdminRole: vi.fn(),
  cookies: vi.fn(),
  normalizeLanguage: vi.fn(),
  languageToStripeLocale: vi.fn(),
  getCourseTranslationBundle: vi.fn(),
  resolveCourseText: vi.fn(),
  purchaseCreate: vi.fn(),
  purchaseFindUnique: vi.fn(),
  courseFindUnique: vi.fn(),
  isLocalTestRequest: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    purchase: {
      findMany: mocks.purchaseFindMany,
      findFirst: mocks.purchaseFindFirst,
      findUnique: mocks.purchaseFindUnique,
      create: mocks.purchaseCreate,
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: { findUnique: mocks.findUser },
    course: { findMany: mocks.findCourses, findUnique: mocks.courseFindUnique },
    lessonPurchase: {
      findMany: mocks.findLessonPurchases,
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    userProgress: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $queryRawUnsafe: mocks.queryRawUnsafe,
    $transaction: mocks.$transaction,
  },
}));

vi.mock('@/lib/messages-db', () => ({
  ensureMessagingTables: mocks.ensureTables,
}));

vi.mock('@/lib/admin/permissions', () => ({
  isAdminRole: mocks.isAdminRole,
}));

vi.mock('@/lib/stripe', () => ({ stripe: null }));

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

vi.mock('@/lib/test-mode', () => ({
  isLocalTestRequest: mocks.isLocalTestRequest,
}));

describe('Security: Authentication enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureTables.mockResolvedValue(undefined);
  });

  test('purchases route rejects unauthenticated requests', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  test('pdf-count route rejects unauthenticated requests', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  test('unread-count route rejects missing email', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: null } } });

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();
    expect(response.status).toBe(401);
  });

  test('checkout route rejects unauthenticated requests', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue('es');

    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ courseId: 'c1' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('Security: Input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue('es');
    mocks.languageToStripeLocale.mockReturnValue('es');
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({ title: 'Curso', description: 'Desc' });
  });

  test('checkout rejects empty courseId', async () => {
    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ courseId: '' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  test('checkout rejects unsupported payment methods', async () => {
    const { POST } = await import('@/app/api/checkout/route');

    for (const method of ['bitcoin', 'pix', 'cash', '<script>alert(1)</script>', "'; DROP TABLE--"]) {
      const req = new Request('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({ courseId: 'c1', paymentMethod: method }),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    }
  });
});

describe('Security: SQL injection protection in unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureTables.mockResolvedValue(undefined);
  });

  test('user ID with SQL injection attempt is properly escaped', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1'; DROP TABLE Message;--", email: 'student@test.com' } },
    });
    mocks.queryRawUnsafe.mockResolvedValue([{ count: 0 }]);

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();

    // Verify it didn't crash and the SQL was called with escaped values
    expect(response.status).toBe(200);
    const call = mocks.queryRawUnsafe.mock.calls[0][0] as string;
    // The route escapes single quotes by doubling them
    expect(call).toContain("u1''; DROP TABLE Message;--");
    expect(call).not.toContain("u1'; DROP TABLE");
  });

  test('email with SQL injection attempt is properly escaped', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: "student@test.com' OR 1=1;--" } },
    });
    mocks.queryRawUnsafe.mockResolvedValue([{ count: 0 }]);

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const call = mocks.queryRawUnsafe.mock.calls[0][0] as string;
    expect(call).toContain("student@test.com'' OR 1=1;--");
  });
});

describe('Security: Dev endpoint protection', () => {
  beforeEach(() => vi.clearAllMocks());

  test('reset-test-purchases returns 404 for non-local requests', async () => {
    mocks.isLocalTestRequest.mockReturnValue(false);

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const req = new Request('http://production.example.com/api/dev/reset-test-purchases', {
      method: 'POST',
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  test('reset-test-purchases requires authentication even locally', async () => {
    mocks.isLocalTestRequest.mockReturnValue(true);
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const req = new Request('http://localhost:3000/api/dev/reset-test-purchases', {
      method: 'POST',
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('Security: Header validation in Stripe webhook', () => {
  const webhookMocks = vi.hoisted(() => ({
    stripe: {
      webhooks: { constructEvent: vi.fn() },
    },
    headers: vi.fn(),
  }));

  test('missing Stripe-Signature header returns 400', async () => {
    vi.doMock('@/lib/stripe', () => ({ stripe: webhookMocks.stripe }));
    vi.doMock('next/headers', () => ({
      headers: () => Promise.resolve({ get: () => null }),
    }));

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const response = await POST(req);

    expect(response.status).toBe(400);

    vi.doUnmock('@/lib/stripe');
    vi.doUnmock('next/headers');
  });
});

describe('Security: Permissions boundary', () => {
  test('non-admin roles cannot access admin permissions', async () => {
    const actual = await vi.importActual<typeof import('@/lib/admin/permissions')>('@/lib/admin/permissions');

    expect(actual.hasPermission('USER', 'admin.access')).toBe(false);
    expect(actual.hasPermission('USER', 'courses.delete')).toBe(false);
    expect(actual.hasPermission('USER', 'users.assign_role')).toBe(false);
    expect(actual.hasPermission('USER', 'settings.update')).toBe(false);
    expect(actual.isAdminRole('USER')).toBe(false);
  });

  test('MODERATOR cannot escalate to higher permissions', async () => {
    const actual = await vi.importActual<typeof import('@/lib/admin/permissions')>('@/lib/admin/permissions');

    expect(actual.hasPermission('MODERATOR', 'courses.create')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'courses.update')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'courses.delete')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'users.update')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'users.assign_role')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'settings.read')).toBe(false);
    expect(actual.hasPermission('MODERATOR', 'settings.update')).toBe(false);
  });
});
