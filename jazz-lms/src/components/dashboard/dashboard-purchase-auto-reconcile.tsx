"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Dispara uma reconciliação automática de pagamentos pendentes
 * quando o usuário entra no dashboard. Best-effort, silencioso.
 * Garante que pagamentos cuja confirmação não chegou via webhook
 * ainda sejam aplicados ao desbloquear o curso.
 */
export function DashboardPurchaseAutoReconcile() {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const controller = new AbortController();

    fetch("/api/purchases/auto-reconcile", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json().catch(() => null)) as
          | { unlocked?: number }
          | null;
        if (data?.unlocked && data.unlocked > 0) {
          router.refresh();
        }
      })
      .catch(() => {
        // best-effort, sem ruído
      });

    return () => controller.abort();
  }, [router]);

  return null;
}
