import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * System / Functional tests validate complete user flows through
 * multiple API layers, simulating real usage patterns.
 */

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  courseFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseUpsert: vi.fn(),
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
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    course: { findUnique: mocks.courseFindUnique, findMany: mocks.findCourses },
    purchase: {
      findUnique: mocks.purchaseFindUnique,
      upsert: mocks.purchaseUpsert,
      findMany: mocks.purchaseFindMany,
      findFirst: mocks.purchaseFindFirst,
    },
    user: { findUnique: mocks.findUser },
    lessonPurchase: { findMany: mocks.findLessonPurchases },
    $transaction: async (callback: (tx: any) => Promise<any>) => callback({
      purchase: {
        upsert: mocks.purchaseUpsert,
      },
    }),
  },
}));

vi.mock('@/lib/stripe', () => ({ stripe: null }));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('@/lib/language', () => ({
  LANGUAGE_COOKIE_KEY: 'jazz_lang',
  normalizeLanguage: mocks.normalizeLanguage,
  languageToStripeLocale: mocks.languageToStripeLocale,
}));

vi.mock('@/lib/course-translations', () => ({
  getCourseTranslationBundle: mocks.getCourseTranslationBundle,
  resolveCourseText: mocks.resolveCourseText,
}));

vi.mock('@/lib/admin/permissions', () => ({
  isAdminRole: mocks.isAdminRole,
}));

describe('Functional: Free course purchase flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue('es');
    mocks.languageToStripeLocale.mockReturnValue('es');
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({ title: 'Curso Gratis', description: 'Desc' });
  });

  test('user can checkout and get redirected for a free course', async () => {
    const userId = 'u-student-1';
    const courseId = 'course-free';

    mocks.getUser.mockResolvedValue({
      data: { user: { id: userId, email: 'student@example.com' } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: courseId,
      title: 'Intro Jazz',
      description: 'Free course',
      price: 0,
      isPublished: true,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.purchaseUpsert.mockResolvedValue({ id: 'p-new' });

    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ courseId, source: 'dashboard' }),
    });

    const res = await POST(req);
    const body = await res.json();

    // Step 1: Purchase created successfully
    expect(res.status).toBe(200);
    expect(mocks.purchaseUpsert).toHaveBeenCalledTimes(1);
    // Step 2: Redirect to dashboard with success
    expect(body.url).toContain('/dashboard');
    expect(body.url).toContain('purchase=success');
  });

  test('user cannot purchase same free course twice', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'student@example.com' } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: 'c1', title: 'Jazz', description: '', price: 0,
    });
    mocks.purchaseFindUnique.mockResolvedValue({ id: 'existing-purchase' });

    const { POST } = await import('@/app/api/checkout/route');
    const req = new Request('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ courseId: 'c1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('Functional: Privileged user PDF access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'es' })) });
  });

  test('admin sees all PDFs without needing purchases', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u-admin', email: 'admin@jazz.com' } },
    });
    mocks.findUser.mockResolvedValue({ role: 'SUPER_ADMIN' });
    mocks.isAdminRole.mockReturnValue(true);
    mocks.purchaseFindMany.mockResolvedValue([]);
    mocks.findLessonPurchases.mockResolvedValue([]);
    mocks.findCourses.mockResolvedValue([
      {
        id: 'c1',
        chapters: [{
          lessons: [
            { id: 'l1', attachments: [{ id: 'a1' }, { id: 'a2' }] },
            { id: 'l2', attachments: [{ id: 'a3' }] },
          ],
        }],
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(3);
  });

  test('regular user only sees PDFs from purchased courses', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'u-regular', email: 'user@example.com' } },
    });
    mocks.findUser.mockResolvedValue({ role: 'USER' });
    mocks.isAdminRole.mockReturnValue(false);
    mocks.purchaseFindFirst.mockResolvedValue({ id: 'p1' });
    mocks.purchaseFindMany.mockResolvedValue([{ courseId: 'c1' }]);
    mocks.findLessonPurchases.mockResolvedValue([]);
    mocks.findCourses.mockResolvedValue([
      {
        id: 'c1',
        chapters: [{
          lessons: [
            { id: 'l1', attachments: [{ id: 'a1' }] },
            { id: 'l2', attachments: [{ id: 'a2' }] },
          ],
        }],
      },
      {
        id: 'c2',
        chapters: [{
          lessons: [
            { id: 'l3', attachments: [{ id: 'a3' }, { id: 'a4' }] },
          ],
        }],
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    // User only purchased c1, so only gets 2 attachments from c1
    expect(body.count).toBe(2);
  });
});

describe('Functional: Purchase history access', () => {
  beforeEach(() => vi.clearAllMocks());

  test('user sees their own purchase history in chronological order', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mocks.purchaseFindMany.mockResolvedValue([
      {
        id: 'p2',
        course: { title: 'Advanced', price: 29.99 },
        createdAt: new Date('2026-03-01'),
      },
      {
        id: 'p1',
        course: { title: 'Basics', price: 0 },
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveLength(2);
    expect(body[0].itemTitle).toBe('Advanced');
    expect(body[1].itemTitle).toBe('Basics');
    // All have EUR
    expect(body.every((p: Record<string, unknown>) => p.currency === 'EUR')).toBe(true);
  });
});
