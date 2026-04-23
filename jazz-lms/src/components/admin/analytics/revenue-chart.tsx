'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = { bucket: string; revenue: number };

function formatCurrency(value: number): string {
  return value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

export function RevenueChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  if (!data.length) return null;
  return (
    <div role="img" aria-label={ariaLabel} className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fontSize: 14 }} />
          <YAxis tick={{ fontSize: 14 }} tickFormatter={formatCurrency} width={80} />
          <Tooltip
            contentStyle={{ fontSize: 15, padding: 12 }}
            labelStyle={{ fontWeight: 600 }}
            formatter={((value: unknown) => [
              formatCurrency(typeof value === 'number' ? value : Number(value) || 0),
              'Receita',
            ]) as never}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#B8860B"
            strokeWidth={3}
            dot={{ r: 4, fill: '#B8860B' }}
            activeDot={{ r: 6 }}
            name="Receita"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
