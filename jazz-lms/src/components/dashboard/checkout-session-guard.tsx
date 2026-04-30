"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

/**
 * Detecta quando o checkout foi feito por um usuário diferente do que está
 * logado no navegador (ex: cookie da sessão antiga não foi limpo). Nesse
 * caso, faz signOut e redireciona para /auth com o courseId preservado,
 * para o usuário comprador entrar com a conta correta e ver o curso liberado.
 */
export function CheckoutSessionGuard({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const expectedUserId = searchParams.get("expectedUserId");
    if (!expectedUserId) return;
    if (expectedUserId === currentUserId) return;

    firedRef.current = true;

    void (async () => {
      const supabase = createClient();
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("[CHECKOUT_SESSION_GUARD_SIGNOUT_FAILED]", error);
      }

      const courseId = searchParams.get("courseId");
      const params = new URLSearchParams();
      params.set("redirectTo", "/dashboard");
      if (courseId) params.set("courseId", courseId);
      params.set("reason", "checkout_session_mismatch");
      router.replace(`/auth?${params.toString()}`);
    })();
  }, [currentUserId, router, searchParams]);

  return null;
}
