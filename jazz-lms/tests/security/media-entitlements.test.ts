import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), tokens: vi.fn(), storageClient: vi.fn(), signedUrl: vi.fn(), download: vi.fn(),
  lessonFindUnique: vi.fn(), lessonFindFirst: vi.fn(), courseFindUnique: vi.fn(), attachmentFindFirst: vi.fn(),
  attachmentFindUnique: vi.fn(), attachmentFindMany: vi.fn(), userFindUnique: vi.fn(), purchaseFindUnique: vi.fn(), lessonPurchaseFindUnique: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/utils/supabase/admin', () => ({ createAdminClient: mocks.storageClient }));
vi.mock('@/lib/mux', () => ({ createMuxPlaybackTokens: mocks.tokens }));
vi.mock('@/lib/db', () => ({ db: {
  lesson: { findUnique: mocks.lessonFindUnique, findFirst: mocks.lessonFindFirst },
  attachment: { findFirst: mocks.attachmentFindFirst, findUnique: mocks.attachmentFindUnique, findMany: mocks.attachmentFindMany },
  course: { findUnique: mocks.courseFindUnique }, user: { findUnique: mocks.userFindUnique },
  purchase: { findUnique: mocks.purchaseFindUnique }, lessonPurchase: { findUnique: mocks.lessonPurchaseFindUnique },
} }));

import { GET as playback } from '@/app/api/lessons/[lessonId]/mux-playback/route';
import { GET as attachment } from '@/app/api/lessons/[lessonId]/attachments/[attachmentId]/route';

const playbackRequest = () => playback(new Request('https://example.test/api/playback'), { params: Promise.resolve({ lessonId: 'paid-lesson' }) });
const attachmentRequest = (proxy = false) => attachment(new NextRequest(`https://example.test/api/pdf${proxy ? '?proxy=1' : ''}`), { params: Promise.resolve({ lessonId: 'paid-lesson', attachmentId: 'paid-pdf' }) });
const mediaLesson = (lessonPublished = true, chapterPublished = true, coursePublished = true) => ({
  id: 'paid-lesson', isPublished: lessonPublished, videoUrl: 'TSZoZs4qPde01uwmlonYHcd6rMdpxQLZ3z1UQt7Mmaxg',
  chapter: { courseId: 'course-1', isPublished: chapterPublished, course: { isPublished: coursePublished } },
});
const mediaAttachment = (lesson = mediaLesson()) => ({
  id: 'paid-pdf', lessonId: lesson.id, url: 'paid.pdf', name: 'paid.pdf', language: 'es', documentKey: 'paid',
  updatedAt: new Date('2026-01-01'), lesson,
});

describe('signed media entitlement enforcement', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('ADMIN_OWNER_EMAIL', undefined);
    vi.stubEnv('SUPABASE_STORAGE_BUCKET', 'test-bucket');
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'student-1', email: 'student@example.test' } }, error: null });
    mocks.lessonFindUnique.mockResolvedValue(mediaLesson());
    mocks.lessonFindFirst.mockResolvedValue({ id: 'free-lesson' });
    mocks.courseFindUnique.mockResolvedValue({ chapters: [{ lessons: [{ id: 'free-lesson' }, { id: 'paid-lesson' }] }] });
    mocks.attachmentFindFirst.mockResolvedValue(mediaAttachment());
    mocks.attachmentFindUnique.mockResolvedValue(null);
    mocks.attachmentFindMany.mockResolvedValue([]);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.lessonPurchaseFindUnique.mockResolvedValue(null);
    mocks.tokens.mockReturnValue({ playbackToken: 'test-token', thumbnailToken: 'test-token', storyboardToken: 'test-token' });
    mocks.storageClient.mockReturnValue({ storage: { from: () => ({ createSignedUrl: mocks.signedUrl, download: mocks.download }) } });
    mocks.signedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.test/paid.pdf' }, error: null });
    mocks.download.mockResolvedValue({ data: new Blob(['isolated PDF bytes']), error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  test.each([undefined, '', '   '])('email-less identities never gain owner privileges with owner setting %s', async (owner) => {
    vi.stubEnv('ADMIN_OWNER_EMAIL', owner);
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'email-less-student', email: null } }, error: null });
    expect((await playbackRequest()).status).toBe(403);
    expect((await attachmentRequest()).status).toBe(403);
    expect(mocks.tokens).not.toHaveBeenCalled();
    expect(mocks.storageClient).not.toHaveBeenCalled();
  });

  test('validation errors reject otherwise populated identities before signing', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'unverified-user', email: 'owner@example.test' } }, error: new Error('Token invalid') });
    vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.test');
    expect((await playbackRequest()).status).toBe(401);
    expect((await attachmentRequest()).status).toBe(401);
    expect(mocks.tokens).not.toHaveBeenCalled();
    expect(mocks.storageClient).not.toHaveBeenCalled();
  });

  test.each([
    { label: 'lesson', lesson: mediaLesson(false, true, true) },
    { label: 'chapter', lesson: mediaLesson(true, false, true) },
    { label: 'course', lesson: mediaLesson(true, true, false) },
  ])('unpublished $label denies a purchaser before provider signing', async ({ lesson }) => {
    mocks.lessonFindUnique.mockResolvedValue(lesson);
    mocks.attachmentFindFirst.mockResolvedValue(mediaAttachment(lesson));
    mocks.purchaseFindUnique.mockResolvedValue({ id: 'purchase-1' });
    expect((await playbackRequest()).status).toBe(404);
    expect((await attachmentRequest()).status).toBe(404);
    expect(mocks.tokens).not.toHaveBeenCalled();
    expect(mocks.storageClient).not.toHaveBeenCalled();
  });

  test.each(['owner', 'role-admin'])('explicit %s may preview drafts', async (privilege) => {
    const lesson = mediaLesson(false, false, false);
    mocks.lessonFindUnique.mockResolvedValue(lesson);
    mocks.attachmentFindFirst.mockResolvedValue(mediaAttachment(lesson));
    if (privilege === 'owner') vi.stubEnv('ADMIN_OWNER_EMAIL', ' STUDENT@example.test ');
    else mocks.userFindUnique.mockResolvedValue({ role: 'COURSE_ADMIN' });
    expect((await playbackRequest()).status).toBe(200);
    expect((await attachmentRequest()).status).toBe(200);
    expect(mocks.tokens).toHaveBeenCalledOnce();
    expect(mocks.signedUrl).toHaveBeenCalledOnce();
  });

  test.each(['full-course', 'historical-lesson'])('%s purchase grants signed playback and PDF output', async (purchase) => {
    if (purchase === 'full-course') mocks.purchaseFindUnique.mockResolvedValue({ id: 'purchase-1' });
    else mocks.lessonPurchaseFindUnique.mockResolvedValue({ id: 'lesson-purchase-1' });
    const video = await playbackRequest();
    const pdf = await attachmentRequest();
    expect(video.status).toBe(200);
    expect(await video.json()).toMatchObject({ playbackToken: 'test-token' });
    expect(video.headers.get('Cache-Control')).toContain('private');
    expect(pdf.status).toBe(200);
    expect(mocks.signedUrl).toHaveBeenCalledWith('paid.pdf', 900, { download: false });
  });

  test('the first published lesson remains free with protected signing', async () => {
    mocks.lessonFindFirst.mockResolvedValue({ id: 'paid-lesson' });
    mocks.courseFindUnique.mockResolvedValue({ chapters: [{ lessons: [{ id: 'paid-lesson' }] }] });
    expect((await playbackRequest()).status).toBe(200);
    expect((await attachmentRequest()).status).toBe(200);
  });

  test('authorized proxy output is private PDF bytes and never a public URL fallback', async () => {
    mocks.purchaseFindUnique.mockResolvedValue({ id: 'purchase-1' });
    const pdf = await attachmentRequest(true);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('Content-Type')).toBe('application/pdf');
    expect(pdf.headers.get('Cache-Control')).toContain('no-store, private');
    expect(await pdf.text()).toBe('isolated PDF bytes');
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(mocks.download).toHaveBeenCalledWith('paid.pdf');
  });
});
