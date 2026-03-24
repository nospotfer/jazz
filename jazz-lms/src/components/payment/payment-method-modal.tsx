"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    VoucherInput,
    type AppliedVoucher,
} from "@/components/vouchers/voucher-input";
import { DEFAULT_FULL_COURSE_PRICE_EUR } from "@/lib/pricing";

interface PaymentMethodModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  language: "es" | "en" | "fr" | "pt";
  courseId: string;
  basePrice?: number;
  errorMessage?: string;
  onClose: () => void;
  onVoucherApplied: (voucher: AppliedVoucher | null) => void;
  onConfirm: () => void;
}

const copyByLanguage = {
  es: {
    title: "Activa tu descuento",
    subtitle:
      "Ingresa tu voucher y continúa al checkout seguro de Lemon Squeezy.",
    voucherHint: "Si no tienes voucher, el curso sigue con el precio normal.",
    summaryTitle: "Resumen de compra",
    basePrice: "Precio base",
    discount: "Descuento",
    total: "Total a pagar",
    cancel: "Cancelar",
    continue: "Ir al checkout",
  },
  en: {
    title: "Apply your discount",
    subtitle:
      "Enter your voucher and continue to secure Lemon Squeezy checkout.",
    voucherHint:
      "If you do not have a voucher, the course keeps the normal price.",
    summaryTitle: "Purchase summary",
    basePrice: "Base price",
    discount: "Discount",
    total: "Total to pay",
    cancel: "Cancel",
    continue: "Go to checkout",
  },
  fr: {
    title: "Activez votre remise",
    subtitle:
      "Entrez votre code promo puis continuez vers le checkout Lemon Squeezy.",
    voucherHint: "Sans code promo, le cours reste au prix normal.",
    summaryTitle: "Resume de l achat",
    basePrice: "Prix de base",
    discount: "Remise",
    total: "Total a payer",
    cancel: "Annuler",
    continue: "Aller au checkout",
  },
  pt: {
    title: "Ative seu desconto",
    subtitle:
      "Digite seu voucher e continue para o checkout seguro da Lemon Squeezy.",
    voucherHint: "Sem voucher, o curso continua com o valor normal.",
    summaryTitle: "Resumo da compra",
    basePrice: "Preco base",
    discount: "Desconto",
    total: "Total a pagar",
    cancel: "Cancelar",
    continue: "Ir para checkout",
  },
} as const;

export function PaymentMethodModal({
  isOpen,
  isLoading = false,
  language,
  courseId,
  basePrice,
  errorMessage,
  onClose,
  onVoucherApplied,
  onConfirm,
}: PaymentMethodModalProps) {
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null,
  );

  useEffect(() => {
    if (isOpen) {
      setAppliedVoucher(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const copy = copyByLanguage[language];
  const fullPrice =
    Number.isFinite(basePrice) && Number(basePrice) > 0
      ? Number(basePrice)
      : DEFAULT_FULL_COURSE_PRICE_EUR;
  const discountValue = appliedVoucher?.discount ?? 0;
  const finalValue = appliedVoucher ? appliedVoucher.finalPrice : fullPrice;
  const formatMoney = (value: number) => `EUR ${value.toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 md:p-7 animate-fade-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
            {copy.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-background/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {copy.voucherHint}
          </p>
          <VoucherInput
            courseId={courseId}
            disabled={isLoading}
            onApplied={(voucher) => {
              setAppliedVoucher(voucher);
              onVoucherApplied(voucher);
            }}
          />
        </div>

        <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-4">
          <p className="text-sm font-semibold text-foreground">
            {copy.summaryTitle}
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{copy.basePrice}</span>
              <span>{formatMoney(fullPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-600">
              <span>{copy.discount}</span>
              <span>-{formatMoney(discountValue)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>{copy.total}</span>
              <span>{formatMoney(finalValue)}</span>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive text-center">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {copy.cancel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isLoading}>
            {copy.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
