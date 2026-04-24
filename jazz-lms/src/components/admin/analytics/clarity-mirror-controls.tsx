'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  CLARITY_EXPORT_DIMENSIONS,
  type ClarityExportDimension,
} from '@/lib/admin/clarity-live-insights';
import { ActionPendingIndicator } from '@/components/admin/analytics/action-pending-indicator';

type ClarityMirrorControlsProps = {
  currentWindowDays: 1 | 2 | 3;
  currentDimensions: ClarityExportDimension[];
};

const WINDOW_OPTIONS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: '24h' },
  { value: 2, label: '48h' },
  { value: 3, label: '72h' },
];

function selectValue(
  dimensions: ClarityExportDimension[],
  index: number,
): ClarityExportDimension | '' {
  return dimensions[index] ?? '';
}

export function ClarityMirrorControls({
  currentWindowDays,
  currentDimensions,
}: ClarityMirrorControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushWithParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.set('_refresh', Date.now().toString());

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      router.refresh();
    });
  };

  const updateWindow = (windowDays: 1 | 2 | 3) => {
    pushWithParams((next) => {
      next.set('numOfDays', String(windowDays));
    });
  };

  const updateDimension = (index: 0 | 1 | 2, value: string) => {
    pushWithParams((next) => {
      const key = `d${index + 1}`;
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
  };

  const refreshNow = () => {
    pushWithParams(() => {
      // _refresh is enough to force transition+refresh.
    });
  };

  return (
    <div className="rounded-xl border border-border bg-white p-4 dark:bg-card">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ventana de datos
          </p>
          <div className="inline-flex rounded-lg border border-border p-1">
            {WINDOW_OPTIONS.map((option) => {
              const active = option.value === currentWindowDays;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isPending || active}
                  onClick={() => updateWindow(option.value)}
                  className={`min-h-[40px] min-w-[70px] rounded-md px-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-jazz-accent text-jazz-dark'
                      : 'text-muted-foreground hover:bg-muted disabled:cursor-wait disabled:opacity-60'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {[0, 1, 2].map((index) => (
          <label key={index} className="flex min-w-[190px] flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dimensión {index + 1}
            </span>
            <select
              value={selectValue(currentDimensions, index)}
              onChange={(event) =>
                updateDimension(index as 0 | 1 | 2, event.target.value)
              }
              disabled={isPending}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground disabled:cursor-wait disabled:opacity-60"
            >
              <option value="">Sin dimensión</option>
              {CLARITY_EXPORT_DIMENSIONS.map((dimension) => (
                <option key={dimension} value={dimension}>
                  {dimension}
                </option>
              ))}
            </select>
          </label>
        ))}

        <button
          type="button"
          onClick={refreshNow}
          disabled={isPending}
          className="inline-flex min-h-[40px] items-center rounded-md border border-border px-3 text-sm font-semibold text-jazz-dark transition hover:bg-muted disabled:cursor-wait disabled:opacity-60 dark:text-white"
        >
          Refrescar datos
        </button>
      </div>

      <ActionPendingIndicator
        busy={isPending}
        label="Cargando datos reales de Clarity..."
      />
    </div>
  );
}