// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AdminStatsPage from '@/app/admin/stats/page';

const mocks = vi.hoisted(() => ({ overview: vi.fn(), revenue: vi.fn(), permission: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/admin', () => ({ requirePermission: mocks.permission }));
vi.mock('@/lib/admin/metrics-db', async (original) => ({ ...await original<typeof import('@/lib/admin/metrics-db')>(),
  getOverview: mocks.overview, getRevenueTimeseries: mocks.revenue,
  getEnrollmentsTimeseries: vi.fn(async () => []), getCompletionByCourse: vi.fn(async () => []),
}));
vi.mock('@/lib/admin/metrics-ga', () => ({ getTrafficOverview: vi.fn(async () => ({ unavailable: true, reason: 'missing_env' })) }));
vi.mock('@/components/admin/analytics/period-filter', () => ({ PeriodFilter: () => null }));
vi.mock('@/components/admin/analytics/refresh-metrics-button', () => ({ RefreshMetricsButton: () => null }));
vi.mock('@/components/admin/analytics/revenue-chart', () => ({ RevenueChart: ({ currency }: { currency?: string }) => <p>Gráfico {currency ?? 'sin moneda'}</p> }));
vi.mock('@/components/admin/analytics/enrollments-chart', () => ({ EnrollmentsChart: () => null }));
vi.mock('@/components/admin/analytics/completion-chart', () => ({ CompletionChart: () => null }));

beforeEach(() => {
  vi.resetAllMocks(); mocks.permission.mockResolvedValue(undefined);
  const legacy = { value: 42.24, delta: null };
  const byCurrency = [
    { currency: 'EUR', amountMinor: '2000', value: 20, delta: null },
    { currency: 'JPY', amountMinor: '2990', value: 2990, delta: null },
    { currency: 'KWD', amountMinor: '1234', value: 1.234, delta: null },
  ];
  // Include the old scalar to demonstrate that the previous page really presented
  // a mixed total in EUR; the new page must ignore it in favor of exact groups.
  const money = { ...legacy, byCurrency, unavailableCount: 2 };
  mocks.overview.mockResolvedValue({ revenue: money, averageTicket: money,
    enrollments: { value: 0, delta: null }, newStudents: { value: 0, delta: null }, completionRate: { value: 0, delta: null }, vouchersRedeemed: { value: 0, delta: null }, medalsEarned: { value: 0, delta: null } });
  mocks.revenue.mockResolvedValue(Object.assign([{ bucket: '2026-10-13', value: 42.24 }], {
    series: byCurrency.map((group) => ({ currency: group.currency,
      points: [{ bucket: '2026-10-13', amountMinor: group.amountMinor, value: group.value }] })), unavailableCount: 2,
  }));
});
afterEach(cleanup);

test('stats shows exact separate currency cards and charts without the old mixed EUR total', async () => {
  const view = render(await AdminStatsPage({}));
  for (const currency of ['EUR', 'JPY', 'KWD']) {
    expect(screen.getByText(`Cobros registrados (${currency})`)).toBeTruthy();
    expect(screen.getByText(`Gráfico ${currency}`)).toBeTruthy();
  }
  expect(screen.getAllByText('1,234 KWD')).toHaveLength(2);
  expect(view.container.textContent).toContain('2 registros excluidos');
  expect(view.container.textContent).not.toMatch(/42,24|Ingresos en EUR|Gráfico sin moneda/);
});

test('stats preserves exact huge totals and declines a chart that would round them', async () => {
  const huge = { value: 42.24, delta: null, byCurrency: [{ currency: 'JPY', amountMinor: '9007199254740993', value: null, delta: null, comparisonUnavailable: true }], unavailableCount: 0 };
  const original = await mocks.overview(); mocks.overview.mockResolvedValue({ ...original, revenue: huge, averageTicket: huge });
  mocks.revenue.mockResolvedValue(Object.assign([{ bucket: '2026-10-13', value: 42.24 }], { series: [{ currency: 'JPY', points: [{ bucket: '2026-10-13', amountMinor: '9007199254740993', value: null }] }], unavailableCount: 0 }));
  render(await AdminStatsPage({}));
  expect(screen.getAllByText(/9[.\s]?007[.\s]?199[.\s]?254[.\s]?740[.\s]?993 JPY/)).toHaveLength(2);
  expect(screen.getByText(/Gráfico no disponible: el importe supera/)).toBeTruthy();
  expect(screen.queryByText('Gráfico JPY')).toBeNull();
  const card = screen.getByText('Cobros registrados (JPY)').parentElement!.parentElement!;
  expect(within(card).getByText('Variación no disponible')).toBeTruthy();
  expect(within(card).queryByText(/Nuevo/)).toBeNull();
});

test('stats financial permission rejects before loading any payment report', async () => {
  const denied = new Error('Synthetic analytics denied'); mocks.permission.mockRejectedValue(denied);
  await expect(AdminStatsPage({})).rejects.toBe(denied);
  expect(mocks.permission).toHaveBeenCalledExactlyOnceWith('analytics.read');
  expect(mocks.overview).not.toHaveBeenCalled(); expect(mocks.revenue).not.toHaveBeenCalled();
});
