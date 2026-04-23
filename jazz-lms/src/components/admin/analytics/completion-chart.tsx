'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = {
  courseId: string;
  courseTitle: string;
  startedCount: number;
  completedCount: number;
  completionRate: number;
};

export function CompletionChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  if (!data.length) return null;
  const shaped = data.map((d) => ({
    ...d,
    percent: Math.round(d.completionRate * 100),
  }));

  return (
    <div role="img" aria-label={ariaLabel} className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={shaped}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 24 }}
        >
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 14 }} />
          <YAxis
            type="category"
            dataKey="courseTitle"
            tick={{ fontSize: 14 }}
            width={180}
          />
          <Tooltip
            contentStyle={{ fontSize: 15, padding: 12 }}
            formatter={((_value: unknown, _name: unknown, entry: unknown) => {
              const payload = (entry as { payload?: Point & { percent: number } })?.payload;
              if (!payload) return ['0%', 'Finalización'];
              return [
                `${payload.percent}% (${payload.completedCount}/${payload.startedCount})`,
                'Finalización',
              ];
            }) as never}
          />
          <Bar dataKey="percent" fill="#B8860B" name="Finalización" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
