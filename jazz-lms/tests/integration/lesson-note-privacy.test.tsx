// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LessonNotesEditor } from '@/components/dashboard/lesson-notes-editor';
import { DashboardNotesNavPanel } from '@/components/layout/dashboard-notes-nav-panel';
import { lessonNoteDraftKeys, readLessonNoteDraft, writeLessonNoteDraft } from '@/lib/lesson-note-drafts';

type Session = { user: { id: string } } | null;
const mocks = vi.hoisted(() => ({
  authCallbacks: new Set<(event: string, session: Session) => void>(),
  initialOwner: 'buyer' as string | null,
  resolveInitialSession: true,
  fetch: vi.fn(),
  t: (_key: string, fallback: string) => fallback,
}));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (callback: (event: string, session: Session) => void) => {
    mocks.authCallbacks.add(callback);
    if (mocks.resolveInitialSession) queueMicrotask(() => {
      if (mocks.authCallbacks.has(callback)) callback('INITIAL_SESSION', mocks.initialOwner ? { user: { id: mocks.initialOwner } } : null);
    });
    return { data: { subscription: { unsubscribe: () => mocks.authCallbacks.delete(callback) } } };
  },
} }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/providers/dashboard-preferences-provider', () => ({ useDashboardPreferences: () => ({ language: 'en', t: mocks.t }) }));
vi.mock('@/components/course/pdf-workspace-viewer', () => ({ PdfWorkspaceViewer: () => null }));

const props = { currentUserId: 'buyer', courseId: 'course', lessonId: 'lesson-1', classLabel: 'Class 1', lessonTitle: 'Lesson' };
const response = (note: unknown) => ({ ok: true, json: async () => ({ note }) });
const serverNote = (userId = 'buyer', lessonId = 'lesson-1', content = 'Saved own note') => ({
  userId, courseId: 'course', lessonId, content, isBold: true, isItalic: false, fontSize: 14,
});
const puts = () => mocks.fetch.mock.calls.filter(([, init]) => init?.method === 'PUT');
async function tick(ms = 0) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
function authChange(session: Session) {
  act(() => { for (const callback of mocks.authCallbacks) callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session); });
}

describe('note drafts cannot cross account or lesson boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.authCallbacks.clear();
    mocks.initialOwner = 'buyer';
    mocks.resolveInitialSession = true;
    window.localStorage.clear();
    vi.stubGlobal('fetch', mocks.fetch);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 1));
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
    mocks.fetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).split('?')[0] === '/api/dashboard/courses-progress') return { ok: true, json: async () => ({ courses: [{
        id: 'course', videos: [{ lessonId: 'lesson-1', title: 'One' }, { lessonId: 'lesson-2', title: 'Two' }],
      }] }) };
      if (init?.method === 'PUT') return { ok: true, json: async () => ({ ok: true }) };
      return response(null);
    });
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  test.each(['buyer', 'free'])('delayed initial session (%s) mounts no draft surface before actor resolution', async (resolvedOwner) => {
    mocks.resolveInitialSession = false;
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Buyer owned plaintext');
    const reads = vi.spyOn(Storage.prototype, 'getItem');
    try {
      render(<LessonNotesEditor {...props} />);
      await tick(1000);
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
      expect(reads).not.toHaveBeenCalled();
      expect(mocks.fetch).not.toHaveBeenCalled();
      act(() => { for (const callback of mocks.authCallbacks) callback('INITIAL_SESSION', { user: { id: resolvedOwner } }); });
      await tick(1000);
      if (resolvedOwner === 'buyer') {
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Buyer owned plaintext');
        expect(mocks.fetch).toHaveBeenCalledTimes(1);
      } else {
        expect(screen.queryByRole('textbox')).toBeNull();
        expect(reads).not.toHaveBeenCalled();
        expect(mocks.fetch).not.toHaveBeenCalled();
      }
      expect(puts()).toHaveLength(0);
    } finally { reads.mockRestore(); }
  });

  test('sidebar waits for initial session and never opens a cached previous actor surface', async () => {
    mocks.resolveInitialSession = false;
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Buyer local note');
    const reads = vi.spyOn(Storage.prototype, 'getItem');
    try {
      render(<DashboardNotesNavPanel currentUserId="buyer" />);
      await tick(1000);
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(reads).not.toHaveBeenCalled();
      authChange({ user: { id: 'free' } });
      await tick(1000);
      expect(screen.queryByRole('textbox')).toBeNull();
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(reads).not.toHaveBeenCalled();
    } finally { reads.mockRestore(); }
  });

  test('a new account ignores/removes ambiguous old plaintext and never saves hydration', async () => {
    window.localStorage.setItem('lesson-notes:course:lesson-1', 'Previous account plaintext');
    window.localStorage.setItem('lesson-notes-style:course:lesson-1', JSON.stringify({ isBold: true, fontSize: 14 }));
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Owned buyer draft');
    mocks.initialOwner = 'free';
    render(<LessonNotesEditor {...props} currentUserId="free" />);
    await tick(1000);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(window.localStorage.getItem('lesson-notes:course:lesson-1')).toBeNull();
    expect(window.localStorage.getItem('lesson-notes-style:course:lesson-1')).toBeNull();
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').content).toBe('Owned buyer draft');
    expect(puts()).toHaveLength(0);
  });

  test('server notes win over owned drafts without being rewritten on load', async () => {
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Older own draft', undefined, { isDirty: false });
    mocks.fetch.mockResolvedValue(response(serverNote()));
    render(<LessonNotesEditor {...props} />);
    await tick(1000);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Saved own note');
    expect(textarea.style.fontWeight).toBe('700');
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').content).toBe('Saved own note');
    expect(puts()).toHaveLength(0);
    expect(new URL(mocks.fetch.mock.calls[0][0], 'https://app.example.test').searchParams.get('expectedUserId')).toBe('buyer');
  });

  test('only explicit edits save, with the validated actor in the PUT and draft namespace', async () => {
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Owned draft');
    render(<LessonNotesEditor {...props} />);
    await tick(500);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Owned draft');
    expect(puts()).toHaveLength(0);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Explicit edit' } });
    await tick(450);
    expect(puts()).toHaveLength(1);
    expect(JSON.parse(puts()[0][1].body)).toEqual({ expectedUserId: 'buyer', courseId: 'course', lessonId: 'lesson-1', content: 'Explicit edit', isBold: false, isItalic: false, fontSize: 13 });
    expect(window.localStorage.getItem(lessonNoteDraftKeys('buyer', 'course', 'lesson-1').content)).toBe('Explicit edit');
    expect(readLessonNoteDraft('free', 'course', 'lesson-1').content).toBe('');
  });

  test.each(['account', 'lesson'])('changing %s cancels a pending autosave and resets visible content', async (scope) => {
    const view = render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Buyer edit pending' } });
    view.rerender(<LessonNotesEditor {...props} currentUserId={scope === 'account' ? 'free' : 'buyer'} lessonId={scope === 'lesson' ? 'lesson-2' : 'lesson-1'} />);
    if (scope === 'account') authChange({ user: { id: 'free' } });
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    await tick(1000);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(puts()).toHaveLength(0);
  });

  test('an old delayed GET cannot hydrate a newly selected account', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    mocks.fetch.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const view = render(<LessonNotesEditor {...props} />);
    await tick();
    const oldSignal = mocks.fetch.mock.calls[0][1].signal as AbortSignal;
    view.rerender(<LessonNotesEditor {...props} currentUserId="free" />);
    authChange({ user: { id: 'free' } });
    await tick();
    expect(oldSignal.aborted).toBe(true);
    await act(async () => finish(response(serverNote('buyer', 'lesson-1', 'Delayed buyer note'))));
    await tick(1000);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    expect(puts()).toHaveLength(0);
  });

  test.each([null, { user: { id: 'free' } }])('an auth change hides old notes and cancels pending saves: %j', async (session) => {
    render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Pending buyer edit' } });
    authChange(session);
    await tick(1000);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(puts()).toHaveLength(0);
  });

  test('an in-flight save is aborted on account change and keeps its original expected actor', async () => {
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => init?.method === 'PUT' ? new Promise(() => {}) : response(null));
    const view = render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Buyer edit' } });
    await tick(450);
    const [, init] = puts()[0];
    view.rerender(<LessonNotesEditor {...props} currentUserId="free" />);
    expect(init.signal.aborted).toBe(true);
    expect(JSON.parse(init.body).expectedUserId).toBe('buyer');
  });

  test.each([401, 409])('a server identity rejection (%s) hides an owned draft without needing an auth event', async (status) => {
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Buyer draft');
    mocks.fetch.mockResolvedValue({ status, ok: false, json: async () => ({ error: 'Session changed' }) });
    render(<LessonNotesEditor {...props} />);
    await tick(1000);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(puts()).toHaveLength(0);
  });

  test('a save rejected after a session change hides old editor content', async () => {
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => init?.method === 'PUT'
      ? { status: 409, ok: false, json: async () => ({ error: 'Session changed' }) } : response(serverNote()));
    render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed actor pending' } });
    await tick(450);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test.each([403, 500, 'network'])('failed save (%s) warns without promising storage, keeps owned content, and does not retry', async (failure) => {
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return response(serverNote());
      if (failure === 'network') throw new Error('Network unavailable');
      return { status: failure, ok: false, json: async () => ({ error: 'Save failed' }) };
    });
    render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsynced own edit' } });
    await tick(450);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Unsynced own edit');
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').content).toBe('Unsynced own edit');
    expect(screen.getByRole('status').textContent).toMatch(/not been saved to your account/);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Another local edit' } });
    await tick(1000);
    expect(puts()).toHaveLength(1);
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').content).toBe('Another local edit');
  });

  test('a failed save with blocked localStorage preserves visible text and warns to copy before reconnecting', async () => {
    const storage = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Storage blocked'); });
    try {
      mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') throw new Error('Network unavailable');
        return response(serverNote());
      });
      render(<LessonNotesEditor {...props} />);
      await tick();
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep this unsaved text' } });
      await tick(450);
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Keep this unsaved text');
      expect(screen.getByRole('status').textContent).toMatch(/Keep this page open and copy your notes/);
      await tick(1000);
      expect(puts()).toHaveLength(1);
    } finally { storage.mockRestore(); }
  });

  test('failed PUT survives reload over an older server note and requires explicit retry before becoming clean', async () => {
    let saved = serverNote('buyer', 'lesson-1', 'Older server note');
    let failSave = true;
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method !== 'PUT') return response(saved);
      if (failSave) return { status: 500, ok: false };
      saved = { ...saved, ...JSON.parse(init.body as string) };
      return { status: 200, ok: true };
    });
    const first = render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New owned unsynced draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    await tick(450);
    expect(puts()).toHaveLength(1);
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').isDirty).toBe(true);
    first.unmount();

    const reloaded = render(<LessonNotesEditor {...props} />);
    await tick(1000);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('New owned unsynced draft');
    expect(textarea.style.fontStyle).toBe('italic');
    expect(puts()).toHaveLength(1);
    expect(saved.content).toBe('Older server note');
    failSave = false;
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await tick();
    expect(puts()).toHaveLength(2);
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').isDirty).toBe(false);
    expect(saved.content).toBe('New owned unsynced draft');
    expect(saved.isItalic).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    reloaded.unmount();

    render(<LessonNotesEditor {...props} />);
    await tick(1000);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('New owned unsynced draft');
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(puts()).toHaveLength(2);
  });

  test('an aborted successful response cannot acknowledge a newer owned edit', async () => {
    let finish!: (value: { status: number; ok: boolean }) => void;
    mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => init?.method === 'PUT'
      ? new Promise((resolve) => { finish = resolve; }) : response(null));
    render(<LessonNotesEditor {...props} />);
    await tick();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'First edit' } });
    await tick(450);
    const oldSignal = puts()[0][1].signal as AbortSignal;
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Newer edit' } });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => finish({ status: 200, ok: true }));
    const draft = readLessonNoteDraft('buyer', 'course', 'lesson-1');
    expect(draft.content).toBe('Newer edit');
    expect(draft.isDirty).toBe(true);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Newer edit');
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDefined();
  });

  test('an editor save cannot acknowledge a newer local-only sidebar draft', async () => {
    let finish!: (value: { status: number; ok: boolean }) => void;
    mocks.fetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).split('?')[0] === '/api/dashboard/courses-progress') return { ok: true, json: async () => ({ courses: [{ id: 'course', videos: [{ lessonId: 'lesson-1', title: 'One' }] }] }) };
      return init?.method === 'PUT' ? new Promise((resolve) => { finish = resolve; }) : response(serverNote());
    });
    const surfaces = render(<><LessonNotesEditor {...props} /><DashboardNotesNavPanel currentUserId="buyer" /></>);
    await tick();
    await tick(350);
    await tick(5);
    fireEvent.change(screen.getByRole('textbox', { name: 'My notes' }), { target: { value: 'Editor snapshot' } });
    await tick(450);
    fireEvent.change(screen.getByRole('textbox', { name: 'Write notes for selected class...' }), { target: { value: 'New sidebar draft' } });
    await act(async () => finish({ status: 200, ok: true }));
    const draft = readLessonNoteDraft('buyer', 'course', 'lesson-1');
    expect(draft.content).toBe('New sidebar draft');
    expect(draft.isDirty).toBe(true);
    surfaces.unmount();
    render(<LessonNotesEditor {...props} />);
    await tick(1000);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('New sidebar draft');
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDefined();
    expect(puts()).toHaveLength(1);
  });

  test('an owned sidebar edit made during GET wins over the delayed older server snapshot', async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    mocks.fetch.mockImplementation(async (url: string) => {
      if (String(url).split('?')[0] === '/api/dashboard/courses-progress') return { ok: true, json: async () => ({ courses: [{ id: 'course', videos: [{ lessonId: 'lesson-1', title: 'One' }] }] }) };
      return new Promise((resolve) => { finish = resolve; });
    });
    render(<><LessonNotesEditor {...props} /><DashboardNotesNavPanel currentUserId="buyer" /></>);
    await tick();
    await tick(350);
    await tick(5);
    fireEvent.change(screen.getByRole('textbox', { name: 'Write notes for selected class...' }), { target: { value: 'Sidebar edit during load' } });
    await act(async () => finish(response(serverNote())));
    await tick(1000);
    expect((screen.getByRole('textbox', { name: 'My notes' }) as HTMLTextAreaElement).value).toBe('Sidebar edit during load');
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').isDirty).toBe(true);
    expect(puts()).toHaveLength(0);
  });

  test('unavailable localStorage does not prevent loading or saving an own server note', async () => {
    const storage = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Storage blocked'); });
    try {
      mocks.fetch.mockResolvedValue(response(serverNote()));
      render(<LessonNotesEditor {...props} />);
      await tick();
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Saved own note');
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Server edit' } });
      await tick(450);
      expect(JSON.parse(puts()[0][1].body).content).toBe('Server edit');
    } finally { storage.mockRestore(); }
  });

  test.each(['mismatched owner', 'forbidden', 'network failure'])('%s note response never authorizes a local draft to autosave', async (failure) => {
    mocks.initialOwner = 'free';
    writeLessonNoteDraft('free', 'course', 'lesson-1', 'Free owned draft');
    if (failure === 'network failure') mocks.fetch.mockRejectedValue(new Error('Unavailable'));
    else mocks.fetch.mockResolvedValue(failure === 'forbidden' ? { ok: false, json: async () => ({ error: 'Forbidden' }) } : response(serverNote('buyer')));
    render(<LessonNotesEditor {...props} currentUserId="free" />);
    await tick();
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Free owned draft');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Local-only edit' } });
    await tick(1000);
    expect(puts()).toHaveLength(0);
    expect(readLessonNoteDraft('free', 'course', 'lesson-1').content).toBe('Local-only edit');
  });

  test('sidebar drafts reset on account/lesson changes and remain local only', async () => {
    window.localStorage.setItem('lesson-notes:course:lesson-1', 'Ambiguous old draft');
    writeLessonNoteDraft('buyer', 'course', 'lesson-1', 'Buyer local one');
    writeLessonNoteDraft('buyer', 'course', 'lesson-2', 'Buyer local two');
    const view = render(<DashboardNotesNavPanel currentUserId="buyer" />);
    await tick();
    await tick(350);
    await tick(5);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Buyer local one');
    fireEvent.click(screen.getByRole('button', { name: /Class 2/ }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Buyer local two');
    view.rerender(<DashboardNotesNavPanel currentUserId="free" />);
    expect(screen.queryByRole('textbox')).toBeNull();
    authChange({ user: { id: 'free' } });
    await tick(350);
    await tick(5);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Free local draft' } });
    expect(readLessonNoteDraft('free', 'course', 'lesson-1').content).toBe('Free local draft');
    expect(readLessonNoteDraft('buyer', 'course', 'lesson-1').content).toBe('Buyer local one');
    expect(puts()).toHaveLength(0);
    authChange(null);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('sidebar progress request carries its verified owner hint before opening the owned draft', async () => {
    render(<DashboardNotesNavPanel currentUserId="buyer" />);
    await tick();
    await tick(1000);
    await tick(5);
    const request = mocks.fetch.mock.calls.find(([url]) => String(url).startsWith('/api/dashboard/courses-progress'))!;
    expect(new URL(request[0], 'https://synthetic.example').searchParams.getAll('expectedUserId')).toEqual(['buyer']);
    expect(request[1].signal).toBeInstanceOf(AbortSignal);
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(puts()).toHaveLength(0);
  });

  test('late courses-progress JSON cannot reopen a retired sidebar draft surface', async () => {
    let finish!: (value: unknown) => void;
    const json = vi.fn(() => new Promise((yes) => { finish = yes; }));
    mocks.fetch.mockResolvedValue({ ok: true, json });
    render(<DashboardNotesNavPanel currentUserId="buyer" />);
    await tick();
    await tick(1000);
    expect(json).toHaveBeenCalledOnce();
    const signal = mocks.fetch.mock.calls[0][1].signal as AbortSignal;
    authChange(null);
    expect(signal.aborted).toBe(true);
    await act(async () => finish({ courses: [{ id: 'course', videos: [{ lessonId: 'lesson-1', title: 'Old private lesson' }] }] }));
    await tick(10);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Open notes editor' })).toBeNull();
    expect(puts()).toHaveLength(0);
  });
});
