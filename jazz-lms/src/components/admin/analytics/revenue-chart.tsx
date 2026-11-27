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
import { getPaymentCurrencyExponent } from '@/lib/payment-money';

type Point = { bucket: string; revenue: number };

export function RevenueChart({ data, currency, ariaLabel }: { data: Point[]; currency: string; ariaLabel: string }) {
  const exponent = getPaymentCurrencyExponent(currency);
  if (!data.length || exponent === null) return null;
  const formatCurrency = (value: number) => `${currency} ${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: exponent, maximumFractionDigits: exponent,
  }).format(value)}`;
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
              typeof value === 'number' && Number.isFinite(value) ? formatCurrency(value) : 'No disponible',
              'Cobros registrados',
            ]) as never}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#B8860B"
            strokeWidth={3}
            dot={{ r: 4, fill: '#B8860B' }}
            activeDot={{ r: 6 }}
            name="Cobros registrados"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
