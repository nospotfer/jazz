import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('jazz medal entitlement', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns no active medal when user has no course or lesson purchase', async () => {
    vi.doMock('react', () => ({
      cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    }));
    vi.doMock('@/lib/db', () => ({
      db: {
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
      db: {
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
      db: {
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
      db: {
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
});