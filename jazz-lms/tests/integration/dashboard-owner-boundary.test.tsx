// @vitest-environment jsdom

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Sidebar } from '@/components/layout/sidebar';
import DashboardLayout from '@/app/dashboard/layout';
import AdminLayout from '@/app/admin/layout';
import { PrivateOwnerBoundary } from '@/components/auth/private-owner-boundary';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type Actor = { id: string; email: string; user_metadata: { full_name: string; avatar_url: string; avatar_mode: 'fixed' } };
type Session = { user: Actor } | null;
type CountResponse = { ok: boolean; status: number; json: () => Promise<{ count: number }> };
const mocks = vi.hoisted(() => {
  const auth = { getUser: vi.fn(), getSession: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn() };
  return {
    client: { auth }, auth,
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
    listeners: new Set<(event: string, session: Session) => void>(),
    fetch: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard', useRouter: () => mocks.router,
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
vi.mock('next/image', () => ({ default: ({ src, alt, width, height, className }: ComponentProps<'img'>) =>
  <img src={src} alt={alt} width={width} height={height} className={className} /> }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a> }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => mocks.client }));
vi.mock('@/hooks/use-user-jazz-medal-progress', () => ({ useUserJazzMedalProgress: () => ({ progress: null }) }));
vi.mock('@/hooks/use-user-course-completion-recognition', () => ({ useUserCourseCompletionRecognition: () => ({ recognition: { isEligible: false } }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en', setLanguage: vi.fn() }) }));
vi.mock('@/lib/server-user', () => ({ getServerUser: async () => actorA }));
vi.mock('@/lib/admin', () => ({ getCurrentUser: async () => ({ id: 'legacy-prisma-id', role: 'COURSE_ADMIN' }), requireAdmin: vi.fn(async () => undefined) }));
vi.mock('@/lib/dashboard-server-data', () => ({
  getFirstPublishedCourseId: async () => 'fixture-course', hasAnyCoursePurchase: async () => true,
  getFirstPublishedCourseSummary: async () => ({ id: 'fixture-course', price: 29.99 }),
}));
vi.mock('@/lib/payment-modal-loader', () => ({ warmPaymentMethodModal: vi.fn(), loadPaymentMethodModal: vi.fn() }));
vi.mock('@/components/providers/dashboard-preferences-provider', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/components/providers/dashboard-preferences-provider')>(),
  useDashboardPreferences: () => ({
  language: 'en',
  t: (key: string, fallback: string) => ({
    profile: 'Profile', notifications: 'Notifications', noNotifications: 'No notifications',
    inboxNewMessageTitle: 'New inbox message', inboxNewMessagePreview: 'Unread inbox activity',
    adminPanel: 'Admin panel', courseNotes: 'Course Notes', unreadMessages: 'Unread messages',
    logOut: 'Log out',
  } as Record<string, string>)[key] ?? fallback,
}) }));

vi.mock('@/components/admin/sidebar', () => ({ AdminSidebar: () => <nav>Admin fixture navigation</nav> }));
vi.mock('@/components/admin/header', () => ({ AdminHeader: () => <header>Admin fixture header</header> }));

const actorA: Actor = { id: 'fixture-owner-a', email: 'alpha-fixture@example.test',
  user_metadata: { full_name: 'Fixture Alpha', avatar_url: '/avatars/jazz-cat-1.svg', avatar_mode: 'fixed' } };
const actorB: Actor = { id: 'fixture-owner-b', email: 'beta-fixture@example.test',
  user_metadata: { full_name: 'Fixture Beta', avatar_url: '/avatars/jazz-saxophone.svg', avatar_mode: 'fixed' } };
let current: Actor | null;
let finishPending: Array<() => void>;
let queues: Map<string, Array<Promise<CountResponse>>>;

function count(count: number): CountResponse { return { ok: true, status: 200, json: async () => ({ count }) }; }
function deferred<T>(fallback: T) {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  finishPending.push(() => resolve(fallback));
  return { promise, resolve };
}
function enqueue(path: string, response: Promise<CountResponse>) {
  queues.set(path, [...(queues.get(path) ?? []), response]);
}
function emit(event: string, actor: Actor | null) {
  current = actor;
  for (const listener of [...mocks.listeners]) listener(event, actor ? { user: actor } : null);
}
async function settle() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }
async function tick(milliseconds = 0) { await act(async () => { vi.advanceTimersByTime(milliseconds); }); await settle(); }
async function auth(event: string, actor: Actor | null) { await act(async () => emit(event, actor)); await settle(); }
async function headerPolling() { await act(async () => { vi.advanceTimersByTime(900); }); await settle(); }
const header = (actor = actorA, admin = false) => <DashboardHeader user={actor} isAdmin={admin} role={admin ? 'COURSE_ADMIN' : 'USER'} />;
function openNotifications() { fireEvent.click(screen.getByRole('button', { name: 'Notifications' })); }
function pdfValues() {
  return screen.queryAllByRole('link', { name: /Course Notes/ }).map((link) => link.textContent);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  mocks.listeners.clear();
  finishPending = [];
  queues = new Map();
  current = actorA;
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  mocks.auth.getSession.mockImplementation(async () => ({ data: { session: current ? { user: current } : null } }));
  mocks.auth.getUser.mockImplementation(async () => ({ data: { user: current }, error: null }));
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.onAuthStateChange.mockImplementation((listener: (event: string, session: Session) => void) => {
    mocks.listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  });
  mocks.fetch.mockImplementation((input: unknown) => {
    if (input === '/api/purchases/auto-reconcile') {
      // The real layout includes this component. Its network is fully closed;
      // zero unlocked rows deliberately cannot trigger an unrelated SSR refresh.
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ unlocked: 0 }) });
    }
    const path = String(input).split('?')[0];
    if (path !== '/api/messages/unread-count' && path !== '/api/dashboard/pdf-count') {
      throw new Error('Unexpected request in closed dashboard fixture');
    }
    return queues.get(path)?.shift() ?? Promise.resolve(count(0));
  });
  vi.stubGlobal('fetch', mocks.fetch);
});

describe('real DashboardLayout and preferences-provider composition', () => {
  const privateChild = <p data-testid="private-ssr-child">Synthetic Alpha protected child</p>;

  test.each(['SIGNED_IN', 'SIGNED_OUT'])('the mounted parent must hide previous SSR children on %s owner change', async (event) => {
    // Execute the actual async server layout with a verified synthetic A user,
    // role and entitlement, then render its real Header/Sidebar/provider/paywall.
    const tree = await DashboardLayout({ children: privateChild });
    render(tree);
    await settle();
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByTestId('private-ssr-child')).toBeTruthy();

    await auth(event, event === 'SIGNED_IN' ? actorB : null);
    expect(screen.queryByTestId('private-ssr-child')).toBeNull();
  });

  test('control: matching initial owner and same-owner token refresh retain legitimate SSR children', async () => {
    render(await DashboardLayout({ children: privateChild }));
    await settle();
    await auth('INITIAL_SESSION', actorA);
    await auth('TOKEN_REFRESHED', actorA);
    expect(screen.getByTestId('private-ssr-child')).toBeTruthy();
  });
});
afterEach(async () => {
  cleanup();
  await act(async () => { for (const finish of finishPending) finish(); });
  await settle();
  mocks.listeners.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('actual DashboardHeader account ownership', () => {
  test('control: the current initial owner keeps its SSR identity, avatar and permitted menu', async () => {
    render(header(actorA, true));
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByRole('img', { name: actorA.user_metadata.full_name }).getAttribute('src')).toBe(actorA.user_metadata.avatar_url);
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    const menu = document.getElementById('dashboard-user-menu')!;
    expect(within(menu).getByText(actorA.email)).toBeTruthy();
    expect(within(menu).getByRole('link', { name: /Admin panel/ })).toBeTruthy();
    expect(mocks.router.refresh).not.toHaveBeenCalled();
  });

  test('an initial client owner differing from SSR cannot retain the previous identity or admin menu', async () => {
    render(header(actorA, true));
    await auth('INITIAL_SESSION', actorB);
    expect(screen.queryAllByText(actorA.email)).toHaveLength(0);
    expect(screen.queryAllByText(actorA.user_metadata.full_name)).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull();
    expect(screen.queryByRole('link', { name: /Admin panel/ })).toBeNull();
  });

  test('a mounted SIGNED_IN owner switch cannot retain the SSR owner identity', async () => {
    render(header(actorA, true));
    await auth('INITIAL_SESSION', actorA);
    await auth('SIGNED_IN', actorB);
    expect(screen.queryAllByText(actorA.email)).toHaveLength(0);
    expect(screen.queryAllByText(actorA.user_metadata.full_name)).toHaveLength(0);
  });

  test('a mounted sign-out clears the old identity and closes its privileged menu', async () => {
    render(header(actorA, true));
    await auth('INITIAL_SESSION', actorA);
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByRole('link', { name: /Admin panel/ })).toBeTruthy();
    await auth('SIGNED_OUT', null);
    expect(screen.queryAllByText(actorA.email)).toHaveLength(0);
    expect(screen.queryByRole('link', { name: /Admin panel/ })).toBeNull();
  });

  test('an old avatar response cannot overwrite B even after SSR props rerender to B', async () => {
    const oldProfile = deferred({ data: { user: actorA }, error: null });
    mocks.auth.getUser.mockReturnValueOnce(oldProfile.promise)
      .mockResolvedValue({ data: { user: actorB }, error: null });
    const view = render(header(actorA));
    await auth('INITIAL_SESSION', actorA);
    await auth('SIGNED_IN', actorB);
    view.rerender(header(actorB));
    await settle();
    expect(screen.getByRole('img', { name: actorB.user_metadata.full_name }).getAttribute('src')).toBe(actorB.user_metadata.avatar_url);

    await act(async () => oldProfile.resolve({ data: { user: actorA }, error: null }));
    expect(screen.getByRole('img', { name: actorB.user_metadata.full_name }).getAttribute('src')).toBe(actorB.user_metadata.avatar_url);
  });

  test('an unread response ignored by abort cannot recreate A notifications after sign-out', async () => {
    const oldUnread = deferred(count(5));
    enqueue('/api/messages/unread-count', oldUnread.promise);
    render(header());
    await auth('INITIAL_SESSION', actorA);
    await headerPolling();
    expect(mocks.fetch).toHaveBeenCalledOnce();
    const signal = mocks.fetch.mock.calls[0][1].signal;
    await auth('SIGNED_OUT', null);
    expect(signal.aborted).toBe(true);
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();

    await act(async () => oldUnread.resolve(count(5)));
    expect(screen.queryByText('New inbox message')).toBeNull();
  });

  test('an old unread response cannot replace the current owner zero-notification result', async () => {
    const oldUnread = deferred(count(5));
    enqueue('/api/messages/unread-count', oldUnread.promise);
    enqueue('/api/messages/unread-count', Promise.resolve(count(0)));
    const view = render(header());
    await auth('INITIAL_SESSION', actorA);
    await headerPolling();
    const oldSignal = mocks.fetch.mock.calls[0][1].signal;
    await auth('SIGNED_IN', actorB);
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull();
    view.rerender(header(actorB));
    await headerPolling();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(oldSignal.aborted).toBe(true);
    openNotifications();
    expect(screen.getByText('No notifications')).toBeTruthy();

    await act(async () => oldUnread.resolve(count(5)));
    expect(screen.queryByText('New inbox message')).toBeNull();
  });

  test('control: same-owner token refresh preserves identity and can show current unread activity', async () => {
    enqueue('/api/messages/unread-count', Promise.resolve(count(2)));
    render(header());
    await auth('INITIAL_SESSION', actorA);
    await auth('TOKEN_REFRESHED', actorA);
    await headerPolling();
    openNotifications();
    expect(screen.getByText('New inbox message')).toBeTruthy();
    expect(screen.getByRole('img', { name: actorA.user_metadata.full_name }).getAttribute('src')).toBe(actorA.user_metadata.avatar_url);
    expect(screen.getByText(actorA.email)).toBeTruthy();
  });
});

describe('actual Sidebar counter ownership', () => {
  test('control: the current owner loads its PDF count without creating unread activity', async () => {
    enqueue('/api/dashboard/pdf-count', Promise.resolve(count(12)));
    render(<Sidebar currentUserId={actorA.id} />);
    await settle();
    await auth('INITIAL_SESSION', actorA);
    await tick();
    expect(pdfValues()).toEqual(['Course Notes12', 'Course Notes12']);
    expect(screen.queryAllByLabelText('Unread messages')).toHaveLength(0);
  });

  test('an initial client owner mismatch cannot retain counts fetched for the SSR owner cookie', async () => {
    // The new SDK owner may be B while the old server cookie is still A.
    current = actorB;
    enqueue('/api/dashboard/pdf-count', Promise.resolve(count(12)));
    render(<Sidebar currentUserId={actorA.id} />);
    await settle();
    await auth('INITIAL_SESSION', actorB);
    expect(pdfValues().every((value) => !value?.includes('12'))).toBe(true);
  });

  test('an old PDF response cannot restore A counter after mounted sign-out', async () => {
    const oldPdf = deferred(count(12));
    enqueue('/api/dashboard/pdf-count', oldPdf.promise);
    render(<Sidebar currentUserId={actorA.id} />);
    await settle();
    await auth('INITIAL_SESSION', actorA);
    await tick();
    const signal = mocks.fetch.mock.calls.find(([path]) => String(path).startsWith('/api/dashboard/pdf-count'))![1].signal;
    await auth('SIGNED_OUT', null);
    expect(signal.aborted).toBe(true);
    expect(pdfValues().every((value) => !value?.includes('12'))).toBe(true);

    await act(async () => oldPdf.resolve(count(12)));
    expect(pdfValues().every((value) => !value?.includes('12'))).toBe(true);
  });

  test('an old PDF response cannot overwrite B counter after a mounted owner switch', async () => {
    const oldPdf = deferred(count(12));
    enqueue('/api/dashboard/pdf-count', oldPdf.promise);
    enqueue('/api/dashboard/pdf-count', Promise.resolve(count(4)));
    const view = render(<Sidebar currentUserId={actorA.id} />);
    await auth('INITIAL_SESSION', actorA);
    await tick();
    await auth('SIGNED_IN', actorB);
    expect(pdfValues()).toEqual([]);
    view.rerender(<Sidebar currentUserId={actorB.id} />);
    await tick();
    expect(pdfValues()).toEqual(['Course Notes4', 'Course Notes4']);

    await act(async () => oldPdf.resolve(count(12)));
    expect(pdfValues()).toEqual(['Course Notes4', 'Course Notes4']);
  });

  test('an old unread response cannot restore A activity badges after mounted sign-out', async () => {
    const oldUnread = deferred(count(7));
    enqueue('/api/messages/unread-count', oldUnread.promise);
    render(<Sidebar currentUserId={actorA.id} />);
    await auth('INITIAL_SESSION', actorA);
    await tick();
    await auth('SIGNED_OUT', null);
    expect(screen.queryAllByLabelText('Unread messages')).toHaveLength(0);

    await act(async () => oldUnread.resolve(count(7)));
    expect(screen.queryAllByLabelText('Unread messages')).toHaveLength(0);
  });

  test('control: an absent session does not read protected counts', async () => {
    current = null;
    render(<Sidebar currentUserId={actorA.id} />);
    await settle();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(pdfValues()).toEqual([]);
  });
});

function CounterChild() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Private child {count}</button>;
}
const boundary = (id = actorA.id, children = <CounterChild />) => <PrivateOwnerBoundary expectedUserId={id}>{children}</PrivateOwnerBoundary>;
function marker() { return document.querySelector('[data-private-owner-state]')!; }

describe('shared private owner boundary', () => {
  test('does not render private children until matching INITIAL_SESSION settles', async () => {
    render(boundary());
    expect(screen.queryByText('Private child 0')).toBeNull();
    expect(marker().getAttribute('data-private-owner-state')).toBe('pending');
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByText('Private child 0')).toBeTruthy();
    expect(marker().getAttribute('data-private-owner-state')).toBe('matching');
  });

  test('an initial different SDK owner cannot expose SSR A while refresh sees old cookies', async () => {
    const view = render(boundary());
    await auth('INITIAL_SESSION', actorB);
    expect(screen.queryByText('Private child 0')).toBeNull();
    expect(mocks.router.refresh).toHaveBeenCalledOnce();
    view.rerender(boundary()); // A cookie / late RSC still resolves A.
    await auth('TOKEN_REFRESHED', actorB);
    expect(screen.queryByText('Private child 0')).toBeNull();
    expect(mocks.router.refresh).toHaveBeenCalledOnce();
    view.rerender(boundary(actorB.id));
    expect(screen.getByText('Private child 0')).toBeTruthy();
  });

  test('late INITIAL_SESSION cannot restore A after a newer SIGNED_IN B', async () => {
    const view = render(boundary());
    await auth('SIGNED_IN', actorB);
    await auth('INITIAL_SESSION', actorA);
    expect(screen.queryByText('Private child 0')).toBeNull();
    view.rerender(boundary(actorB.id));
    expect(screen.getByText('Private child 0')).toBeTruthy();
  });

  test('A to B to A in one batch remounts instead of retaining A private state', async () => {
    render(boundary());
    await auth('INITIAL_SESSION', actorA);
    fireEvent.click(screen.getByText('Private child 0'));
    expect(screen.getByText('Private child 1')).toBeTruthy();
    const generation = Number(marker().getAttribute('data-private-owner-generation'));
    await act(async () => { emit('SIGNED_IN', actorB); emit('SIGNED_IN', actorA); });
    expect(screen.getByText('Private child 0')).toBeTruthy();
    expect(Number(marker().getAttribute('data-private-owner-generation'))).toBe(generation + 2);
  });

  test('same-owner token refresh retains current child state and never refreshes the router', async () => {
    render(boundary());
    await auth('INITIAL_SESSION', actorA);
    fireEvent.click(screen.getByText('Private child 0'));
    const generation = marker().getAttribute('data-private-owner-generation');
    await auth('TOKEN_REFRESHED', actorA);
    expect(screen.getByText('Private child 1')).toBeTruthy();
    expect(marker().getAttribute('data-private-owner-generation')).toBe(generation);
    expect(mocks.router.refresh).not.toHaveBeenCalled();
  });

  test('SDK sign-out retires children even when a later stale RSC still names A', async () => {
    const view = render(boundary());
    await auth('INITIAL_SESSION', actorA);
    await auth('SIGNED_OUT', null);
    view.rerender(boundary());
    expect(screen.queryByText('Private child 0')).toBeNull();
    expect(marker().getAttribute('data-private-owner-state')).toBe('signed-out');
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/auth');
  });

  test('unconfigured SDK has finite accessible recovery; retry still needs owner proof', async () => {
    render(boundary());
    await tick(15000);
    expect(marker().getAttribute('data-private-owner-state')).toBe('unavailable');
    expect(screen.getByRole('alert').textContent).toContain('could not check');
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(marker().getAttribute('data-private-owner-state')).toBe('pending');
    expect(screen.queryByText('Private child 0')).toBeNull();
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByText('Private child 0')).toBeTruthy();
  });
});

describe('real AdminLayout private owner scope', () => {
  test.each(['SIGNED_IN', 'SIGNED_OUT'])('admin parent retires verified SSR child on %s', async (event) => {
    render(await AdminLayout({ children: <p data-testid="admin-private-child">Synthetic Alpha admin child</p> }));
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByTestId('admin-private-child')).toBeTruthy();
    await auth(event, event === 'SIGNED_IN' ? actorB : null);
    expect(screen.queryByTestId('admin-private-child')).toBeNull();
  });
  test('uses verified Auth ID rather than the legacy Prisma identity, retaining requireAdmin', async () => {
    const { requireAdmin } = await import('@/lib/admin');
    render(await AdminLayout({ children: <p data-testid="admin-private-child">Synthetic Alpha admin child</p> }));
    expect(requireAdmin).toHaveBeenCalledOnce();
    await auth('INITIAL_SESSION', actorA);
    expect(screen.getByTestId('admin-private-child')).toBeTruthy();
  });
});
