import { describe, expect, test, vi } from "vitest";
import { createBrowserTransportAdapter } from "../../scripts/native/browser-transport-adapter.mjs";

function fixture(options: { samplesPerPhase?: number; maxTrackedRequests?: number } = {}) {
  let time = 0;
  const adapter = createBrowserTransportAdapter({ ...options, nowMs: () => time });
  return { adapter, tick: (value: number) => { time = value; } };
}

describe("native browser transport adapter", () => {
  test("observes the old returned-promise rejection hole without changing promise/error identity", async () => {
    const { adapter } = fixture();
    const request = {};
    adapter.attempt(request, { method: "POST", target: "sdk" });
    adapter.admit(request);
    const error = new Error("SYNTHETIC_PRIVATE_TRANSPORT_ERROR");
    let reject!: (reason: unknown) => void;
    const pending = new Promise<never>((_, fail) => { reject = fail; });
    const observed = adapter.observeOperation(request, () => pending);
    expect(observed).toBe(pending);
    const assertion = expect(observed).rejects.toBe(error);
    reject(error);
    await assertion;
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.startup.counts).toMatchObject({ admitted: 1, failed: 1, denied: 0 });
    expect(snapshot.recorder.phases.startup.samples.at(-1)).toMatchObject({ admitted: true, reason: "UNKNOWN_FAILURE" });
    expect(JSON.stringify(snapshot)).not.toContain(error.message);
  });

  test("preserves synchronous return/throw and fulfilled values without implicitly admitting", async () => {
    const { adapter } = fixture();
    const request = {};
    adapter.attempt(request);
    const getter = vi.fn(() => { throw new Error("DO_NOT_READ_THENABLE"); });
    const result = Object.defineProperty({}, "then", { get: getter });
    expect(adapter.observeOperation(request, () => result)).toBe(result);
    expect(getter).not.toHaveBeenCalled();
    const value = { safe: true };
    const promise = Promise.resolve(value);
    expect(adapter.observeOperation(request, () => promise)).toBe(promise);
    await expect(promise).resolves.toBe(value);
    const error = { privateError: "EXACT_ERROR_IDENTITY" };
    let caught: unknown;
    try { adapter.observeOperation(request, () => { throw error; }); } catch (value) { caught = value; }
    expect(caught).toBe(error);
    expect(adapter.snapshot().recorder.phases.startup.counts).toMatchObject({ admitted: 0, failed: 1 });
  });

  test("native guard rejection before the actual I/O hook stays a denial", () => {
    const { adapter } = fixture();
    const request = {}, guardError = new Error("SYNTHETIC_SOCKET_GUARD");
    const operation = vi.fn();
    adapter.attempt(request, { method: "GET", target: "app" });
    const forward = () => {
      const validSocket = false;
      if (!validSocket) throw guardError;
      adapter.admit(request);
      return adapter.observeOperation(request, operation);
    };
    try { forward(); } catch (error) {
      expect(error).toBe(guardError);
      adapter.reject(request, "GUARD_REJECTED");
    }
    expect(operation).not.toHaveBeenCalled();
    expect(adapter.snapshot().recorder.phases.startup.counts).toMatchObject({ attempted: 1, admitted: 0, denied: 1, failed: 0 });
  });

  test("a post-admission catch cannot reclassify failure as guard denial", () => {
    const { adapter } = fixture();
    const request = {};
    adapter.attempt(request);
    adapter.admit(request, { rootFrameMatched: true });
    adapter.reject(request, "HOST_DENIED", { observedBindingMatched: false });
    adapter.failed(request);
    adapter.reject(request, "GUARD_REJECTED");
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.startup.counts).toMatchObject({ denied: 0, admitted: 1, failed: 1 });
    expect(snapshot.recorder.phases.startup.samples.at(-1)).toMatchObject({ reason: "UNKNOWN_FAILURE", checks: { observedBindingMatched: false } });
    expect(snapshot.adapter.duplicateEvents).toBe(2);
  });

  test("deliberate denial's browser abort is distinguished and terminal duplicates do not count twice", () => {
    const { adapter } = fixture();
    const request = {};
    adapter.attempt(request);
    adapter.reject(request, "DOCUMENT_MISMATCH");
    adapter.failed(request);
    adapter.finished(request);
    adapter.response(request, 200);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.startup.counts).toMatchObject({ denied: 1, failed: 0, response: 0, finished: 0 });
    expect(snapshot.adapter).toMatchObject({ deliberateAbortEvents: 1, duplicateEvents: 2 });
    expect(snapshot.recorder.unmatchedEvents).toBe(0);
  });

  test("response headers keep correlation through a later failure or successful finish", () => {
    const { adapter, tick } = fixture();
    adapter.startPhase("card");
    const failed = {}, finished = {};
    adapter.attempt(failed); adapter.admit(failed);
    adapter.attempt(finished); adapter.admit(finished);
    tick(1); adapter.response(failed, 200); adapter.response(finished, 204);
    expect(adapter.snapshot().recorder.trackedRequests).toBe(2);
    tick(2); adapter.failed(failed); adapter.finished(finished);
    adapter.finished(finished); adapter.failed(failed);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.card.counts).toMatchObject({ response: 2, failed: 1, finished: 1 });
    expect(snapshot.recorder.phases.card.samples.find((sample) => sample.kind === "failed")).toMatchObject({ responseObserved: true });
    expect(snapshot.recorder.trackedRequests).toBe(0);
    expect(snapshot.adapter.duplicateEvents).toBe(2);
  });

  test("closing card retains its descriptive phase and late responses survive logout", () => {
    const { adapter, tick } = fixture();
    adapter.startPhase("card");
    const card = {};
    tick(1); adapter.attempt(card); adapter.admit(card);
    tick(4); adapter.closePhase();
    expect(adapter.snapshot().adapter).toMatchObject({ currentPhase: "card", currentPhaseClosed: true });
    expect(adapter.snapshot().recorder.phases.card.closedAtMs).toBe(4);
    tick(5); const unarmed = {};
    adapter.attempt(unarmed); adapter.reject(unarmed, "PHASE_UNARMED");
    tick(6); adapter.startPhase("logout");
    const logout = {};
    adapter.attempt(logout); adapter.admit(logout);
    tick(8); adapter.response(card, 200); adapter.finished(card);
    adapter.response(logout, 204); adapter.finished(logout);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.card).toMatchObject({ closedAtMs: 6, counts: { attempted: 2, denied: 1, response: 1, lateResponse: 1 } });
    expect(snapshot.recorder.phases.logout.counts).toMatchObject({ response: 1, lateResponse: 0 });
  });

  test("a phase transition closes requests admitted after an earlier policy-window close", () => {
    const { adapter, tick } = fixture();
    adapter.startPhase("card");
    tick(1); adapter.closePhase();
    const request = {};
    tick(2); adapter.attempt(request, { method: "GET", target: "checkout" });
    adapter.admit(request);
    tick(3); adapter.startPhase("logout");
    tick(4); adapter.response(request, 200);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.card.counts).toMatchObject({ admitted: 1, response: 1, lateResponse: 1 });
    expect(snapshot.recorder.phases.card.closedAtMs).toBe(3);
    expect(snapshot.recorder.phases.logout.counts.response).toBe(0);
  });

  test("reopening the same phase creates a new window without inventing late responses", () => {
    const { adapter, tick } = fixture();
    adapter.startPhase("fill"); tick(1); adapter.closePhase();
    adapter.startPhase("fill");
    const request = {};
    adapter.attempt(request); adapter.admit(request); adapter.response(request, 200); adapter.finished(request);
    expect(adapter.snapshot().recorder.phases.fill.counts.lateResponse).toBe(0);
    expect(adapter.startPhase("PRIVATE_UNKNOWN_PHASE")).toBe(false);
    expect(adapter.closePhase("PRIVATE_UNKNOWN_PHASE")).toBe(false);
    expect(adapter.snapshot().adapter.currentPhase).toBe("fill");
  });

  test("unknown and overflow requests remain explicitly unmatched without fabricated admission", () => {
    const { adapter } = fixture({ maxTrackedRequests: 1 });
    const first = {}, overflow = {}, unknown = {};
    expect(adapter.attempt(first)).toBe(true);
    expect(adapter.attempt(overflow)).toBe(false);
    expect(adapter.admit(overflow)).toBe(false);
    expect(adapter.response(overflow, 200)).toBe(false);
    adapter.finished(overflow);
    adapter.failed(unknown);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.startup.counts).toMatchObject({ attempted: 2, untrackedAttempts: 1, admitted: 0, response: 0 });
    expect(snapshot.recorder).toMatchObject({ trackedRequests: 1, unmatchedEvents: 4 });
    expect(snapshot.adapter.unknownRequestEvents).toBe(1);
    expect(adapter.attempt(first)).toBe(false);
    expect(adapter.attempt(null)).toBe(false);
    expect(adapter.snapshot().adapter).toMatchObject({ duplicateEvents: 1, invalidRequests: 1 });
  });

  test("early noisy phases cannot hide later card evidence; storage stays bounded", () => {
    const { adapter, tick } = fixture({ samplesPerPhase: 2, maxTrackedRequests: 2 });
    const phases = ["startup", "fill", "continue", "init", "card", "logout"] as const;
    for (const [index, phase] of phases.entries()) {
      adapter.startPhase(phase);
      for (let i = 0; i < 100; i++) {
        tick(index * 100 + i); const request = {};
        adapter.attempt(request, { method: "POST", target: "sdk" });
        adapter.reject(request, "HOST_DENIED");
      }
      adapter.closePhase();
    }
    const snapshot = adapter.snapshot();
    for (const phase of phases) {
      expect(snapshot.recorder.phases[phase].counts).toMatchObject({ attempted: 100, denied: 100 });
      expect(snapshot.recorder.phases[phase].samples).toHaveLength(2);
      expect(snapshot.recorder.phases[phase].samplesDropped).toBe(198);
    }
    expect(snapshot.recorder.trackedRequests).toBe(0);
    expect(JSON.stringify(snapshot).length).toBeLessThan(7_000);
  });

  test("request identity, metadata, errors and accessors never enter a snapshot", () => {
    const { adapter } = fixture();
    const secret = "PRIVATE_SYNTHETIC_SENTINEL";
    const getter = vi.fn(() => { throw new Error(secret); });
    const request = Object.defineProperty({ url: secret, body: secret, headers: secret }, "cookies", { get: getter });
    const metadata = { method: "POST", target: "sdk", url: secret, payload: secret,
      checks: { rootFrameMatched: true, ownRequestOrigin: secret, rawBody: secret } };
    Object.defineProperty(metadata, "privateKey", { get: getter });
    Object.defineProperty(metadata.checks, "foreignPaymentIdFound", { get: getter });
    adapter.attempt(request, metadata);
    adapter.reject(request, new Error(secret), { foreignCheckoutIdFound: false, phase: secret, urlSha256: secret, body: secret });
    const serialized = JSON.stringify(adapter.snapshot());
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toMatch(/cookies|payload|headers|requestId|privateKey|urlSha256|rawBody/);
    expect(getter).not.toHaveBeenCalled();
    expect(adapter.snapshot().recorder.phases.startup.samples).toEqual([
      expect.objectContaining({ checks: { rootFrameMatched: true } }),
      expect.objectContaining({ reason: "GUARD_REJECTED", checks: { foreignCheckoutIdFound: false } }),
    ]);
  });

  test("clock faults are finite gaps and cannot replace an operation's original error", async () => {
    expect(() => createBrowserTransportAdapter({})).toThrow("BROWSER_TRANSPORT_CLOCK_REQUIRED");
    let broken = false;
    const adapter = createBrowserTransportAdapter({ nowMs: () => { if (broken) throw new Error("PRIVATE_CLOCK"); return 0; } });
    const request = {}, asyncRequest = {};
    adapter.attempt(request); adapter.admit(request);
    adapter.attempt(asyncRequest); adapter.admit(asyncRequest); broken = true;
    const error = new Error("ORIGINAL_OPERATION_ERROR");
    expect(() => adapter.observeOperation(request, () => { throw error; })).toThrow(error);
    const rejected = Promise.reject(error);
    expect(adapter.observeOperation(asyncRequest, () => rejected)).toBe(rejected);
    await expect(rejected).rejects.toBe(error);
    expect(adapter.snapshot().adapter.invalidClockReads).toBe(2);
    expect(adapter.snapshot().adapter.lostCorrelations).toBe(2);
    expect(JSON.stringify(adapter.snapshot())).not.toMatch(/PRIVATE_CLOCK|ORIGINAL_OPERATION_ERROR/);
    for (const nowMs of [() => NaN, () => -1, () => 86_400_001, () => "secret"]) {
      const invalid = createBrowserTransportAdapter({ nowMs });
      expect(invalid.attempt({})).toBe(false);
      expect(invalid.snapshot().adapter.invalidClockReads).toBe(1);
      expect(invalid.snapshot().recorder.phases.startup.counts.attempted).toBe(0);
    }
  });

  test("a failed admission timestamp stays an explicit gap instead of fabricating a later denial/failure", () => {
    let time = 0;
    const adapter = createBrowserTransportAdapter({ nowMs: () => time });
    const request = {};
    adapter.attempt(request);
    time = -1;
    expect(adapter.admit(request)).toBe(false);
    time = 2;
    expect(adapter.reject(request, "HOST_DENIED")).toBe(false);
    adapter.failed(request);
    const snapshot = adapter.snapshot();
    expect(snapshot.recorder.phases.startup.counts).toMatchObject({ attempted: 1, admitted: 0, denied: 0, failed: 0 });
    expect(snapshot.recorder.unmatchedEvents).toBe(1);
    expect(snapshot.adapter).toMatchObject({ lostCorrelations: 1, invalidClockReads: 1, duplicateEvents: 1 });
  });

  test("snapshots detach both recorder samples and adapter counters", () => {
    const { adapter } = fixture();
    const request = {};
    adapter.attempt(request, { checks: { rootFrameMatched: true } });
    const copy = adapter.snapshot();
    copy.adapter.currentPhase = "card";
    copy.adapter.invalidRequests = 100;
    copy.recorder.phases.startup.counts.attempted = 100;
    copy.recorder.phases.startup.samples[0].checks.rootFrameMatched = false;
    expect(adapter.snapshot().adapter).toMatchObject({ currentPhase: "startup", invalidRequests: 0 });
    expect(adapter.snapshot().recorder.phases.startup.counts.attempted).toBe(1);
    expect(adapter.snapshot().recorder.phases.startup.samples[0].checks.rootFrameMatched).toBe(true);
  });
});
