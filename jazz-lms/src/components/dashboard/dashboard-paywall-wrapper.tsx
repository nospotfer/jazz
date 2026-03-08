'use client';

import { ReactNode, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface DashboardPaywallWrapperProps {
  hasPaidCourse: boolean;
  courseId: string | null;
  children: ReactNode;
}

export function DashboardPaywallWrapper({ hasPaidCourse, courseId, children }: DashboardPaywallWrapperProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const copy = {
    es: {
      title: 'Área bloqueada',
      description: 'Para acceder a esta área necesitas realizar el pago del curso completo.',
      processing: 'Procesando...',
      payFullCourse: 'Pagar curso completo',
    },
    en: {
      title: 'Locked area',
      description: 'To access this area, you need to purchase the full course.',
      processing: 'Processing...',
      payFullCourse: 'Pay full course',
    },
    fr: {
      title: 'Zone bloquée',
      description: 'Pour accéder à cette zone, vous devez acheter le cours complet.',
      processing: 'Traitement...',
      payFullCourse: 'Payer le cours complet',
    },
    pt: {
      title: 'Área bloqueada',
      description: 'Para acessar esta área, você precisa comprar o curso completo.',
      processing: 'Processando...',
      payFullCourse: 'Pagar curso completo',
    },
  }[language];

  const isLockedRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname === '/dashboard') return false;
    return pathname.startsWith('/dashboard');
  }, [pathname]);

  const showPaywall = !hasPaidCourse && isLockedRoute;

  const handlePurchase = async () => {
    if (!courseId || isPurchasing) return;

    try {
      setIsPurchasing(true);
      const response = await axios.post('/api/checkout', {
        courseId,
        source: 'dashboard',
        language,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch {
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
              onClick={handlePurchase}
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
                  {copy.payFullCourse}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
