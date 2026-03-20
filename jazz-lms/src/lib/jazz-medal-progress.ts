import { cache } from 'react';

import { CANONICAL_JAZZ_CLASSES } from '@/lib/course-lessons';
import { getCourseTranslationBundle, resolveLessonTitle } from '@/lib/course-translations';
import { db } from '@/lib/db';
import {
  LESSON_QUIZ_QUESTION_COUNT,
  buildUserJazzMedalProgress,
  clampQuizPercent,
  type CourseCompletionRecognitionSnapshot,
  getQuizMedalTier,
  getHighestQuizMedal,
  type QuizMedalTierValue,
  type UserJazzMedalProfileSnapshot,
} from '@/lib/lesson-quiz';
import type { SupportedLanguage } from '@/lib/language';

const defaultLessonCount = CANONICAL_JAZZ_CLASSES.length;

const emptyRecognitionSnapshot: CourseCompletionRecognitionSnapshot = {
  isEligible: false,
  completedLessons: 0,
  totalLessons: 0,
  completionPercent: 0,
  quizzesWithMedalCount: 0,
  scorePercent: 0,
  medal: 'NONE',
};

type PublishedJazzQuizLesson = {
  id: string;
  title: string;
  classNumber: number;
};

type PublishedJazzQuizLessonSet = {
  courseId: string | null;
  lessons: PublishedJazzQuizLesson[];
};

const getPublishedJazzQuizLessons = cache(async () => {
  const firstPublishedCourse = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              position: true,
              quizQuestions: {
                where: { isActive: true },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!firstPublishedCourse) {
    return {
      courseId: null,
      lessons: [] as Array<{ id: string; title: string; classNumber: number }>,
    };
  }

  const lessons = firstPublishedCourse.chapters
    .flatMap((chapter) => chapter.lessons)
    .filter((lesson) => lesson.quizQuestions.length > 0)
    .map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      classNumber: typeof lesson.position === 'number' && lesson.position > 0 ? lesson.position : index + 1,
    }));

  return {
    courseId: firstPublishedCourse.id,
    lessons,
  };
});

const getUserEntitledJazzQuizLessons = cache(async (
  userId: string,
  publishedCourse: PublishedJazzQuizLessonSet
) => {
  if (!publishedCourse.courseId || publishedCourse.lessons.length === 0) {
    return {
      hasAccess: false,
      lessons: [] as PublishedJazzQuizLesson[],
    };
  }

  const [fullCoursePurchase, lessonPurchases] = await Promise.all([
    db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: publishedCourse.courseId,
        },
      },
      select: { id: true },
    }),
    db.lessonPurchase.findMany({
      where: {
        userId,
        lessonId: {
          in: publishedCourse.lessons.map((lesson) => lesson.id),
        },
      },
      select: {
        lessonId: true,
      },
    }),
  ]);

  if (fullCoursePurchase) {
    return {
      hasAccess: true,
      lessons: publishedCourse.lessons,
    };
  }

  const entitledLessonIds = new Set(lessonPurchases.map((purchase) => purchase.lessonId));
  const entitledLessons = publishedCourse.lessons.filter((lesson) => entitledLessonIds.has(lesson.id));

  return {
    hasAccess: entitledLessons.length > 0,
    lessons: entitledLessons,
  };
});

const getUserJazzMedalSummaryRows = cache(async (userId: string, lessonIds: string[]) => {
  if (lessonIds.length === 0) {
    return [] as Array<{
      lessonId: string;
      bestMedal: QuizMedalTierValue;
      bestScorePercent: number;
      bestCorrectCount: number;
    }>;
  }

  return db.lessonQuizSummary.findMany({
    where: {
      userId,
      lessonId: { in: lessonIds },
    },
    select: {
      lessonId: true,
      bestMedal: true,
      bestScorePercent: true,
      bestCorrectCount: true,
    },
  }) as Promise<Array<{
    lessonId: string;
    bestMedal: QuizMedalTierValue;
    bestScorePercent: number;
    bestCorrectCount: number;
  }>>;
});

export const getUserJazzMedalProgress = cache(async (userId: string) => {
  try {
    const publishedCourse = await getPublishedJazzQuizLessons();

    if (!publishedCourse.courseId) {
      return buildUserJazzMedalProgress(0, defaultLessonCount, 'NONE');
    }

    const entitledLessons = await getUserEntitledJazzQuizLessons(userId, publishedCourse);

    if (!entitledLessons.hasAccess) {
      return buildUserJazzMedalProgress(0, publishedCourse.lessons.length || defaultLessonCount, 'NONE');
    }

    const summaries = await getUserJazzMedalSummaryRows(
      userId,
      entitledLessons.lessons.map((lesson) => lesson.id)
    );
    const platinumMedalCount = summaries.filter((summary) => summary.bestMedal === 'PLATINUM').length;

    return buildUserJazzMedalProgress(
      platinumMedalCount,
      publishedCourse.lessons.length > 0 ? publishedCourse.lessons.length : defaultLessonCount,
      getHighestQuizMedal(summaries.map((summary) => summary.bestMedal))
    );
  } catch (error) {
    console.error('[jazz-medal-progress] Unable to load medal progress.', error);
    return buildUserJazzMedalProgress(0, defaultLessonCount, 'NONE');
  }
});

export const getUserCourseCompletionRecognition = cache(async (
  userId: string
): Promise<CourseCompletionRecognitionSnapshot> => {
  try {
    const publishedCourse = await getPublishedJazzQuizLessons();

    if (!publishedCourse.courseId || publishedCourse.lessons.length === 0) {
      return emptyRecognitionSnapshot;
    }

    const entitledLessons = await getUserEntitledJazzQuizLessons(userId, publishedCourse);

    if (!entitledLessons.hasAccess || entitledLessons.lessons.length === 0) {
      return emptyRecognitionSnapshot;
    }

    const entitledLessonIds = entitledLessons.lessons.map((lesson) => lesson.id);

    const [completedLessons, summaries, fullyCompletedQuizAttempts] = await Promise.all([
      db.userProgress.count({
        where: {
          userId,
          lessonId: { in: entitledLessonIds },
          isCompleted: true,
        },
      }),
      getUserJazzMedalSummaryRows(userId, entitledLessonIds),
      db.lessonQuizAttempt.findMany({
        where: {
          userId,
          lessonId: { in: entitledLessonIds },
          completedAt: { not: null },
          questionCount: { gte: LESSON_QUIZ_QUESTION_COUNT },
        },
        distinct: ['lessonId'],
        select: {
          lessonId: true,
        },
      }),
    ]);

    const totalLessons = entitledLessonIds.length;
    const completionPercent = clampQuizPercent((completedLessons / totalLessons) * 100);
    const summaryByLessonId = new Map(summaries.map((summary) => [summary.lessonId, summary]));
    const fullyCompletedQuizLessonIds = new Set(
      fullyCompletedQuizAttempts.map((attempt) => attempt.lessonId)
    );

    const lessonsWithQuizMedal = entitledLessonIds.filter((lessonId) => {
      const summary = summaryByLessonId.get(lessonId);
      return Boolean(summary && summary.bestMedal !== 'NONE' && fullyCompletedQuizLessonIds.has(lessonId));
    });

    const quizzesWithMedalCount = lessonsWithQuizMedal.length;
    const scoreRows = entitledLessonIds
      .map((lessonId) => summaryByLessonId.get(lessonId)?.bestScorePercent)
      .filter((value): value is number => typeof value === 'number');
    const rawScorePercent =
      scoreRows.length > 0
        ? scoreRows.reduce((total, value) => total + value, 0) / scoreRows.length
        : 0;
    const scorePercent = clampQuizPercent(rawScorePercent);
    const medal = getQuizMedalTier(scorePercent);
    const isEligible =
      totalLessons > 0 && completionPercent >= 100 && quizzesWithMedalCount === totalLessons;

    return {
      isEligible,
      completedLessons,
      totalLessons,
      completionPercent,
      quizzesWithMedalCount,
      scorePercent,
      medal,
    };
  } catch (error) {
    console.error('[jazz-medal-progress] Unable to load course completion recognition.', error);
    return emptyRecognitionSnapshot;
  }
});

export const getUserJazzMedalProfile = cache(async (
  userId: string,
  language: SupportedLanguage
): Promise<UserJazzMedalProfileSnapshot> => {
  try {
    const publishedCourse = await getPublishedJazzQuizLessons();

    if (!publishedCourse.courseId) {
      const progress = buildUserJazzMedalProgress(0, defaultLessonCount, 'NONE');

      return {
        progress,
        lessons: CANONICAL_JAZZ_CLASSES.map((lesson) => ({
          lessonId: null,
          classNumber: lesson.classNumber,
          title: lesson.subtitles[language],
          medal: 'NONE',
          bestScorePercent: null,
          bestCorrectCount: null,
        })),
      };
    }

    const entitledLessons = await getUserEntitledJazzQuizLessons(userId, publishedCourse);

    if (!entitledLessons.hasAccess) {
      return {
        progress: buildUserJazzMedalProgress(0, publishedCourse.lessons.length || defaultLessonCount, 'NONE'),
        lessons: publishedCourse.lessons.map((lesson) => ({
          lessonId: lesson.id,
          classNumber: lesson.classNumber,
          title: lesson.title,
          medal: 'NONE' as const,
          bestScorePercent: null,
          bestCorrectCount: null,
        })),
      };
    }

    const [summaries, translationBundle] = await Promise.all([
      getUserJazzMedalSummaryRows(
        userId,
        entitledLessons.lessons.map((lesson) => lesson.id)
      ),
      getCourseTranslationBundle({
        language,
        courseIds: [publishedCourse.courseId],
        chapterIds: [],
        lessonIds: publishedCourse.lessons.map((lesson) => lesson.id),
      }),
    ]);

    const summaryByLessonId = new Map(summaries.map((summary) => [summary.lessonId, summary]));
    const platinumMedalCount = summaries.filter((summary) => summary.bestMedal === 'PLATINUM').length;
    const progress = buildUserJazzMedalProgress(
      platinumMedalCount,
      publishedCourse.lessons.length > 0 ? publishedCourse.lessons.length : defaultLessonCount,
      getHighestQuizMedal(summaries.map((summary) => summary.bestMedal))
    );

    return {
      progress,
      lessons: publishedCourse.lessons.map((lesson) => {
        const isEntitledLesson = entitledLessons.lessons.some((item) => item.id === lesson.id);
        const summary = summaryByLessonId.get(lesson.id);

        return {
          lessonId: lesson.id,
          classNumber: lesson.classNumber,
          title: resolveLessonTitle(
            translationBundle.lessons,
            lesson.id,
            lesson.title,
            language,
            lesson.classNumber
          ),
          medal: isEntitledLesson ? summary?.bestMedal ?? 'NONE' : 'NONE',
          bestScorePercent: isEntitledLesson ? summary?.bestScorePercent ?? null : null,
          bestCorrectCount: isEntitledLesson ? summary?.bestCorrectCount ?? null : null,
        };
      }),
    };
  } catch (error) {
    console.error('[jazz-medal-progress] Unable to load medal profile.', error);
    const progress = buildUserJazzMedalProgress(0, defaultLessonCount, 'NONE');

    return {
      progress,
      lessons: CANONICAL_JAZZ_CLASSES.map((lesson) => ({
        lessonId: null,
        classNumber: lesson.classNumber,
        title: lesson.subtitles[language],
        medal: 'NONE',
        bestScorePercent: null,
        bestCorrectCount: null,
      })),
    };
  }
});