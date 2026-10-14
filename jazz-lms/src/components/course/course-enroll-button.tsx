'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';
import { loadPaymentMethodModal, warmPaymentMethodModal } from '@/lib/payment-modal-loader';
import type { AppliedVoucher } from '@/components/vouchers/voucher-input';
import { useOwnerAction } from '@/hooks/use-owner-action';
import { getKnownCatalogPrice } from '@/lib/pricing';

const PaymentMethodModal = dynamic(
  () => loadPaymentMethodModal().then((mod) => mod.PaymentMethodModal),
  { ssr: false }
);

interface CourseEnrollButtonProps {
  courseId: string;
  price: number | null;
}

export function CourseEnrollButton({ courseId, price }: CourseEnrollButtonProps) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const { capture, isCurrent } = useOwnerAction();
  const catalogPrice = getKnownCatalogPrice(price);

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

  const copy = {
    es: {
      somethingWrong: 'Algo salió mal. Inténtalo de nuevo.',
      enrollFree: 'Inscribirse gratis',
      buyCourse: 'Comprar curso',
      chooseMethod: 'Aplicar voucher y continuar',
      priceUnavailable: 'Precio no disponible',
      methodLabel: 'Método de pago',
      methodCard: 'Tarjeta',
      methodPaypal: 'PayPal',
      methodHint: 'Selecciona cómo quieres pagar.',
    },
    en: {
      somethingWrong: 'Something went wrong. Please try again.',
      enrollFree: 'Enroll for free',
      buyCourse: 'Buy course',
      chooseMethod: 'Apply voucher and continue',
      priceUnavailable: 'Price unavailable',
    },
    fr: {
      somethingWrong: 'Une erreur est survenue. Réessayez.',
      enrollFree: 'S’inscrire gratuitement',
      buyCourse: 'Acheter le cours',
      chooseMethod: 'Appliquer un code et continuer',
      priceUnavailable: 'Prix indisponible',
    },
    pt: {
      somethingWrong: 'Algo deu errado. Tente novamente.',
      enrollFree: 'Inscrever-se grátis',
      buyCourse: 'Comprar curso',
      chooseMethod: 'Aplicar voucher e continuar',
      priceUnavailable: 'Preço indisponível',
    },
  }[language];

  const checkoutCourse = async () => {
    if (catalogPrice === null || !courseId) return;
    const token = capture();
    if (!token) return;
    try {
      setIsLoading(true);
      setPaymentError('');

      const response = await axios.post('/api/checkout', {
        courseId,
        language,
        voucherCode: appliedVoucher?.voucher.code,
      });
      if (!isCurrent(token)) return;

      // Redirect to the hosted provider checkout URL
      window.location.assign(response.data.url);
    } catch (error) {
      if (!isCurrent(token)) return;
      if (axios.isAxiosError(error) && typeof error.response?.data === 'string') {
        setPaymentError(error.response.data);
        toast.error(error.response.data);
      } else {
        toast.error(copy.somethingWrong);
      }
    } finally {
      if (isCurrent(token)) setIsLoading(false);
    }
  };

  const onClick = () => {
    if (catalogPrice === null || !courseId) return;
    if (catalogPrice === 0) {
      void checkoutCourse();
      return;
    }

    warmPaymentMethodModal();
    setPaymentError('');
    setIsMethodModalOpen(true);
  };

  const primePaymentModal = () => {
    warmPaymentMethodModal();
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={onClick}
        onMouseEnter={primePaymentModal}
        onFocus={primePaymentModal}
        onTouchStart={primePaymentModal}
        disabled={isLoading || catalogPrice === null || !courseId}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            {catalogPrice === null ? copy.priceUnavailable : catalogPrice === 0 ? copy.enrollFree : copy.chooseMethod}
          </>
        )}
      </Button>

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isLoading}
        language={language}
        courseId={courseId}
        basePrice={catalogPrice}
        errorMessage={paymentError}
        onClose={() => {
          if (!isLoading) {
            setIsMethodModalOpen(false);
          }
        }}
        onVoucherApplied={(voucher) => {
          setAppliedVoucher(voucher);
          setPaymentError('');
        }}
        onConfirm={() => {
          void checkoutCourse();
        }}
      />
    </div>
  );
}
