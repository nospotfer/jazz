'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useAnalyticsConsent } from '@/components/analytics/use-analytics-consent';
import { isAnalyticsPathAllowed, isValidGaMeasurementId, readAnalyticsConsent } from '@/lib/analytics/consent';
import { guardAnalyticsNavigation } from '@/lib/analytics/navigation';
import { mayMeasurePublicPage, prepareGoogleAnalytics, recordGoogleAnalyticsPage, updateGoogleAnalyticsConsent } from '@/lib/analytics/google-analytics';

/** Optional GA4 measures the public homepage only after an explicit choice. */
export function GoogleAnalyticsScript() {
  const pathname = usePathname();
  const { analytics } = useAnalyticsConsent();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const ready = useRef(false);
  const recorded = useRef(false);
  const allowed = analytics && isAnalyticsPathAllowed(pathname) && isValidGaMeasurementId(measurementId);
  const recordPage = useCallback(() => {
    if (!recorded.current && isValidGaMeasurementId(measurementId)) recorded.current = recordGoogleAnalyticsPage(measurementId);
  }, [measurementId]);

  useLayoutEffect(() => {
    if (!isValidGaMeasurementId(measurementId)) return;
    recorded.current = false;
    const removeGuard = guardAnalyticsNavigation(destinationAllowed => {
      updateGoogleAnalyticsConsent(measurementId, destinationAllowed && readAnalyticsConsent().analytics);
    });
    if (allowed && prepareGoogleAnalytics(measurementId)) {
      if (ready.current) recordPage();
    } else {
      updateGoogleAnalyticsConsent(measurementId, false);
    }
    return () => { removeGuard(); updateGoogleAnalyticsConsent(measurementId, false); };
  }, [allowed, measurementId, pathname, recordPage]);

  if (!allowed || !mayMeasurePublicPage()) return null;
  return <Script
    id="ga4-loader"
    src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
    strategy="afterInteractive"
    onReady={() => {
      ready.current = true;
      recordPage();
    }}
  />;
}
