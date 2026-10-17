import { NextRequest } from 'next/server';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { LANGUAGE_COOKIE_KEY } from '@/lib/language';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), getSession: vi.fn(), ensureTables: vi.fn(), query: vi.fn(),
  findUser: vi.fn(), findPurchase: vi.fn(), findPurchases: vi.fn(), findCourses: vi.fn(),
  medals: vi.fn(), profile: vi.fn(), recognition: vi.fn(), access: vi.fn(), upsert: vi.fn(),
}));
vi.mock('react', () => ({ cache: <T>(callback: T) => callback }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: {
  getUser: mocks.getUser, getSession: mocks.getSession,
} }) }));
vi.mock('@/lib/messages-db', () => ({ ensureMessagingTables: mocks.ensureTables }));
vi.mock('@/lib/db', () => ({ db: {
  $queryRawUnsafe: mocks.query,
  user: { findUnique: mocks.findUser },
  purchase: { findFirst: mocks.findPurchase, findMany: mocks.findPurchases },
  course: { findMany: mocks.findCourses },
  userProgress: { upsert: mocks.upsert },
} }));
vi.mock('@/lib/jazz-medal-progress', () => ({
  getUserJazzMedalProgress: mocks.medals,
  getUserJazzMedalProfile: mocks.profile,
  getUserCourseCompletionRecognition: mocks.recognition,
}));
vi.mock('@/lib/lesson-quiz-server', () => ({ assertLessonQuizAccess: mocks.access, isLessonQuizError: () => false }));

const verifiedUser = { id: 'verified-owner-b', email: 'verified-b@example.test' };
const courseId = 'fixture-course';
const lessonId = 'fixture-lesson';
const endpoints = [
  { name: 'unread messages', path: '/api/messages/unread-count', method: 'GET', invoke: async (request: NextRequest) =>
    (await import('@/app/api/messages/unread-count/route')).GET(request) },
  { name: 'PDF count', path: '/api/dashboard/pdf-count', method: 'GET', invoke: async (request: NextRequest) =>
    (await import('@/app/api/dashboard/pdf-count/route')).GET(request) },
  { name: 'quiz medals', path: '/api/dashboard/quiz-medals', method: 'GET', invoke: async (request: NextRequest) =>
    (await import('@/app/api/dashboard/quiz-medals/route')).GET(request) },
  { name: 'medal profile', path: '/api/dashboard/quiz-medals/profile', method: 'GET', invoke: async (request: NextRequest) =>
    (await import('@/app/api/dashboard/quiz-medals/profile/route')).GET(request) },
  { name: 'course recognition', path: '/api/dashboard/course-completion-recognition', method: 'GET', invoke: async (request: NextRequest) =>
    (await import('@/app/api/dashboard/course-completion-recognition/route')).GET(request) },
  { name: 'lesson progress', path: `/api/courses/${courseId}/lessons/${lessonId}/progress`, method: 'PUT', invoke: async (request: NextRequest) =>
    (await import('@/app/api/courses/[courseId]/lessons/[lessonId]/progress/route')).PUT(request, {
      params: Promise.resolve({ courseId, lessonId }),
    }) },
];

function requestFor(endpoint: typeof endpoints[number], hint: string | undefined) {
  const url = new URL(`https://app.example.test${endpoint.path}`);
  url.searchParams.set('language', 'fr');
  if (hint !== undefined) url.searchParams.set('expectedUserId', hint);
  return new NextRequest(url, {
    method: endpoint.method,
    headers: { cookie: `${LANGUAGE_COOKIE_KEY}=fr`, 'content-type': 'application/json' },
    ...(endpoint.method === 'PUT' ? { body: JSON.stringify({ isCompleted: true, progressPercent: 80 }) } : {}),
  });
}

function observed(response: Response) {
  const effects = [mocks.ensureTables, mocks.query, mocks.findUser, mocks.findPurchase,
    mocks.findPurchases, mocks.findCourses, mocks.medals, mocks.profile, mocks.recognition,
    mocks.access, mocks.upsert];
  return {
    status: response.status,
    readsAccessesOrWrites: effects.some((effect) => effect.mock.calls.length > 0),
    progressActor: mocks.upsert.mock.calls[0]?.[0]?.where?.userId_lessonId?.userId ?? null,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PROFESSOR_EMAIL', 'fixture-professor@example.test');
  mocks.getUser.mockResolvedValue({ data: { user: verifiedUser }, error: null });
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'stale-owner-a' } } } });
  mocks.ensureTables.mockResolvedValue(undefined);
  mocks.query.mockResolvedValue([{ count: 3 }]);
  mocks.findUser.mockResolvedValue({ role: 'USER' });
  mocks.findPurchase.mockResolvedValue({ id: 'fixture-purchase' });
  mocks.findPurchases.mockResolvedValue([{ courseId }]);
  mocks.findCourses.mockResolvedValue([]);
  mocks.medals.mockResolvedValue({ platinumMedalCount: 1 });
  mocks.profile.mockResolvedValue({ lessons: [] });
  mocks.recognition.mockResolvedValue({ isEligible: false });
  mocks.access.mockResolvedValue({ id: lessonId });
  mocks.upsert.mockImplementation(async ({ create }) => ({ id: 'fixture-progress', ...create }));
});
afterAll(() => vi.unstubAllEnvs());

describe.each(endpoints)('$name expected owner consistency', (endpoint) => {
  test.each(['stale-owner-a', '', '   '])('rejects stale or blank intent %j before all owner data/access work', async (hint) => {
    const response = await endpoint.invoke(requestFor(endpoint, hint));
    expect(observed(response)).toEqual({ status: 409, readsAccessesOrWrites: false, progressActor: null });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test.each([undefined, verifiedUser.id])('preserves backward-compatible or matching hint %j using verified identity', async (hint) => {
    const response = await endpoint.invoke(requestFor(endpoint, hint));
    expect(response.status).toBe(200);
    expect(observed(response).readsAccessesOrWrites).toBe(true);
    expect(mocks.getSession).not.toHaveBeenCalled();
    if (endpoint.name === 'lesson progress') {
      expect(observed(response).progressActor).toBe(verifiedUser.id);
      expect(mocks.access).toHaveBeenCalledWith({ userId: verifiedUser.id, userEmail: verifiedUser.email,
        courseId, lessonId, allowFreePreview: true });
    } else if (endpoint.name === 'medal profile') {
      expect(mocks.profile).toHaveBeenCalledWith(verifiedUser.id, 'fr', verifiedUser.email);
    } else if (endpoint.name === 'PDF count') {
      expect(mocks.findPurchases).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: verifiedUser.id } }));
      expect(mocks.findCourses.mock.calls[0]?.[0]?.include?.chapters?.include?.lessons?.include?.attachments?.where).toEqual({ language: 'fr' });
    }
  });

  test('authentication failure stays401 before hint checks and owner work', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await endpoint.invoke(requestFor(endpoint, 'stale-owner-a'));
    expect(observed(response)).toEqual({ status: 401, readsAccessesOrWrites: false, progressActor: null });
  });

  test('rejects ambiguous duplicate hints before owner work', async () => {
    const request = requestFor(endpoint, verifiedUser.id);
    const url = new URL(request.url);
    url.searchParams.append('expectedUserId', 'stale-owner-a');
    const duplicate = new NextRequest(url, {
      method: endpoint.method,
      headers: request.headers,
      ...(endpoint.method === 'PUT' ? { body: JSON.stringify({ isCompleted: true }) } : {}),
    });
    expect(observed(await endpoint.invoke(duplicate))).toEqual({ status: 409, readsAccessesOrWrites: false, progressActor: null });
  });
});
