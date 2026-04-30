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

type TrackerInstance = {
  start: (...args: unknown[]) => Promise<unknown> | unknown;
  stop: () => void;
  setUserID?: (id: string) => void;
  setMetadata?: (key: string, value: string) => void;
};

let trackerPromise: Promise<TrackerInstance | null> | null = null;
let started = false;

export function isOpenReplayEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = process.env.NEXT_PUBLIC_OPENREPLAY_ENABLED;
  const key = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY;
  return flag === 'true' && typeof key === 'string' && key.trim().length > 0;
}

async function getTracker(): Promise<TrackerInstance | null> {
  if (!isOpenReplayEnabled()) return null;
  if (trackerPromise) return trackerPromise;

  trackerPromise = (async () => {
    try {
      const mod = await import('@openreplay/tracker');
      const Tracker = (mod as { default?: unknown }).default ?? mod;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctor = Tracker as any;
      const projectKey = process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY!;
      const ingestPoint = process.env.NEXT_PUBLIC_OPENREPLAY_INGEST_URL?.trim() || undefined;
      const instance = new Ctor({
        projectKey,
        ...(ingestPoint ? { ingestPoint } : {}),
        // Privacidade: mascarar inputs sensíveis por padrão.
        defaultInputMode: 0, // 0 = Plain, 1 = Obscured, 2 = Hidden — usaremos data attrs por campo.
        obscureTextEmails: true,
        obscureTextNumbers: false,
        respectDoNotTrack: true,
        captureIFrames: false,
      });
      return instance as TrackerInstance;
    } catch (error) {
      console.warn('[openreplay] init failed; tracker disabled.', error);
      return null;
    }
  })();

  return trackerPromise;
}

export async function startTracker(): Promise<void> {
  if (started) return;
  try {
    const tracker = await getTracker();
    if (!tracker) return;
    await tracker.start();
    started = true;
  } catch (error) {
    console.warn('[openreplay] start failed.', error);
  }
}

export async function stopTracker(): Promise<void> {
  if (!started) return;
  try {
    const tracker = await getTracker();
    tracker?.stop();
  } catch (error) {
    console.warn('[openreplay] stop failed.', error);
  } finally {
    started = false;
  }
}

export async function identifyUser(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const tracker = await getTracker();
    tracker?.setUserID?.(userId);
  } catch (error) {
    console.warn('[openreplay] identify failed.', error);
  }
}

export async function setTrackerMetadata(key: string, value: string): Promise<void> {
  try {
    const tracker = await getTracker();
    tracker?.setMetadata?.(key, value);
  } catch (error) {
    console.warn('[openreplay] setMetadata failed.', error);
  }
}
