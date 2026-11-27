"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardPreferences } from "@/components/providers/dashboard-preferences-provider";
import { AuthOwnerContext, useAuthOwnerStore } from "@/hooks/use-auth-owner";

const copy = {
  es: { pending: "Comprobando tu sesión…", changed: "Tu sesión ha cambiado. Actualiza para continuar con la cuenta actual.", out: "Inicia sesión para continuar.", unavailable: "No pudimos comprobar tu sesión.", retry: "Volver a comprobar", login: "Iniciar sesión" },
  en: { pending: "Checking your session…", changed: "Your session changed. Refresh to continue with the current account.", out: "Sign in to continue.", unavailable: "We could not check your session.", retry: "Check again", login: "Sign in" },
  fr: { pending: "Vérification de votre session…", changed: "Votre session a changé. Actualisez pour continuer avec le compte actuel.", out: "Connectez-vous pour continuer.", unavailable: "Impossible de vérifier votre session.", retry: "Vérifier à nouveau", login: "Se connecter" },
  pt: { pending: "Verificando sua sessão…", changed: "Sua sessão mudou. Atualize para continuar com a conta atual.", out: "Entre para continuar.", unavailable: "Não foi possível verificar sua sessão.", retry: "Verificar novamente", login: "Entrar" },
};

export function PrivateOwnerBoundary({ expectedUserId, children }: { expectedUserId: string; children: ReactNode }) {
  const owner = useAuthOwnerStore();
  const { language } = useDashboardPreferences();
  const router = useRouter();
  const lastRefresh = useRef<number | null>(null);
  const ready = owner.resolved && !owner.unavailable && owner.ownerId === expectedUserId;
  const state = owner.unavailable ? "unavailable" : !owner.resolved ? "pending" : !owner.ownerId ? "signed-out" : ready ? "matching" : "changed";

  useEffect(() => {
    if (state !== "changed" || lastRefresh.current === owner.generation) return;
    lastRefresh.current = owner.generation;
    // A refresh can still see old cookies. Only matching verified props reveal children.
    router.refresh();
  }, [state, owner.generation, router]);

  const text = copy[language];
  return (
    <div data-private-owner-state={state} data-private-owner-generation={owner.generation}>
      {ready ? (
        <AuthOwnerContext.Provider key={`${expectedUserId}:${owner.generation}`} value={{ ...owner, expectedUserId, ready }}>
          {children}
        </AuthOwnerContext.Provider>
      ) : (
        <div role={state === "pending" ? "status" : "alert"} className="min-h-[50dvh] flex flex-col items-center justify-center gap-4 p-6 text-center bg-background text-foreground">
          <p>{state === "pending" ? text.pending : state === "changed" ? text.changed : state === "signed-out" ? text.out : text.unavailable}</p>
          {state !== "pending" && <div className="flex flex-wrap justify-center gap-4">
            <button type="button" className="min-h-11 rounded-lg border border-border px-4" onClick={() => { owner.retry(); router.refresh(); }}>{text.retry}</button>
            <Link href="/auth" className="min-h-11 inline-flex items-center rounded-lg border border-border px-4">{text.login}</Link>
          </div>}
        </div>
      )}
    </div>
  );
}
