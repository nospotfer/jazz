import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';

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

interface RawLessonPurchase {
  id: string;
  userId: string;
  lessonId: string;
  lessonTitle: string;
  chapterId: string;
  courseId: string;
  courseTitle: string;
}

interface RawProgress {
  lessonId: string;
  isCompleted: number;
  progressPercent: number;
}

export async function GET() {
  try {
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
                },
              },
            },
          },
        },
      });

      const courses: CourseProgressItem[] = publishedCourses.map((course) => ({
        id: course.id,
        title: course.title,
        videos: course.chapters.flatMap((chapter) =>
          chapter.lessons.map((lesson) => ({
            lessonId: lesson.id,
            title: lesson.title,
            progressPercent: 0,
            courseId: course.id,
          }))
        ),
      }));

      return NextResponse.json({ courses });
    }

    const [fullCoursePurchases, rawLessonPurchases, rawProgress] =
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
        db.$queryRaw<RawLessonPurchase[]>`
          SELECT
            lp.id,
            lp.userId,
            lp.lessonId,
            l.title AS lessonTitle,
            l.chapterId,
            c.courseId,
            co.title AS courseTitle
          FROM LessonPurchase lp
          JOIN Lesson l ON l.id = lp.lessonId
          JOIN Chapter c ON c.id = l.chapterId
          JOIN Course co ON co.id = c.courseId
          WHERE lp.userId = ${user.id}
        `,
        db.$queryRaw<RawProgress[]>`
          SELECT lessonId, isCompleted, progressPercent
          FROM UserProgress
          WHERE userId = ${user.id}
        `,
      ]);

    const progressMap = new Map<string, RawProgress>(
      rawProgress.map((p) => [p.lessonId, p])
    );

    function getPercent(lessonId: string): number {
      const p = progressMap.get(lessonId);
      if (!p) return 0;
      if (p.isCompleted === 1 || (p.isCompleted as unknown as boolean) === true)
        return 100;
      return p.progressPercent ?? 0;
    }

    const coursesMap = new Map<string, CourseProgressItem>();

    for (const purchase of fullCoursePurchases) {
      const course = purchase.course;
      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          id: course.id,
          title: course.title,
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
            title: lesson.title,
            progressPercent: getPercent(lesson.id),
            courseId: course.id,
          });
          existingIds.add(lesson.id);
        }
      }
    }

    for (const lp of rawLessonPurchases) {
      if (!coursesMap.has(lp.courseId)) {
        coursesMap.set(lp.courseId, {
          id: lp.courseId,
          title: lp.courseTitle,
          videos: [],
        });
      }
      const courseEntry = coursesMap.get(lp.courseId)!;
      if (courseEntry.videos.some((v) => v.lessonId === lp.lessonId)) continue;
      courseEntry.videos.push({
        lessonId: lp.lessonId,
        title: lp.lessonTitle,
        progressPercent: getPercent(lp.lessonId),
        courseId: lp.courseId,
      });
    }

    const courses = Array.from(coursesMap.values());
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[courses-progress]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
