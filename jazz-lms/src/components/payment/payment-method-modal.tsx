'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { VoucherInput, type AppliedVoucher } from '@/components/vouchers/voucher-input';

export type PaymentMethod = 'card' | 'paypal';

interface PaymentMethodModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  language: 'es' | 'en' | 'fr' | 'pt';
  courseId: string;
  errorMessage?: string;
  onClose: () => void;
  onVoucherApplied: (voucher: AppliedVoucher | null) => void;
  onConfirm: (method: PaymentMethod) => void;
}

const copyByLanguage = {
  es: {
    title: 'Elige método de pago',
    subtitle: 'Selecciona cómo quieres completar la compra.',
    voucherHint: 'Aplica tu código antes de continuar al checkout.',
    methodCard: 'Tarjeta',
    methodPaypal: 'PayPal',
    cancel: 'Cancelar',
    continue: 'Continuar',
  },
  en: {
    title: 'Choose payment method',
    subtitle: 'Select how you want to complete your purchase.',
    voucherHint: 'Apply your code before continuing to checkout.',
    methodCard: 'Card',
    methodPaypal: 'PayPal',
    cancel: 'Cancel',
    continue: 'Continue',
  },
  fr: {
    title: 'Choisissez le moyen de paiement',
    subtitle: 'Sélectionnez comment finaliser votre achat.',
    voucherHint: 'Appliquez votre code avant de continuer vers le checkout.',
    methodCard: 'Carte',
    methodPaypal: 'PayPal',
    cancel: 'Annuler',
    continue: 'Continuer',
  },
  pt: {
    title: 'Escolha o método de pagamento',
    subtitle: 'Selecione como deseja concluir a compra.',
    voucherHint: 'Aplique seu código antes de continuar para o checkout.',
    methodCard: 'Cartão',
    methodPaypal: 'PayPal',
    cancel: 'Cancelar',
    continue: 'Continuar',
  },
} as const;

function MethodLogo({ method }: { method: PaymentMethod }) {
  if (method === 'card') {
    return (
      <div className="h-11 w-11 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
          <rect x="8" y="14" width="48" height="36" rx="8" fill="currentColor" className="text-indigo-500" />
          <rect x="8" y="22" width="48" height="6" fill="white" fillOpacity="0.85" />
          <rect x="14" y="36" width="14" height="6" rx="2" fill="white" fillOpacity="0.85" />
        </svg>
      </div>
    );
  }

  if (method === 'paypal') {
    return (
      <div className="h-11 w-11 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
          <path d="M23 50h-7l6-36h14c8 0 13 4 12 11-1 7-6 10-13 10h-6l-2 15Z" fill="#0EA5E9" />
          <path d="M29 50h-7l5-29h13c7 0 11 3 10 9-1 6-5 8-11 8h-6l-4 12Z" fill="#1D4ED8" />
        </svg>
      </div>
    );
  }

  return null;
}

export function PaymentMethodModal({
  isOpen,
  isLoading = false,
  language,
  courseId,
  errorMessage,
  onClose,
  onVoucherApplied,
  onConfirm,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [animatedMethod, setAnimatedMethod] = useState<PaymentMethod | null>(null);
  const [animationNonce, setAnimationNonce] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null);
      setAnimatedMethod(null);
      setAnimationNonce(0);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const copy = copyByLanguage[language];

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setAnimatedMethod(method);
    setAnimationNonce((current) => current + 1);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 md:p-7 animate-fade-scale-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-foreground">{copy.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-background/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{copy.voucherHint}</p>
          <VoucherInput
            courseId={courseId}
            disabled={isLoading}
            onApplied={onVoucherApplied}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleSelectMethod('card')}
            disabled={isLoading}
            className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 text-left transition-all duration-200 ease-out will-change-transform ${
              selectedMethod === 'card'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.04] -translate-y-1'
                : 'border-border bg-background hover:scale-[1.035] hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/15'
            }`}
          >
            {selectedMethod === 'card' ? (
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/18 via-transparent to-primary/5 animate-pulse" />
            ) : null}
            {selectedMethod === 'card' ? (
              <span className="payment-selected-sheen" aria-hidden="true" />
            ) : null}
            {animatedMethod === 'card' ? (
              <span key={`card-${animationNonce}`} className="payment-tunnel-select" aria-hidden="true" />
            ) : null}
            <div className="relative z-10">
              <MethodLogo method="card" />
              <p className="mt-3 text-lg font-semibold text-foreground">{copy.methodCard}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground">CARD</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMethod('paypal')}
            disabled={isLoading}
            className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 text-left transition-all duration-200 ease-out will-change-transform ${
              selectedMethod === 'paypal'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.04] -translate-y-1'
                : 'border-border bg-background hover:scale-[1.035] hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/15'
            }`}
          >
            {selectedMethod === 'paypal' ? (
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/18 via-transparent to-primary/5 animate-pulse" />
            ) : null}
            {selectedMethod === 'paypal' ? (
              <span className="payment-selected-sheen" aria-hidden="true" />
            ) : null}
            {animatedMethod === 'paypal' ? (
              <span key={`paypal-${animationNonce}`} className="payment-tunnel-select" aria-hidden="true" />
            ) : null}
            <div className="relative z-10">
              <MethodLogo method="paypal" />
              <p className="mt-3 text-lg font-semibold text-foreground">{copy.methodPaypal}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground">PAYPAL</p>
            </div>
          </button>

        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive text-center">{errorMessage}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!selectedMethod) {
                return;
              }
              onConfirm(selectedMethod);
            }}
            disabled={isLoading || !selectedMethod}
          >
            {copy.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
