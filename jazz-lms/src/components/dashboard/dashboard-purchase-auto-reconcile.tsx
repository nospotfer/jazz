"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthOwner } from "@/hooks/use-auth-owner";

/**
 * Dispara uma reconciliação automática de pagamentos pendentes
 * quando o usuário entra no dashboard. Best-effort, silencioso.
 * Garante que pagamentos cuja confirmação não chegou via webhook
 * ainda sejam aplicados ao desbloquear o curso.
 */
export function DashboardPurchaseAutoReconcile() {
  const router = useRouter();
  const firedRef = useRef(false);
  const { ready, capture, isCurrent } = useAuthOwner();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_RECOVERY_ACCESS === 'true') return;
    const token = capture();
    if (!token) return;
    if (firedRef.current) return;
    firedRef.current = true;

    const controller = new AbortController();
    let active = true;

    fetch("/api/purchases/auto-reconcile", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!active || controller.signal.aborted || !isCurrent(token) || !response.ok) return;
        const data = (await response.json().catch(() => null)) as
          | { unlocked?: number }
          | null;
        if (active && !controller.signal.aborted && isCurrent(token) && data?.unlocked && data.unlocked > 0) {
          router.refresh();
        }
      })
      .catch(() => {
        // best-effort, sem ruído
      });

    return () => { active = false; controller.abort(); };
  }, [router, ready, capture, isCurrent]);

  return null;
}
