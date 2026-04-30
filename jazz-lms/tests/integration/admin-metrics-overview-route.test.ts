import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

function makeReq(range = '30d') {
  return new Request(`http://localhost:3000/api/admin/metrics/overview?range=${range}`, {
    method: 'GET',
  });
}

describe('GET /api/admin/metrics/overview', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns 403 when admin permission check fails', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: false,
        response: new Response('Forbidden', { status: 403 }),
      }),
    }));
    vi.doMock('@/lib/admin/metrics-db', () => ({
      isRangeKey: vi.fn(),
      resolveRange: vi.fn(),
      getOverview: vi.fn(),
    }));
    vi.doMock('@/lib/admin/metrics-ga', () => ({
      getTrafficOverview: vi.fn(),
    }));

    const { GET } = await import('@/app/api/admin/metrics/overview/route');
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  test('returns 200 with aggregated KPIs and traffic when authorized', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({ ok: true, userId: 'user-1' }),
    }));
    vi.doMock('@/lib/admin/metrics-db', async () => {
      const actual = await vi.importActual<typeof import('@/lib/admin/metrics-db')>(
        '@/lib/admin/metrics-db'
      );
      return {
        ...actual,
        getOverview: vi.fn().mockResolvedValue({
          revenue: { value: 1200, delta: 0.25 },
          enrollments: { value: 12, delta: null },
          averageTicket: { value: 100, delta: 0 },
          newStudents: { value: 5, delta: 1 },
          completionRate: { value: 0.42, delta: 0.05 },
          vouchersRedeemed: { value: 3, delta: null },
          medalsEarned: { value: 17, delta: 0.3 },
        }),
      };
    });
    vi.doMock('@/lib/admin/metrics-ga', () => ({
      getTrafficOverview: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          sessions: 420,
          users: 250,
          topPages: [],
          sources: [],
        },
      }),
    }));

    const { GET } = await import('@/app/api/admin/metrics/overview/route');
    const res = await GET(makeReq('30d'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.range.key).toBe('30d');
    expect(body.data.revenue.value).toBe(1200);
    expect(body.data.traffic).toEqual({ value: 420, users: 250 });
  });

  test('reports traffic unavailable when GA4 envs are missing', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({ ok: true, userId: 'user-1' }),
    }));
    vi.doMock('@/lib/admin/metrics-db', async () => {
      const actual = await vi.importActual<typeof import('@/lib/admin/metrics-db')>(
        '@/lib/admin/metrics-db'
      );
      return {
        ...actual,
        getOverview: vi.fn().mockResolvedValue({
          revenue: { value: 0, delta: null },
          enrollments: { value: 0, delta: null },
          averageTicket: { value: 0, delta: null },
          newStudents: { value: 0, delta: null },
          completionRate: { value: 0, delta: null },
          vouchersRedeemed: { value: 0, delta: null },
          medalsEarned: { value: 0, delta: null },
        }),
      };
    });
    vi.doMock('@/lib/admin/metrics-ga', () => ({
      getTrafficOverview: vi.fn().mockResolvedValue({
        unavailable: true,
        reason: 'missing_env',
      }),
    }));

    const { GET } = await import('@/app/api/admin/metrics/overview/route');
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.data.traffic).toEqual({ unavailable: true, reason: 'missing_env' });
  });
});
