'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function isLocalTestHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function DashboardLocalTestReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAttemptedResetRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (pathname !== '/dashboard') return;
    if (!isLocalTestHost()) return;

    const shouldRunReset = searchParams.get('resetTestPurchases') === '1';

    if (!shouldRunReset || hasAttemptedResetRef.current) {
      return;
    }

    hasAttemptedResetRef.current = true;

    const clearResetTrigger = () => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('resetTestPurchases');
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    const runReset = async () => {
      try {
        const response = await fetch('/api/dev/reset-test-purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          deletedPurchases?: number;
          deletedProgress?: number;
          deletedLessonPurchases?: number;
        };

        const deletedCount =
          (data.deletedPurchases ?? 0) +
          (data.deletedProgress ?? 0) +
          (data.deletedLessonPurchases ?? 0);

        if (deletedCount > 0) {
          clearResetTrigger();
          router.refresh();
          return;
        }
      } catch {
        // Silent fail in local reset helper.
      }

      clearResetTrigger();
    };

    void runReset();
  }, [pathname, router, searchParams]);

  return null;
}