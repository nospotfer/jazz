import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getHeader: vi.fn(),
  verifyLemonSignature: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
  revertCoursePurchaseByProviderReferenceId: vi.fn(),
  userFindFirst: vi.fn(),
  courseFindMany: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: mocks.getHeader,
  }),
}));

vi.mock('@/lib/lemon-squeezy', () => ({
  verifyLemonSignature: mocks.verifyLemonSignature,
}));

vi.mock('@/lib/course-purchase-sync', () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
  revertCoursePurchaseByProviderReferenceId: mocks.revertCoursePurchaseByProviderReferenceId,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: mocks.userFindFirst,
    },
    course: {
      findMany: mocks.courseFindMany,
    },
  },
}));

describe('POST /api/webhooks/lemon-squeezy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getHeader.mockImplementation((name: string) => {
      if (name === 'x-signature') {
        return 'sig_test_123';
      }

      return null;
    });
    mocks.verifyLemonSignature.mockReturnValue(true);
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    mocks.revertCoursePurchaseByProviderReferenceId.mockResolvedValue(undefined);
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.courseFindMany.mockResolvedValue([]);
  });

  test('returns 401 for invalid signature', async () => {
    mocks.verifyLemonSignature.mockReturnValue(false);

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify({ meta: { event_name: 'order_created' } }),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('returns 400 for invalid JSON payload', async () => {
    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: '{invalid-json',
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.upsertCoursePurchaseFromProvider).not.toHaveBeenCalled();
  });

  test('returns 400 when event name is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify({ meta: {} }),
      })
    );

    expect(response.status).toBe(400);
  });

  test('handles order_created and persists purchase', async () => {
    const payload = {
      meta: {
        event_name: 'order_created',
        custom_data: {
          userId: 'user-1',
          courseId: 'course-1',
          purchaseType: 'course',
          voucherCode: 'JAZZ20',
        },
      },
      data: {
        id: 'order-123',
        attributes: {
          subtotal: 2999,
          total: 1999,
          discount_code: 'PROVIDER20',
        },
      },
    };

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledTimes(1);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      courseId: 'course-1',
      providerReferenceId: 'ls-order:order-123',
      originalPrice: 29.99,
      discountAmount: 10,
      finalPrice: 19.99,
      localVoucherCode: 'JAZZ20',
      providerDiscountCode: 'PROVIDER20',
    });
  });

  test('handles order_created with snake_case custom metadata', async () => {
    const payload = {
      meta: {
        event_name: 'order_created',
        custom_data: {
          user_id: 'user-1',
          course_id: 'course-1',
          purchase_type: 'course',
          voucher_code: 'JAZZ20',
          provider_discount_code: 'PROVIDER20',
        },
      },
      data: {
        id: 'order-124',
        attributes: {
          subtotal: 2999,
          total: 1999,
        },
      },
    };

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledTimes(1);
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      courseId: 'course-1',
      providerReferenceId: 'ls-order:order-124',
      originalPrice: 29.99,
      discountAmount: 10,
      finalPrice: 19.99,
      localVoucherCode: 'JAZZ20',
      providerDiscountCode: 'PROVIDER20',
    });
  });

  test('handles order_refunded and reverts purchase', async () => {
    const payload = {
      meta: {
        event_name: 'order_refunded',
      },
      data: {
        attributes: {
          order_id: 'order-123',
        },
      },
    };

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.revertCoursePurchaseByProviderReferenceId).toHaveBeenCalledWith('ls-order:order-123');
  });

  test('handles order_created without metadata using email and single published course fallback', async () => {
    mocks.userFindFirst.mockResolvedValue({ id: 'user-fallback' });
    mocks.courseFindMany.mockResolvedValue([{ id: 'course-fallback' }]);

    const payload = {
      meta: {
        event_name: 'order_created',
      },
      data: {
        id: 'order-125',
        attributes: {
          status: 'paid',
          user_email: 'admin@neurofactory.net',
          subtotal: 2990,
          total: 2990,
        },
      },
    };

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.userFindFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'admin@neurofactory.net',
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    expect(mocks.courseFindMany).toHaveBeenCalledWith({
      where: { isPublished: true },
      select: { id: true },
      take: 2,
    });
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledWith({
      userId: 'user-fallback',
      courseId: 'course-fallback',
      providerReferenceId: 'ls-order:order-125',
      originalPrice: 29.9,
      discountAmount: 0,
      finalPrice: 29.9,
      localVoucherCode: null,
      providerDiscountCode: null,
    });
  });

  test('returns 500 when processing fails', async () => {
    mocks.upsertCoursePurchaseFromProvider.mockImplementation(() => {
      throw new Error('db-failure');
    });

    const payload = {
      meta: {
        event_name: 'order_created',
        custom_data: {
          userId: 'user-1',
          courseId: 'course-1',
          purchaseType: 'course',
        },
      },
      data: {
        id: 'order-123',
        attributes: {
          subtotal: 2999,
          total: 2999,
        },
      },
    };

    const { POST } = await import('@/app/api/webhooks/lemon-squeezy/route');
    const response = await POST(
      new Request('http://localhost:3000/api/webhooks/lemon-squeezy', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(500);
  });
});
