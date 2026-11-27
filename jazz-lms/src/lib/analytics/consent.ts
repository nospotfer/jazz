export const ANALYTICS_CONSENT_KEY = 'jazz-analytics-consent-v1';
export const ANALYTICS_CONSENT_EVENT = 'jazz:analytics-consent';
const MAX_PREFERENCE_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type AnalyticsPreference = { analytics: boolean; replay: boolean };
type StoredPreference = AnalyticsPreference & { version: 1; savedAt: number };
let temporaryPreference: string | null = null;

export function hasPrivacySignal(): boolean {
  if (typeof navigator === 'undefined') return false;
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  const windowPreference = typeof window === 'undefined' ? undefined : (window as Window & { doNotTrack?: string }).doNotTrack;
  return privacy.globalPrivacyControl === true || navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || windowPreference === '1';
}

export function parseAnalyticsPreference(raw: string | null, now = Date.now()): StoredPreference | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || typeof value.analytics !== 'boolean' || typeof value.replay !== 'boolean' ||
        typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt > MAX_PREFERENCE_AGE_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export function getAnalyticsPreferenceSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  let raw = temporaryPreference;
  try { raw = window.localStorage.getItem(ANALYTICS_CONSENT_KEY); } catch { /* Keep only the choice made in this page when storage is unavailable. */ }
  return parseAnalyticsPreference(raw) ? raw : null;
}

export function readAnalyticsConsent() {
  const preference = parseAnalyticsPreference(getAnalyticsPreferenceSnapshot());
  const blockedByPrivacySignal = hasPrivacySignal();
  return {
    analytics: !blockedByPrivacySignal && preference?.analytics === true,
    replay: !blockedByPrivacySignal && preference?.replay === true,
    hasChoice: preference !== null,
    blockedByPrivacySignal,
  };
}

export function saveAnalyticsConsent(preference: AnalyticsPreference) {
  if (typeof window === 'undefined') return;
  const normalized = { analytics: preference.analytics === true, replay: preference.replay === true };
  temporaryPreference = JSON.stringify({ version: 1, ...normalized, savedAt: Date.now() });
  try { window.localStorage.setItem(ANALYTICS_CONSENT_KEY, temporaryPreference); } catch { /* The in-memory choice expires with this page. */ }
  clearOptionalAnalyticsStorage(hasPrivacySignal() ? { analytics: false, replay: false } : normalized);
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

export function subscribeAnalyticsConsent(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) {
      temporaryPreference = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(ANALYTICS_CONSENT_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, listener);
  };
}

export function isAnalyticsPathAllowed(pathname: string | null) {
  return pathname === '/';
}

export function isAnalyticsUrlAllowed(raw: string) {
  try {
    const url = new URL(raw);
    return isAnalyticsPathAllowed(url.pathname) && !url.search && (!url.hash || /^#board-(hero|professor|learn|courses|press|jazzcats|faq)$/.test(url.hash));
  } catch { return false; }
}

/** The installed replay SDK passes document.referrer through without its URL sanitizer. */
export function isReplayReferrerAllowed(referrer: string) {
  return !referrer || isAnalyticsUrlAllowed(referrer);
}

/** Optional analytics expose only the public landing URL, never query/hash/private paths. */
export function sanitizeAnalyticsUrl(raw: string) {
  try { return `${new URL(raw).origin}/`; } catch { return ''; }
}

export function isValidGaMeasurementId(value: string | undefined): value is string {
  return typeof value === 'string' && /^G-[A-Z0-9]+$/.test(value);
}
import { clearOptionalAnalyticsStorage } from './storage';

