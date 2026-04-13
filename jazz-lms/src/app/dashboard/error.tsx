"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-xl">
        <h2 className="text-xl font-semibold text-foreground">No pudimos cargar el panel</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta nuevamente en unos segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
