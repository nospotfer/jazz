// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '@/components/admin/analytics/kpi-card';

describe('KpiCard', () => {
  test('renders value formatted as EUR currency and positive delta with up arrow', () => {
    render(
      <KpiCard label="Receita total" value={1234} format="currency" delta={0.25} />,
    );
    expect(screen.getByText(/Receita total/)).toBeTruthy();
    // es-ES currency format contains the euro sign
    expect(screen.getByText(/€/)).toBeTruthy();
    expect(screen.getByText(/\+25% vs\. período anterior/)).toBeTruthy();
    expect(screen.getByText('▲')).toBeTruthy();
  });

  test('renders percent format and negative delta with down arrow', () => {
    render(<KpiCard label="Conclusão" value={0.42} format="percent" delta={-0.1} />);
    expect(screen.getByText(/42%/)).toBeTruthy();
    expect(screen.getByText(/−10% vs\. período anterior/)).toBeTruthy();
    expect(screen.getByText('▼')).toBeTruthy();
  });

  test('renders "Nuevo" when delta is null', () => {
    render(<KpiCard label="Matrículas" value={5} format="number" delta={null} />);
    expect(screen.getByText(/Nuevo/)).toBeTruthy();
  });

  test('renders unavailable state with reason', () => {
    render(
      <KpiCard
        label="Sesiones en el sitio"
        value={0}
        format="number"
        delta={null}
        unavailable={{ reason: 'GA4 no configurado.' }}
      />,
    );
    expect(screen.getByText('No disponible')).toBeTruthy();
    expect(screen.getByText('GA4 no configurado.')).toBeTruthy();
  });
});
