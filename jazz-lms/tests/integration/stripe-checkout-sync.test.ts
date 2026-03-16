import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('syncCourseCheckoutSession', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('persists purchase and voucher usage from checkout session', async () => {
    const sessionRetrieve = vi.fn().mockResolvedValue({
      id: 'cs_sync_1',
      status: 'complete',
      payment_status: 'paid',
      amount_subtotal: 3000,
      amount_total: 0,
      total_details: {
        amount_discount: 3000,
        breakdown: {
          discounts: [
            {
              discount: {
                promotion_code: { code: 'LOUISARMSTRONG100025412' },
                coupon: null,
              },
            },
          ],
        },
      },
      metadata: {
        purchaseType: 'course',
        userId: 'u1',
        courseId: 'c1',
      },
    });

    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        checkout: {
          sessions: {
            retrieve: sessionRetrieve,
          },
        },
      },
    }));

    const purchaseUpsert = vi.fn().mockResolvedValue({ id: 'p1' });
    const redemptionCreate = vi.fn().mockResolvedValue({ id: 'vr1' });
    const voucherUpdate = vi.fn().mockResolvedValue({ id: 'v1' });

    vi.doMock('@/lib/db', () => ({
      db: {
        voucherCode: {
          findUnique: vi.fn().mockResolvedValue({ id: 'v1' }),
        },
        $transaction: async (callback: (tx: any) => Promise<unknown>) =>
          callback({
            purchase: {
              findUnique: vi.fn().mockResolvedValue(null),
              upsert: purchaseUpsert,
            },
            voucherRedemption: {
              findFirst: vi.fn().mockResolvedValue(null),
              create: redemptionCreate,
              update: vi.fn().mockResolvedValue({ id: 'vr1' }),
              delete: vi.fn().mockResolvedValue({ id: 'vr1' }),
            },
            voucherCode: {
              findUnique: vi.fn().mockResolvedValue({ currentUses: 0 }),
              update: voucherUpdate,
            },
            discountApplied: {
              upsert: vi.fn().mockResolvedValue({ id: 'd1' }),
              deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
          }),
      },
    }));

    const { syncCourseCheckoutSession } = await import('@/lib/stripe-checkout-sync');
    const result = await syncCourseCheckoutSession({
      sessionId: 'cs_sync_1',
      expectedUserId: 'u1',
      expectedCourseId: 'c1',
    });

    expect(result.success).toBe(true);
    expect(result.voucherId).toBe('v1');
    expect(sessionRetrieve).toHaveBeenCalledTimes(1);
    expect(purchaseUpsert).toHaveBeenCalledTimes(1);
    expect(redemptionCreate).toHaveBeenCalledTimes(1);
    expect(voucherUpdate).toHaveBeenCalledTimes(1);
  });

  test('returns not_paid when session is not settled', async () => {
    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        checkout: {
          sessions: {
            retrieve: vi.fn().mockResolvedValue({
              id: 'cs_sync_2',
              status: 'open',
              payment_status: 'unpaid',
              amount_subtotal: 3000,
              amount_total: 3000,
              total_details: {
                amount_discount: 0,
                breakdown: {
                  discounts: [],
                },
              },
              metadata: {
                purchaseType: 'course',
                userId: 'u1',
                courseId: 'c1',
              },
            }),
          },
        },
      },
    }));

    const transactionSpy = vi.fn();
    vi.doMock('@/lib/db', () => ({
      db: {
        voucherCode: {
          findUnique: vi.fn(),
        },
        $transaction: transactionSpy,
      },
    }));

    const { syncCourseCheckoutSession } = await import('@/lib/stripe-checkout-sync');
    const result = await syncCourseCheckoutSession({
      sessionId: 'cs_sync_2',
      expectedUserId: 'u1',
      expectedCourseId: 'c1',
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('not_paid');
    expect(transactionSpy).not.toHaveBeenCalled();
  });
});
