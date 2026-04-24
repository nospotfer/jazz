'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function RefreshMetricsButton() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isRevalidating, setIsRevalidating] = useState(false);
  const busy = isPending || isRevalidating;

  const onClick = async () => {
    setIsRevalidating(true);
    try {
      const res = await fetch('/api/admin/metrics/revalidate', { method: 'POST' });
      if (!res.ok) {
        console.error('revalidate metrics failed', await res.text());
      }

      const next = new URLSearchParams(params.toString());
      next.set('_refresh', Date.now().toString());
      const href = `${pathname}?${next.toString()}`;

      startTransition(() => {
        router.replace(href, { scroll: false });
        router.refresh();
      });
    } catch (err) {
      console.error('revalidate metrics error', err);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-white px-4 text-[16px] font-medium text-jazz-dark transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-jazz-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:bg-card dark:text-white"
    >
      <span aria-hidden="true">{busy ? '⏳' : '🔄'}</span>
      {busy ? 'Actualizando…' : 'Refrescar'}
    </button>
  );
}
