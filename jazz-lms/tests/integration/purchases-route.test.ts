import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchaseFindMany: vi.fn(),
  purchaseFindUnique: vi.fn(),
  listRecentLemonOrdersByEmail: vi.fn(),
  retrieveLemonOrder: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
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
      findUnique: mocks.purchaseFindUnique,
    },
  },
}));

vi.mock('@/lib/lemon-squeezy', () => ({
  listRecentLemonOrdersByEmail: mocks.listRecentLemonOrdersByEmail,
  retrieveLemonOrder: mocks.retrieveLemonOrder,
}));

vi.mock('@/lib/course-purchase-sync', () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
}));

describe('GET /api/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
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

describe('POST /api/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([]);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    process.env.LEMON_SQUEEZY_API_KEY = 'lsk_test_123';
  });

  test('returns 400 when action is invalid', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
      })
    );

    expect(response.status).toBe(400);
  });

  test('returns 200/database when purchase already exists', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue({ id: 'p1' });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ purchased: true, source: 'database' });
    expect(mocks.retrieveLemonOrder).not.toHaveBeenCalled();
  });

  test('returns 202/pending_webhook when order id is missing and no recent paid match is found', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([]);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ purchased: false, reason: 'pending_webhook' });
    expect(mocks.listRecentLemonOrdersByEmail).toHaveBeenCalledWith({
      email: 'admin@neurofactory.net',
      withinMinutes: 30,
    });
    expect(mocks.retrieveLemonOrder).not.toHaveBeenCalled();
  });

  test('reconciles without orderId when exactly one recent paid order matches email and metadata', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([
      {
        id: 'recent-order-1',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          subtotal: 2999,
          total: 1794,
          discount_code: 'PROVIDER40',
          custom_data: {
            userId: 'u1',
            courseId: 'course-1',
            voucherCode: 'JAZZRECENT40',
          },
        },
      },
    ]);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: 'reconciled_recent_order',
      providerReferenceId: 'ls-order:recent-order-1',
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'u1',
      courseId: 'course-1',
      providerReferenceId: 'ls-order:recent-order-1',
      originalPrice: 29.99,
      discountAmount: 12.05,
      finalPrice: 17.94,
      localVoucherCode: 'JAZZRECENT40',
      providerDiscountCode: 'PROVIDER40',
    });
    expect(mocks.retrieveLemonOrder).not.toHaveBeenCalled();
  });

  test('returns 202/pending_webhook when recent orders are ambiguous', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([
      {
        id: 'recent-order-1',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          custom_data: { userId: 'u1', courseId: 'course-1' },
        },
      },
      {
        id: 'recent-order-2',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          custom_data: { userId: 'u1', courseId: 'course-1' },
        },
      },
    ]);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ purchased: false, reason: 'pending_webhook' });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('reconciles ambiguous recent orders when checkoutAttemptId matches exactly one candidate', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([
      {
        id: 'recent-order-1',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          subtotal: 2999,
          total: 2999,
          custom_data: {
            userId: 'u1',
            courseId: 'course-1',
            checkoutAttemptId: 'attempt-a',
          },
        },
      },
      {
        id: 'recent-order-2',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          subtotal: 2999,
          total: 2999,
          custom_data: {
            userId: 'u1',
            courseId: 'course-1',
            checkoutAttemptId: 'attempt-b',
          },
        },
      },
    ]);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reconcile',
          courseId: 'course-1',
          checkoutAttemptId: 'attempt-b',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: 'reconciled_recent_order',
      providerReferenceId: 'ls-order:recent-order-2',
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        providerReferenceId: 'ls-order:recent-order-2',
      })
    );
  });

  test('returns 202/pending_webhook when recent order lacks course metadata', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockResolvedValue([
      {
        id: 'recent-order-3',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          subtotal: 2999,
          total: 1794,
        },
      },
    ]);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ purchased: false, reason: 'pending_webhook' });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('reconciles paid Lemon order with custom_data and persists provider/local voucher fields', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-1',
      attributes: {
        status: 'paid',
        user_email: 'admin@neurofactory.net',
        subtotal: 2999,
        total: 1794,
        discount_code: 'PROVIDER40',
        custom_data: {
          userId: 'u1',
          courseId: 'course-1',
          voucherCode: 'CABCALLOWAY40011512',
        },
      },
    });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: 'reconciled',
      providerReferenceId: 'ls-order:order-1',
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'u1',
      courseId: 'course-1',
      providerReferenceId: 'ls-order:order-1',
      originalPrice: 29.99,
      discountAmount: 12.05,
      finalPrice: 17.94,
      localVoucherCode: 'CABCALLOWAY40011512',
      providerDiscountCode: 'PROVIDER40',
    });
  });

  test('reconciles using first_order_item.order_data.custom_data fallback', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-2',
      attributes: {
        status: 'paid',
        user_email: 'admin@neurofactory.net',
        subtotal: 2999,
        total: 1794,
        discount_code: 'PROVIDER40',
        first_order_item: {
          order_data: {
            custom_data: {
              userId: 'u1',
              courseId: 'course-1',
              voucherCode: 'CABCALLOWAY40020440',
              providerDiscountCode: 'PROVIDER40',
            },
          },
        },
      },
    });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-2' }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        localVoucherCode: 'CABCALLOWAY40020440',
        providerDiscountCode: 'PROVIDER40',
      })
    );
  });

  test('reconciles paid Lemon order without any discount code', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-no-discount',
      attributes: {
        status: 'paid',
        user_email: 'admin@neurofactory.net',
        subtotal: 2999,
        total: 2999,
        custom_data: {
          userId: 'u1',
          courseId: 'course-1',
        },
      },
    });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-no-discount' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      purchased: true,
      source: 'reconciled',
      providerReferenceId: 'ls-order:order-no-discount',
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'u1',
      courseId: 'course-1',
      providerReferenceId: 'ls-order:order-no-discount',
      originalPrice: 29.99,
      discountAmount: 0,
      finalPrice: 29.99,
      localVoucherCode: null,
      providerDiscountCode: null,
    });
  });

  test('reconciles with snake_case metadata keys', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-4',
      attributes: {
        status: 'paid',
        user_email: 'admin@neurofactory.net',
        subtotal: 2999,
        total: 1794,
        custom_data: {
          user_id: 'u1',
          course_id: 'course-1',
          voucher_code: 'JAZZSNAKE40',
          provider_discount_code: 'PROVIDER40',
        },
      },
    });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-4' }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        localVoucherCode: 'JAZZSNAKE40',
        providerDiscountCode: 'PROVIDER40',
      })
    );
  });

  test('returns 403 when Lemon order email mismatches current user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-3',
      attributes: {
        status: 'paid',
        user_email: 'other@neurofactory.net',
      },
    });

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-3' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ purchased: false, reason: 'order_user_mismatch' });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('returns 202/pending_webhook when recent orders lookup fails in provider', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.listRecentLemonOrdersByEmail.mockRejectedValue(new Error('Lemon API failed (403): forbidden'));

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ purchased: false, reason: 'pending_webhook' });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('returns 503/provider_unavailable when retrieve order fails in provider', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockRejectedValue(new Error('Lemon API failed (401): unauthorized'));

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-401' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ purchased: false, reason: 'provider_unavailable' });
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('returns 503/database_schema_mismatch when purchase upsert fails with missing table/column', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@neurofactory.net' } } });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.retrieveLemonOrder.mockResolvedValue({
      id: 'order-schema-mismatch',
      attributes: {
        status: 'paid',
        user_email: 'admin@neurofactory.net',
        subtotal: 2999,
        total: 2999,
        custom_data: {
          userId: 'u1',
          courseId: 'course-1',
        },
      },
    });

    const prismaStyleError = Object.assign(new Error('The table `DiscountApplied` does not exist'), {
      code: 'P2021',
    });
    mocks.upsertCoursePurchaseFromProvider.mockRejectedValue(prismaStyleError);

    const { POST } = await import('@/app/api/purchases/route');
    const response = await POST(
      new Request('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconcile', courseId: 'course-1', orderId: 'order-schema-mismatch' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ purchased: false, reason: 'database_schema_mismatch' });
  });
});
