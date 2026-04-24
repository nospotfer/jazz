'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import type { RangeKey } from '@/lib/admin/metrics-db';

const OPTIONS: Array<{ value: RangeKey; label: string; aria: string }> = [
  { value: '7d', label: '7 días', aria: 'Últimos 7 días' },
  { value: '30d', label: '30 días', aria: 'Últimos 30 días' },
  { value: '60d', label: '60 días', aria: 'Últimos 60 días' },
  { value: '90d', label: '90 días', aria: 'Últimos 90 días' },
  { value: '12m', label: '12 meses', aria: 'Últimos 12 meses' },
];

export function PeriodFilter({ current }: { current: RangeKey }) {
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div
      role="tablist"
      aria-label="Período del panel"
      className="inline-flex flex-wrap gap-2 rounded-lg border border-border bg-white p-1 dark:bg-card"
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        const next = new URLSearchParams(params.toString());
        next.set('range', opt.value);
        const href = `${pathname}?${next.toString()}`;

        return (
          <Link
            key={opt.value}
            href={href}
            prefetch={false}
            role="tab"
            aria-selected={active}
            aria-label={opt.aria}
            className={`min-h-[44px] min-w-[88px] rounded-md px-4 text-[17px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-jazz-accent focus-visible:ring-offset-2 ${
              active
                ? 'bg-jazz-accent text-jazz-dark shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
