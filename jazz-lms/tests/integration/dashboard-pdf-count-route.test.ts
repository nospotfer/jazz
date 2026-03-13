import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findUser: vi.fn(),
  findPurchaseFirst: vi.fn(),
  findPurchases: vi.fn(),
  findLessonPurchases: vi.fn(),
  findCourses: vi.fn(),
  isAdminRole: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock('@/lib/admin/permissions', () => ({
  isAdminRole: mocks.isAdminRole,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: mocks.findUser },
    purchase: {
      findFirst: mocks.findPurchaseFirst,
      findMany: mocks.findPurchases,
    },
    lessonPurchase: { findMany: mocks.findLessonPurchases },
    course: { findMany: mocks.findCourses },
  },
}));

describe('GET /api/dashboard/pdf-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminRole.mockReturnValue(false);
    mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'es' })) });
  });

  test('returns 401 with zero when unauthenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.count).toBe(0);
  });

  test('returns zero for non-privileged user without purchases', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'student@example.com' } } });
    mocks.findUser.mockResolvedValue({ role: 'USER' });
    mocks.findPurchaseFirst.mockResolvedValue(null);

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(0);
  });

  test('returns attachment count for privileged viewers', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u-admin', email: 'admin@example.com' } } });
    mocks.findUser.mockResolvedValue({ role: 'SUPER_ADMIN' });
    mocks.isAdminRole.mockReturnValue(true);

    mocks.findPurchases.mockResolvedValue([]);
    mocks.findLessonPurchases.mockResolvedValue([]);
    mocks.findCourses.mockResolvedValue([
      {
        id: 'c1',
        chapters: [
          {
            lessons: [
              {
                id: 'l1',
                attachments: [
                  { id: 'a1', name: 'Clase 1_ La Esencia del Jazz - Apuntes.pdf', url: 'https://cdn.test/Clase%201_%20La%20Esencia%20del%20Jazz%20-%20Apuntes.pdf' },
                  { id: 'a2', name: 'Clase 2_ El Lenguaje del Jazz_ Heterogeneidad Sonora - Apuntes.pdf', url: 'https://cdn.test/Clase%202_%20El%20Lenguaje%20del%20Jazz_%20Heterogeneidad%20Sonora%20-%20Apuntes.pdf' },
                ],
              },
              {
                id: 'l2',
                attachments: [
                  { id: 'a3', name: 'Clase 3_ Gospel y Blues_ Las Raices Profundas - Apuntes.pdf', url: 'https://cdn.test/Clase%203_%20Gospel%20y%20Blues_%20Las%20Raices%20Profundas%20-%20Apuntes.pdf' },
                ],
              },
            ],
          },
        ],
      },
    ]);

    const { GET } = await import('@/app/api/dashboard/pdf-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(3);
  });
});
