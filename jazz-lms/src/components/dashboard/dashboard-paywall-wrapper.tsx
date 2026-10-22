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
import { useOwnerAction } from '@/hooks/use-owner-action';
import { withExpectedUserId } from '@/hooks/use-auth-owner';
import { getCheckoutSessionChangedMessage, isCheckoutSessionChanged } from '@/lib/checkout-helpers';

const PaymentMethodModal = dynamic(
  () => loadPaymentMethodModal().then((mod) => mod.PaymentMethodModal),
  { ssr: false }
);

interface DashboardPaywallWrapperProps {
  hasPaidCourse: boolean;
  courseId: string | null;
  coursePrice?: number | null;
  children: ReactNode;
}

export function DashboardPaywallWrapper({ hasPaidCourse, courseId, coursePrice, children }: DashboardPaywallWrapperProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const { capture, isCurrent } = useOwnerAction();

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
  }[language];

  const isLockedRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname === '/dashboard') return false;
    // Course payment must not prevent managing the registered user's account.
    // Authentication and owner checks still come from the dashboard boundary.
    if (/^\/dashboard\/(?:profile|payment|settings)\/?$/.test(pathname)) return false;
    // The notes page and API enforce access to the individual lesson, including
    // the free first lesson and historical single-lesson purchases.
    if (/^\/dashboard\/notes\/[^/]+\/[^/]+\/?$/.test(pathname)) return false;
    return pathname.startsWith('/dashboard/');
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
    if (process.env.NEXT_PUBLIC_RECOVERY_ACCESS === 'true') return;
    warmPaymentMethodModal();
    setPaymentError('');
    setIsMethodModalOpen(true);
  };

  const handlePurchase = async () => {
    if (process.env.NEXT_PUBLIC_RECOVERY_ACCESS === 'true') return;
    if (!courseId || isPurchasing) return;
    const token = capture();
    if (!token) return;

    try {
      setIsPurchasing(true);
      setPaymentError('');
      const response = await axios.post(withExpectedUserId('/api/checkout', token.ownerId), {
        courseId,
        source: 'dashboard',
        language,
        voucherCode: appliedVoucher?.voucher.code,
      });
      if (!isCurrent(token)) return;

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch (error) {
      if (!isCurrent(token)) return;
      if (axios.isAxiosError(error) && isCheckoutSessionChanged(error.response?.status, error.response?.data)) {
        setPaymentError(getCheckoutSessionChangedMessage(language));
      } else if (axios.isAxiosError(error) && typeof error.response?.data === 'string') {
        setPaymentError(error.response.data);
      }
      setIsPurchasing(false);
    }
  };

  return (
    <>
    <div className="relative isolate min-h-full">
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
    </div>

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isPurchasing}
        language={language}
        courseId={courseId ?? ''}
        basePrice={coursePrice}
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
    </>
  );
}
