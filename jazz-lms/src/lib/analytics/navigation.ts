import { isAnalyticsUrlAllowed } from './consent';

const listeners = new Set<(allowed: boolean) => void>();
let removeHistoryGuard: (() => void) | null = null;

/** Run privacy guards before application/vendor history handlers observe a new URL. */
export function guardAnalyticsNavigation(onNavigate: (allowed: boolean) => void) {
  listeners.add(onNavigate);
  if (!removeHistoryGuard) removeHistoryGuard = installHistoryGuard();
  return () => {
    listeners.delete(onNavigate);
    if (!listeners.size && removeHistoryGuard) {
      removeHistoryGuard();
      removeHistoryGuard = null;
    }
  };
}

function installHistoryGuard() {
  const originalPush = window.history.pushState;
  const originalReplace = window.history.replaceState;
  const notify = (url?: string | URL | null) => {
    let allowed = false;
    try { allowed = isAnalyticsUrlAllowed(new URL(url ?? window.location.href, window.location.href).href); } catch { /* Invalid navigation is denied. */ }
    listeners.forEach(listener => listener(allowed));
  };
  const push: History['pushState'] = function(this: History, data, unused, url) {
    notify(url);
    return originalPush.call(this, data, unused, url);
  };
  const replace: History['replaceState'] = function(this: History, data, unused, url) {
    notify(url);
    return originalReplace.call(this, data, unused, url);
  };
  const onPopState = () => notify(window.location.href);
  window.history.pushState = push;
  window.history.replaceState = replace;
  window.addEventListener('popstate', onPopState);
  return () => {
    if (window.history.pushState === push) window.history.pushState = originalPush;
    if (window.history.replaceState === replace) window.history.replaceState = originalReplace;
    window.removeEventListener('popstate', onPopState);
  };
}
