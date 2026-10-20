import { createRequire } from "node:module";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  HOSTED_SDK_READINESS_SNAPSHOT_KEY,
  installHostedSdkReadiness,
} from "../../scripts/native/hosted-sdk-readiness.mjs";
import type { HostedSdkReadinessSnapshot } from "../../scripts/native/hosted-sdk-readiness.mjs";

type BrowserWindow = Window & typeof globalThis;
// jsdom is already a test dependency; keep its small constructor boundary typed
// without adding a declaration/dependency solely for this serialized-init test.
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string, options: { url: string; runScripts: "outside-only" }) => { window: BrowserWindow };
};
const sdkOrigin = "https://sdk-v2.custom.hs.dodopayments.com";
const documents: BrowserWindow[] = [];

function documentWindow() {
  // External resources/scripts are disabled; eval runs only the supplied init.
  const view = new JSDOM("<!doctype html><body></body>", {
    url: "https://test.checkout.dodopayments.com", runScripts: "outside-only",
  }).window;
  documents.push(view);
  return view;
}
function frame(view: BrowserWindow) {
  const element = view.document.createElement("iframe");
  view.document.body.append(element);
  return element;
}
function install(view: BrowserWindow, options: unknown = { sdkOrigin }) {
  return view.eval(`(${installHostedSdkReadiness.toString()})(${JSON.stringify(options)})`) as boolean;
}
function snapshot(view: BrowserWindow) {
  const read = (view as unknown as Record<string, unknown>)[HOSTED_SDK_READINESS_SNAPSHOT_KEY];
  expect(typeof read).toBe("function");
  return (read as () => HostedSdkReadinessSnapshot)();
}
function emit(view: BrowserWindow, source: MessageEventSource | null, data: unknown, origin = sdkOrigin) {
  const event = new view.MessageEvent("message", { source, data, origin, cancelable: true });
  view.dispatchEvent(event);
  return event;
}
const envelope = (type: unknown = "READY") => ({ __dodo_payments_msg__: true, nonce: "synthetic-nonce", type });

afterEach(() => {
  vi.restoreAllMocks();
  for (const view of documents.splice(0)) view.close();
});

describe("passive hosted SDK readiness init", () => {
  test("serialized init observes each exact signal from a current direct frame", () => {
    const view = documentWindow();
    let now = 100;
    vi.spyOn(view.performance, "now").mockImplementation(() => now);
    expect(install(view)).toBe(true);
    const source = frame(view).contentWindow!;
    for (const [type, time] of [["READY", 102.8], ["ELEMENT_READY", 104.9], ["ERROR", 105]] as const) {
      now = time; emit(view, source, envelope(type));
    }
    expect(snapshot(view)).toMatchObject({
      counts: { bridge: 1, element: 1, error: 1 }, invalidClockReads: 0,
      samples: [{ kind: "bridge", atMs: 2 }, { kind: "element", atMs: 4 }, { kind: "error", atMs: 5 }],
      samplesDropped: 0, samplesTruncated: false, countsSaturated: false,
    });
  });

  test.each(["http://sdk-v2.custom.hs.dodopayments.com", "https://sdk-v2.custom.hs.dodopayments.com.evil.test",
    "https://sdk-v2.custom.hs.dodopayments.com/", "null", ""])("rejects nonexact message origin %s", origin => {
    const view = documentWindow(); install(view);
    emit(view, frame(view).contentWindow!, envelope(), origin);
    expect(snapshot(view).counts).toEqual({ bridge: 0, element: 0, error: 0 });
  });

  test("ignores null, top-window, removed-frame and nested-frame sources", () => {
    const view = documentWindow(); install(view);
    const direct = frame(view), removed = frame(view), formerSource = removed.contentWindow!;
    const nested = frame(direct.contentWindow as BrowserWindow);
    removed.remove();
    for (const source of [null, view, formerSource, nested.contentWindow!]) emit(view, source, envelope());
    expect(snapshot(view).counts.bridge).toBe(0);
    emit(view, direct.contentWindow!, envelope());
    expect(snapshot(view).counts.bridge).toBe(1);
  });

  test("rejects malformed, inherited and unknown message envelopes without coercion", () => {
    const view = documentWindow(); install(view); const source = frame(view).contentWindow!;
    const inherited = Object.create(envelope());
    const bad = [null, "READY", [], {}, inherited, { ...envelope(), __dodo_payments_msg__: 1 },
      { ...envelope(), nonce: 7 }, { ...envelope(), nonce: null }, { ...envelope(), nonce: new String("nonce") },
      envelope(null), envelope({ toString: () => "READY" }), envelope("ready"), envelope("PAYMENT_SUCCEEDED")];
    for (const data of bad) emit(view, source, data);
    expect(snapshot(view).counts).toEqual({ bridge: 0, element: 0, error: 0 });
    expect(snapshot(view).samples).toEqual([]);
  });

  test("reads only own data fields and never evaluates private accessors or prose", () => {
    const view = documentWindow(); install(view); const source = frame(view).contentWindow!;
    const getter = vi.fn(() => { throw new Error("PRIVATE_PROVIDER_PROSE"); });
    const secret = "PRIVATE_NONCE_https://checkout.example/opaque?session=private-secret";
    const valid = { ...envelope("ERROR"), nonce: secret, payload: { email: secret, message: secret }, origin: secret };
    Object.defineProperty(valid, "unrelated", { get: getter });
    emit(view, source, valid);
    for (const name of ["__dodo_payments_msg__", "nonce", "type"]) {
      const data = envelope(); Object.defineProperty(data, name, { get: getter }); emit(view, source, data);
    }
    emit(view, source, new Proxy({}, { getOwnPropertyDescriptor: getter }));
    expect(getter).toHaveBeenCalledTimes(1); // Proxy descriptor trap only; no accessor invocation.
    const serialized = JSON.stringify(snapshot(view));
    expect(snapshot(view).counts).toEqual({ bridge: 0, element: 0, error: 1 });
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toMatch(/nonce|payload|prose|origin|url|iframe|identifier|paymentAccepted|readyToPay/i);
  });

  test("snapshots are detached, finite and contain only the documented fields", () => {
    const view = documentWindow(); install(view); emit(view, frame(view).contentWindow!, envelope());
    const copy = snapshot(view);
    expect(Object.keys(copy).sort()).toEqual(["counts", "countsSaturated", "invalidClockReads", "limits", "samples", "samplesDropped", "samplesTruncated", "version"].sort());
    expect(Object.keys(copy.samples[0]).sort()).toEqual(["atMs", "kind"]);
    copy.counts.bridge = 99; copy.samples[0].kind = "error"; copy.samples[0].atMs = -1;
    copy.samples.length = 0; copy.limits.samples = 999;
    expect(snapshot(view)).toMatchObject({ counts: { bridge: 1 }, limits: { samples: 16 } });
    expect(snapshot(view).samples[0]).toMatchObject({ kind: "bridge" });
  });

  test("sample truncation preserves subsequent signal counts", () => {
    const view = documentWindow(); install(view); const source = frame(view).contentWindow!;
    for (let i = 0; i < 21; i++) emit(view, source, envelope(i % 2 ? "ELEMENT_READY" : "READY"));
    expect(snapshot(view)).toMatchObject({ counts: { bridge: 11, element: 10, error: 0 }, samplesDropped: 5,
      samplesTruncated: true, countsSaturated: false });
    expect(snapshot(view).samples).toHaveLength(16);
  });

  test("signal and dropped-sample counters saturate with explicit loss flags", () => {
    const view = documentWindow(); install(view); const source = frame(view).contentWindow!;
    const ready = new view.MessageEvent("message", { source, data: envelope(), origin: sdkOrigin });
    for (let i = 0; i < 65_536; i++) view.dispatchEvent(ready);
    for (let i = 0; i < 20; i++) emit(view, source, envelope("ERROR"));
    const result = snapshot(view);
    expect(result).toMatchObject({ limits: { count: 65_535, samples: 16 },
      counts: { bridge: 65_535, element: 0, error: 20 }, samplesDropped: 65_535,
      countsSaturated: true, samplesTruncated: true });
    expect(result.samples).toHaveLength(16);
    expect(JSON.stringify(result).length).toBeLessThan(2_000);
  }, 20_000);

  test("invalid and regressing clocks drop timing while preserving observed signals", () => {
    const view = documentWindow(); let now = 100;
    const clock = vi.spyOn(view.performance, "now").mockImplementation(() => now);
    install(view); const source = frame(view).contentWindow!;
    now = 101.9; emit(view, source, envelope());
    for (const bad of [NaN, Infinity, -1, 100, 86_400_101]) { now = bad; emit(view, source, envelope()); }
    clock.mockImplementationOnce(() => { throw new Error("PRIVATE_CLOCK_ERROR"); }); emit(view, source, envelope());
    now = 102.9; emit(view, source, envelope());
    expect(snapshot(view)).toMatchObject({ counts: { bridge: 8 }, invalidClockReads: 6,
      samplesDropped: 6, samplesTruncated: true, samples: [{ kind: "bridge", atMs: 1 }, { kind: "bridge", atMs: 2 }] });
    expect(JSON.stringify(snapshot(view))).not.toContain("PRIVATE_CLOCK_ERROR");
  });

  test("a failed initial clock cannot fabricate a later time baseline", () => {
    const view = documentWindow(); vi.spyOn(view.performance, "now").mockReturnValueOnce(NaN).mockReturnValue(400);
    install(view); emit(view, frame(view).contentWindow!, envelope());
    expect(snapshot(view)).toMatchObject({ counts: { bridge: 1 }, samples: [], invalidClockReads: 1,
      samplesDropped: 1, samplesTruncated: true });
  });

  test("fixed nonenumerable installer runs once and never reads an existing property getter", () => {
    const view = documentWindow(); expect(install(view)).toBe(true);
    const descriptor = Object.getOwnPropertyDescriptor(view, HOSTED_SDK_READINESS_SNAPSHOT_KEY)!;
    expect(descriptor).toMatchObject({ enumerable: false, configurable: false, writable: false });
    expect(Object.keys(view)).not.toContain(HOSTED_SDK_READINESS_SNAPSHOT_KEY);
    expect(install(view)).toBe(false); emit(view, frame(view).contentWindow!, envelope());
    expect(snapshot(view).counts.bridge).toBe(1);
    const other = documentWindow(), getter = vi.fn(() => { throw new Error("PRIVATE_EXISTING_PROPERTY"); });
    Object.defineProperty(other, HOSTED_SDK_READINESS_SNAPSHOT_KEY, { get: getter });
    expect(install(other)).toBe(false); expect(getter).not.toHaveBeenCalled();
  });

  test("subframe installs are no-ops and a restarted top document gets separate counters", () => {
    const first = documentWindow(), child = frame(first).contentWindow as BrowserWindow;
    expect(install(child)).toBe(false);
    expect(Object.getOwnPropertyDescriptor(child, HOSTED_SDK_READINESS_SNAPSHOT_KEY)).toBeUndefined();
    install(first); emit(first, child, envelope());
    const restarted = documentWindow(); install(restarted);
    expect(snapshot(first).counts.bridge).toBe(1);
    expect(snapshot(restarted).counts.bridge).toBe(0);
  });

  test("configuration must explicitly select the exact TEST origin", () => {
    for (const options of [null, {}, { sdkOrigin: `${sdkOrigin}/` }, { sdkOrigin: "https://live.example" },
      { sdkOrigin: 1 }]) {
      const view = documentWindow(); expect(install(view, options)).toBe(false);
      expect(Object.getOwnPropertyDescriptor(view, HOSTED_SDK_READINESS_SNAPSHOT_KEY)).toBeUndefined();
    }
    expect(installHostedSdkReadiness({ sdkOrigin })).toBe(false); // Node import/call has no browser side effect.
  });

  test("observer does not alter SDK events, network, storage, console or DOM", () => {
    const view = documentWindow(), source = frame(view).contentWindow!, before = view.document.documentElement.outerHTML;
    const output = ["log", "warn", "error", "info", "debug"] as const;
    const consoleCalls = output.map(name => vi.spyOn(view.console, name).mockImplementation(() => {}));
    const storage = vi.spyOn(view.Storage.prototype, "setItem");
    const xhr = vi.spyOn(view.XMLHttpRequest.prototype, "open");
    const post = vi.spyOn(view, "postMessage"), network = vi.fn();
    Object.defineProperty(view, "fetch", { value: network });
    const otherListener = vi.fn(); view.addEventListener("message", otherListener);
    const mutations = new view.MutationObserver(() => {}); mutations.observe(view.document, { subtree: true, childList: true, attributes: true });
    install(view); const data = envelope("ELEMENT_READY"), event = emit(view, source, data); snapshot(view);
    expect(event.data).toBe(data); expect(event.defaultPrevented).toBe(false); expect(otherListener).toHaveBeenCalledOnce();
    expect(network).not.toHaveBeenCalled(); expect(xhr).not.toHaveBeenCalled(); expect(post).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled(); for (const call of consoleCalls) expect(call).not.toHaveBeenCalled();
    expect(mutations.takeRecords()).toEqual([]); expect(view.document.documentElement.outerHTML).toBe(before); mutations.disconnect();
  });
});
