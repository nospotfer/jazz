// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PrivateOwnerBoundary } from "@/components/auth/private-owner-boundary";
import { useOwnerScopedResource } from "@/hooks/use-owner-scoped-resource";
import { useUserJazzMedalProgress } from "@/hooks/use-user-jazz-medal-progress";
import { useUserJazzMedalProfile } from "@/hooks/use-user-jazz-medal-profile";
import { useUserCourseCompletionRecognition } from "@/hooks/use-user-course-completion-recognition";
import { DashboardPurchaseAutoReconcile } from "@/components/dashboard/dashboard-purchase-auto-reconcile";

const mocks = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: unknown) => void>(),
  fetch: vi.fn(), refresh: vi.fn(), language: "en",
}));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    mocks.listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  },
} }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/components/providers/dashboard-preferences-provider", () => ({ useDashboardPreferences: () => ({ language: mocks.language }) }));

let pending: Array<() => void>;
function deferred<T>(fallback: T) {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  pending.push(() => resolve(fallback));
  return { promise, resolve };
}
const response = (value: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
async function auth(event = "INITIAL_SESSION", id: string | null = "owner-a") {
  await act(async () => { for (const listener of [...mocks.listeners]) listener(event, id ? { user: { id } } : null); });
}
async function tick(milliseconds = 0) { await act(async () => { vi.advanceTimersByTime(milliseconds); await Promise.resolve(); }); }
function Resource({ id = "owner-a", path = "/api/messages/unread-count" }: { id?: string; path?: string }) {
  const { value } = useOwnerScopedResource<{ marker: string } | null>({ path, initialValue: null, emptyValue: null, intervalMs: 60000, expectedUserId: id });
  return <output>{value?.marker ?? "empty"}</output>;
}
function LearningReads({ language = "fr" }: { language?: "fr" | "pt" }) {
  const { progress } = useUserJazzMedalProgress();
  const { profile } = useUserJazzMedalProfile(language);
  const { recognition } = useUserCourseCompletionRecognition();
  return <output>{progress?.platinumMedalCount ?? 0}/{profile?.progress.platinumMedalCount ?? 0}/{recognition.completedLessons}</output>;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  mocks.listeners.clear(); mocks.language = "en"; pending = [];
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  mocks.fetch.mockResolvedValue(response({ marker: "current" }));
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(async () => {
  cleanup();
  await act(async () => { for (const finish of pending) finish(); });
  mocks.listeners.clear(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("owner-scoped private reads", () => {
  test("automatic reconciliation cannot refresh from a late JSON result after owner invalidation", async () => {
    const body = deferred({ unlocked: 1 });
    const json = vi.fn(() => body.promise);
    mocks.fetch.mockResolvedValue({ ok: true, status: 200, json });
    render(<PrivateOwnerBoundary expectedUserId="owner-a"><DashboardPurchaseAutoReconcile /></PrivateOwnerBoundary>);
    await auth();
    expect(json).toHaveBeenCalledOnce();
    await act(async () => {
      for (const listener of [...mocks.listeners]) listener("SIGNED_OUT", null);
      body.resolve({ unlocked: 1 });
      await Promise.resolve();
    });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  test("does not read while the SDK owner is unresolved or differs from the server owner", async () => {
    render(<Resource />);
    await tick();
    expect(mocks.fetch).not.toHaveBeenCalled();
    await auth("INITIAL_SESSION", "owner-b");
    await tick();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(screen.getByText("empty")).toBeTruthy();
  });
  test.each(["/api/messages/unread-count", "/api/dashboard/pdf-count"])("%s sends exactly the matching owner hint and a cancellable request", async (path) => {
    render(<Resource path={path} />);
    await auth(); await tick();
    const [request, options] = mocks.fetch.mock.calls[0];
    const url = new URL(request, "https://synthetic.example");
    expect(url.pathname).toBe(path);
    expect(url.searchParams.getAll("expectedUserId")).toEqual(["owner-a"]);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(screen.getByText("current")).toBeTruthy();
  });
  test("a cookie owner mismatch 409 cannot expose its body as current data", async () => {
    mocks.fetch.mockResolvedValue(response({ marker: "wrong-owner-private-body" }, 409));
    render(<Resource />); await auth(); await tick();
    expect(screen.getByText("empty")).toBeTruthy();
    expect(screen.queryByText("wrong-owner-private-body")).toBeNull();
  });
  test("a late fetch ignored by cancellation cannot restore state after sign-out", async () => {
    const old = deferred(response({ marker: "old-private" }));
    mocks.fetch.mockReturnValue(old.promise);
    render(<Resource />); await auth(); await tick();
    const signal = mocks.fetch.mock.calls[0][1].signal;
    await auth("SIGNED_OUT", null);
    expect(signal.aborted).toBe(true);
    await act(async () => old.resolve(response({ marker: "old-private" })));
    expect(screen.getByText("empty")).toBeTruthy();
  });
  test("owner changes during response.json reject late parsed private data", async () => {
    const body = deferred({ marker: "old-private" });
    const json = vi.fn(() => body.promise);
    mocks.fetch.mockResolvedValue({ ok: true, status: 200, json });
    render(<Resource />); await auth(); await tick();
    expect(json).toHaveBeenCalledOnce();
    await auth("SIGNED_OUT", null);
    await act(async () => body.resolve({ marker: "old-private" }));
    expect(screen.getByText("empty")).toBeTruthy();
  });
  test("A to B to A rejects the original A response and reads the fresh generation", async () => {
    const old = deferred(response({ marker: "retired-a" }));
    mocks.fetch.mockReturnValueOnce(old.promise).mockResolvedValue(response({ marker: "fresh-a" }));
    render(<Resource />); await auth(); await tick();
    await act(async () => {
      for (const listener of [...mocks.listeners]) {
        listener("SIGNED_IN", { user: { id: "owner-b" } });
        listener("SIGNED_IN", { user: { id: "owner-a" } });
      }
    });
    await tick();
    expect(screen.getByText("fresh-a")).toBeTruthy();
    await act(async () => old.resolve(response({ marker: "retired-a" })));
    expect(screen.getByText("fresh-a")).toBeTruthy();
  });
  test("a same-owner refresh retains current data while a newer request supersedes the older one", async () => {
    const old = deferred(response({ marker: "superseded" }));
    mocks.fetch.mockResolvedValueOnce(response({ marker: "stable" })).mockReturnValueOnce(old.promise).mockResolvedValue(response({ marker: "fresh" }));
    render(<Resource />); await auth(); await tick();
    await auth("TOKEN_REFRESHED"); await tick();
    expect(screen.getByText("stable")).toBeTruthy();
    await auth("USER_UPDATED"); await tick();
    expect(screen.getByText("fresh")).toBeTruthy();
    await act(async () => old.resolve(response({ marker: "superseded" })));
    expect(screen.getByText("fresh")).toBeTruthy();
  });
  test("stale SSR A props cannot start a new read after live SDK B has arrived", async () => {
    const view = render(<Resource />); await auth(); await tick();
    await auth("SIGNED_IN", "owner-b");
    view.rerender(<Resource id="owner-a" />); await tick();
    expect(mocks.fetch).toHaveBeenCalledOnce();
    view.rerender(<Resource id="owner-b" />); await tick();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(new URL(mocks.fetch.mock.calls[1][0], "https://synthetic.example").searchParams.get("expectedUserId")).toBe("owner-b");
  });
});

describe("real learning hooks share the verified owner scope", () => {
  test("all three requests bind the same owner, preserving profile language", async () => {
    mocks.fetch.mockImplementation(async (input: string) => {
      const path = new URL(input, "https://synthetic.example").pathname;
      if (path.endsWith("/profile")) return response({ progress: { platinumMedalCount: 8 } });
      if (path.endsWith("/quiz-medals")) return response({ platinumMedalCount: 8 });
      if (path.endsWith("/course-completion-recognition")) return response({ completedLessons: 8 });
      throw new Error("Unexpected closed request");
    });
    render(<PrivateOwnerBoundary expectedUserId="owner-a"><LearningReads /></PrivateOwnerBoundary>);
    await auth(); await tick(900);
    expect(screen.getByText("8/8/8")).toBeTruthy();
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    for (const [input] of mocks.fetch.mock.calls) {
      const url = new URL(input, "https://synthetic.example");
      expect(url.searchParams.getAll("expectedUserId")).toEqual(["owner-a"]);
      if (url.pathname.endsWith("/profile")) expect(url.searchParams.get("language")).toBe("fr");
    }
    // One shared listener rather than independent unverified session booleans.
    expect(mocks.listeners.size).toBe(1);
    await auth("SIGNED_OUT", null);
    expect(screen.queryByText("8/8/8")).toBeNull();
  });
  test("profile language change cancels the old body even when the transport ignores abort", async () => {
    const old = deferred(response({ progress: { platinumMedalCount: 12 } }));
    mocks.fetch.mockImplementation((input: string) => String(input).includes("language=fr") ? old.promise : Promise.resolve(response({ progress: { platinumMedalCount: 4 } })));
    function Profile({ language }: { language: "fr" | "pt" }) { const { profile } = useUserJazzMedalProfile(language); return <output>{profile?.progress.platinumMedalCount ?? 0}</output>; }
    const view = render(<PrivateOwnerBoundary expectedUserId="owner-a"><Profile language="fr" /></PrivateOwnerBoundary>);
    await auth(); await tick();
    const signal = mocks.fetch.mock.calls[0][1].signal;
    view.rerender(<PrivateOwnerBoundary expectedUserId="owner-a"><Profile language="pt" /></PrivateOwnerBoundary>);
    await tick(); expect(signal.aborted).toBe(true);
    expect(screen.getByText("4")).toBeTruthy();
    await act(async () => old.resolve(response({ progress: { platinumMedalCount: 12 } })));
    expect(screen.getByText("4")).toBeTruthy();
  });
});

describe("localized finite owner recovery", () => {
  test.each([
    ["es", "Volver a comprobar", "Iniciar sesión"], ["en", "Check again", "Sign in"],
    ["fr", "Vérifier à nouveau", "Se connecter"], ["pt", "Verificar novamente", "Entrar"],
  ])("%s exposes a named recovery control without revealing the private child", async (language, retry, login) => {
    mocks.language = language;
    render(<PrivateOwnerBoundary expectedUserId="owner-a"><p>Private synthetic frame</p></PrivateOwnerBoundary>);
    await tick(15000);
    const button = screen.getByRole("button", { name: retry });
    expect(button.className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: login })).toBeTruthy();
    expect(screen.queryByText("Private synthetic frame")).toBeNull();
    fireEvent.click(button);
    await auth();
    expect(screen.getByText("Private synthetic frame")).toBeTruthy();
  });
});
