import { beforeEach, expect, test, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  lock: vi.fn(), existing: vi.fn(), upsert: vi.fn(), voucher: vi.fn(), latest: vi.fn(),
  count: vi.fn(), redemption: vi.fn(), update: vi.fn(), discount: vi.fn(), events: vi.fn(),
}));
const tx = {
  $executeRaw: calls.lock,
  purchase: { findUnique: calls.existing, upsert: calls.upsert },
  voucherCode: { findUnique: calls.latest, update: calls.update },
  voucherRedemption: { findFirst: vi.fn(), count: calls.count, create: calls.redemption },
  discountApplied: { upsert: calls.discount },
  paymentWebhookEvent: { findMany: calls.events },
};
vi.mock('@/lib/db', () => ({ db: {
  voucherCode: { findUnique: calls.voucher },
  $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
} }));
import { upsertCoursePurchaseFromProvider } from '@/lib/course-purchase-sync';

const input = {
  userId: 'free-intent-user', courseId: 'free-intent-course', providerReferenceId: 'dodo-voucher:FREEINTENT',
  originalPrice: 80, discountAmount: 80, finalPrice: 0, localVoucherCode: 'FREEINTENT',
};
beforeEach(() => {
  vi.resetAllMocks();
  calls.voucher.mockResolvedValue({ id: 'free-intent-voucher' });
  calls.latest.mockResolvedValue({ isActive: true, expiresAt: null, maxUses: null, currentUses: 0, maxUsesPerUser: 1, courseId: input.courseId });
  calls.existing.mockResolvedValue(null); calls.count.mockResolvedValue(0);
  calls.upsert.mockResolvedValue({ id: 'free-intent-purchase' });
  calls.events.mockResolvedValue([]);
});

test('a rejected free-grant intent stops all purchase, discount, redemption and usage writes', async () => {
  const rejected = new Error('Closed synthetic course intent changed');
  const guard = vi.fn().mockRejectedValue(rejected);
  await expect(upsertCoursePurchaseFromProvider({ ...input, beforeFreeVoucherGrant: guard })).rejects.toBe(rejected);
  expect(guard).toHaveBeenCalledWith(tx, 'free-intent-voucher');
  expect(calls.lock).toHaveBeenCalledOnce();
  expect(calls.existing).not.toHaveBeenCalled();
  for (const write of [calls.upsert, calls.discount, calls.redemption, calls.update]) expect(write).not.toHaveBeenCalled();
});

test('accepted intent runs after the shared usage lock and before entitlement reads/writes', async () => {
  const order: string[] = [];
  calls.lock.mockImplementation(async () => { order.push('locked'); });
  calls.existing.mockImplementation(async () => { order.push('existing'); return null; });
  calls.upsert.mockImplementation(async () => { order.push('purchase'); return { id: 'free-intent-purchase' }; });
  const guard = vi.fn(async () => { order.push('guard'); });
  await upsertCoursePurchaseFromProvider({ ...input, beforeFreeVoucherGrant: guard });
  expect(order).toEqual(['locked', 'guard', 'existing', 'purchase']);
  expect(calls.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ originalPrice: 80, discountAmount: 80, finalPrice: 0 }) }));
  expect(calls.redemption).toHaveBeenCalledOnce();
  expect(calls.update).toHaveBeenCalledOnce();
});

test('paid provider fulfillment never invokes a checkout free-grant guard', async () => {
  const guard = vi.fn().mockRejectedValue(new Error('Closed guard must not affect paid fulfillment'));
  await upsertCoursePurchaseFromProvider({ ...input, providerReferenceId: 'dodo-pay:paid-intent-control', beforeFreeVoucherGrant: guard });
  expect(guard).not.toHaveBeenCalled();
  expect(calls.events).toHaveBeenCalledOnce();
  expect(calls.upsert).toHaveBeenCalledOnce();
});

test('an unmapped free voucher cannot reach the intent guard or grant writes', async () => {
  calls.voucher.mockResolvedValue(null);
  const guard = vi.fn();
  await expect(upsertCoursePurchaseFromProvider({ ...input, localVoucherCode: undefined, beforeFreeVoucherGrant: guard }))
    .rejects.toMatchObject({ name: 'VoucherRedemptionRejectedError' });
  expect(guard).not.toHaveBeenCalled();
  expect(calls.lock).not.toHaveBeenCalled();
  expect(calls.upsert).not.toHaveBeenCalled();
});
