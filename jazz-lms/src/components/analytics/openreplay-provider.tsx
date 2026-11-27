'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  isOpenReplayEnabled,
  startTracker,
  stopTracker,
} from '@/lib/analytics/openreplay';
import { isAnalyticsPathAllowed } from '@/lib/analytics/consent';
import { useAnalyticsConsent } from './use-analytics-consent';
import { guardAnalyticsNavigation } from '@/lib/analytics/navigation';

/**
 * Optional replay is limited to the public homepage after explicit consent.
 * Account, student and admin pages never start the tracker.
 */
export function OpenReplayProvider() {
  const pathname = usePathname();
  const { replay } = useAnalyticsConsent();

  useLayoutEffect(() => {
    if (!isOpenReplayEnabled() || !replay || !isAnalyticsPathAllowed(pathname)) {
      void stopTracker();
      return;
    }

    const removeGuard = guardAnalyticsNavigation(allowed => { if (!allowed) void stopTracker(); });
    void startTracker();
    return () => { removeGuard(); void stopTracker(); };
  }, [pathname, replay]);

  return null;
}
