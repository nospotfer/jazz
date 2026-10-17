// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AdminVoucherDetailPage from '@/app/admin/vouchers/[voucherId]/page';
import { formatPaymentAmount } from '@/lib/payment-money';

const mocks = vi.hoisted(() => ({ permission: vi.fn(), voucher: vi.fn(), users: vi.fn(), notFound: vi.fn() }));
vi.mock('@/lib/admin', () => ({ requirePermission: mocks.permission }));
vi.mock('@/lib/db', () => ({ db: { voucherCode: { findUnique: mocks.voucher }, user: { findMany: mocks.users } } }));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));

const recordedPurchase = (overrides: Record<string, unknown> = {}) => ({
  id: 'synthetic-purchase', originalPrice: 80, discountAmount: 8, finalPrice: 72,
  paymentCurrency: null, paymentAmountMinor: null, createdAt: new Date('2026-10-13T12:00:00Z'), ...overrides,
});
const redemption = (id = 'synthetic-use', userId = 'synthetic-student', purchase: unknown = recordedPurchase()) => ({
  id, userId, redeemedAt: new Date('2026-10-13T12:00:00Z'), purchase,
});
const voucher = (redemptions = [redemption()]) => ({
  id: 'synthetic-voucher', code: 'SYNTHETIC-REDUCTION', type: 'DISCOUNT_FIXED', currentUses: redemptions.length,
  maxUses: 10, expiresAt: null, discountAmount: 8, discountPercent: null, minOrderValue: 20,
  course: { id: 'synthetic-course', title: 'Synthetic course' }, batch: null, redemptions,
});
async function page(redemptions = [redemption()]) {
  mocks.voucher.mockResolvedValue(voucher(redemptions));
  return render(await AdminVoucherDetailPage({ params: Promise.resolve({ voucherId: 'synthetic-voucher' }) }));
}
function amounts(row = 0) {
  const cells = within(screen.getAllByRole('row')[row + 1]).getAllByRole('cell');
  return cells.slice(4).map((cell) => cell.textContent);
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue(undefined);
  mocks.users.mockResolvedValue([{ id: 'synthetic-student', name: 'Synthetic student', email: 'synthetic@example.test' }]);
  mocks.notFound.mockImplementation(() => { throw new Error('Synthetic not found'); });
});
afterEach(cleanup);

test.each([
  ['JPY', '2990', 29.9],
  ['KWD', '1234', 12.34],
  ['EUR', '2990', 80],
])('redemption final amount uses the exact %s pair without relabeling legacy base/discount', async (currency, minor, legacy) => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({
    paymentCurrency: currency, paymentAmountMinor: minor, finalPrice: legacy,
  }))]);
  expect(amounts()).toEqual([
    '80,00 · Moneda no disponible', '8,00 · Moneda no disponible', formatPaymentAmount(minor, currency, 'es-ES'),
  ]);
  const query = mocks.voucher.mock.calls[0][0];
  expect(query.include.redemptions.include.purchase.select).toMatchObject({ paymentCurrency: true, paymentAmountMinor: true });
});

test('legacy monetary facts have no inferred unit even when the voucher has fixed EUR terms', async () => {
  await page();
  expect(amounts()).toEqual(['80,00 · Moneda no disponible', '8,00 · Moneda no disponible', '72,00 · Moneda no disponible']);
  expect(screen.getByText('Descuento: € 8.00')).toBeTruthy();
  expect(screen.getByText('Pedido mínimo: € 20.00')).toBeTruthy();
});

test('legacy base and discount retain recorded precision without borrowing the final payment currency', async () => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({
    originalPrice: 1.234, discountAmount: 0.001, paymentCurrency: 'KWD', paymentAmountMinor: '1233',
  }))]);
  expect(amounts()).toEqual(['1,234 · Moneda no disponible', '0,001 · Moneda no disponible', formatPaymentAmount('1233', 'KWD', 'es-ES')]);
});

test.each([['ZZZ', '1234'], ['JPY', '01']])('incomplete or malformed canonical pair %s/%s never labels the legacy final amount', async (currency, minor) => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({ paymentCurrency: currency, paymentAmountMinor: minor }))]);
  expect(amounts()[2]).toBe('72,00 · Moneda no disponible');
});

test('unknown monetary facts remain unavailable rather than becoming zero', async () => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({ originalPrice: null, discountAmount: null, finalPrice: null }))]);
  expect(amounts()).toEqual(['No disponible', 'No disponible', 'No disponible']);
});

test('real zero stays distinct from unavailable and the exact final zero overrides the legacy float', async () => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({
    originalPrice: 0, discountAmount: 0, finalPrice: 80, paymentCurrency: 'KWD', paymentAmountMinor: '0',
  }))]);
  expect(amounts()).toEqual(['0,00 · Moneda no disponible', '0,00 · Moneda no disponible', formatPaymentAmount('0', 'KWD', 'es-ES')]);
});

test.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('invalid legacy monetary facts (%s) stay unavailable', async (value) => {
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({ originalPrice: value, discountAmount: value, finalPrice: value }))]);
  expect(amounts()).toEqual(['No disponible', 'No disponible', 'No disponible']);
});

test('64-digit canonical values render exactly within the bounded scrolling table', async () => {
  const minor = '1234567890'.repeat(6) + '1234';
  await page([redemption('synthetic-use', 'synthetic-student', recordedPurchase({ paymentCurrency: 'KWD', paymentAmountMinor: minor }))]);
  const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
  expect(cells[6].textContent).toBe(formatPaymentAmount(minor, 'KWD', 'es-ES'));
  expect(screen.getByRole('table').parentElement?.className).toContain('overflow-x-auto');
});

test('a missing historical purchase does not invent monetary facts', async () => {
  await page([redemption('synthetic-use', 'synthetic-student', null)]);
  expect(amounts()).toEqual(['No disponible', 'No disponible', 'No disponible']);
});

test('vouchers.read denial happens before voucher or user queries', async () => {
  mocks.permission.mockRejectedValue(new Error('Synthetic permission denied'));
  await expect(AdminVoucherDetailPage({ params: Promise.resolve({ voucherId: 'synthetic-voucher' }) })).rejects.toThrow('Synthetic permission denied');
  expect(mocks.permission).toHaveBeenCalledWith('vouchers.read');
  expect(mocks.voucher).not.toHaveBeenCalled();
  expect(mocks.users).not.toHaveBeenCalled();
});

test('missing voucher keeps the not-found boundary before student queries', async () => {
  mocks.voucher.mockResolvedValue(null);
  await expect(AdminVoucherDetailPage({ params: Promise.resolve({ voucherId: 'synthetic-missing' }) })).rejects.toThrow('Synthetic not found');
  expect(mocks.notFound).toHaveBeenCalledOnce();
  expect(mocks.users).not.toHaveBeenCalled();
});

test('empty redemption history keeps its empty state without querying students', async () => {
  await page([]);
  expect(screen.getByText('Aún no hay usos registrados.')).toBeTruthy();
  expect(mocks.users).not.toHaveBeenCalled();
});

test('voucher lookup and deduplicated student query remain scoped to this voucher history', async () => {
  await page([redemption('synthetic-use-a'), redemption('synthetic-use-b'), redemption('synthetic-use-c', 'synthetic-student-b')]);
  expect(mocks.voucher).toHaveBeenCalledOnce();
  expect(mocks.voucher.mock.calls[0][0]).toMatchObject({
    where: { id: 'synthetic-voucher' }, include: { redemptions: { orderBy: { redeemedAt: 'desc' } } },
  });
  expect(mocks.users).toHaveBeenCalledExactlyOnceWith({
    where: { id: { in: ['synthetic-student', 'synthetic-student-b'] } }, select: { id: true, email: true, name: true },
  });
  expect(screen.getAllByRole('row')).toHaveLength(4);
});
