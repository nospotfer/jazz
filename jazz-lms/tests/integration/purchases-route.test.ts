import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchaseFindMany: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    purchase: { findMany: mocks.purchaseFindMany },
  },
}));

describe('GET /api/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 when unauthenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  test('returns empty array when no purchases', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mocks.purchaseFindMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  test('returns formatted purchase list', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mocks.purchaseFindMany.mockResolvedValue([
      {
        id: 'p1',
        course: { title: 'Jazz Basics', price: 29.99 },
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
      {
        id: 'p2',
        course: { title: 'Advanced Harmony', price: 0 },
        createdAt: new Date('2026-02-20T14:30:00Z'),
      },
    ]);

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({
      id: 'p1',
      itemType: 'Curso',
      itemTitle: 'Jazz Basics',
      amount: 29.99,
      createdAt: '2026-01-15T10:00:00.000Z',
      currency: 'EUR',
    });
    expect(body[1].amount).toBe(0);
  });

  test('returns 500 on internal error', async () => {
    mocks.getUser.mockRejectedValue(new Error('db down'));

    const { GET } = await import('@/app/api/purchases/route');
    const response = await GET();

    expect(response.status).toBe(500);
  });
});
