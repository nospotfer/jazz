/**
 * OpenReplay tracker — lazy singleton, fail-safe.
 *
 * Princípios:
 * - Client-only (importa @openreplay/tracker dinamicamente).
 * - Falha silenciosamente: nenhum erro do OpenReplay deve quebrar o app.
 * - Lê configuração via NEXT_PUBLIC_OPENREPLAY_* (Next.js inlina no bundle do client).
 *
 * Uso:
 *   import { startTracker, stopTracker, isOpenReplayEnabled } from '@/lib/analytics/openreplay';
 *
 * Ativação:
 *   NEXT_PUBLIC_OPENREPLAY_ENABLED=true
 *   NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY=<key>
 *   NEXT_PUBLIC_OPENREPLAY_INGEST_URL=<https://your-ingest> (opcional para cloud)
 */

import { isAnalyticsUrlAllowed, isReplayReferrerAllowed, readAnalyticsConsent, sanitizeAnalyticsUrl } from '@/lib/analytics/consent';

type TrackerInstance = {
  start: (...args: unknown[]) => Promise<unknown> | unknown;
  stop: () => void;
};

let trackerPromise: Promise<TrackerInstance | null> | null = null;
let trackerInstance: TrackerInstance | null = null;
let startTask: Promise<void> | null = null;
let lifecycleEpoch = 0;
let started = false;

function canRecordReplay() {
  return typeof window !== 'undefined' && isAnalyticsUrlAllowed(window.location.href) && isReplayReferrerAllowed(document.referrer) && readAnalyticsConsent().replay;
}
export function isOpenReplayEnabled(): boolean {
  // The SDK refuses insecure pages. Avoid loading it (and its console error)
  // in HTTP development previews; production runs on HTTPS.
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return false;
  const flag = process.env.NEXT_PUBLIC_OPENREPLAY_ENABLED;
  const key = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
  return flag === 'true' && typeof key === 'string' && key.trim().length > 0;
}

async function getTracker(): Promise<TrackerInstance | null> {
  if (!isOpenReplayEnabled() || !canRecordReplay()) return null;
  if (trackerPromise) return trackerPromise;

  trackerPromise = (async () => {
    try {
      const mod = await import('@openreplay/tracker');
      const Tracker = mod.default;
      const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY!;
      const ingestPoint = process.env.NEXT_PUBLIC_OPENREPLAY_INGEST_URL?.trim() || undefined;
      const instance = new Tracker({
        projectKey,
        ...(ingestPoint ? { ingestPoint } : {}),
        defaultInputMode: 2, // Hidden; optional replay never records form values.
        obscureInputEmails: true,
        obscureInputNumbers: true,
        obscureInputDates: true,
        obscureTextEmails: true,
        obscureTextNumbers: true,
        respectDoNotTrack: true,
        captureIFrames: false,
        network: { disabled: true, capturePayload: false, ignoreHeaders: true, sessionTokenHeader: false, failuresOnly: false, captureInIframes: false },
        consoleMethods: null,
        captureExceptions: false,
        captureResourceTimings: false,
        capturePageRenderTimings: false,
        urls: { urlSanitizer: sanitizeAnalyticsUrl, titleSanitizer: () => 'La Cultura del Jazz' },
        domSanitizer: (node: Element) => {
          if (!canRecordReplay() || node.matches('form, input, textarea, select, mux-player, video, iframe, [data-analytics-private]') ||
              node.closest('form, mux-player, [data-analytics-private]')) return 2;
          return 0;
        },
      });
      trackerInstance = instance as TrackerInstance;
      return trackerInstance;
    } catch {
      console.warn('[openreplay] init failed; tracker disabled.');
      return null;
    }
  })();

  return trackerPromise;
}

export async function startTracker(): Promise<void> {
  if (started || !canRecordReplay() || !isOpenReplayEnabled()) return;
  const epoch = lifecycleEpoch;
  if (startTask) {
    await startTask;
    if (epoch === lifecycleEpoch && canRecordReplay() && !started) await startTracker();
    return;
  }
  const task = (async () => {
    try {
      const tracker = await getTracker();
      if (!tracker || epoch !== lifecycleEpoch || !canRecordReplay()) return;
      const result = await tracker.start();
      if (epoch !== lifecycleEpoch || !canRecordReplay()) {
        tracker.stop();
        return;
      }
      started = !(typeof result === 'object' && result !== null && 'success' in result && result.success === false);
    } catch {
      console.warn('[openreplay] start failed.');
    }
  })();
  startTask = task;
  try { await task; } finally { if (startTask === task) startTask = null; }
}

export async function stopTracker(): Promise<void> {
  lifecycleEpoch += 1;
  started = false;
  try {
    // Stop immediately even while SDK.start() awaits its handshake. Never load
    // the SDK merely to stop an unconfigured or unconsented tracker.
    trackerInstance?.stop();
  } catch {
    console.warn('[openreplay] stop failed.');
  }
}
