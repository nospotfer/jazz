'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  getAnalyticsPreferenceSnapshot, hasPrivacySignal, parseAnalyticsPreference,
  saveAnalyticsConsent, subscribeAnalyticsConsent,
} from '@/lib/analytics/consent';

export function useAnalyticsConsent() {
  const raw = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsPreferenceSnapshot, () => null);
  // Keep SSR and the first hydration render identical; the browser signal is
  // read immediately after hydration, before any optional provider can start.
  const blockedByPrivacySignal = useSyncExternalStore(subscribeAnalyticsConsent, hasPrivacySignal, () => false);
  return useMemo(() => {
    const preference = parseAnalyticsPreference(raw);
    return {
      analytics: !blockedByPrivacySignal && preference?.analytics === true,
      replay: !blockedByPrivacySignal && preference?.replay === true,
      hasChoice: preference !== null,
      blockedByPrivacySignal,
      setConsent: saveAnalyticsConsent,
    };
  }, [raw, blockedByPrivacySignal]);
}
