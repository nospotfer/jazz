'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { loadPaymentMethodModal, warmPaymentMethodModal } from '@/lib/payment-modal-loader';
import type { AppliedVoucher } from '@/components/vouchers/voucher-input';
import { DEFAULT_FULL_COURSE_PRICE_EUR } from '@/lib/pricing';

const PaymentMethodModal = dynamic(
  () => loadPaymentMethodModal().then((mod) => mod.PaymentMethodModal),
  { ssr: false }
);

interface DashboardPaywallWrapperProps {
  hasPaidCourse: boolean;
  courseId: string | null;
  children: ReactNode;
}

export function DashboardPaywallWrapper({ hasPaidCourse, courseId, children }: DashboardPaywallWrapperProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

  const copy = {
    es: {
      title: 'Área bloqueada',
      description: 'Para acceder a esta área necesitas realizar el pago del curso completo.',
      processing: 'Procesando...',
      payFullCourse: 'Pagar curso completo',
      chooseMethod: 'Aplicar voucher y continuar',
    },
    en: {
      title: 'Locked area',
      description: 'To access this area, you need to purchase the full course.',
      processing: 'Processing...',
      payFullCourse: 'Pay full course',
      chooseMethod: 'Apply voucher and continue',
    },
    fr: {
      title: 'Zone bloquée',
      description: 'Pour accéder à cette zone, vous devez acheter le cours complet.',
      processing: 'Traitement...',
      payFullCourse: 'Payer le cours complet',
      chooseMethod: 'Appliquer un code et continuer',
    },
    pt: {
      title: 'Área bloqueada',
      description: 'Para acceder a esta área, necesitas comprar el curso completo.',
      processing: 'Processando...',
      payFullCourse: 'Pagar curso completo',
      chooseMethod: 'Aplicar voucher e continuar',
    },
  }[language === 'pt' ? 'es' : language];

  const isLockedRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname === '/dashboard') return false;
    return pathname.startsWith('/dashboard');
  }, [pathname]);

  const showPaywall = !hasPaidCourse && isLockedRoute;

  useEffect(() => {
    const idleCallback = window.requestIdleCallback?.(() => {
      warmPaymentMethodModal();
    });

    if (idleCallback !== undefined) {
      return () => {
        window.cancelIdleCallback?.(idleCallback);
      };
    }

    const timeoutId = window.setTimeout(() => {
      warmPaymentMethodModal();
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const primePaymentModal = () => {
    warmPaymentMethodModal();
  };

  const openPaymentModal = () => {
    warmPaymentMethodModal();
    setPaymentError('');
    setIsMethodModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!courseId || isPurchasing) return;

    try {
      setIsPurchasing(true);
      setPaymentError('');
      const response = await axios.post('/api/checkout', {
        courseId,
        source: 'dashboard',
        language,
        voucherCode: appliedVoucher?.voucher.code,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data === 'string') {
        setPaymentError(error.response.data);
      }
      setIsPurchasing(false);
    }
  };

  return (
    <div className="relative min-h-full">
      <div className={showPaywall ? 'blur-sm pointer-events-none select-none' : ''}>
        {children}
      </div>

      {showPaywall && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card shadow-2xl p-6 space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-xl font-serif font-bold text-foreground">
              {copy.title}
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {copy.description}
            </p>
            <Button
              type="button"
              onClick={openPaymentModal}
              onMouseEnter={primePaymentModal}
              onFocus={primePaymentModal}
              onTouchStart={primePaymentModal}
              disabled={isPurchasing || !courseId}
              className="w-full"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {copy.processing}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {copy.chooseMethod}
                </>
              )}
            </Button>
            {paymentError ? (
              <p className="text-xs text-destructive">{paymentError}</p>
            ) : null}
          </div>
        </div>
      )}

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isPurchasing}
        language={language}
        courseId={courseId ?? ''}
        basePrice={DEFAULT_FULL_COURSE_PRICE_EUR}
        errorMessage={paymentError}
        onClose={() => {
          if (!isPurchasing) {
            setIsMethodModalOpen(false);
          }
        }}
        onVoucherApplied={(voucher) => {
          setAppliedVoucher(voucher);
          setPaymentError('');
        }}
        onConfirm={() => {
          void handlePurchase();
        }}
      />
    </div>
  );
}
