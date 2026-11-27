import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { LANGUAGE_COOKIE_KEY } from '@/lib/language';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), getSession: vi.fn(), findUser: vi.fn(), findPurchase: vi.fn(),
  findPurchases: vi.fn(), findProgress: vi.fn(), findCourses: vi.fn(), translations: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (key: string) =>
  key === LANGUAGE_COOKIE_KEY ? { value: 'fr' } : undefined }) }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: {
  getUser: mocks.getUser, getSession: mocks.getSession,
} }) }));
vi.mock('@/lib/db', () => ({ db: {
  user: { findUnique: mocks.findUser },
  purchase: { findFirst: mocks.findPurchase, findMany: mocks.findPurchases },
  userProgress: { findMany: mocks.findProgress },
  course: { findMany: mocks.findCourses },
} }));
vi.mock('@/lib/course-translations', () => ({
  getCourseTranslationBundle: mocks.translations,
  resolveCourseText: (_translations: unknown, _id: string, title: string) => ({ title }),
  resolveLessonTitle: (_translations: unknown, _id: string, title: string) => title,
}));

const verifiedUser = { id: 'verified-owner-b', email: 'verified-b@example.test' };
const effects = [mocks.findUser, mocks.findPurchase, mocks.findPurchases,
  mocks.findProgress, mocks.findCourses, mocks.translations];

function requestFor(hint?: string, duplicate = false) {
  const url = new URL('https://app.example.test/api/dashboard/courses-progress');
  if (hint !== undefined) url.searchParams.set('expectedUserId', hint);
  if (duplicate) url.searchParams.append('expectedUserId', 'stale-owner-a');
  return new Request(url);
}

async function invoke(request: Request) {
  const route = await import('@/app/api/dashboard/courses-progress/route');
  return route.GET(request);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PROFESSOR_EMAIL', 'fixture-professor@example.test');
  mocks.getUser.mockResolvedValue({ data: { user: verifiedUser }, error: null });
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'stale-owner-a' } } } });
  mocks.findUser.mockResolvedValue({ role: 'USER' });
  mocks.findPurchase.mockResolvedValue({ id: 'fixture-purchase' });
  mocks.findPurchases.mockResolvedValue([{ course: {
    id: 'fixture-course', title: 'Fixture course', description: null,
    chapters: [{ id: 'fixture-chapter', lessons: [{ id: 'fixture-lesson', title: 'Fixture lesson', position: 1 }] }],
  } }]);
  mocks.findProgress.mockResolvedValue([{ lessonId: 'fixture-lesson', isCompleted: false, progressPercent: 65 }]);
  mocks.findCourses.mockResolvedValue([]);
  mocks.translations.mockResolvedValue({ courses: {}, chapters: {}, lessons: {} });
});
afterAll(() => vi.unstubAllEnvs());

describe('courses progress expected owner consistency', () => {
  test.each(['stale-owner-a', '', '   '])('rejects wrong or blank intent %j before private reads', async (hint) => {
    const response = await invoke(requestFor(hint));
    expect({ status: response.status, privateReads: effects.some((effect) => effect.mock.calls.length > 0),
      progressActor: mocks.findProgress.mock.calls[0]?.[0]?.where?.userId ?? null })
      .toEqual({ status: 409, privateReads: false, progressActor: null });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test('rejects duplicate intent before private reads', async () => {
    const response = await invoke(requestFor(verifiedUser.id, true));
    expect(response.status).toBe(409);
    expect(effects.some((effect) => effect.mock.calls.length > 0)).toBe(false);
  });

  test.each([undefined, verifiedUser.id])('preserves no hint or matching hint %j and verified identity/language', async (hint) => {
    const response = await invoke(requestFor(hint));
    expect(response.status).toBe(200);
    expect(mocks.findProgress).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: verifiedUser.id } }));
    expect(mocks.findPurchases).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: verifiedUser.id } }));
    expect(mocks.translations).toHaveBeenCalledWith(expect.objectContaining({ language: 'fr' }));
    expect(await response.json()).toEqual({ courses: [{ id: 'fixture-course', title: 'Fixture course',
      videos: [{ lessonId: 'fixture-lesson', title: 'Fixture lesson', progressPercent: 65, courseId: 'fixture-course' }] }] });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test('unauthenticated remains401 before intent or private reads', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await invoke(requestFor('stale-owner-a'));
    expect(response.status).toBe(401);
    expect(effects.some((effect) => effect.mock.calls.length > 0)).toBe(false);
  });
});
