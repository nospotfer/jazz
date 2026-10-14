// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CourseViewClient } from "@/components/course/course-view-client";
import { CourseEnrollButton } from "@/components/course/course-enroll-button";
import { DashboardPaywallWrapper } from "@/components/dashboard/dashboard-paywall-wrapper";

const mocks = vi.hoisted(() => ({
  post: vi.fn(), assign: vi.fn(), toast: vi.fn(),
  listeners: new Set<(event: string, session: unknown) => void>(),
}));
vi.mock("axios", () => ({ default: { post: mocks.post, isAxiosError: () => true } }));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/my-courses", useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/providers/dashboard-preferences-provider", () => ({ useDashboardPreferences: () => ({ language: "en", t: (_key: string, fallback: string) => fallback }) }));
vi.mock("@/components/providers/language-provider", () => ({ useLanguage: () => ({ language: "en" }) }));
vi.mock("@/lib/payment-modal-loader", () => ({ warmPaymentMethodModal: vi.fn(), loadPaymentMethodModal: vi.fn() }));
vi.mock("next/dynamic", () => ({ default: () => ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) => isOpen ? <button onClick={onConfirm}>Confirm synthetic checkout</button> : null }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    mocks.listeners.add(listener);
    listener("INITIAL_SESSION", { user: { id: "owner-a" } });
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  },
} }) }));

const result = { data: { url: "https://checkout.synthetic.example/owned" } };
let finish: Array<() => void>;
function deferred() {
  let resolve!: (value: typeof result) => void;
  let reject!: (value: unknown) => void;
  const promise = new Promise<typeof result>((yes, no) => { resolve = yes; reject = no; });
  finish.push(() => resolve(result));
  return { promise, resolve, reject };
}
function owner(event: string, id: string | null) {
  for (const listener of [...mocks.listeners]) listener(event, id ? { user: { id } } : null);
}
async function start(kind: "enroll" | "paywall" | "course-view") {
  const view = kind === "enroll" ? render(<CourseEnrollButton courseId="synthetic-course" price={0} />)
    : kind === "course-view" ? render(<CourseViewClient userName="Synthetic Alpha" hasPurchased={false} coursePrice={29.99} courseId="synthetic-course" lessonRoutesByTitle={{}} lessonRoutesInOrder={[]} lessonIdsInOrder={[]} lessonTitlesInOrder={[]} />)
    : render(<DashboardPaywallWrapper courseId="synthetic-course" hasPaidCourse={false}><p>Synthetic child</p></DashboardPaywallWrapper>);
  fireEvent.click(screen.getAllByRole("button", { name: kind === "enroll" ? "Enroll for free" : kind === "course-view" ? /Buy full course/ : "Apply voucher and continue" })[0]);
  if (kind !== "enroll") fireEvent.click(screen.getByRole("button", { name: "Confirm synthetic checkout" }));
  await act(async () => { await Promise.resolve(); });
  expect(mocks.post).toHaveBeenCalledOnce();
  expect(mocks.post.mock.calls[0][0]).toBe("/api/checkout");
  expect(mocks.post.mock.calls[0][1].courseId).toBe("synthetic-course");
  return view;
}
beforeEach(() => {
  vi.resetAllMocks(); finish = []; mocks.listeners.clear();
  // Preserve the actual DOM window; only the navigation sink is closed.
  const actualWindow = window;
  const location = new Proxy({}, { get: (target, property) => property === "assign" ? mocks.assign : Reflect.get(actualWindow.location, property, actualWindow.location) });
  vi.stubGlobal("window", new Proxy(actualWindow, { get: (target, property) => property === "location" ? location : Reflect.get(target, property, target) }));
});
afterEach(async () => {
  cleanup(); await act(async () => { for (const done of finish) done(); });
  mocks.listeners.clear(); vi.unstubAllGlobals();
});

describe.each(["enroll", "paywall", "course-view"] as const)("%s checkout async ownership", (kind) => {
  test("matching owner can follow the current successful checkout exactly once", async () => {
    const pending = deferred(); mocks.post.mockReturnValue(pending.promise);
    await start(kind);
    await act(async () => pending.resolve(result));
    expect(mocks.assign).toHaveBeenCalledExactlyOnceWith(result.data.url);
  });
  test.each(["SIGNED_IN", "SIGNED_OUT"])("retired owner after %s cannot follow a late checkout response", async (event) => {
    const pending = deferred(); mocks.post.mockReturnValue(pending.promise);
    await start(kind);
    await act(async () => owner(event, event === "SIGNED_OUT" ? null : "owner-b"));
    await act(async () => pending.resolve(result));
    expect(mocks.assign).not.toHaveBeenCalled();
  });
  test("unmounted frame cannot follow a late checkout response", async () => {
    const pending = deferred(); mocks.post.mockReturnValue(pending.promise);
    const view = await start(kind); view.unmount();
    await act(async () => pending.resolve(result));
    expect(mocks.assign).not.toHaveBeenCalled();
  });
  test("retired owner cannot surface a late checkout error", async () => {
    const pending = deferred(); mocks.post.mockReturnValue(pending.promise);
    await start(kind);
    await act(async () => owner("SIGNED_OUT", null));
    await act(async () => pending.reject({ response: { data: "Synthetic old-owner checkout failure" } }));
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(screen.queryByText("Synthetic old-owner checkout failure")).toBeNull();
  });
});
