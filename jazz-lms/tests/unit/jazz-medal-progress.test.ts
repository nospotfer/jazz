import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('jazz medal entitlement', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('ADMIN_OWNER_EMAIL', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  test.each([0, 1])('uses course order for generic titles with chapter positions starting at %i', async (startPosition) => {
    vi.doMock('react', () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
      course: { findFirst: vi.fn().mockResolvedValue({ id: 'course-numbering', chapters: [
        { lessons: Array.from({ length: 8 }, (_, index) => ({
          id: `lesson-${index + 1}`, title: `Study session ${index + 1}`, position: startPosition + index, quizQuestions: [{ id: `q-${index + 1}` }],
        })) },
        { lessons: Array.from({ length: 7 }, (_, index) => ({
          id: `lesson-${index + 9}`, title: `Study session ${index + 9}`, position: startPosition + index, quizQuestions: [{ id: `q-${index + 9}` }],
        })) },
      ] }) },
      purchase: { findUnique: vi.fn().mockResolvedValue(null) },
      lessonPurchase: { findMany: vi.fn().mockResolvedValue([]) },
    } }));
    const { getUserJazzMedalProfile } = await import('@/lib/jazz-medal-progress');
    const profile = await getUserJazzMedalProfile('user-numbering', 'es');
    expect(profile.lessons.map((lesson) => lesson.classNumber)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
  });

  test('preserves official titles and explicit class labels independently of position and missing quiz lessons', async () => {
    vi.doMock('react', () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
      course: { findFirst: vi.fn().mockResolvedValue({ id: 'course-canonical', chapters: [{ lessons: [
        { id: 'missing-quiz', title: 'Clase 1', position: 0, quizQuestions: [] },
        { id: 'ragtime', title: 'Um Antecedente Decisivo: O Ragtime', position: 1, quizQuestions: [{ id: 'ragtime-q' }] },
        { id: 'rhythm', title: 'Aula 6 - El Ritmo', position: 2, quizQuestions: [{ id: 'rhythm-q' }] },
        { id: 'essence', title: 'La Esencia del Jazz', position: 3, quizQuestions: [{ id: 'essence-q' }] },
      ] }] }) },
      purchase: { findUnique: vi.fn().mockResolvedValue(null) },
      lessonPurchase: { findMany: vi.fn().mockResolvedValue([]) },
    } }));
    const { getUserJazzMedalProfile } = await import('@/lib/jazz-medal-progress');
    const profile = await getUserJazzMedalProfile('user-canonical', 'es');
    expect(profile.lessons.map((lesson) => [lesson.lessonId, lesson.classNumber])).toEqual([
      ['missing-quiz', 1], ['ragtime', 5], ['rhythm', 6], ['essence', 1],
    ]);
  });

  test('returns no active medal when user has no course or lesson purchase', async () => {
    vi.doMock('react', () => ({
      cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
        course: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'course-1',
            chapters: [
              {
                lessons: [
                  {
                    id: 'lesson-1',
                    title: 'A Essencia do Jazz',
                    position: 1,
                    quizQuestions: [{ id: 'q1' }],
                  },
                ],
              },
            ],
          }),
        },
        purchase: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        lessonPurchase: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        lessonQuizSummary: {
          findMany: vi.fn().mockResolvedValue([{ lessonId: 'lesson-1', bestMedal: 'PLATINUM', bestScorePercent: 100, bestCorrectCount: 12 }]),
        },
      },
    }));

    const { getUserJazzMedalProgress, getUserJazzMedalProfile } = await import('@/lib/jazz-medal-progress');

    const progress = await getUserJazzMedalProgress('user-1');
    const profile = await getUserJazzMedalProfile('user-1', 'pt');

    expect(progress.activeProfileMedal).toBe('NONE');
    expect(progress.platinumMedalCount).toBe(0);
    expect(profile.lessons[0]?.medal).toBe('NONE');
    expect(profile.lessons[0]?.bestScorePercent).toBeNull();
  }, 15000);

  test('keeps medals only for lessons the user is entitled to', async () => {
    vi.doMock('react', () => ({
      cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
        course: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'course-1',
            chapters: [
              {
                lessons: [
                  {
                    id: 'lesson-1',
                    title: 'A Essencia do Jazz',
                    position: 1,
                    quizQuestions: [{ id: 'q1' }],
                  },
                  {
                    id: 'lesson-2',
                    title: 'A Linguagem do Jazz',
                    position: 2,
                    quizQuestions: [{ id: 'q2' }],
                  },
                ],
              },
            ],
          }),
        },
        purchase: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        lessonPurchase: {
          findMany: vi.fn().mockResolvedValue([{ lessonId: 'lesson-2' }]),
        },
        lessonQuizSummary: {
          findMany: vi.fn().mockResolvedValue([{ lessonId: 'lesson-2', bestMedal: 'GOLD', bestScorePercent: 92, bestCorrectCount: 11 }]),
        },
      },
    }));

    const { getUserJazzMedalProgress, getUserJazzMedalProfile } = await import('@/lib/jazz-medal-progress');

    const progress = await getUserJazzMedalProgress('user-1');
    const profile = await getUserJazzMedalProfile('user-1', 'pt');

    expect(progress.activeProfileMedal).toBe('GOLD');
    expect(progress.platinumMedalCount).toBe(0);
    expect(profile.lessons.find((lesson) => lesson.lessonId === 'lesson-1')?.medal).toBe('NONE');
    expect(profile.lessons.find((lesson) => lesson.lessonId === 'lesson-2')?.medal).toBe('GOLD');
  });

  test('marks user as eligible for course completion recognition when all lessons and quizzes are complete', async () => {
    vi.doMock('react', () => ({
      cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
        course: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'course-1',
            chapters: [
              {
                lessons: [
                  { id: 'lesson-1', title: 'Class 1', position: 1, quizQuestions: [{ id: 'q1' }] },
                  { id: 'lesson-2', title: 'Class 2', position: 2, quizQuestions: [{ id: 'q2' }] },
                ],
              },
            ],
          }),
        },
        purchase: {
          findUnique: vi.fn().mockResolvedValue({ id: 'purchase-1' }),
        },
        lessonPurchase: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        lessonQuizSummary: {
          findMany: vi.fn().mockResolvedValue([
            { lessonId: 'lesson-1', bestMedal: 'SILVER', bestScorePercent: 74, bestCorrectCount: 9 },
            { lessonId: 'lesson-2', bestMedal: 'GOLD', bestScorePercent: 92, bestCorrectCount: 11 },
          ]),
        },
        userProgress: {
          count: vi.fn().mockResolvedValue(2),
        },
        lessonQuizAttempt: {
          findMany: vi.fn().mockResolvedValue([{ lessonId: 'lesson-1' }, { lessonId: 'lesson-2' }]),
        },
      },
    }));

    const { getUserCourseCompletionRecognition } = await import('@/lib/jazz-medal-progress');

    const recognition = await getUserCourseCompletionRecognition('user-1');

    expect(recognition.isEligible).toBe(true);
    expect(recognition.completedLessons).toBe(2);
    expect(recognition.totalLessons).toBe(2);
    expect(recognition.completionPercent).toBe(100);
    expect(recognition.quizzesWithMedalCount).toBe(2);
    expect(recognition.scorePercent).toBe(83);
    expect(recognition.medal).toBe('SILVER');
  });

  test('blocks eligibility when quizzes are not complete in all lessons', async () => {
    vi.doMock('react', () => ({
      cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
        course: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'course-1',
            chapters: [
              {
                lessons: [
                  { id: 'lesson-1', title: 'Class 1', position: 1, quizQuestions: [{ id: 'q1' }] },
                  { id: 'lesson-2', title: 'Class 2', position: 2, quizQuestions: [{ id: 'q2' }] },
                ],
              },
            ],
          }),
        },
        purchase: {
          findUnique: vi.fn().mockResolvedValue({ id: 'purchase-1' }),
        },
        lessonPurchase: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        lessonQuizSummary: {
          findMany: vi.fn().mockResolvedValue([
            { lessonId: 'lesson-1', bestMedal: 'BRONZE', bestScorePercent: 58, bestCorrectCount: 7 },
            { lessonId: 'lesson-2', bestMedal: 'NONE', bestScorePercent: 42, bestCorrectCount: 5 },
          ]),
        },
        userProgress: {
          count: vi.fn().mockResolvedValue(2),
        },
        lessonQuizAttempt: {
          findMany: vi.fn().mockResolvedValue([{ lessonId: 'lesson-1' }]),
        },
      },
    }));

    const { getUserCourseCompletionRecognition } = await import('@/lib/jazz-medal-progress');

    const recognition = await getUserCourseCompletionRecognition('user-1');

    expect(recognition.isEligible).toBe(false);
    expect(recognition.completedLessons).toBe(2);
    expect(recognition.totalLessons).toBe(2);
    expect(recognition.quizzesWithMedalCount).toBe(1);
  });

  test.each([
    { name: 'one historical lesson purchase', fullPurchase: false, ownedLessons: ['lesson-2'], completed: 1, completedQuizzes: ['lesson-2'], secondHasQuiz: true, eligible: false },
    { name: 'a full purchase with a published lesson missing its quiz bank', fullPurchase: true, ownedLessons: [], completed: 2, completedQuizzes: ['lesson-1'], secondHasQuiz: false, eligible: false },
    { name: 'historical purchases covering every published lesson', fullPurchase: false, ownedLessons: ['lesson-1', 'lesson-2'], completed: 2, completedQuizzes: ['lesson-1', 'lesson-2'], secondHasQuiz: true, eligible: true },
  ])('counts the entire published course for $name', async ({ fullPurchase, ownedLessons, completed, completedQuizzes, secondHasQuiz, eligible }) => {
    vi.doMock('react', () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn().mockResolvedValue(null) },
      course: { findFirst: vi.fn().mockResolvedValue({ id: 'whole-course', chapters: [{ lessons: [
        { id: 'lesson-1', title: 'Class 1', position: 0, quizQuestions: [{ id: 'q1' }] },
        { id: 'lesson-2', title: 'Class 2', position: 1, quizQuestions: secondHasQuiz ? [{ id: 'q2' }] : [] },
      ] }] }) },
      purchase: { findUnique: vi.fn().mockResolvedValue(fullPurchase ? { id: 'full-purchase' } : null) },
      lessonPurchase: { findMany: vi.fn().mockResolvedValue(ownedLessons.map((lessonId) => ({ lessonId }))) },
      userProgress: { count: vi.fn().mockResolvedValue(completed) },
      lessonQuizSummary: { findMany: vi.fn().mockResolvedValue(completedQuizzes.map((lessonId) => ({ lessonId, bestMedal: 'PLATINUM', bestScorePercent: 100, bestCorrectCount: 12 }))) },
      lessonQuizAttempt: { findMany: vi.fn().mockResolvedValue(completedQuizzes.map((lessonId) => ({ lessonId }))) },
    } }));
    const { getUserCourseCompletionRecognition } = await import('@/lib/jazz-medal-progress');
    const recognition = await getUserCourseCompletionRecognition('whole-course-user');
    expect(recognition.totalLessons).toBe(2);
    expect(recognition.completedLessons).toBe(completed);
    expect(recognition.completionPercent).toBe(completed * 50);
    expect(recognition.quizzesWithMedalCount).toBe(completedQuizzes.length);
    expect(recognition.scorePercent).toBe(completedQuizzes.length * 50);
    expect(recognition.isEligible).toBe(eligible);
  });

  test.each([
    { role: 'SUPER_ADMIN', owner: '', verifiedEmail: undefined, allowed: true },
    { role: 'COURSE_ADMIN', owner: '', verifiedEmail: undefined, allowed: true },
    { role: 'CONTENT_CREATOR', owner: '', verifiedEmail: undefined, allowed: true },
    { role: 'MODERATOR', owner: '', verifiedEmail: undefined, allowed: true },
    { role: 'USER', owner: ' OWNER@example.test ', verifiedEmail: 'owner@EXAMPLE.test', allowed: true },
    { role: 'USER', owner: '', verifiedEmail: undefined, allowed: false },
    { role: 'USER', owner: '  ', verifiedEmail: '', allowed: false },
    { role: 'USER', owner: 'owner@example.test', verifiedEmail: undefined, allowed: false },
    { role: 'USER', owner: 'owner@example.test', verifiedEmail: 'student@example.test', allowed: false },
    { role: 'ADMIN', owner: '', verifiedEmail: 'student@example.test', allowed: false },
  ])('medal scope follows verified owner and immutable role policy: $role / $allowed', async ({ role, owner, verifiedEmail, allowed }) => {
    vi.stubEnv('ADMIN_OWNER_EMAIL', owner);
    vi.doMock('react', () => ({ cache: <T extends (...args: never[]) => unknown>(fn: T) => fn }));
    const findRole = vi.fn().mockResolvedValue({ role, email: 'owner@example.test' });
    vi.doMock('@/lib/course-translations', () => ({
      getCourseTranslationBundle: vi.fn().mockResolvedValue({ lessons: new Map() }),
      resolveLessonTitle: (_map: unknown, _id: string, title: string) => title,
    }));
    vi.doMock('@/lib/db', () => ({ db: {
      user: { findUnique: findRole },
      course: { findFirst: vi.fn().mockResolvedValue({ id: 'staff-course', chapters: [{ lessons: [
        { id: 'staff-lesson', title: 'Staff lesson', position: 0, quizQuestions: [{ id: 'staff-q' }] },
      ] }] }) },
      purchase: { findUnique: vi.fn().mockResolvedValue(null) },
      lessonPurchase: { findMany: vi.fn().mockResolvedValue([]) },
      userProgress: { count: vi.fn().mockResolvedValue(1) },
      lessonQuizSummary: { findMany: vi.fn().mockResolvedValue([{ lessonId: 'staff-lesson', bestMedal: 'PLATINUM', bestScorePercent: 100, bestCorrectCount: 12 }]) },
      lessonQuizAttempt: { findMany: vi.fn().mockResolvedValue([{ lessonId: 'staff-lesson' }]) },
    } }));
    const { getUserJazzMedalProgress, getUserJazzMedalProfile, getUserCourseCompletionRecognition } = await import('@/lib/jazz-medal-progress');
    const progress = await getUserJazzMedalProgress('verified-user-id', verifiedEmail);
    const profile = await getUserJazzMedalProfile('verified-user-id', 'es', verifiedEmail);
    const recognition = await getUserCourseCompletionRecognition('verified-user-id', verifiedEmail);
    expect(progress.platinumMedalCount).toBe(allowed ? 1 : 0);
    expect(profile.lessons[0].medal).toBe(allowed ? 'PLATINUM' : 'NONE');
    expect(recognition.isEligible).toBe(allowed);
    expect(findRole).toHaveBeenCalledWith({ where: { id: 'verified-user-id' }, select: { role: true } });
  });
});
