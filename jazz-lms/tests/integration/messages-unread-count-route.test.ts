import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensureTables: vi.fn(),
  getUser: vi.fn(),
  queryRawUnsafe: vi.fn(),
}));

vi.mock('@/lib/messages-db', () => ({
  ensureMessagingTables: mocks.ensureTables,
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
    $queryRawUnsafe: mocks.queryRawUnsafe,
  },
}));

describe('GET /api/messages/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureTables.mockResolvedValue(undefined);
  });

  test('returns 401 when unauthenticated', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  test('returns unread count for professor path', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'p1', email: 'culturadeljazz@gmail.com' } },
    });
    mocks.queryRawUnsafe.mockResolvedValue([{ count: 7 }]);

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(7);
  });

  test('returns unread count for student path', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u'1", email: 'student@example.com' } },
    });
    mocks.queryRawUnsafe.mockResolvedValue([{ count: 2 }]);

    const { GET } = await import('@/app/api/messages/unread-count/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(2);
  });
});
