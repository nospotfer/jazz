import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Contract tests validate the shape and types of API responses,
 * ensuring the API contract is maintained across changes.
 */

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchaseFindMany: vi.fn(),
  purchaseFindFirst: vi.fn(),
  findUser: vi.fn(),
  findCourses: vi.fn(),
  findLessonPurchases: vi.fn(),
  findPurchases: vi.fn(),
  queryRawUnsafe: vi.fn(),
  ensureTables: vi.fn(),
  isAdminRole: vi.fn(),
  cookies: vi.fn(),
  normalizeLanguage: vi.fn(),
  languageToStripeLocale: vi.fn(),
  getCourseTranslationBundle: vi.fn(),
  resolveCourseText: vi.fn(),
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
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: { findUnique: mocks.findUser },
    course: { findMany: mocks.findCourses, findUnique: vi.fn() },
    lessonPurchase: { findMany: mocks.findLessonPurchases },
    $queryRawUnsafe: mocks.queryRawUnsafe,
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

describe('API Contract: /api/purchases response shape', () => {
  beforeEach(() => vi.clearAllMocks());

  test('each purchase has required fields with correct types', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mocks.purchaseFindMany.mockResolvedValue([
      {
        id: 'p1',
        course: { title: 'Jazz 101', price: 29.99 },
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();
    const body = await response.json();

    expect(Array.isArray(body)).toBe(true);
    for (const item of body) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('itemType');
      expect(item).toHaveProperty('itemTitle');
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('currency');
      expect(typeof item.id).toBe('string');
      expect(typeof item.itemTitle).toBe('string');
      expect(typeof item.amount).toBe('number');
      expect(item.currency).toBe('EUR');
      expect(item.itemType).toBe('Curso');
      // Validate ISO date format
      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
    }
  });
});

describe('API Contract: /api/dashboard/pdf-count response shape', () => {
  beforeEach(() => vi.clearAllMocks());

  test('returns { count: number }', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } } });
    mocks.findUser.mockResolvedValue({ role: 'USER' });
    mocks.isAdminRole.mockReturnValue(false);
    mocks.purchaseFindFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveProperty('count');
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThanOrEqual(0);
  });
});

describe('API Contract: /api/messages/unread-count response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureTables.mockResolvedValue(undefined);
  });

  test('returns { count: number }', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'student@example.com' } },
    });
    mocks.queryRawUnsafe.mockResolvedValue([{ count: 3 }]);

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveProperty('count');
    expect(typeof body.count).toBe('number');
    expect(body.count).toBeGreaterThanOrEqual(0);
  });
});

describe('API Contract: /api/checkout response shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue('es');
    mocks.languageToStripeLocale.mockReturnValue('es');
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({ title: 'Curso', description: 'Desc' });
  });

  test('error responses contain text body with non-empty string', async () => {
    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('API Contract: /api/lesson-checkout is deprecated', () => {
  test('returns 410 with Spanish deprecation message', async () => {
    const { POST } = await import('@/app/api/lesson-checkout/route');
    const response = await POST();
    const text = await response.text();

    expect(response.status).toBe(410);
    expect(text.length).toBeGreaterThan(0);
  });
});
