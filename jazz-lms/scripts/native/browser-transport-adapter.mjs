import { BROWSER_TRANSPORT_PHASES, BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS,
  createBrowserTransportDiagnostics } from './browser-transport-diagnostics.mjs';

/** @typedef {import('./browser-transport-diagnostics.mjs').Phase} Phase */
/** @typedef {{ handle: object|null, admitted: boolean, responded: boolean,
 * terminal: 'denied'|'failed'|'finished'|null }} Entry */
/** @param {unknown} input @param {string} name @returns {unknown} */
function field(input, name) {
  if (input === null || typeof input !== 'object') return undefined;
  try { return Object.getOwnPropertyDescriptor(input, name)?.value; } catch { return undefined; }
}
/** @param {unknown} value @returns {value is object} */
const object = value => value !== null && typeof value === 'object';
/** @type {Set<string>} */
const phases = new Set(BROWSER_TRANSPORT_PHASES);

/** Pure observer: return values describe recording, never routing/action authority.
 * nowMs must provide integer elapsed milliseconds, not wall-clock time. Clock faults
 * are counted and dropped without replacing an observed operation's result/error.
 * Request objects are WeakMap keys only; never pass raw request metadata as checks.
 * Call admit explicitly after guards, immediately before transport; observeOperation
 * does not admit. A response retains correlation until finished/failed. Deliberate
 * denial's later abort and duplicate terminal callbacks do not fabricate failures.
 * closedAtMs is the most recent window/phase-exit close; each event's late flag
 * is evaluated when that event is recorded, including earlier window closures.
 * lostCorrelations reports recording faults; these may leave bounded recorder slots
 * pending rather than inventing a clock value to release or repair the evidence.
 * @param {unknown} options
 */
export function createBrowserTransportAdapter(options) {
  const nowMs = field(options, 'nowMs');
  if (typeof nowMs !== 'function') throw new TypeError('BROWSER_TRANSPORT_CLOCK_REQUIRED');
  const clock = /** @type {() => unknown} */ (nowMs);
  const recorder = createBrowserTransportDiagnostics({ samplesPerPhase: field(options, 'samplesPerPhase'),
    maxTrackedRequests: field(options, 'maxTrackedRequests') });
  /** @type {WeakMap<object, Entry>} */
  const requests = new WeakMap();
  /** @type {Phase} */
  let currentPhase = 'startup';
  /** @type {Set<Phase>} */
  const closedPhases = new Set();
  const counters = { invalidClockReads: 0, invalidRequests: 0, duplicateEvents: 0, lostCorrelations: 0,
    deliberateAbortEvents: 0, unknownRequestEvents: 0 };
  /** @param {keyof typeof counters} name */
  const count = name => { counters[name] = Math.min(Number.MAX_SAFE_INTEGER, counters[name] + 1); };
  function atMs() {
    try { const value = clock(); if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 &&
      value <= BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.maxElapsedMs) return value; } catch { /* No error prose. */ }
    count('invalidClockReads'); return undefined;
  }
  /** @param {unknown} request */
  function lookup(request) {
    const entry = object(request) ? requests.get(request) : undefined;
    if (!entry) count('unknownRequestEvents');
    return entry;
  }
  /** @param {Entry|undefined} entry @param {boolean} [failure] */
  function terminal(entry, failure = false) {
    if (!entry?.terminal) return false;
    count(failure && entry.terminal === 'denied' ? 'deliberateAbortEvents' : 'duplicateEvents'); return true;
  }
  /** @param {Entry|undefined} entry @param {'denied'|'failed'|'finished'} kind @param {boolean} recorded */
  function retire(entry, kind, recorded) {
    if (!entry) return;
    if (!recorded && entry.handle !== null) count('lostCorrelations');
    entry.terminal = kind; entry.handle = null;
  }
  /** @param {unknown} [phase] */
  function closePhase(phase = currentPhase) {
    if (typeof phase !== 'string' || !phases.has(phase)) return false;
    const selected = /** @type {Phase} */ (phase);
    if (closedPhases.has(selected)) return true;
    const recorded = recorder.closePhase({ phase, atMs: atMs() });
    if (recorded) closedPhases.add(selected); return recorded;
  }
  /** @param {unknown} request */
  function failed(request) {
    const entry = lookup(request); if (terminal(entry, true)) return false;
    const recorded = recorder.fail(entry?.handle, { atMs: atMs(), reason: 'UNKNOWN_FAILURE' });
    retire(entry, 'failed', recorded);
    return recorded;
  }
  return Object.freeze({
    /** @param {unknown} phase */
    startPhase(phase) {
      if (typeof phase !== 'string' || !phases.has(phase)) return false;
      if (phase !== currentPhase) {
        // Phase exit also closes reads admitted after an earlier policy-window close.
        closedPhases.delete(currentPhase); closePhase();
      }
      currentPhase = /** @type {Phase} */ (phase); closedPhases.delete(currentPhase); return true;
    },
    closePhase,
    /** @param {unknown} request @param {unknown} [metadata] */
    attempt(request, metadata = {}) {
      if (!object(request)) { count('invalidRequests'); return false; }
      if (requests.has(request)) { count('duplicateEvents'); return false; }
      const handle = recorder.attempt({ phase: currentPhase, atMs: atMs(), method: field(metadata, 'method'),
        target: field(metadata, 'target'), checks: field(metadata, 'checks') });
      requests.set(request, { handle, admitted: false, responded: false, terminal: null }); return handle !== null;
    },
    /** @param {unknown} request @param {unknown} [checks] */
    admit(request, checks) {
      const entry = lookup(request); if (terminal(entry)) return false;
      if (entry?.admitted) { count('duplicateEvents'); return false; }
      const recorded = recorder.admit(entry?.handle, { phase: currentPhase, atMs: atMs(), checks });
      if (entry) {
        entry.admitted = true;
        if (!recorded && entry.handle !== null) { count('lostCorrelations'); entry.handle = null; }
      }
      return recorded;
    },
    /** @param {unknown} request @param {unknown} [reason] @param {unknown} [checks] */
    reject(request, reason, checks) {
      const entry = lookup(request); if (terminal(entry)) return false;
      const recorded = entry?.admitted
        ? recorder.fail(entry.handle, { atMs: atMs(), reason: 'UNKNOWN_FAILURE', checks })
        : recorder.deny(entry?.handle, { atMs: atMs(), reason, checks });
      retire(entry, entry?.admitted ? 'failed' : 'denied', recorded);
      return recorded;
    },
    /** @param {unknown} request @param {unknown} status */
    response(request, status) {
      const entry = lookup(request); if (terminal(entry)) return false;
      if (entry?.responded) { count('duplicateEvents'); return false; }
      const recorded = recorder.response(entry?.handle, { atMs: atMs(), status });
      if (entry && recorded) entry.responded = true; return recorded;
    },
    failed,
    /** @param {unknown} request */
    finished(request) {
      const entry = lookup(request); if (terminal(entry)) return false;
      const recorded = recorder.finish(entry?.handle, { atMs: atMs() });
      retire(entry, 'finished', recorded); return recorded;
    },
    /** Preserve sync return/throw and native Promise identity, fulfillment/rejection.
     * No thenable/accessor invocation; rejection observer's child fulfills silently.
     * @template T @param {unknown} request @param {() => T} operation @returns {T} */
    observeOperation(request, operation) {
      let result;
      try { result = operation(); } catch (error) { failed(request); throw error; }
      try { Promise.prototype.then.call(result, undefined, () => { failed(request); }); }
      catch { /* Non-Promise results have no asynchronous operation to observe. */ }
      return result;
    },
    snapshot() { return { recorder: recorder.snapshot(), adapter: { ...counters,
      currentPhase, currentPhaseClosed: closedPhases.has(currentPhase) } }; },
  });
}
