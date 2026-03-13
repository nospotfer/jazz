import { cache } from 'react';

import { CANONICAL_JAZZ_CLASSES } from '@/lib/course-lessons';
import { getCourseTranslationBundle, resolveLessonTitle } from '@/lib/course-translations';
import { db } from '@/lib/db';
import {
  buildUserJazzMedalProgress,
  getHighestQuizMedal,
  type QuizMedalTierValue,
  type UserJazzMedalProfileSnapshot,
} from '@/lib/lesson-quiz';
import type { SupportedLanguage } from '@/lib/language';

const defaultLessonCount = CANONICAL_JAZZ_CLASSES.length;

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
  const publishedCourse = await getPublishedJazzQuizLessons();

  if (!publishedCourse.courseId) {
    return buildUserJazzMedalProgress(0, defaultLessonCount, 'NONE');
  }

  const summaries = await getUserJazzMedalSummaryRows(
    userId,
    publishedCourse.lessons.map((lesson) => lesson.id)
  );
  const platinumMedalCount = summaries.filter((summary) => summary.bestMedal === 'PLATINUM').length;

  return buildUserJazzMedalProgress(
    platinumMedalCount,
    publishedCourse.lessons.length > 0 ? publishedCourse.lessons.length : defaultLessonCount,
    getHighestQuizMedal(summaries.map((summary) => summary.bestMedal))
  );
});

export const getUserJazzMedalProfile = cache(async (
  userId: string,
  language: SupportedLanguage
): Promise<UserJazzMedalProfileSnapshot> => {
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

  const [summaries, translationBundle] = await Promise.all([
    getUserJazzMedalSummaryRows(
      userId,
      publishedCourse.lessons.map((lesson) => lesson.id)
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
        medal: summary?.bestMedal ?? 'NONE',
        bestScorePercent: summary?.bestScorePercent ?? null,
        bestCorrectCount: summary?.bestCorrectCount ?? null,
      };
    }),
  };
});