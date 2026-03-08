import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { MyCoursesClient, type PurchasedVideoItem } from '@/components/dashboard/my-courses-client';
import {
  DEFAULT_LESSON_DURATION_MINUTES,
} from '@/lib/pricing';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';
import { getCourseTranslationBundle, resolveCourseText, resolveLessonTitle } from '@/lib/course-translations';

export default async function MyCoursesPage() {
  const supabase = createClient();
  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const [fullCoursePurchases, singleLessonPurchases, userProgress] = await Promise.all([
    db.purchase.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            chapters: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              include: {
                lessons: {
                  where: { isPublished: true },
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    }),
    db.lessonPurchase.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    }),
    db.userProgress.findMany({
      where: { userId: user.id },
    }),
  ]);

  const progressMap = new Map(
    userProgress.map((p) => [p.lessonId, p])
  );

  const fullCourses = fullCoursePurchases.map((purchase) => purchase.course);
  const allChapters = fullCourses.flatMap((course) => course.chapters);
  const allLessons = allChapters.flatMap((chapter) => chapter.lessons);

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: Array.from(new Set([
      ...fullCourses.map((course) => course.id),
      ...singleLessonPurchases.map((item) => item.lesson.chapter.course.id),
    ])),
    chapterIds: Array.from(new Set([
      ...allChapters.map((chapter) => chapter.id),
      ...singleLessonPurchases.map((item) => item.lesson.chapter.id),
    ])),
    lessonIds: Array.from(new Set([
      ...allLessons.map((lesson) => lesson.id),
      ...singleLessonPurchases.map((item) => item.lesson.id),
    ])),
  });

  const lessonClassById = new Map<string, number>();
  for (const course of fullCourses) {
    const orderedCourseLessons = course.chapters.flatMap((chapter) => chapter.lessons);
    orderedCourseLessons.forEach((lesson, index) => {
      lessonClassById.set(lesson.id, index + 1);
    });
  }

  const purchasedVideosMap = new Map<string, PurchasedVideoItem>();

  for (const purchase of fullCoursePurchases) {
    for (const chapter of purchase.course.chapters) {
      for (const lesson of chapter.lessons) {
        const progress = progressMap.get(lesson.id);
        const progressPercent = progress?.isCompleted
          ? 100
          : progress?.progressPercent || 0;
        const minutesRemaining = progress?.isCompleted
          ? 0
          : progress?.minutesRemaining ?? DEFAULT_LESSON_DURATION_MINUTES;

        purchasedVideosMap.set(lesson.id, {
          lessonId: lesson.id,
          lessonTitle: resolveLessonTitle(
            translationBundle.lessons,
            lesson.id,
            lesson.title,
            language,
            lessonClassById.get(lesson.id)
          ),
          courseId: purchase.course.id,
          courseTitle: resolveCourseText(
            translationBundle.courses,
            purchase.course.id,
            purchase.course.title,
            purchase.course.description
          ).title,
          chapterTitle: resolveCourseText(
            translationBundle.chapters,
            chapter.id,
            chapter.title,
            chapter.description
          ).title,
          classOrder: chapter.position * 1000 + lesson.position,
          progressPercent,
          minutesRemaining,
          isCompleted: progressPercent >= 100,
          accessType: 'full-course',
        });
      }
    }
  }

  for (const lessonPurchase of singleLessonPurchases) {
    const lesson = lessonPurchase.lesson;
    const progress = progressMap.get(lesson.id);
    const progressPercent = progress?.isCompleted
      ? 100
      : progress?.progressPercent || 0;
    const minutesRemaining = progress?.isCompleted
      ? 0
      : progress?.minutesRemaining ?? DEFAULT_LESSON_DURATION_MINUTES;

    if (!purchasedVideosMap.has(lesson.id)) {
      purchasedVideosMap.set(lesson.id, {
        lessonId: lesson.id,
        lessonTitle: resolveLessonTitle(
          translationBundle.lessons,
          lesson.id,
          lesson.title,
          language,
          lessonClassById.get(lesson.id) ?? lesson.position
        ),
        courseId: lesson.chapter.course.id,
        courseTitle: resolveCourseText(
          translationBundle.courses,
          lesson.chapter.course.id,
          lesson.chapter.course.title,
          lesson.chapter.course.description
        ).title,
        chapterTitle: resolveCourseText(
          translationBundle.chapters,
          lesson.chapter.id,
          lesson.chapter.title,
          lesson.chapter.description
        ).title,
        classOrder: lesson.chapter.position * 1000 + lesson.position,
        progressPercent,
        minutesRemaining,
        isCompleted: progressPercent >= 100,
        accessType: 'single-video',
      });
    }
  }

  const purchasedVideos = Array.from(purchasedVideosMap.values()).sort((a, b) => {
    if (a.courseTitle === b.courseTitle) {
      return a.classOrder - b.classOrder;
    }
    return a.courseTitle.localeCompare(b.courseTitle);
  });

  return (
    <MyCoursesClient videos={purchasedVideos} />
  );
}
