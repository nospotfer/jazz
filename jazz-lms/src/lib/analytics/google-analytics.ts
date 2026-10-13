import { isAnalyticsUrlAllowed, isValidGaMeasurementId, readAnalyticsConsent, sanitizeAnalyticsUrl } from './consent';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

function analyticsWindow() { return window as unknown as AnalyticsWindow; }

export function mayMeasurePublicPage() {
  return typeof window !== 'undefined' && readAnalyticsConsent().analytics && isAnalyticsUrlAllowed(window.location.href);
}

/** Disable collection synchronously before private navigation or withdrawal. */
export function updateGoogleAnalyticsConsent(measurementId: string, allowed = mayMeasurePublicPage()) {
  if (!isValidGaMeasurementId(measurementId) || typeof window === 'undefined') return;
  const target = analyticsWindow();
  target[`ga-disable-${measurementId}`] = !allowed;
  target.gtag?.('consent', 'update', {
    analytics_storage: allowed ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
}

/** Queue privacy defaults before loading the vendor script; no inline code interpolation. */
export function prepareGoogleAnalytics(measurementId: string) {
  if (!isValidGaMeasurementId(measurementId) || !mayMeasurePublicPage()) return false;
  const target = analyticsWindow();
  target.dataLayer ??= [];
  // gtag's documented queue uses IArguments, rather than dataLayer object events.
  // eslint-disable-next-line prefer-rest-params
  target.gtag ??= function() { target.dataLayer!.push(arguments); };
  target.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  });
  updateGoogleAnalyticsConsent(measurementId);
  return true;
}

/** Manual homepage event contains no query, hash, account route or full referrer URL. */
export function recordGoogleAnalyticsPage(measurementId: string) {
  if (!isValidGaMeasurementId(measurementId) || !mayMeasurePublicPage()) {
    updateGoogleAnalyticsConsent(measurementId, false);
    return false;
  }
  const target = analyticsWindow();
  if (!target.gtag) return false;
  updateGoogleAnalyticsConsent(measurementId);
  target.gtag('js', new Date());
  target.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: sanitizeAnalyticsUrl(window.location.href),
    page_title: 'La Cultura del Jazz',
    page_referrer: document.referrer ? sanitizeAnalyticsUrl(document.referrer) : '',
  });
  target.gtag('event', 'page_view', {
    send_to: measurementId,
    page_location: sanitizeAnalyticsUrl(window.location.href),
    page_title: 'La Cultura del Jazz',
    page_referrer: document.referrer ? sanitizeAnalyticsUrl(document.referrer) : '',
  });
  return true;
}
