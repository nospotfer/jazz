"use client";

import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  VoucherInput,
  type AppliedVoucher,
} from "@/components/vouchers/voucher-input";
import { DEFAULT_FULL_COURSE_PRICE_EUR, getKnownCatalogPrice } from "@/lib/pricing";

interface PaymentMethodModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  language: "es" | "en" | "fr" | "pt";
  courseId: string;
  basePrice?: number | null;
  errorMessage?: string;
  onClose: () => void;
  onVoucherApplied: (voucher: AppliedVoucher | null) => void;
  onConfirm: () => void;
}

const copyByLanguage = {
  es: {
    title: "Activa tu descuento",
    subtitle:
      "Ingresa tu voucher y continúa al checkout seguro de Dodo Payments.",
    voucherHint: "Si no tienes voucher, el curso sigue con el precio normal.",
    summaryTitle: "Resumen de compra",
    basePrice: "Precio base",
    discount: "Descuento",
    total: "Total a pagar",
    priceUnavailable: "Precio no disponible",
    priceUnavailableHint: "No pudimos obtener el precio del curso. Actualiza la página para continuar.",
    checkoutAmountHint: "El importe final se confirmará en el checkout.",
    cancel: "Cancelar",
    continue: "Ir al checkout",
  },
  en: {
    title: "Apply your discount",
    subtitle:
      "Enter your voucher and continue to secure Dodo Payments checkout.",
    voucherHint:
      "If you do not have a voucher, the course keeps the normal price.",
    summaryTitle: "Purchase summary",
    basePrice: "Base price",
    discount: "Discount",
    total: "Total to pay",
    priceUnavailable: "Price unavailable",
    priceUnavailableHint: "We could not get the course price. Refresh the page to continue.",
    checkoutAmountHint: "The final amount will be confirmed in checkout.",
    cancel: "Cancel",
    continue: "Go to checkout",
  },
  fr: {
    title: "Activez votre remise",
    subtitle:
      "Entrez votre code promo puis continuez vers le checkout Dodo Payments.",
    voucherHint: "Sans code promo, le cours reste au prix normal.",
    summaryTitle: "Resume de l achat",
    basePrice: "Prix de base",
    discount: "Remise",
    total: "Total a payer",
    priceUnavailable: "Prix indisponible",
    priceUnavailableHint: "Impossible d’obtenir le prix du cours. Actualisez la page pour continuer.",
    checkoutAmountHint: "Le montant final sera confirmé lors du paiement.",
    cancel: "Annuler",
    continue: "Aller au checkout",
  },
  pt: {
    title: "Ative seu desconto",
    subtitle:
      "Digite seu voucher e continue para o checkout seguro da Dodo Payments.",
    voucherHint: "Sem voucher, o curso continua com o valor normal.",
    summaryTitle: "Resumo da compra",
    basePrice: "Preco base",
    discount: "Desconto",
    total: "Total a pagar",
    priceUnavailable: "Preço indisponível",
    priceUnavailableHint: "Não foi possível obter o preço do curso. Atualize a página para continuar.",
    checkoutAmountHint: "O valor final será confirmado no checkout.",
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
  const [voucherSnapshot, setVoucherSnapshot] = useState<{
    courseId: string; epoch: number; voucher: AppliedVoucher;
  } | null>(null);
  const [validationEpoch, setValidationEpoch] = useState(0);
  const lifecycle = useRef({ courseId, isOpen, epoch: 0, active: false });
  const onApplied = useRef(onVoucherApplied);
  useLayoutEffect(() => { onApplied.current = onVoucherApplied; }, [onVoucherApplied]);
  useLayoutEffect(() => {
    const epoch = lifecycle.current.epoch + 1;
    lifecycle.current = { courseId, isOpen, epoch, active: true };
    setValidationEpoch(epoch);
    setVoucherSnapshot(null);
    // The displayed quote and parent checkout intent must reset together.
    onApplied.current(null);
    return () => {
      lifecycle.current.active = false;
      lifecycle.current.epoch += 1;
    };
  }, [courseId, isOpen]);

  const appliedVoucher = voucherSnapshot?.courseId === courseId && voucherSnapshot.epoch === validationEpoch
    ? voucherSnapshot.voucher : null;

  if (!isOpen) {
    return null;
  }

  const copy = copyByLanguage[language];
  const knownAmount = getKnownCatalogPrice;
  // Only omitted legacy callers retain the default. Explicit missing prices
  // must not be turned into a quote, and a real zero is a known amount.
  const catalogPrice = knownAmount(basePrice === undefined ? DEFAULT_FULL_COURSE_PRICE_EUR : basePrice);
  const fullPrice = catalogPrice === null ? null
    : appliedVoucher ? knownAmount(appliedVoucher.originalPrice) : catalogPrice;
  const discountValue = fullPrice === null ? null : appliedVoucher ? knownAmount(appliedVoucher.discount) : 0;
  const finalValue = fullPrice === null ? null
    : appliedVoucher ? knownAmount(appliedVoucher.finalPrice) : fullPrice;
  const isPriceAvailable = fullPrice !== null && discountValue !== null && finalValue !== null;
  const formatMoney = (value: number | null) => value === null ? copy.priceUnavailable : `EUR ${value.toFixed(2)}`;

  return (
    <div
      data-testid="payment-method-modal-overlay"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div
        data-testid="payment-method-modal"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 md:p-7 animate-fade-scale-in"
      >
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
            key={`${courseId}:${validationEpoch}`}
            courseId={courseId}
            disabled={isLoading || !isPriceAvailable}
            onApplied={(voucher) => {
              const current = lifecycle.current;
              if (!current.active || !current.isOpen || current.courseId !== courseId || current.epoch !== validationEpoch) return;
              setVoucherSnapshot(voucher ? { courseId, epoch: validationEpoch, voucher } : null);
              onApplied.current(voucher);
            }}
          />
        </div>

        {!isPriceAvailable ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground text-center">
            {copy.priceUnavailableHint}
          </p>
        ) : null}

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
              <span>{discountValue === null ? copy.priceUnavailable : `-${formatMoney(discountValue)}`}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>{copy.total}</span>
              <span>{formatMoney(finalValue)}</span>
            </div>
          </div>
        </div>

        {isPriceAvailable ? (
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {copy.checkoutAmountHint}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive text-center">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            data-testid="payment-method-modal-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            data-testid="payment-method-modal-continue"
            onClick={onConfirm}
            disabled={isLoading || !isPriceAvailable}
          >
            {copy.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
