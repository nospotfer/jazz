// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminDashboard from '@/app/admin/page';
import { hasPermission } from '@/lib/admin/permissions';

const mocks = vi.hoisted(() => ({ permission: vi.fn(), can: vi.fn(), serverUser: vi.fn(), userLookup: vi.fn(), courses: vi.fn(), users: vi.fn(), purchases: vi.fn(), recent: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/admin', () => ({ requirePermission: mocks.permission, can: mocks.can }));
vi.mock('@/lib/server-user', () => ({ getServerUser: mocks.serverUser }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), cache: <T,>(callback: T) => callback }));
vi.mock('@/lib/db', () => ({ db: { course: { count: mocks.courses }, user: { count: mocks.users, findUnique: mocks.userLookup },
  purchase: { count: mocks.purchases, findMany: mocks.recent } } }));
function purchase(id: string, finalPrice: unknown, catalogPrice = 80) {
  return { id, userId: `synthetic-owner-${id}`, createdAt: new Date('2026-10-01T12:00:00Z'), finalPrice,
    course: { id: `synthetic-course-${id}`, title: `Synthetic course ${id}`, price: catalogPrice } };
}
async function renderPage() { return render(await AdminDashboard()); }
beforeEach(() => {
  vi.resetAllMocks(); mocks.permission.mockResolvedValue(undefined); mocks.can.mockResolvedValue(true);
  mocks.serverUser.mockResolvedValue({ id: 'synthetic-admin-actor', email: 'synthetic-admin-role@example.test' });
  mocks.userLookup.mockResolvedValue({ id: 'synthetic-admin-actor', email: 'synthetic-admin-role@example.test', role: 'SUPER_ADMIN' });
  mocks.courses.mockImplementation(async (query?: unknown) => query ? 1 : 4);
  mocks.users.mockResolvedValue(10); mocks.purchases.mockResolvedValue(30); mocks.recent.mockResolvedValue([]);
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited in closed admin fixture'); }); vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { cleanup(); expect(mocks.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

test('recorded72 remains72 when the same purchase current catalog changes80 to100', async () => {
  mocks.recent.mockResolvedValue([purchase('recorded', 72, 80)]); const view = await renderPage();
  expect(screen.getByText('Importe registrado: 72,00 · Moneda no disponible')).toBeTruthy();
  expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  mocks.recent.mockResolvedValue([purchase('recorded', 72, 100)]); view.rerender(await AdminDashboard());
  expect(screen.getByText('Importe registrado: 72,00 · Moneda no disponible')).toBeTruthy();
  expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  expect(view.container.textContent).not.toContain('100,00');
});
test.each([null, undefined, NaN, Infinity, -1, '72'])('missing or malformed recorded amount%j staysunknown with a positive catalogprice', async (finalPrice) => {
  mocks.recent.mockResolvedValue([purchase('unknown', finalPrice, 80)]); const view = await renderPage();
  expect(screen.getByText('Importe registrado: No disponible')).toBeTruthy();
  expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  expect(screen.getByText('1 registros excluidos de los totales por falta de importe o moneda verificados.')).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/€|Gratis|80[.,]00|Ingresos/);
});
test('recordedzero remains explicit0 rather than freeorcurrentcatalog80', async () => {
  mocks.recent.mockResolvedValue([purchase('zero', 0, 80)]); const view = await renderPage();
  expect(screen.getByText('Importe registrado: 0,00 · Moneda no disponible')).toBeTruthy();
  expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/€|Gratis|80[.,]00/);
});
test('latestfive legacy amounts retain individual facts but no unverified currency total', async () => {
  mocks.recent.mockResolvedValue([purchase('paid',72),purchase('zero',0),purchase('null',null),purchase('invalid',NaN),purchase('other',4.5)]);
  const view = await renderPage();
  expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  expect(screen.getByText('5 registros excluidos de los totales por falta de importe o moneda verificados.')).toBeTruthy();
  expect(screen.getAllByText('Importe registrado: No disponible')).toHaveLength(2);
  expect(view.container.textContent).not.toMatch(/€|Gratis|Ingresos/);
});
test('totalcount labels purchase recordsincludingzero access ratherthan paidcompleted sales', async () => {
  mocks.recent.mockResolvedValue([purchase('free-access',0)]); await renderPage();
  const label=screen.getByText('Registros de compra');const card=label.parentElement!;
  expect(within(card).getByText('30')).toBeTruthy();expect(within(card).getByText('Incluye accesos gratuitos')).toBeTruthy();
  expect(screen.queryByText('Total de ventas')).toBeNull();expect(screen.queryByText('Compras completadas')).toBeNull();
});
test('control no purchases retains the existing genuineempty state', async () => {
  await renderPage();expect(screen.getByText('Aún no se ha realizado ninguna compra')).toBeTruthy();
  expect(screen.queryByText(/^Importe registrado:/)).toBeNull();
});
test('control queryscope remains five newest records with courseidentityanddate preserved', async () => {
  mocks.recent.mockResolvedValue([purchase('scope',72)]); await renderPage();
  expect(mocks.permission).toHaveBeenCalledExactlyOnceWith('admin.access');
  expect(mocks.recent).toHaveBeenCalledExactlyOnceWith({ take:5, orderBy:{createdAt:'desc'}, select:{id:true,userId:true,createdAt:true,finalPrice:true,paymentCurrency:true,paymentAmountMinor:true,course:{select:{title:true}}} });
  expect(mocks.purchases).toHaveBeenCalledExactlyOnceWith();
  expect(screen.getByRole('heading',{name:'Synthetic course scope'})).toBeTruthy();
  expect(screen.getByText('ID de usuario: synthetic-owner-scope')).toBeTruthy();
  expect(screen.getByText(new Date('2026-10-01T12:00:00Z').toLocaleDateString('es-ES'))).toBeTruthy();
  expect(screen.getByRole('link',{name:/Gestionar usuarios/}).getAttribute('href')).toBe('/admin/users');
});
test('control permissionrejection happens before any database query or amount render', async () => {
  const denied=new Error('Synthetic admin access denied');mocks.permission.mockRejectedValue(denied);
  await expect(AdminDashboard()).rejects.toBe(denied);
  expect(mocks.courses).not.toHaveBeenCalled();expect(mocks.users).not.toHaveBeenCalled();
  expect(mocks.purchases).not.toHaveBeenCalled();expect(mocks.recent).not.toHaveBeenCalled();
});


describe('analytics permission for actual recorded amounts', () => {
  async function useRealAdminRole(role: string, authenticated = true) {
    const actualAdmin = await vi.importActual<typeof import('@/lib/admin')>('@/lib/admin');
    mocks.permission.mockImplementation(actualAdmin.requirePermission);
    mocks.can.mockImplementation(actualAdmin.can);
    mocks.serverUser.mockResolvedValue(authenticated ? { id: 'synthetic-admin-actor', email: 'synthetic-admin-role@example.test' } : null);
    mocks.userLookup.mockResolvedValue({ id: 'synthetic-admin-actor', email: 'synthetic-admin-role@example.test', role });
    mocks.recent.mockResolvedValue([purchase('private-amount', 72.34)]);
  }
  test.each(['CONTENT_CREATOR', 'MODERATOR'])('admin-access %s cannot query or render recorded financial amounts', async (role) => {
    expect(hasPermission(role, 'admin.access')).toBe(true);
    expect(hasPermission(role, 'analytics.read')).toBe(false);
    await useRealAdminRole(role); const view = await renderPage();
    expect({ financeQueries: mocks.recent.mock.calls.length,
      recordedAmountVisible: Boolean(screen.queryByText('Importe registrado: 72,34 · Moneda no disponible')),
      financialSummaryVisible: Boolean(screen.queryByText(/^Totales por moneda/)) })
      .toEqual({ financeQueries: 0, recordedAmountVisible: false, financialSummaryVisible: false });
    expect(screen.getByRole('heading', { name: 'Panel administrativo' })).toBeTruthy();
    expect(screen.getByText('Registros de compra')).toBeTruthy();
    expect(mocks.purchases).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: /Gestionar usuarios/ }).getAttribute('href')).toBe('/admin/users');
    expect(view.container.textContent).not.toContain('Synthetic course private-amount');
  });
  test.each(['SUPER_ADMIN', 'COURSE_ADMIN'])('analytics-authorized %s retains recorded amounts and excludes unknown-currency totals', async (role) => {
    expect(hasPermission(role, 'admin.access')).toBe(true);
    expect(hasPermission(role, 'analytics.read')).toBe(true);
    await useRealAdminRole(role); await renderPage();
    expect(mocks.recent).toHaveBeenCalledOnce();
    expect(screen.getByText('Importe registrado: 72,34 · Moneda no disponible')).toBeTruthy();
    expect(screen.getByText('Sin totales con moneda verificada')).toBeTruthy();
  });
  test('ordinary USER still cannot obtain overview or financial queries', async () => {
    await useRealAdminRole('USER'); await expect(AdminDashboard()).rejects.toThrow();
    expect(mocks.courses).not.toHaveBeenCalled(); expect(mocks.users).not.toHaveBeenCalled();
    expect(mocks.purchases).not.toHaveBeenCalled(); expect(mocks.recent).not.toHaveBeenCalled();
  });
  test('unverified server identity cannot obtain overview or financial queries', async () => {
    await useRealAdminRole('SUPER_ADMIN', false); await expect(AdminDashboard()).rejects.toThrow();
    expect(mocks.userLookup).not.toHaveBeenCalled(); expect(mocks.courses).not.toHaveBeenCalled();
    expect(mocks.users).not.toHaveBeenCalled(); expect(mocks.purchases).not.toHaveBeenCalled(); expect(mocks.recent).not.toHaveBeenCalled();
  });
});
