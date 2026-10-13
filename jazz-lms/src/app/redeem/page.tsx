"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function RedeemPageContent() {
  const { language } = useLanguage();
  const copy = {
    es: { title: "Canjea tu acceso", subtitle: "Introduce tu código para acceder al curso.", code: "Código del voucher", submit: "Canjear acceso", loading: "Canjeando…", invalid: "Introduce un código y abre el enlace de canje del curso.", success: "Voucher canjeado correctamente.", granted: "Acceso concedido correctamente.", failed: "No se pudo canjear el voucher.", missingCourse: "Abre el enlace de canje que recibiste con tu voucher para identificar el curso.", home: "Volver al inicio" },
    en: { title: "Redeem your access", subtitle: "Enter your code to access the course.", code: "Voucher code", submit: "Redeem access", loading: "Redeeming…", invalid: "Enter a code and open the course redemption link.", success: "Voucher redeemed successfully.", granted: "Access granted successfully.", failed: "Unable to redeem the voucher.", missingCourse: "Open the redemption link you received with your voucher to identify the course.", home: "Back to home" },
    fr: { title: "Activez votre accès", subtitle: "Saisissez votre code pour accéder au cours.", code: "Code du voucher", submit: "Activer l’accès", loading: "Activation…", invalid: "Saisissez un code et ouvrez le lien d’activation du cours.", success: "Voucher activé avec succès.", granted: "Accès accordé avec succès.", failed: "Impossible d’activer le voucher.", missingCourse: "Ouvrez le lien d’activation reçu avec votre voucher pour identifier le cours.", home: "Retour à l’accueil" },
    pt: { title: "Resgatar acesso", subtitle: "Digite seu código para acessar o curso.", code: "Código do voucher", submit: "Resgatar acesso", loading: "Resgatando…", invalid: "Digite um código e abra o link de resgate do curso.", success: "Voucher resgatado com sucesso.", granted: "Acesso concedido com sucesso.", failed: "Não foi possível resgatar o voucher.", missingCourse: "Abra o link de resgate recebido com seu voucher para identificar o curso.", home: "Voltar ao início" },
  }[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [voucherCode, setVoucherCode] = useState("");
  const courseId = searchParams.get("courseId") || "";
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initialCode = searchParams.get("code") || "";
    if (initialCode) {
      setVoucherCode(initialCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!voucherCode.trim() || !courseId) {
      toast.error(copy.invalid);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("/api/vouchers/redeem", {
        voucherCode: voucherCode.trim().toUpperCase(),
        courseId,
      });

      if (response.data?.success) {
        setStatus("success");
        setMessage(copy.success);
        toast.success(copy.granted);

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      const apiMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : copy.failed;
      setStatus("error");
      setMessage(apiMessage);
      toast.error(apiMessage);
    } finally {
      setIsLoading(false);
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
                setStatus("idle");
              }}
              placeholder="JAZZFREE2026"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isLoading || !voucherCode.trim() || !courseId}
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <h1 className="text-2xl font-bold">Canjea tu acceso</h1>
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </div>
        </div>
      }
    >
      <RedeemPageContent />
    </Suspense>
  );
}
