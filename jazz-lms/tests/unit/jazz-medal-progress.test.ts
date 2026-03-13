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
  });

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
});