// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AdminDashboard from '@/app/admin/page';

const mocks = vi.hoisted(() => ({ recent: vi.fn(), can: vi.fn(), permission: vi.fn() }));
vi.mock('@/lib/admin', () => ({ can: mocks.can, requirePermission: mocks.permission }));
vi.mock('@/lib/db', () => ({ db: {
  purchase: { count: vi.fn(async () => 5), findMany: mocks.recent },
  course: { count: vi.fn(async () => 1) }, user: { count: vi.fn(async () => 2) },
} }));
function purchase(id: string, currency: string | null, minor: string | null, finalPrice: number | null) {
  return { id, userId: 'synthetic-owner', createdAt: new Date('2026-10-13T12:00:00Z'),
    paymentCurrency: currency, paymentAmountMinor: minor, finalPrice, course: { title: `Synthetic ${id}` } };
}
beforeEach(() => { vi.resetAllMocks(); mocks.can.mockResolvedValue(true); mocks.permission.mockResolvedValue(undefined); });
afterEach(cleanup);

test('recent purchases prefer exact JPY and KWD facts over incompatible legacy floats', async () => {
  mocks.recent.mockResolvedValue([purchase('yen', 'JPY', '2990', 29.9), purchase('dinar', 'KWD', '1234', 12.34)]);
  const view = render(await AdminDashboard());
  expect(screen.getByText(/Importe registrado: 2990 JPY/)).toBeTruthy();
  expect(screen.getByText(/Importe registrado: 1,234 KWD/)).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/29,90|12,34|42,24|€/);
});

test('recent sums stay separate by verified currency and legacy amounts remain excluded', async () => {
  mocks.recent.mockResolvedValue([purchase('eur', 'EUR', '2000', 20), purchase('yen', 'JPY', '2990', 29.9),
    purchase('legacy', null, null, 80), purchase('unknown', null, null, null)]);
  const view = render(await AdminDashboard());
  expect(screen.getByText('Totales por moneda (últimos 5 registros)')).toBeTruthy();
  expect(screen.getByText('20,00 EUR')).toBeTruthy();
  expect(screen.getByText('2990 JPY')).toBeTruthy();
  expect(screen.getByText('2 registros excluidos de los totales por falta de importe o moneda verificados.')).toBeTruthy();
  expect(screen.getByText('Importe registrado: 80,00 · Moneda no disponible')).toBeTruthy();
  expect(view.container.textContent).not.toContain('129,90');
});

test('financial permissions still prevent exact currency queries and display', async () => {
  mocks.can.mockResolvedValue(false); mocks.recent.mockResolvedValue([purchase('private', 'EUR', '2000', 20)]);
  const view = render(await AdminDashboard());
  expect(mocks.recent).not.toHaveBeenCalled();
  expect(view.container.textContent).not.toMatch(/EUR|Importe registrado|Totales por moneda/);
  expect(screen.getByRole('heading', { name: 'Panel administrativo' })).toBeTruthy();
});
