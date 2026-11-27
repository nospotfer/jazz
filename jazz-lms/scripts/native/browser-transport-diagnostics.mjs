/**
 * In-memory transport evidence, not SDK readiness or payment acceptance.
 * Pass elapsed milliseconds from the test's start (at most 24 hours), and map
 * policy/transport results to the enums below. No clock or run labels are read.
 * Never pass a browser Request, URL, body, headers, cookies or provider error.
 *
 * const trace = createBrowserTransportDiagnostics();
 * const request = trace.attempt({ phase: 'card', atMs: 100, method: 'POST', target: 'sdk' });
 * trace.admit(request, { phase: 'card', atMs: 101 }); // immediately before transport
 * trace.closePhase({ phase: 'card', atMs: 200 });
 * trace.response(request, { atMs: 210, status: 200 }); // attributed to card, late
 * trace.finish(request, { atMs: 211 }); // release tracking on requestfinished
 *
 * Denial retires a request: its resulting browser abort is not a transport failure.
 * A response is retained until finish/fail, so failure after headers stays visible.
 * Call closePhase when each policy window ends; later admissions start a new window.
 * When tracking capacity is full, attempts still count but return null and increment
 * untrackedAttempts. Their later events cannot be correlated. Samples have a separate
 * per-phase cap; reaching it never stops counters for tracked requests.
 * unmatchedEvents counts callbacks without a tracked handle (including retired or
 * overflow handles); ignoredEvents also includes invalid timestamps and lifecycle.
 * Snapshots expose neither handles nor request identifiers.
 */

/** @type {readonly Phase[]} */
export const BROWSER_TRANSPORT_PHASES = Object.freeze(['startup', 'fill', 'continue', 'init', 'card', 'logout']);
export const BROWSER_TRANSPORT_DENIAL_REASONS = Object.freeze([
  'HOST_DENIED', 'METHOD_DENIED', 'PHASE_UNARMED', 'FRAME_MISMATCH', 'DOCUMENT_MISMATCH',
  'CHECKOUT_MISMATCH', 'PAYMENT_MISMATCH', 'CUSTOMER_MISMATCH', 'LEASE_EXPIRED', 'GUARD_REJECTED',
]);
export const BROWSER_TRANSPORT_FAILURE_REASONS = Object.freeze(['NETWORK_ERROR', 'TIMEOUT', 'ABORTED', 'UNKNOWN_FAILURE']);
export const BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS = Object.freeze({
  defaultSamplesPerPhase: 16, maxSamplesPerPhase: 64, defaultTrackedRequests: 256, maxTrackedRequests: 1024,
  maxElapsedMs: 86_400_000,
});

/** @typedef {'startup'|'fill'|'continue'|'init'|'card'|'logout'} Phase */
/** @typedef {'attempted'|'admitted'|'denied'|'failed'|'response'|'finished'} Kind */
/** @typedef {{ phase: Phase, atMs: number, closeVersion: number }} Admission */
/** @typedef {{ method: string, target: string, lastAtMs: number,
 * attemptPhase: Phase, admission: Admission|null, responded: boolean }} RequestState */
/** @typedef {{ kind: Kind, atMs: number, method: string, target: string,
 * checks: Record<string, boolean>, reason?: string, status?: number, late?: boolean,
 * admitted?: boolean, responseObserved?: boolean }} Sample */
/** @typedef {{ counts: Record<Kind|'lateResponse'|'untrackedAttempts', number>, samples: Sample[],
 * samplesDropped: number, closedAtMs: number|null, closeVersion: number }} Bucket */

/** @type {Set<string>} */
const phaseSet = new Set(BROWSER_TRANSPORT_PHASES);
const denialSet = new Set(BROWSER_TRANSPORT_DENIAL_REASONS);
const failureSet = new Set(BROWSER_TRANSPORT_FAILURE_REASONS);
const methods = new Set(['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE', 'OTHER']);
const targets = new Set(['app', 'auth', 'checkout', 'sdk', 'supplier', 'other']);
const checkNames = [
  'rootFrameMatched', 'documentOriginMatched', 'originalDocumentPathMatched', 'observedBindingMatched',
  'ownRequestOrigin', 'foreignCheckoutIdFound', 'foreignPaymentIdFound',
];
/** @param {number} value */
const increment = value => Math.min(Number.MAX_SAFE_INTEGER, value + 1);

/** Read own data fields only: unknown fields and accessors are never evaluated. */
/** @param {unknown} input @param {string} name @returns {unknown} */
function field(input, name) {
  if (input === null || typeof input !== 'object') return undefined;
  try { return Object.getOwnPropertyDescriptor(input, name)?.value; } catch { return undefined; }
}
/** @param {unknown} input @returns {Phase|null} */
function phaseOf(input) {
  const value = field(input, 'phase');
  return typeof value === 'string' && phaseSet.has(value) ? /** @type {Phase} */ (value) : null;
}
/** @param {unknown} value @returns {value is number} */
const timestamp = value => Number.isSafeInteger(value) && /** @type {number} */ (value) >= 0 &&
  /** @type {number} */ (value) <= BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.maxElapsedMs;
/** @param {unknown} input @returns {Record<string, boolean>} */
function checksOf(input) {
  /** @type {Record<string, boolean>} */
  const checks = {};
  const selected = field(input, 'checks');
  for (const name of checkNames) {
    const value = field(selected, name);
    if (typeof value === 'boolean') checks[name] = value;
  }
  return checks;
}
/** @returns {Bucket} */
function bucket() {
  return { counts: { attempted: 0, admitted: 0, denied: 0, failed: 0, response: 0, finished: 0,
    lateResponse: 0, untrackedAttempts: 0 }, samples: [], samplesDropped: 0, closedAtMs: null, closeVersion: 0 };
}

/** Unknown options are dropped; invalid limits use bounded defaults. No I/O or ambient inputs.
 * @param {unknown} [options]
 */
export function createBrowserTransportDiagnostics(options = {}) {
  const requestedSamples = field(options, 'samplesPerPhase');
  const samplesPerPhase = Number.isSafeInteger(requestedSamples) && /** @type {number} */ (requestedSamples) >= 0 &&
    /** @type {number} */ (requestedSamples) <= BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.maxSamplesPerPhase
    ? /** @type {number} */ (requestedSamples) : BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.defaultSamplesPerPhase;
  const requestedTracking = field(options, 'maxTrackedRequests');
  const maxTrackedRequests = Number.isSafeInteger(requestedTracking) && /** @type {number} */ (requestedTracking) > 0 &&
    /** @type {number} */ (requestedTracking) <= BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.maxTrackedRequests
    ? /** @type {number} */ (requestedTracking) : BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.defaultTrackedRequests;
  /** @type {Record<Phase, Bucket>} */
  const phases = /** @type {Record<Phase, Bucket>} */ (Object.fromEntries(BROWSER_TRANSPORT_PHASES.map(phase => [phase, bucket()])));
  /** @type {Map<object, RequestState>} */
  const requests = new Map();
  let ignoredEvents = 0, unmatchedEvents = 0;
  const ignore = () => { ignoredEvents = increment(ignoredEvents); return false; };

  /** @param {Phase} phase @param {Sample} sample */
  function append(phase, sample) {
    const selected = phases[phase];
    selected.counts[sample.kind] = increment(selected.counts[sample.kind]);
    if (selected.samples.length < samplesPerPhase) selected.samples.push(sample);
    else selected.samplesDropped = increment(selected.samplesDropped);
  }
  /** @param {RequestState} request @param {Kind} kind @param {number} atMs @param {unknown} input @returns {Sample} */
  function sample(request, kind, atMs, input) {
    return { kind, atMs, method: request.method, target: request.target, checks: checksOf(input) };
  }
  /** @param {unknown} handle @param {unknown} input */
  function lookup(handle, input) {
    const request = handle !== null && typeof handle === 'object' ? requests.get(handle) : undefined;
    const atMs = field(input, 'atMs');
    if (!request) { unmatchedEvents = increment(unmatchedEvents); ignore(); return null; }
    if (!timestamp(atMs) || atMs < request.lastAtMs) { ignore(); return null; }
    return { request, atMs, handle: /** @type {object} */ (handle) };
  }
  /** @param {Admission|null} admission @param {number} atMs */
  function late(admission, atMs) {
    if (!admission) return false;
    const selected = phases[admission.phase];
    return selected.closeVersion > admission.closeVersion && selected.closedAtMs !== null &&
      selected.closedAtMs >= admission.atMs && atMs >= selected.closedAtMs;
  }

  return Object.freeze({
    /** @param {unknown} input @returns {object|null} */
    attempt(input) {
      const phase = phaseOf(input), atMs = field(input, 'atMs');
      if (!phase || !timestamp(atMs)) { ignore(); return null; }
      const method = field(input, 'method'), target = field(input, 'target');
      /** @type {RequestState} */
      const request = { attemptPhase: phase, lastAtMs: atMs, admission: null, responded: false,
        method: typeof method === 'string' && methods.has(method) ? method : 'OTHER',
        target: typeof target === 'string' && targets.has(target) ? target : 'other' };
      append(phase, sample(request, 'attempted', atMs, input));
      if (requests.size >= maxTrackedRequests) {
        phases[phase].counts.untrackedAttempts = increment(phases[phase].counts.untrackedAttempts); return null;
      }
      const handle = Object.freeze({}); requests.set(handle, request); return handle;
    },
    /** @param {unknown} handle @param {unknown} input */
    admit(handle, input) {
      const found = lookup(handle, input), phase = phaseOf(input);
      if (!found) return false;
      if (!phase || found.request.admission) return ignore();
      found.request.admission = { phase, atMs: found.atMs, closeVersion: phases[phase].closeVersion };
      found.request.lastAtMs = found.atMs; append(phase, sample(found.request, 'admitted', found.atMs, input)); return true;
    },
    /** @param {unknown} handle @param {unknown} input */
    deny(handle, input) {
      const found = lookup(handle, input);
      if (!found) return false;
      if (found.request.admission) return ignore();
      const reason = field(input, 'reason');
      append(found.request.attemptPhase, { ...sample(found.request, 'denied', found.atMs, input),
        reason: typeof reason === 'string' && denialSet.has(reason) ? reason : 'GUARD_REJECTED' });
      requests.delete(found.handle); return true;
    },
    /** @param {unknown} handle @param {unknown} input */
    fail(handle, input) {
      const found = lookup(handle, input);
      if (!found) return false;
      const { request, atMs } = found, reason = field(input, 'reason');
      append(request.admission?.phase ?? request.attemptPhase, { ...sample(request, 'failed', atMs, input),
        admitted: request.admission !== null, responseObserved: request.responded, late: late(request.admission, atMs),
        reason: typeof reason === 'string' && failureSet.has(reason) ? reason : 'UNKNOWN_FAILURE' });
      requests.delete(found.handle); return true;
    },
    /** Phase comes from admission, never from response input or the current UI phase.
     * @param {unknown} handle @param {unknown} input */
    response(handle, input) {
      const found = lookup(handle, input), status = field(input, 'status');
      if (!found) return false;
      const { request, atMs } = found;
      if (!request.admission || request.responded || !Number.isSafeInteger(status) ||
        /** @type {number} */ (status) < 100 || /** @type {number} */ (status) > 599) return ignore();
      const isLate = late(request.admission, atMs);
      append(request.admission.phase, { ...sample(request, 'response', atMs, input), status: /** @type {number} */ (status), late: isLate });
      if (isLate) phases[request.admission.phase].counts.lateResponse = increment(phases[request.admission.phase].counts.lateResponse);
      request.responded = true; request.lastAtMs = atMs; return true;
    },
    /** Release on requestfinished; response alone is not transfer completion.
     * @param {unknown} handle @param {unknown} input */
    finish(handle, input) {
      const found = lookup(handle, input);
      if (!found) return false;
      if (!found.request.admission) return ignore();
      append(found.request.admission.phase, { ...sample(found.request, 'finished', found.atMs, input),
        responseObserved: found.request.responded, late: late(found.request.admission, found.atMs) });
      requests.delete(found.handle); return true;
    },
    /** @param {unknown} input */
    closePhase(input) {
      const phase = phaseOf(input), atMs = field(input, 'atMs');
      if (!phase || !timestamp(atMs)) return ignore();
      const selected = phases[phase];
      if (selected.closedAtMs !== null && atMs < selected.closedAtMs) return ignore();
      selected.closedAtMs = atMs; selected.closeVersion = increment(selected.closeVersion); return true;
    },
    snapshot() {
      const snapshots = /** @type {Record<Phase, Omit<Bucket, 'closeVersion'>>} */ (
        Object.fromEntries(BROWSER_TRANSPORT_PHASES.map(phase => {
          const selected = phases[phase];
          return [phase, { counts: { ...selected.counts }, closedAtMs: selected.closedAtMs,
            samplesDropped: selected.samplesDropped, samples: selected.samples.map(entry => ({ ...entry, checks: { ...entry.checks } })) }];
        })));
      return { version: 1, limits: { samplesPerPhase, maxTrackedRequests }, trackedRequests: requests.size, ignoredEvents, unmatchedEvents,
        phases: snapshots };
    },
  });
}
