'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import type { RangeKey } from '@/lib/admin/metrics-db';

const OPTIONS: Array<{ value: RangeKey; label: string; aria: string }> = [
  { value: '7d', label: '7 días', aria: 'Últimos 7 días' },
  { value: '30d', label: '30 días', aria: 'Últimos 30 días' },
  { value: '60d', label: '60 días', aria: 'Últimos 60 días' },
  { value: '90d', label: '90 días', aria: 'Últimos 90 días' },
  { value: '12m', label: '12 meses', aria: 'Últimos 12 meses' },
];

export function PeriodFilter({ current }: { current: RangeKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onSelect = (value: RangeKey) => {
    const next = new URLSearchParams(params.toString());
    next.set('range', value);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Período del panel"
      aria-busy={isPending}
      className="inline-flex flex-wrap gap-2 rounded-lg border border-border bg-white p-1 dark:bg-card"
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={opt.aria}
            onClick={() => onSelect(opt.value)}
            className={`min-h-[44px] min-w-[88px] rounded-md px-4 text-[17px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-jazz-accent focus-visible:ring-offset-2 ${
              active
                ? 'bg-jazz-accent text-jazz-dark shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
