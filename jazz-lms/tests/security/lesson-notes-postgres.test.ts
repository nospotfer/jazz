import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const auth = vi.hoisted(() => ({ user: null as null | { id: string; email: string } }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: auth.user }, error: null }) } }) }));

const testDatabaseUrl = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-notes-${randomUUID()}`;
const buyer = `${prefix}-buyer`;
const student = `${prefix}-student`;
const staff = `${prefix}-staff`;
const courseId = `${prefix}-course`;
const chapterId = `${prefix}-chapter`;
const freeLesson = `${prefix}-free`;
const paidLesson = `${prefix}-paid`;
let database: typeof import('@/lib/db')['db'];
let route: typeof import('@/app/api/dashboard/notes/route');
const identity = (id: string) => ({ id, email: `${id}@example.test` });

describe.skipIf(!testDatabaseUrl)('notes PostgreSQL persistence and access', () => {
  beforeAll(async () => {
    const url = new URL(testDatabaseUrl!);
    if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/jazz_maintenance') {
      throw new Error('Refusing database writes outside isolated loopback jazz_maintenance:55432');
    }
    vi.stubEnv('DATABASE_URL', testDatabaseUrl!);
    vi.stubEnv('ADMIN_OWNER_EMAIL', 'maintenance-owner@example.test');
    vi.stubEnv('PROFESSOR_EMAIL', 'maintenance-professor@example.test');
    database = (await import('@/lib/db')).db;
    route = await import('@/app/api/dashboard/notes/route');
    await database.user.createMany({ data: [
      { ...identity(buyer), role: 'USER' }, { ...identity(student), role: 'USER' }, { ...identity(staff), role: 'COURSE_ADMIN' },
    ] });
    await database.course.create({ data: {
      id: courseId, title: 'Isolated notes course', isPublished: true,
      chapters: { create: { id: chapterId, title: 'Test chapter', position: 1, isPublished: true,
        lessons: { create: [
          { id: freeLesson, title: 'Free lesson', position: 1, isPublished: true },
          { id: paidLesson, title: 'Paid lesson', position: 2, isPublished: true },
        ] },
      } }, purchases: { create: { userId: buyer } },
    } });
  });
  beforeEach(async () => {
    auth.user = identity(buyer);
    await database.lessonNote.deleteMany({ where: { userId: { in: [buyer, student, staff] } } });
    await database.course.update({ where: { id: courseId }, data: { isPublished: true } });
    await database.chapter.update({ where: { id: chapterId }, data: { isPublished: true } });
    await database.lesson.update({ where: { id: paidLesson }, data: { isPublished: true } });
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (database) {
      await database.lessonNote.deleteMany({ where: { userId: { in: [buyer, student, staff] } } });
      await database.course.deleteMany({ where: { id: courseId } });
      await database.user.deleteMany({ where: { id: { in: [buyer, student, staff] } } });
      await database.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  const save = (body: Record<string, unknown>) => route.PUT(new NextRequest('http://127.0.0.1/api/dashboard/notes', {
    method: 'PUT', body: JSON.stringify({ courseId, lessonId: paidLesson, content: 'Student notes', isBold: true, isItalic: false, fontSize: 13, ...body }),
  }));
  const read = (lessonId = paidLesson, userId?: string, targetCourse = courseId) => route.GET(new NextRequest(`http://127.0.0.1/api/dashboard/notes?${new URLSearchParams({ courseId: targetCourse, lessonId, ...(userId ? { userId } : {}) })}`));

  test('round-trips PostgreSQL Booleans, literal SQL-looking content and dates without request DDL', async () => {
    const ddl = vi.spyOn(database, '$executeRawUnsafe');
    const raw = vi.spyOn(database, '$executeRaw');
    const content = `Jazz notes '; DROP TABLE "User"; --`;
    const response = await save({ content, isBold: true, isItalic: true, fontSize: 13.9 });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, note: { userId: buyer, content, isBold: true, isItalic: true, fontSize: 13 } });
    const fetched = await read();
    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toMatchObject({ note: { content, isBold: true, isItalic: true, updatedAt: expect.any(String) } });
    expect(fetched.headers.get('Cache-Control')).toContain('no-store, private');
    expect(await database.user.count({ where: { id: { in: [buyer, student, staff] } } })).toBe(3);
    expect(ddl).not.toHaveBeenCalled();
    expect(raw).not.toHaveBeenCalled();
  });

  test('upserts only the authenticated author and supports clearing existing notes', async () => {
    expect((await save({ userId: student, content: 'Original note' })).status).toBe(200);
    expect((await save({ content: '', isBold: false, isItalic: false })).status).toBe(200);
    expect(await database.lessonNote.count({ where: { userId: buyer, lessonId: paidLesson } })).toBe(1);
    expect(await database.lessonNote.count({ where: { userId: student } })).toBe(0);
    expect(await database.lessonNote.findUnique({ where: { userId_lessonId: { userId: buyer, lessonId: paidLesson } } })).toMatchObject({ content: '', isBold: false, isItalic: false });
  });

  test('allows private free first-lesson notes while denying paid access and other student authors', async () => {
    await save({ content: 'Buyer private note' });
    auth.user = identity(student);
    expect((await save({ lessonId: freeLesson, content: 'Free lesson note' })).status).toBe(200);
    expect((await read(freeLesson)).status).toBe(200);
    expect((await save({ lessonId: paidLesson })).status).toBe(403);
    expect((await read(paidLesson)).status).toBe(403);
    expect((await read(freeLesson, buyer)).status).toBe(403);
    expect((await read(freeLesson, undefined, 'wrong-course')).status).toBe(404);
    expect(await database.lessonNote.count({ where: { userId: student } })).toBe(1);
  });

  test('permits staff to review the requested student note in its actual course', async () => {
    await save({ content: 'Buyer private note' });
    auth.user = identity(staff);
    const response = await read(paidLesson, buyer);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ note: { userId: buyer, content: 'Buyer private note' } });
    expect((await read(paidLesson, buyer, 'wrong-course')).status).toBe(404);
  });

  test.each(['course', 'chapter', 'lesson'])('denies ordinary students access to unpublished %s notes', async (entity) => {
    if (entity === 'course') await database.course.update({ where: { id: courseId }, data: { isPublished: false } });
    if (entity === 'chapter') await database.chapter.update({ where: { id: chapterId }, data: { isPublished: false } });
    if (entity === 'lesson') await database.lesson.update({ where: { id: paidLesson }, data: { isPublished: false } });
    expect((await save({})).status).toBe(404);
    expect((await read()).status).toBe(404);
    expect(await database.lessonNote.count({ where: { userId: buyer } })).toBe(0);
  });

  test('rejects unauthenticated requests and malformed Boolean input before storing notes', async () => {
    auth.user = null;
    expect((await save({})).status).toBe(401);
    expect((await read()).status).toBe(401);
    auth.user = identity(buyer);
    expect((await save({ isBold: 'false' })).status).toBe(400);
    expect(await database.lessonNote.count({ where: { userId: buyer } })).toBe(0);
  });
});
