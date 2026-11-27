"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { languageToHtmlLang } from "@/lib/language";
import { getVoucherFailureMessage, getVoucherFailureReason, type VoucherFailureReason } from "@/lib/voucher-feedback";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useState } from "react";

export type AppliedVoucher = {
  voucher: {
    id: string;
    code: string;
    type: "FREE_ACCESS" | "DISCOUNT_PERCENT" | "DISCOUNT_FIXED";
  };
  type: "FREE_ACCESS" | "DISCOUNT_PERCENT" | "DISCOUNT_FIXED";
  originalPrice: number;
  discount: number;
  finalPrice: number;
  discountPercent: number;
  isFree: boolean;
  message: string;
  savings: string;
};

type VoucherInputProps = {
  courseId: string;
  onApplied: (voucher: AppliedVoucher | null) => void;
  disabled?: boolean;
};

export function VoucherInput({
  courseId,
  onApplied,
  disabled,
}: VoucherInputProps) {
  const { language } = useLanguage();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [failureReason, setFailureReason] = useState<VoucherFailureReason | 'Missing code' | 'Missing course'>('Failed');
  const [voucherData, setVoucherData] = useState<AppliedVoucher | null>(null);

  const copy = {
    es: {
      label: "Código de descuento",
      placeholder: "Ingresa tu código",
      apply: "Aplicar",
      validating: "Validando...",
      applied: "Código aplicado correctamente.",
      free: "Acceso 100% gratuito",
      newPrice: "Nuevo precio",
      missingCode: "Ingresa un código antes de aplicar.",
      missingCourse: "No se encontró el curso para validar el voucher.",
      remove: "Quitar",
    },
    en: {
      label: "Discount code",
      placeholder: "Enter your code",
      apply: "Apply",
      validating: "Validating...",
      applied: "Code applied successfully.",
      free: "100% free access",
      newPrice: "New price",
      missingCode: "Enter a code before applying.",
      missingCourse: "Course was not found to validate this voucher.",
      remove: "Remove",
    },
    fr: {
      label: "Code promo",
      placeholder: "Entrez votre code",
      apply: "Appliquer",
      validating: "Validation...",
      applied: "Code appliqué avec succès.",
      free: "Accès 100 % gratuit",
      newPrice: "Nouveau prix",
      missingCode: "Saisissez un code avant d’appliquer.",
      missingCourse: "Le cours est introuvable pour valider ce code.",
      remove: "Supprimer",
    },
    pt: {
      label: "Código de desconto",
      placeholder: "Digite seu código",
      apply: "Aplicar",
      validating: "Validando...",
      applied: "Código aplicado com sucesso.",
      free: "Acesso 100% gratuito",
      newPrice: "Novo preço",
      missingCode: "Digite um código antes de aplicar.",
      missingCourse: "Curso não encontrado para validar este voucher.",
      remove: "Remover",
    },
  }[language];
  const message = failureReason === 'Missing code' ? copy.missingCode
    : failureReason === 'Missing course' ? copy.missingCourse
      : getVoucherFailureMessage(failureReason, language);

  const handleApply = async () => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setStatus("error");
      setFailureReason('Missing code');
      onApplied(null);
      return;
    }

    if (!courseId) {
      setStatus("error");
      setFailureReason('Missing course');
      onApplied(null);
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      const response = await axios.post("/api/vouchers/validate", {
        code: normalizedCode,
        courseId,
      });

      if (response.data?.valid) {
        setVoucherData(response.data as AppliedVoucher);
        setStatus("success");
        onApplied(response.data as AppliedVoucher);
      } else {
        setVoucherData(null);
        setStatus("error");
        setFailureReason(getVoucherFailureReason(response.data, response.status));
        onApplied(null);
      }
    } catch (error) {
      setVoucherData(null);
      setStatus("error");
      setFailureReason(getVoucherFailureReason(
        axios.isAxiosError(error) ? error.response?.data : undefined,
        axios.isAxiosError(error) ? error.response?.status : undefined,
      ));
      onApplied(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="voucher-code" className="text-sm font-medium text-foreground">
        {copy.label}
      </label>
      <div className="flex gap-2">
        <input
          id="voucher-code"
          name="voucherCode"
          autoComplete="off"
          inputMode="text"
          maxLength={12}
          pattern="[A-Z0-9]{5,12}"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={code}
          placeholder={copy.placeholder}
          disabled={isLoading || disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const next = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
            setCode(next);
            setStatus("idle");
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleApply();
            }
          }}
        />
        {voucherData ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || disabled}
            onClick={() => {
              setVoucherData(null);
              setCode("");
              setStatus("idle");
              onApplied(null);
            }}
          >
            {copy.remove}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isLoading || disabled || !code.trim()}
            onClick={handleApply}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {copy.validating}
              </>
            ) : (
              copy.apply
            )}
          </Button>
        )}
      </div>

      {status === "success" ? (
        <div role="status" className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <p>{copy.applied}</p>
            {voucherData && (
              <p className="text-green-700 font-medium mt-1">
                {voucherData.isFree
                  ? copy.free
                  : `${copy.newPrice}: ${new Intl.NumberFormat(languageToHtmlLang(language), { style: 'currency', currency: 'EUR' }).format(voucherData.finalPrice)}`}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-800">{message}</p>
        </div>
      ) : null}
    </div>
  );
}
