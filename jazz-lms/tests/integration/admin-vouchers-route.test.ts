import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('GET /api/admin/vouchers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq(query = '') {
    return new Request(`http://localhost:3000/api/admin/vouchers${query}`, {
      method: 'GET',
    });
  }

  test('returns auth response when admin permission fails', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: false,
        response: new Response('Forbidden', { status: 403 }),
      }),
    }));

    vi.doMock('@/lib/db', () => ({ db: {} }));
    vi.doMock('@/lib/voucher-artists', () => ({
      getVoucherArtistByKey: vi.fn().mockReturnValue(null),
    }));

    const { GET } = await import('@/app/api/admin/vouchers/route');
    const response = await GET(makeReq());

    expect(response.status).toBe(403);
  });

  test('returns generated, used and available voucher stats', async () => {
    const voucherCodeFindMany = vi
      .fn()
      .mockImplementation((args?: Record<string, unknown>) => {
        if (args && 'select' in args) {
          return Promise.resolve([
            { currentUses: 0, maxUses: 1 },
            { currentUses: 1, maxUses: 1 },
            { currentUses: 3, maxUses: null },
          ]);
        }

        return Promise.resolve([]);
      });

    const voucherCodeCount = vi
      .fn()
      .mockResolvedValueOnce(12) // generated
      .mockResolvedValueOnce(5) // used
      .mockResolvedValueOnce(8) // active
      .mockResolvedValueOnce(2); // expired

    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: true,
        userId: 'admin-1',
      }),
    }));

    vi.doMock('@/lib/voucher-artists', () => ({
      getVoucherArtistByKey: vi.fn().mockReturnValue(null),
    }));

    vi.doMock('@/lib/db', () => ({
      db: {
        voucherCode: {
          findMany: voucherCodeFindMany,
          count: voucherCodeCount,
        },
      },
    }));

    const { GET } = await import('@/app/api/admin/vouchers/route');
    const response = await GET(makeReq('?status=all'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.stats.generated).toBe(12);
    expect(body.stats.total).toBe(12);
    expect(body.stats.used).toBe(5);
    expect(body.stats.available).toBe(2);
    expect(body.stats.active).toBe(8);
    expect(body.stats.expired).toBe(2);
    expect(voucherCodeFindMany).toHaveBeenCalledTimes(2);
    expect(voucherCodeCount).toHaveBeenCalledTimes(4);
  });
});
