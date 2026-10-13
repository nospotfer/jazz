import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getVoucherFailureReason } from '@/lib/voucher-feedback';

const mocks = vi.hoisted(() => ({
  validate: vi.fn(), user: vi.fn(), existing: vi.fn(), latest: vi.fn(), redemptionCount: vi.fn(),
  lock: vi.fn(), purchase: vi.fn(), discount: vi.fn(), redemption: vi.fn(), updateMany: vi.fn(), update: vi.fn(),
}));
const tx = {
  $executeRaw: mocks.lock,
  voucherCode: { findUnique: mocks.latest, updateMany: mocks.updateMany, update: mocks.update },
  voucherRedemption: { count: mocks.redemptionCount, create: mocks.redemption },
  purchase: { create: mocks.purchase }, discountApplied: { create: mocks.discount },
};
vi.mock('@/lib/db', () => ({ db: { purchase: { findUnique: mocks.existing }, $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx) } }));
vi.mock('@/lib/vouchers', () => ({ validateVoucherForCourse: mocks.validate }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.user } }) }));
import { POST } from '@/app/api/vouchers/redeem/route';

const activeVoucher = { id: 'fixture-voucher', isActive: true, expiresAt: null, maxUses: 1, currentUses: 0, maxUsesPerUser: 1 };
const request = () => new Request('http://localhost:3010/api/vouchers/redeem', {
  method: 'POST', body: JSON.stringify({ courseId: 'fixture-course', voucherCode: 'JAZZFREE' }),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: 'fixture-user' } } });
  mocks.validate.mockResolvedValue({ valid: true, voucher: { id: 'fixture-voucher' }, originalPrice: 29.90, finalPrice: 0, discount: 29.90 });
  mocks.existing.mockResolvedValue(null); mocks.latest.mockResolvedValue(activeVoucher);
  mocks.redemptionCount.mockResolvedValue(0); mocks.purchase.mockResolvedValue({ id: 'fixture-purchase' });
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe('redeem feedback retains existing status/error and adds the atomic validation reason', () => {
  test.each([
    { voucher: null, count: 0, status: 400, reason: 'Invalid code' },
    { voucher: { ...activeVoucher, isActive: false }, count: 0, status: 400, reason: 'Inactive' },
    { voucher: { ...activeVoucher, expiresAt: new Date(0) }, count: 0, status: 400, reason: 'Expired' },
    { voucher: { ...activeVoucher, currentUses: 1 }, count: 0, status: 409, reason: 'Max uses reached' },
    { voucher: activeVoucher, count: 1, status: 409, reason: 'Max uses per user reached' },
  ])('exposes $reason after the locked voucher recheck without creating an entitlement', async ({ voucher, count, status, reason }) => {
    mocks.latest.mockResolvedValue(voucher); mocks.redemptionCount.mockResolvedValue(count);
    const response = await POST(request()); const payload = await response.json();
    expect(response.status).toBe(status);
    expect(payload).toMatchObject({ success: false, error: 'Redeem failed', reason, message: expect.any(String) });
    expect(getVoucherFailureReason(payload, response.status)).toBe(reason);
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.purchase).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  test('the atomic final usage guard exposes the same limit reason and retains 409', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ success: false, error: 'Redeem failed', reason: 'Max uses reached' });
  });

  test('ordinary free redemption keeps the exact purchase/discount amount and access contract', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, accessGranted: true, redirectUrl: '/dashboard' });
    expect(mocks.purchase).toHaveBeenCalledWith({ data: {
      userId: 'fixture-user', courseId: 'fixture-course', voucherId: 'fixture-voucher',
      originalPrice: 29.90, finalPrice: 0, discountAmount: 29.90,
    } });
    expect(mocks.discount).toHaveBeenCalledWith({ data: {
      purchaseId: 'fixture-purchase', voucherId: 'fixture-voucher', originalPrice: 29.90, finalPrice: 0, discountAmount: 29.90,
    } });
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: 'fixture-voucher', currentUses: { lt: 1 } }, data: { currentUses: { increment: 1 } } });
  });

  test('initial validation errors remain their existing machine-readable contract', async () => {
    mocks.validate.mockResolvedValue({ valid: false, error: 'Voucher type mismatch', message: 'Existing validation message' });
    const response = await POST(request());
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({ success: false, error: 'Voucher type mismatch', message: 'Existing validation message' });
    expect(getVoucherFailureReason(payload, response.status)).toBe('Voucher type mismatch');
    expect(mocks.lock).not.toHaveBeenCalled();
  });
});
