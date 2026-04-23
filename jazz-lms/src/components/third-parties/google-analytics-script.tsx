'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js) loader — client-side.
 *
 * Regras:
 * - Só renderiza se `NEXT_PUBLIC_GA_MEASUREMENT_ID` estiver definido (fail-safe).
 * - NUNCA carrega em rotas `/admin/*` — admins não são trackeados como visitantes.
 * - Complementa o GA4 Data API já usado em /admin/stats (server-side, via
 *   service account). Este script é o inverso: coleta tráfego real no browser.
 */
export function GoogleAnalyticsScript() {
  const pathname = usePathname();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) return null;
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
