import { describe, expect, test, vi } from "vitest";
import {
  BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS,
  BROWSER_TRANSPORT_PHASES,
  createBrowserTransportDiagnostics,
} from "../../scripts/native/browser-transport-diagnostics.mjs";

describe("native browser transport diagnostics", () => {
  test("startup noise cannot exhaust card evidence and counters outlive each phase's sample cap", () => {
    const trace = createBrowserTransportDiagnostics();
    for (let i = 0; i < 40; i++) {
      const request = trace.attempt({ phase: "startup", atMs: i * 2, method: "GET", target: "sdk" });
      trace.deny(request, { atMs: i * 2 + 1, reason: "HOST_DENIED" });
    }
    const card = trace.attempt({ phase: "card", atMs: 100, method: "POST", target: "checkout" });
    trace.admit(card, { phase: "card", atMs: 101 });
    trace.response(card, { atMs: 110, status: 200 });
    trace.finish(card, { atMs: 111 });

    const snapshot = trace.snapshot();
    expect(snapshot.phases.startup.counts).toMatchObject({ attempted: 40, denied: 40, failed: 0 });
    expect(snapshot.phases.startup.samples).toHaveLength(16);
    expect(snapshot.phases.startup.samplesDropped).toBe(64);
    expect(snapshot.phases.card.counts).toMatchObject({ attempted: 1, admitted: 1, response: 1, finished: 1 });
    expect(snapshot.phases.card.samples.map((sample) => sample.kind)).toEqual(["attempted", "admitted", "response", "finished"]);
    expect(snapshot.trackedRequests).toBe(0);
  });

  test("all six phase buckets stay bounded independently while counts continue", () => {
    const trace = createBrowserTransportDiagnostics({ samplesPerPhase: 2 });
    for (const phase of BROWSER_TRANSPORT_PHASES) {
      for (let i = 0; i < 25; i++) {
        const request = trace.attempt({ phase, atMs: i * 2 });
        trace.deny(request, { atMs: i * 2 + 1, reason: "PHASE_UNARMED" });
      }
    }
    const snapshot = trace.snapshot();
    for (const phase of BROWSER_TRANSPORT_PHASES) {
      expect(snapshot.phases[phase].counts).toMatchObject({ attempted: 25, denied: 25 });
      expect(snapshot.phases[phase].samples).toHaveLength(2);
      expect(snapshot.phases[phase].samplesDropped).toBe(48);
    }
    expect(JSON.stringify(snapshot).length).toBeLessThan(6_000);
  });

  test("a delayed response belongs to its admission phase, even while logout is active", () => {
    const trace = createBrowserTransportDiagnostics();
    const original = trace.attempt({ phase: "startup", atMs: 0 });
    trace.admit(original, { phase: "card", atMs: 1 });
    trace.closePhase({ phase: "card", atMs: 4 });
    const logout = trace.attempt({ phase: "logout", atMs: 4 });
    trace.admit(logout, { phase: "logout", atMs: 4 });
    trace.response(original, { phase: "logout", atMs: 5, status: 200 });
    trace.response(logout, { phase: "card", atMs: 6, status: 204 });
    trace.finish(original, { atMs: 7 });
    trace.finish(logout, { atMs: 7 });

    const snapshot = trace.snapshot();
    expect(snapshot.phases.startup.counts).toMatchObject({ attempted: 1, response: 0 });
    expect(snapshot.phases.card.counts).toMatchObject({ attempted: 0, admitted: 1, response: 1, lateResponse: 1 });
    expect(snapshot.phases.card.samples.find((sample) => sample.kind === "response")).toMatchObject({ atMs: 5, status: 200, late: true });
    expect(snapshot.phases.logout.counts).toMatchObject({ response: 1, lateResponse: 0 });
  });

  test("identical requests have distinct opaque correlations but no serialized identifiers", () => {
    const trace = createBrowserTransportDiagnostics();
    const first = trace.attempt({ phase: "card", atMs: 1, method: "POST", target: "sdk" });
    const second = trace.attempt({ phase: "card", atMs: 1, method: "POST", target: "sdk" });
    expect(first).not.toBe(second);
    expect(Object.keys(first!)).toEqual([]);
    expect(Object.isFrozen(first)).toBe(true);
    trace.admit(first, { phase: "card", atMs: 2 });
    trace.admit(second, { phase: "card", atMs: 2 });
    trace.response(second, { atMs: 3, status: 400 });
    trace.response(first, { atMs: 4, status: 200 });
    trace.finish(first, { atMs: 5 });
    trace.finish(second, { atMs: 5 });
    const snapshot = trace.snapshot();
    expect(snapshot.phases.card.counts).toMatchObject({ attempted: 2, admitted: 2, response: 2, finished: 2 });
    expect(snapshot.phases.card.samples.filter((sample) => sample.kind === "response").map((sample) => sample.status)).toEqual([400, 200]);
    expect(JSON.stringify(snapshot)).not.toMatch(/requestId|handle|checkoutSessionId|paymentId/);
  });

  test("guard denial and transport failure remain separate, including failure after headers", () => {
    const trace = createBrowserTransportDiagnostics();
    const denied = trace.attempt({ phase: "init", atMs: 0 });
    trace.deny(denied, { atMs: 1, reason: "DOCUMENT_MISMATCH" });
    expect(trace.fail(denied, { atMs: 2, reason: "ABORTED" })).toBe(false);
    const failed = trace.attempt({ phase: "init", atMs: 3 });
    trace.admit(failed, { phase: "init", atMs: 4 });
    trace.response(failed, { atMs: 5, status: 200 });
    trace.closePhase({ phase: "init", atMs: 6 });
    trace.fail(failed, { atMs: 7, reason: "NETWORK_ERROR" });
    const pending = trace.attempt({ phase: "init", atMs: 8 });
    trace.fail(pending, { atMs: 9, reason: "ABORTED" });

    const snapshot = trace.snapshot();
    expect(snapshot.phases.init.counts).toMatchObject({ denied: 1, failed: 2, response: 1, lateResponse: 0 });
    expect(snapshot.phases.init.samples.filter((sample) => sample.kind === "failed")).toEqual([
      expect.objectContaining({ admitted: true, responseObserved: true, late: true, reason: "NETWORK_ERROR" }),
      expect.objectContaining({ admitted: false, responseObserved: false, late: false, reason: "ABORTED" }),
    ]);
    expect(snapshot.unmatchedEvents).toBe(1);
    expect(snapshot.trackedRequests).toBe(0);
  });

  test("invalid lifecycle events cannot fabricate admissions, responses or denials", () => {
    const trace = createBrowserTransportDiagnostics();
    const request = trace.attempt({ phase: "continue", atMs: 10 });
    expect(trace.response(request, { atMs: 11, status: 200 })).toBe(false);
    expect(trace.admit(request, { phase: "continue", atMs: 20 })).toBe(true);
    expect(trace.response(request, { atMs: 19, status: 200 })).toBe(false);
    expect(trace.response(request, { atMs: 21, status: 700 })).toBe(false);
    expect(trace.response(request, { atMs: 22, status: 204 })).toBe(true);
    expect(trace.response(request, { atMs: 23, status: 200 })).toBe(false);
    expect(trace.admit(request, { phase: "logout", atMs: 24 })).toBe(false);
    expect(trace.deny(request, { atMs: 24, reason: "GUARD_REJECTED" })).toBe(false);
    expect(trace.finish(request, { atMs: 25 })).toBe(true);
    expect(trace.response(request, { atMs: 26, status: 200 })).toBe(false);
    expect(trace.snapshot().phases.continue.counts).toMatchObject({ admitted: 1, response: 1, denied: 0, finished: 1 });
    expect(trace.snapshot()).toMatchObject({ ignoredEvents: 7, unmatchedEvents: 1, trackedRequests: 0 });
  });

  test("same-millisecond close and admission ordering does not invent a late response", () => {
    const trace = createBrowserTransportDiagnostics();
    trace.closePhase({ phase: "card", atMs: 10 });
    const afterClose = trace.attempt({ phase: "card", atMs: 10 });
    trace.admit(afterClose, { phase: "card", atMs: 10 });
    trace.response(afterClose, { atMs: 10, status: 200 });
    trace.finish(afterClose, { atMs: 10 });
    const beforeClose = trace.attempt({ phase: "card", atMs: 12 });
    trace.admit(beforeClose, { phase: "card", atMs: 12 });
    trace.closePhase({ phase: "card", atMs: 12 });
    trace.response(beforeClose, { atMs: 12, status: 200 });
    expect(trace.snapshot().phases.card.samples.filter((sample) => sample.kind === "response").map((sample) => sample.late)).toEqual([false, true]);
  });

  test("pending correlation is bounded, lost attempts are counted, and finished slots can be reused", () => {
    const trace = createBrowserTransportDiagnostics({ maxTrackedRequests: 4, samplesPerPhase: 1 });
    const handles = Array.from({ length: 40 }, (_, atMs) => trace.attempt({ phase: "fill", atMs }));
    expect(handles.filter(Boolean)).toHaveLength(4);
    expect(trace.response(handles[39], { atMs: 40, status: 200 })).toBe(false);
    const saturated = trace.snapshot();
    expect(saturated).toMatchObject({ trackedRequests: 4, unmatchedEvents: 1 });
    expect(saturated.phases.fill.counts).toMatchObject({ attempted: 40, untrackedAttempts: 36 });
    expect(saturated.phases.fill.samples).toHaveLength(1);
    expect(saturated.phases.fill.samplesDropped).toBe(39);
    trace.admit(handles[0], { phase: "fill", atMs: 41 });
    trace.response(handles[0], { atMs: 42, status: 200 });
    trace.finish(handles[0], { atMs: 43 });
    expect(trace.attempt({ phase: "fill", atMs: 44 })).not.toBeNull();
    expect(trace.snapshot().trackedRequests).toBe(4);
  });

  test("counts-only mode and invalid options cannot create unbounded storage", () => {
    const trace = createBrowserTransportDiagnostics({ samplesPerPhase: 0 });
    const request = trace.attempt({ phase: "card", atMs: 0 });
    trace.admit(request, { phase: "card", atMs: 1 });
    trace.response(request, { atMs: 2, status: 200 });
    trace.finish(request, { atMs: 3 });
    expect(trace.snapshot().phases.card).toMatchObject({ samples: [], samplesDropped: 4 });
    const defaults = createBrowserTransportDiagnostics({ samplesPerPhase: Infinity, maxTrackedRequests: 1_000_000 });
    expect(defaults.snapshot().limits).toEqual({
      samplesPerPhase: BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.defaultSamplesPerPhase,
      maxTrackedRequests: BROWSER_TRANSPORT_DIAGNOSTIC_LIMITS.defaultTrackedRequests,
    });
  });

  test("only finite enums and literal booleans survive; URLs, payloads, credentials and prose do not", () => {
    const secret = "PRIVATE_SYNTHETIC_SENTINEL";
    const privateValues = [secret, "fixture@example.invalid", "https://example.invalid/?token=private", "Bearer synthetic-token", "4242424242424242"];
    const trace = createBrowserTransportDiagnostics({ runId: secret, sourceCommit: secret });
    const request = trace.attempt({ phase: "card", atMs: 1, method: secret, target: secret,
      url: privateValues[2], body: { card: privateValues[4] }, headers: { authorization: privateValues[3] },
      cookies: secret, email: privateValues[1], sdkReady: true, paymentAccepted: true,
      checks: { rootFrameMatched: true, foreignPaymentIdFound: false, ownRequestOrigin: secret, payload: secret },
    });
    trace.admit(request, { phase: "card", atMs: 2, headers: secret });
    trace.response(request, { atMs: 3, status: 200, payload: secret, sdkReady: true, paymentAccepted: true });
    trace.fail(request, { atMs: 4, reason: new Error(secret), providerError: secret });
    const denied = trace.attempt({ phase: "startup", atMs: 5 });
    trace.deny(denied, { atMs: 6, reason: secret });
    expect(trace.attempt({ phase: secret, atMs: 7 })).toBeNull();
    const snapshot = trace.snapshot();
    expect(snapshot.phases.card.samples[0]).toMatchObject({ method: "OTHER", target: "other", checks: { rootFrameMatched: true, foreignPaymentIdFound: false } });
    expect(snapshot.phases.card.samples[3].reason).toBe("UNKNOWN_FAILURE");
    expect(snapshot.phases.startup.samples[1].reason).toBe("GUARD_REJECTED");
    const serialized = JSON.stringify(snapshot);
    for (const value of privateValues) expect(serialized).not.toContain(value);
    expect(serialized).not.toMatch(/url|body|headers|cookies|email|sdkReady|paymentAccepted|providerError|requestId|runId|sourceCommit/);
  });

  test("getters and coercion are not invoked, and throwing proxy descriptors do not leak", () => {
    const getter = vi.fn(() => { throw new Error("PRIVATE_ACCESSOR"); });
    const trace = createBrowserTransportDiagnostics();
    const input = { phase: "init", atMs: 1, checks: { foreignCheckoutIdFound: false } };
    Object.defineProperty(input, "url", { get: getter });
    Object.defineProperty(input.checks, "rootFrameMatched", { get: getter });
    const request = trace.attempt(input);
    trace.admit(request, { phase: "init", atMs: 2 });
    const response = { atMs: 3, status: 200 };
    Object.defineProperty(response, "phase", { get: getter });
    trace.response(request, response);
    trace.fail(request, { atMs: 4, reason: { toString: getter } });
    const invalid = { phase: "init" };
    Object.defineProperty(invalid, "atMs", { get: getter });
    expect(trace.attempt(invalid)).toBeNull();
    const descriptorTrap = vi.fn(() => { throw new Error("PRIVATE_ACCESSOR"); });
    expect(trace.attempt(new Proxy({}, { getOwnPropertyDescriptor: descriptorTrap }))).toBeNull();
    expect(descriptorTrap).toHaveBeenCalledTimes(2);
    expect(getter).not.toHaveBeenCalled();
    expect(JSON.stringify(trace.snapshot())).not.toContain("PRIVATE_ACCESSOR");
    expect(trace.snapshot().phases.init.samples[0].checks).toEqual({ foreignCheckoutIdFound: false });
  });

  test("elapsed times and HTTP statuses are bounded numeric evidence, not arbitrary input", () => {
    const trace = createBrowserTransportDiagnostics();
    for (const atMs of [NaN, Infinity, -1, 0.5, 86_400_001, 4242424242424242, "10"]) {
      expect(trace.attempt({ phase: "card", atMs })).toBeNull();
    }
    const request = trace.attempt({ phase: "card", atMs: 86_400_000 });
    trace.admit(request, { phase: "card", atMs: 86_400_000 });
    for (const status of [0, 600, 200.5, "200", Infinity]) {
      expect(trace.response(request, { atMs: 86_400_000, status })).toBe(false);
    }
    expect(trace.response(request, { atMs: 86_400_000, status: 599 })).toBe(true);
    expect(trace.snapshot().phases.card.counts.response).toBe(1);
  });

  test("snapshots are detached and the helper performs no network or console output", () => {
    const network = vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); });
    vi.stubGlobal("fetch", network);
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const checks = { rootFrameMatched: true };
      const trace = createBrowserTransportDiagnostics();
      const request = trace.attempt({ phase: "card", atMs: 1, checks });
      checks.rootFrameMatched = false;
      const copy = trace.snapshot();
      copy.phases.card.counts.attempted = 99;
      copy.phases.card.samples[0].checks.rootFrameMatched = false;
      copy.phases.card.samples.length = 0;
      expect(trace.snapshot().phases.card.counts.attempted).toBe(1);
      expect(trace.snapshot().phases.card.samples[0].checks.rootFrameMatched).toBe(true);
      trace.admit(request, { phase: "card", atMs: 2 });
      trace.finish(request, { atMs: 3 });
      expect(network).not.toHaveBeenCalled();
      expect(output).not.toHaveBeenCalled();
    } finally {
      output.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
