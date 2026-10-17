import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), access: vi.fn(), findFirst: vi.fn(), upsert: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/db', () => ({ db: { lessonNote: { findFirst: mocks.findFirst, upsert: mocks.upsert } } }));
vi.mock('@/lib/lesson-notes', () => ({
  getLessonNotesAccess: mocks.access,
  LessonNotesAccessError: class extends Error { statusCode = 403; },
}));

import { GET, PUT } from '@/app/api/dashboard/notes/route';

function get(expectedUserId?: string, userId?: string) {
  const query = new URLSearchParams({ courseId: 'course', lessonId: 'lesson' });
  if (expectedUserId !== undefined) query.set('expectedUserId', expectedUserId);
  if (userId !== undefined) query.set('userId', userId);
  return GET(new NextRequest(`https://app.example.test/api/dashboard/notes?${query}`));
}
function put(extra: Record<string, unknown> = {}) {
  return PUT(new NextRequest('https://app.example.test/api/dashboard/notes', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: 'course', lessonId: 'lesson', content: 'Own note', ...extra }),
  }));
}
function expectNoDatabaseAccess() {
  expect(mocks.access).not.toHaveBeenCalled();
  expect(mocks.findFirst).not.toHaveBeenCalled();
  expect(mocks.upsert).not.toHaveBeenCalled();
}

describe('lesson note requests bind a stale browser editor to its verified actor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'current-user', email: 'student@example.test' } }, error: null });
    mocks.access.mockResolvedValue({ isPrivileged: false });
    mocks.findFirst.mockResolvedValue(null);
    mocks.upsert.mockImplementation(async (args) => args.create);
  });

  test.each([false, true])('a changed session rejects both reads and saves before any DB access (staff=%s)', async (isPrivileged) => {
    mocks.access.mockResolvedValue({ isPrivileged });
    for (const response of [await get('previous-user'), await put({ expectedUserId: 'previous-user' })]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ error: 'Session changed' });
      expect(response.headers.get('cache-control')).toContain('no-store');
    }
    expectNoDatabaseAccess();
  });

  test.each([null, 123, '', '   ', { id: 'current-user' }])('malformed supplied PUT identity fails before DB access: %j', async (expectedUserId) => {
    expect((await put({ expectedUserId })).status).toBe(400);
    expectNoDatabaseAccess();
  });

  test('an explicitly empty GET identity is invalid rather than legacy omission', async () => {
    expect((await get('')).status).toBe(400);
    expectNoDatabaseAccess();
  });

  test.each([undefined, 'current-user'])('own reads/saves remain compatible with expected identity %s', async (expectedUserId) => {
    expect((await get(expectedUserId)).status).toBe(200);
    expect((await put({ expectedUserId, userId: 'another-user', isBold: true, fontSize: 99 })).status).toBe(200);
    expect(mocks.access).toHaveBeenCalledWith({ userId: 'current-user', userEmail: 'student@example.test', courseId: 'course', lessonId: 'lesson' });
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { userId: 'current-user', courseId: 'course', lessonId: 'lesson' } });
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_lessonId: { userId: 'current-user', lessonId: 'lesson' } },
      create: expect.objectContaining({ userId: 'current-user', content: 'Own note', isBold: true, fontSize: 14 }),
    }));
  });

  test('expected actor is distinct from an authorized staff read target', async () => {
    mocks.access.mockResolvedValue({ isPrivileged: true });
    expect((await get('current-user', 'student-user')).status).toBe(200);
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { userId: 'student-user', courseId: 'course', lessonId: 'lesson' } });
  });

  test('a matching actor still cannot read another student without staff access', async () => {
    expect((await get('current-user', 'another-user')).status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  test.each([null, new Error('Unverified token')])('authentication remains required even when expected identity matches', async (error) => {
    mocks.getUser.mockResolvedValue({ data: { user: error ? { id: 'current-user' } : null }, error });
    expect((await get('current-user')).status).toBe(401);
    expect((await put({ expectedUserId: 'current-user' })).status).toBe(401);
    expectNoDatabaseAccess();
  });
});
