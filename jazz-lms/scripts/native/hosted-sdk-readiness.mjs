// @ts-check

export const HOSTED_SDK_READINESS_SNAPSHOT_KEY = '__jazzHostedSdkReadinessSnapshot';

/** @typedef {'bridge'|'element'|'error'} ReadinessKind */
/** @typedef {{ kind: ReadinessKind, atMs: number }} ReadinessSample */
/** @typedef {{ version: number, limits: { samples: number, count: number, elapsedMs: number },
 * counts: Record<ReadinessKind, number>, samples: ReadinessSample[], samplesDropped: number,
 * samplesTruncated: boolean, countsSaturated: boolean, invalidClockReads: number }} HostedSdkReadinessSnapshot */

/** Passive Dodo 1.1.0 message observation; no payment/action authority follows.
 * Pass this function directly to Playwright addInitScript with the explicit TEST
 * sdkOrigin below. Everything used at runtime is inside the serialized function.
 * Only the top document installs; each new document starts independent counters.
 * Counts are document-wide history across successive direct SDK iframes, not a
 * binding to the current frame or a current-health assertion. A controller needs
 * a pre-init baseline and independent intended-frame/document continuity proof.
 * The fixed nonenumerable window function returns detached finite snapshots.
 * Invalid clocks drop timing samples rather than inventing elapsed times. If the
 * initial clock fails, this document has no time baseline and records counts only.
 * No observed nonce, payload/prose, origin, URL or frame identity is retained.
 * @param {unknown} options
 * @returns {boolean} Whether this invocation installed the observer.
 */
export function installHostedSdkReadiness(options) {
  if (typeof window === 'undefined') return false;
  const view = window;
  try { if (view.top !== view) return false; } catch { return false; }

  /** @param {unknown} object @param {string} name @returns {unknown} */
  function field(object, name) {
    if (object === null || typeof object !== 'object') return undefined;
    try { return Object.getOwnPropertyDescriptor(object, name)?.value; } catch { return undefined; }
  }
  if (field(options, 'sdkOrigin') !== 'https://sdk-v2.custom.hs.dodopayments.com') return false;
  // Duplicate the public key literal: serialization must not depend on exports.
  const key = '__jazzHostedSdkReadinessSnapshot';
  try { if (Object.getOwnPropertyDescriptor(view, key)) return false; } catch { return false; }

  const sampleLimit = 16, countLimit = 65_535, elapsedLimitMs = 86_400_000;
  const counts = { bridge: 0, element: 0, error: 0 };
  /** @type {ReadinessSample[]} */
  const samples = [];
  let samplesDropped = 0, invalidClockReads = 0, lastAtMs = 0;
  let samplesTruncated = false, countsSaturated = false;
  /** @param {number} value */
  function increment(value) {
    if (value >= countLimit) { countsSaturated = true; return countLimit; }
    return value + 1;
  }
  function clock() {
    try {
      const value = view.performance.now();
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
    } catch { /* Never retain or log exception prose. */ }
    invalidClockReads = increment(invalidClockReads); return null;
  }
  const startedAt = clock();
  function elapsed() {
    const now = clock();
    if (startedAt === null || now === null) return null;
    const delta = now - startedAt, atMs = Math.floor(delta);
    if (!Number.isFinite(delta) || delta < 0 || delta > elapsedLimitMs || atMs < lastAtMs) {
      invalidClockReads = increment(invalidClockReads); return null;
    }
    lastAtMs = atMs; return atMs;
  }
  /** @returns {HostedSdkReadinessSnapshot} */
  function snapshot() {
    return { version: 1, limits: { samples: sampleLimit, count: countLimit, elapsedMs: elapsedLimitMs },
      counts: { ...counts }, samples: samples.map(sample => ({ ...sample })), samplesDropped,
      samplesTruncated, countsSaturated, invalidClockReads };
  }
  /** @param {MessageEvent} event */
  function observe(event) {
    try {
      if (event.origin !== 'https://sdk-v2.custom.hs.dodopayments.com' || event.source === null) return;
      const data = event.data;
      if (field(data, '__dodo_payments_msg__') !== true || typeof field(data, 'nonce') !== 'string') return;
      const type = field(data, 'type');
      if (type !== 'READY' && type !== 'ELEMENT_READY' && type !== 'ERROR') return;
      let currentDirectFrame = false;
      for (const frame of view.document.querySelectorAll('iframe')) {
        if (frame.contentWindow === event.source) { currentDirectFrame = true; break; }
      }
      if (!currentDirectFrame) return;
      const kind = type === 'READY' ? 'bridge' : type === 'ELEMENT_READY' ? 'element' : 'error';
      counts[kind] = increment(counts[kind]);
      if (samples.length < sampleLimit) {
        const atMs = elapsed();
        if (atMs !== null) { samples.push({ kind, atMs }); return; }
      }
      samplesDropped = increment(samplesDropped); samplesTruncated = true;
    } catch { /* Invalid/unreadable events do not affect the page or retain input. */ }
  }
  try {
    view.addEventListener('message', observe);
    Object.defineProperty(view, key, { value: snapshot, enumerable: false, writable: false, configurable: false });
  } catch {
    try { view.removeEventListener('message', observe); } catch { /* No output. */ }
    return false;
  }
  return true;
}
