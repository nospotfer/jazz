import type { AnalyticsPreference } from './consent';

/** Remove known, JavaScript-accessible optional identifiers on this browser. */
export function clearOptionalAnalyticsStorage(preference: AnalyticsPreference) {
  if (typeof window === 'undefined') return;
  if (!preference.analytics) {
    const names = document.cookie.split(';').map(cookie => cookie.split('=')[0].trim())
      .filter(name => name === 'muxData' || name === '_ga' || /^_ga_[A-Z0-9]+$/.test(name));
    const parts = window.location.hostname.split('.');
    const domains = [window.location.hostname];
    for (let index = 1; index < parts.length - 1; index += 1) domains.push(parts.slice(index).join('.'));
    for (const name of names) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      for (const domain of domains) document.cookie = `${name}=; Path=/; Domain=${domain}; Max-Age=0; SameSite=Lax`;
    }
  }
  if (!preference.replay) {
    for (const storageName of ['localStorage', 'sessionStorage'] as const) {
      try {
        const storage = window[storageName];
        const keys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith('__openreplay_')) keys.push(key);
        }
        keys.forEach(key => storage.removeItem(key));
      } catch { /* Blocked browser storage must not break privacy controls. */ }
    }
  }
}
