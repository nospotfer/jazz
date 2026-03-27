"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function RedeemPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [voucherCode, setVoucherCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initialCode = searchParams.get("code") || "";
    const initialCourseId = searchParams.get("courseId") || "";
    if (initialCode) {
      setVoucherCode(initialCode.toUpperCase());
    }
    if (initialCourseId) {
      setCourseId(initialCourseId);
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!voucherCode.trim() || !courseId) {
      toast.error("Dados inválidos para resgate.");
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
        setMessage(response.data.message || "Voucher resgatado com sucesso.");
        toast.success("Acesso concedido com sucesso.");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      const apiMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Falha ao resgatar voucher.";
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
          <h1 className="text-2xl font-bold">Resgatar acesso</h1>
          <p className="text-sm text-muted-foreground">
            Digite seu código para liberar o curso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Código do voucher</label>
            <input
              id="redeem-voucher-code"
              name="voucherCode"
              autoComplete="off"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={voucherCode}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setVoucherCode(event.target.value.toUpperCase());
                setStatus("idle");
              }}
              placeholder="JAZZ-FREE-ABC123"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !voucherCode.trim() || !courseId}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resgatando...
              </>
            ) : (
              "Resgatar acesso"
            )}
          </Button>
        </form>

        {status === "success" ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">{message}</p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
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
            <h1 className="text-2xl font-bold">Resgatar acesso</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }
    >
      <RedeemPageContent />
    </Suspense>
  );
}
