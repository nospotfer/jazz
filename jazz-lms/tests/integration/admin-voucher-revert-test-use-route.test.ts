import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('POST /api/admin/vouchers/revert-test-use', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq(body?: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/admin/vouchers/revert-test-use', {
      method: 'POST',
      body: JSON.stringify(body || {}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  test('returns auth response when admin permission fails', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: false,
        response: new Response('Forbidden', { status: 403 }),
        userId: null,
      }),
    }));

    vi.doMock('@/lib/db', () => ({ db: {} }));

    const { POST } = await import('@/app/api/admin/vouchers/revert-test-use/route');
    const response = await POST(makeReq());

    expect(response.status).toBe(403);
  });

  test('returns 404 when no matching purchase is found', async () => {
    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: true,
        userId: 'admin-1',
      }),
    }));

    vi.doMock('@/lib/db', () => ({
      db: {
        purchase: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    }));

    const { POST } = await import('@/app/api/admin/vouchers/revert-test-use/route');
    const response = await POST(makeReq({ voucherCode: 'LOUISARMSTRONG100' }));

    expect(response.status).toBe(404);
  });

  test('reverts purchase and decrements voucher usage', async () => {
    const voucherUpdate = vi.fn().mockResolvedValue({ id: 'v1' });

    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({
        ok: true,
        userId: 'admin-1',
      }),
    }));

    vi.doMock('@/lib/db', () => ({
      db: {
        purchase: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'p1',
            userId: 'admin-1',
            courseId: 'c1',
            voucherId: 'v1',
            voucher: {
              id: 'v1',
              code: 'LOUISARMSTRONG100',
              currentUses: 1,
            },
            redemption: {
              id: 'vr1',
              voucherId: 'v1',
            },
          }),
        },
        $transaction: async (callback: (tx: any) => Promise<unknown>) =>
          callback({
            voucherCode: {
              findUnique: vi.fn().mockResolvedValue({ currentUses: 1 }),
              update: voucherUpdate,
            },
            voucherRedemption: {
              findFirst: vi.fn().mockResolvedValue({ id: 'vr1', voucherId: 'v1' }),
              deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            discountApplied: {
              deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            purchase: {
              delete: vi.fn().mockResolvedValue({ id: 'p1' }),
            },
          }),
      },
    }));

    const { POST } = await import('@/app/api/admin/vouchers/revert-test-use/route');
    const response = await POST(makeReq({ voucherCode: 'louisarmstrong100' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(voucherUpdate).toHaveBeenCalledTimes(1);
  });
});
