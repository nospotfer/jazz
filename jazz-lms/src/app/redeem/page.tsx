"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { type AuthOwnerToken, withExpectedUserId } from "@/hooks/use-auth-owner";
import { useOwnerAction } from "@/hooks/use-owner-action";
import { getCheckoutSessionChangedMessage, isCheckoutSessionChanged } from "@/lib/checkout-helpers";
import { getVoucherFailureMessage, getVoucherFailureReason, type VoucherFailureReason } from "@/lib/voucher-feedback";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

type RedemptionWork = { owner: AuthOwnerToken; intent: string; generation: number };
type RedemptionResult = {
  work: RedemptionWork;
  loading: boolean;
  status: "idle" | "success" | "error";
  failureReason: VoucherFailureReason;
  sessionChanged: boolean;
};

function RedeemPageContent() {
  const { language } = useLanguage();
  const { capture, isCurrent, ready } = useOwnerAction();
  const copy = {
    es: { title: "Canjea tu acceso", subtitle: "Introduce tu código para acceder al curso.", code: "Código del voucher", submit: "Canjear acceso", loading: "Canjeando…", invalid: "Introduce un código y abre el enlace de canje del curso.", success: "Voucher canjeado correctamente.", granted: "Acceso concedido correctamente.", failed: "No se pudo canjear el voucher.", missingCourse: "Abre el enlace de canje que recibiste con tu voucher para identificar el curso.", home: "Volver al inicio" },
    en: { title: "Redeem your access", subtitle: "Enter your code to access the course.", code: "Voucher code", submit: "Redeem access", loading: "Redeeming…", invalid: "Enter a code and open the course redemption link.", success: "Voucher redeemed successfully.", granted: "Access granted successfully.", failed: "Unable to redeem the voucher.", missingCourse: "Open the redemption link you received with your voucher to identify the course.", home: "Back to home" },
    fr: { title: "Activez votre accès", subtitle: "Saisissez votre code pour accéder au cours.", code: "Code du voucher", submit: "Activer l’accès", loading: "Activation…", invalid: "Saisissez un code et ouvrez le lien d’activation du cours.", success: "Voucher activé avec succès.", granted: "Accès accordé avec succès.", failed: "Impossible d’activer le voucher.", missingCourse: "Ouvrez le lien d’activation reçu avec votre voucher pour identifier le cours.", home: "Retour à l’accueil" },
    pt: { title: "Resgatar acesso", subtitle: "Digite seu código para acessar o curso.", code: "Código do voucher", submit: "Resgatar acesso", loading: "Resgatando…", invalid: "Digite um código e abra o link de resgate do curso.", success: "Voucher resgatado com sucesso.", granted: "Acesso concedido com sucesso.", failed: "Não foi possível resgatar o voucher.", missingCourse: "Abra o link de resgate recebido com seu voucher para identificar o curso.", home: "Voltar ao início" },
  }[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const initialCode = searchParams.get("code") || "";
  const [voucherCode, setVoucherCode] = useState(initialCode.toUpperCase());
  const intent = JSON.stringify([courseId, initialCode]);
  const [intentVersion, setIntentVersion] = useState({ key: intent, generation: 0 });
  if (intentVersion.key !== intent) {
    setIntentVersion({ key: intent, generation: intentVersion.generation + 1 });
    if (initialCode) setVoucherCode(initialCode.toUpperCase());
  }
  const intentRef = useRef({ key: intent, generation: 0 });
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const navigation = useRef<{ timer: ReturnType<typeof setTimeout>; work: RedemptionWork } | null>(null);
  const clearNavigation = useCallback(() => {
    if (navigation.current) clearTimeout(navigation.current.timer);
    navigation.current = null;
  }, []);
  useLayoutEffect(() => {
    if (intentRef.current.key !== intentVersion.key) {
      intentRef.current = intentVersion;
      clearNavigation();
    }
  }, [intentVersion, clearNavigation]);
  const isCurrentWork = useCallback((work: RedemptionWork) => (
    isCurrent(work.owner) && intentRef.current.key === work.intent
      && intentRef.current.generation === work.generation
  ), [isCurrent]);
  const currentResult = result?.work.intent === intent && result.work.generation === intentVersion.generation
    && isCurrent(result.work.owner) ? result : null;
  const isLoading = currentResult?.loading ?? false;
  const status = currentResult?.status ?? "idle";
  const message = status === "success" ? copy.success : currentResult?.sessionChanged
    ? getCheckoutSessionChangedMessage(language)
    : getVoucherFailureMessage(currentResult?.failureReason ?? "Failed", language);
  const signInCopy = {
    es: { link: "Iniciar sesión", return: "Después de iniciar sesión, vuelve a abrir el enlace de tu voucher." },
    en: { link: "Sign in", return: "After signing in, reopen your voucher link." },
    fr: { link: "Se connecter", return: "Après connexion, rouvrez le lien de votre voucher." },
    pt: { link: "Entrar", return: "Depois de entrar, abra novamente o link do seu voucher." },
  }[language];

  // The standalone SDK subscription rerenders on owner changes. Retired
  // feedback is hidden above; cancel its timer even when the next owner is ready.
  useEffect(() => {
    if (navigation.current && !isCurrentWork(navigation.current.work)) clearNavigation();
  });
  useEffect(() => clearNavigation, [clearNavigation]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const owner = capture();
    if (!owner) {
      toast.error(getVoucherFailureMessage("Unauthorized", language));
      return;
    }
    if (isLoading) return;

    if (!voucherCode.trim() || !courseId) {
      toast.error(copy.invalid);
      return;
    }

    const work = { owner, intent, generation: intentRef.current.generation };
    clearNavigation();
    setResult({ work, loading: true, status: "idle", failureReason: "Failed", sessionChanged: false });
    try {
      const response = await axios.post(withExpectedUserId("/api/vouchers/redeem", owner.ownerId), {
        voucherCode: voucherCode.trim().toUpperCase(),
        courseId,
      });
      if (!isCurrentWork(work)) return;

      if (response.data?.success) {
        setResult({ work, loading: false, status: "success", failureReason: "Failed", sessionChanged: false });
        toast.success(copy.granted);

        navigation.current = { work, timer: setTimeout(() => {
          navigation.current = null;
          if (isCurrentWork(work)) router.push("/dashboard");
        }, 1500) };
      } else {
        const reason = getVoucherFailureReason(response.data, response.status);
        const sessionChanged = isCheckoutSessionChanged(response.status, response.data);
        setResult({ work, loading: false, status: "error", failureReason: reason, sessionChanged });
        toast.error(sessionChanged ? getCheckoutSessionChangedMessage(language) : getVoucherFailureMessage(reason, language));
      }
    } catch (error) {
      if (!isCurrentWork(work)) return;
      const failureData = axios.isAxiosError(error) ? error.response?.data : undefined;
      const failureStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
      const reason = getVoucherFailureReason(
        failureData, failureStatus,
      );
      const sessionChanged = isCheckoutSessionChanged(failureStatus, failureData);
      setResult({ work, loading: false, status: "error", failureReason: reason, sessionChanged });
      toast.error(sessionChanged ? getCheckoutSessionChangedMessage(language) : getVoucherFailureMessage(reason, language));
    } finally {
      if (isCurrentWork(work)) {
        setResult(previous => previous?.work === work ? { ...previous, loading: false } : previous);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="redeem-voucher-code" className="text-sm font-medium">{copy.code}</label>
            <input
              id="redeem-voucher-code"
              name="voucherCode"
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base"
              value={voucherCode}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setVoucherCode(event.target.value.toUpperCase());
                clearNavigation();
                setResult(null);
              }}
              placeholder="JAZZFREE2026"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isLoading || !ready || !voucherCode.trim() || !courseId}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {copy.loading}
              </>
            ) : (
              copy.submit
            )}
          </Button>
        </form>

        {!ready && <div className="rounded-lg border border-border bg-muted p-3 space-y-2 text-sm">
          <p role="status">{getVoucherFailureMessage("Unauthorized", language)}</p>
          <Link href="/auth" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">{signInCopy.link}</Link>
          <p className="text-muted-foreground">{signInCopy.return}</p>
        </div>}
        {!courseId && <p className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">{copy.missingCourse}</p>}
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4">{copy.home}</Link>

        {status === "success" ? (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">{message}</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RedeemPage() {
  const { language } = useLanguage();
  const loadingCopy = {
    es: { title: 'Canjea tu acceso', loading: 'Cargando…' },
    en: { title: 'Redeem your access', loading: 'Loading…' },
    fr: { title: 'Activez votre accès', loading: 'Chargement…' },
    pt: { title: 'Resgatar acesso', loading: 'Carregando…' },
  }[language];
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <h1 className="text-2xl font-bold">{loadingCopy.title}</h1>
            <p className="text-sm text-muted-foreground">{loadingCopy.loading}</p>
          </div>
        </div>
      }
    >
      <RedeemPageContent />
    </Suspense>
  );
}
