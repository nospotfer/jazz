'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = { bucket: string; paid: number; voucher: number; total: number };

export function EnrollmentsChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  if (!data.length) return null;
  return (
    <div role="img" aria-label={ariaLabel} className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
          <XAxis dataKey="bucket" tick={{ fontSize: 14 }} />
          <YAxis tick={{ fontSize: 14 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 15, padding: 12 }} labelStyle={{ fontWeight: 600 }} />
          <Legend wrapperStyle={{ fontSize: 15 }} />
          <Bar dataKey="paid" stackId="a" fill="#B8860B" name="Pagas" />
          <Bar dataKey="voucher" stackId="a" fill="#1F4E79" name="Voucher" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
