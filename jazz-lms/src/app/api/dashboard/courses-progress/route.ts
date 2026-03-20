import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';
import { getCourseTranslationBundle, resolveCourseText, resolveLessonTitle } from '@/lib/course-translations';

export const dynamic = 'force-dynamic';

export interface CourseProgressVideo {
  lessonId: string;
  title: string;
  progressPercent: number;
  courseId: string;
}

export interface CourseProgressItem {
  id: string;
  title: string;
  videos: CourseProgressVideo[];
}

function normalizeMergeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getLessonNumber(position: number | undefined, fallback: number) {
  return typeof position === 'number' && position > 0 ? position : fallback;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = user.email
      ? await db.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        })
      : null;

    const professorEmail = (process.env.PROFESSOR_EMAIL || '').trim().toLowerCase();
    const isProfessor = !!professorEmail && user.email?.toLowerCase() === professorEmail;
    const isPrivilegedViewer = isProfessor || isAdminRole(dbUser?.role ?? null);

    if (!isPrivilegedViewer) {
      const hasFullPurchase = await db.purchase.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!hasFullPurchase) {
        return NextResponse.json({ courses: [] });
      }
    }

    if (isPrivilegedViewer) {
      const publishedCourses = await db.course.findMany({
        where: { isPublished: true },
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
                },
              },
            },
          },
        },
      });

      const orderedLessons = publishedCourses.flatMap((course) =>
        course.chapters.flatMap((chapter) => chapter.lessons)
      );
      const translationBundle = await getCourseTranslationBundle({
        language,
        courseIds: publishedCourses.map((course) => course.id),
        chapterIds: publishedCourses.flatMap((course) => course.chapters.map((chapter) => chapter.id)),
        lessonIds: orderedLessons.map((lesson) => lesson.id),
      });

      const coursesMap = new Map<string, CourseProgressItem>();

      for (const course of publishedCourses) {
        const localizedCourseTitle = resolveCourseText(
          translationBundle.courses,
          course.id,
          course.title,
          course.description
        ).title;
        const courseKey = normalizeMergeKey(localizedCourseTitle);

        if (!coursesMap.has(courseKey)) {
          coursesMap.set(courseKey, {
            id: course.id,
            title: localizedCourseTitle,
            videos: [],
          });
        }

        const courseEntry = coursesMap.get(courseKey)!;
        const existingLessonKeys = new Set(
          courseEntry.videos.map((video) => normalizeMergeKey(`${video.progressPercent}:${video.title}`))
        );

        for (const chapter of course.chapters) {
          for (const lesson of chapter.lessons) {
            const classNumber = getLessonNumber(lesson.position, courseEntry.videos.length + 1);
            const resolvedTitle = resolveLessonTitle(
              translationBundle.lessons,
              lesson.id,
              lesson.title,
              language,
              classNumber
            );
            const lessonKey = normalizeMergeKey(`${classNumber}:${resolvedTitle}`);

            if (existingLessonKeys.has(lessonKey)) {
              continue;
            }

            courseEntry.videos.push({
              lessonId: lesson.id,
              title: resolvedTitle,
              progressPercent: 0,
              courseId: course.id,
            });
            existingLessonKeys.add(lessonKey);
          }
        }
      }

      return NextResponse.json({ courses: Array.from(coursesMap.values()) });
    }

    const [fullCoursePurchases, userProgress] =
      await Promise.all([
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
        db.userProgress.findMany({
          where: { userId: user.id },
          select: {
            lessonId: true,
            isCompleted: true,
            progressPercent: true,
          },
        }),
      ]);

    const orderedLessons = fullCoursePurchases.flatMap((purchase) =>
      purchase.course.chapters.flatMap((chapter) => chapter.lessons)
    );
    const translationBundle = await getCourseTranslationBundle({
      language,
      courseIds: Array.from(new Set(
        fullCoursePurchases.map((purchase) => purchase.course.id)
      )),
      chapterIds: Array.from(new Set(
        fullCoursePurchases.flatMap((purchase) => purchase.course.chapters.map((chapter) => chapter.id))
      )),
      lessonIds: Array.from(new Set(
        orderedLessons.map((lesson) => lesson.id)
      )),
    });

    const progressMap = new Map<string, { isCompleted: boolean; progressPercent: number }>(
      userProgress.map((p) => [
        p.lessonId,
        {
          isCompleted: Boolean(p.isCompleted),
          progressPercent: p.progressPercent ?? 0,
        },
      ])
    );

    function getPercent(lessonId: string): number {
      const p = progressMap.get(lessonId);
      if (!p) return 0;
      if (p.isCompleted) return 100;
      return p.progressPercent ?? 0;
    }

    const coursesMap = new Map<string, CourseProgressItem>();

    for (const purchase of fullCoursePurchases) {
      const course = purchase.course;
      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          id: course.id,
          title: resolveCourseText(
            translationBundle.courses,
            course.id,
            course.title,
            course.description
          ).title,
          videos: [],
        });
      }
      const courseEntry = coursesMap.get(course.id)!;
      const existingIds = new Set(courseEntry.videos.map((v) => v.lessonId));

      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          if (existingIds.has(lesson.id)) continue;
          courseEntry.videos.push({
            lessonId: lesson.id,
            title: resolveLessonTitle(
              translationBundle.lessons,
              lesson.id,
              lesson.title,
              language,
              getLessonNumber(lesson.position, courseEntry.videos.length + 1)
            ),
            progressPercent: getPercent(lesson.id),
            courseId: course.id,
          });
          existingIds.add(lesson.id);
        }
      }
    }

    const courses = Array.from(coursesMap.values());
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[courses-progress]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
