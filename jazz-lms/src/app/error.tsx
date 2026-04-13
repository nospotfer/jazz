"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-xl">
            <h1 className="text-2xl font-semibold">Algo salio mal</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrio un error inesperado. Puedes intentar nuevamente.
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
      </body>
    </html>
  );
}
