import type { ReactNode } from 'react';

export type KpiFormat = 'currency' | 'number' | 'percent';
export type KpiTone = 'neutral' | 'positive' | 'negative' | 'unavailable';

export type KpiCardProps = {
  label: string;
  value: number;
  format: KpiFormat;
  delta: number | null;
  currency?: 'EUR' | 'USD' | 'BRL';
  icon?: ReactNode;
  /** Exibido em vez do valor quando o KPI nao esta disponivel (ex.: GA4 offline). */
  unavailable?: { reason: string };
};

function formatValue(value: number, format: KpiFormat, currency: 'EUR' | 'USD' | 'BRL' = 'EUR'): string {
  if (format === 'currency') {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  }
  if (format === 'percent') {
    return `${(value * 100).toFixed(0)}%`;
  }
  return value.toLocaleString('es-ES');
}

function formatDelta(delta: number | null): { label: string; tone: KpiTone; symbol: string } {
  if (delta === null) return { label: 'Novo', tone: 'neutral', symbol: '•' };
  if (delta === 0) return { label: 'sem variação', tone: 'neutral', symbol: '•' };
  if (delta > 0) {
    const pct = (delta * 100).toFixed(0);
    return { label: `+${pct}% vs. período anterior`, tone: 'positive', symbol: '▲' };
  }
  const pct = Math.abs(delta * 100).toFixed(0);
  return { label: `−${pct}% vs. período anterior`, tone: 'negative', symbol: '▼' };
}

const toneClasses: Record<KpiTone, string> = {
  neutral: 'text-[#4B5563] dark:text-[#D1D5DB]',
  positive: 'text-[#166534] dark:text-[#4ADE80]',
  negative: 'text-[#991B1B] dark:text-[#F87171]',
  unavailable: 'text-[#4B5563] dark:text-[#D1D5DB]',
};

/**
 * Card de KPI otimizado para publico 50+:
 * - Rotulo >= 17px, numero principal >= 40px.
 * - Delta sempre com simbolo textual (▲/▼/•), nunca depende so de cor.
 * - Estado 'unavailable' tem texto explicito ("Indisponivel") + motivo.
 */
export function KpiCard({
  label,
  value,
  format,
  delta,
  currency = 'EUR',
  icon,
  unavailable,
}: KpiCardProps) {
  if (unavailable) {
    return (
      <div
        className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-card"
        aria-label={`${label}: indisponível`}
      >
        <div className="flex items-start justify-between">
          <p className="text-[17px] font-medium text-muted-foreground">{label}</p>
          {icon ? (
            <span className="text-2xl text-jazz-accent" aria-hidden="true">
              {icon}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[28px] font-semibold leading-tight text-[#4B5563] dark:text-[#D1D5DB]">
          Indisponível
        </p>
        <p className="mt-1 text-[14px] text-muted-foreground">{unavailable.reason}</p>
      </div>
    );
  }

  const formatted = formatValue(value, format, currency);
  const deltaInfo = formatDelta(delta);

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-card">
      <div className="flex items-start justify-between">
        <p className="text-[17px] font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="text-2xl text-jazz-accent" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[40px] font-bold leading-[48px] text-jazz-dark dark:text-white">
        {formatted}
      </p>
      <p className={`mt-1 text-[17px] font-semibold ${toneClasses[deltaInfo.tone]}`}>
        <span aria-hidden="true">{deltaInfo.symbol}</span> {deltaInfo.label}
      </p>
    </div>
  );
}
