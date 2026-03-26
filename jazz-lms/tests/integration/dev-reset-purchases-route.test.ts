import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('POST /api/dev/reset-test-purchases', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq(url = 'http://localhost:3000/api/dev/reset-test-purchases') {
    return new Request(url, { method: 'POST' });
  }

  test('returns 404 for non-local requests', async () => {
    vi.doMock('@/lib/test-mode', () => ({
      isLocalTestRequest: vi.fn().mockReturnValue(false),
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser: vi.fn() } }),
    }));
    vi.doMock('@/lib/db', () => ({ db: {} }));

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const response = await POST(makeReq('http://production.example.com/api/dev/reset-test-purchases'));
    expect(response.status).toBe(404);
  });

  test('returns 401 when user is not authenticated', async () => {
    vi.doMock('@/lib/test-mode', () => ({
      isLocalTestRequest: vi.fn().mockReturnValue(true),
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      }),
    }));
    vi.doMock('@/lib/db', () => ({ db: {} }));

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(401);
  });

  test('deletes all user test data and returns counts', async () => {
    vi.doMock('@/lib/test-mode', () => ({
      isLocalTestRequest: vi.fn().mockReturnValue(true),
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }),
    }));

    const $transaction = vi.fn().mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        voucherRedemption: {
          findMany: vi.fn().mockResolvedValue([{ voucherId: 'v1' }, { voucherId: 'v1' }]),
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        voucherCode: {
          findUnique: vi.fn().mockResolvedValue({ currentUses: 3 }),
          update: vi.fn().mockResolvedValue({ id: 'v1' }),
        },
        discountApplied: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        purchase: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
        userProgress: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
        lessonPurchase: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      })
    );
    vi.doMock('@/lib/db', () => ({
      db: {
        $transaction,
      },
    }));

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const response = await POST(makeReq());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.deletedPurchases).toBe(2);
    expect(body.deletedProgress).toBe(5);
    expect(body.deletedLessonPurchases).toBe(1);
    expect(body.deletedRedemptions).toBe(2);
    expect(body.deletedDiscounts).toBe(2);
  });

  test('skips null or missing vouchers while rolling back usage counters', async () => {
    vi.doMock('@/lib/test-mode', () => ({
      isLocalTestRequest: vi.fn().mockReturnValue(true),
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }),
    }));

    const updateVoucher = vi.fn().mockResolvedValue({ id: 'v1' });
    const $transaction = vi.fn().mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
      callback({
        voucherRedemption: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ voucherId: null }, { voucherId: 'v-missing' }, { voucherId: 'v1' }]),
          deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
        voucherCode: {
          findUnique: vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ currentUses: 2 }),
          update: updateVoucher,
        },
        discountApplied: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        purchase: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        userProgress: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        lessonPurchase: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      })
    );
    vi.doMock('@/lib/db', () => ({
      db: {
        $transaction,
      },
    }));

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const response = await POST(makeReq());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateVoucher).toHaveBeenCalledTimes(1);
  });

  test('returns 500 on internal error', async () => {
    vi.doMock('@/lib/test-mode', () => ({
      isLocalTestRequest: vi.fn().mockReturnValue(true),
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      }),
    }));
    vi.doMock('@/lib/db', () => ({
      db: {
        $transaction: vi.fn().mockRejectedValue(new Error('db error')),
      },
    }));

    const { POST } = await import('@/app/api/dev/reset-test-purchases/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(500);
  });
});
