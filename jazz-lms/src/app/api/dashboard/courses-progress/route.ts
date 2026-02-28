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

    const [fullCoursePurchases, lessonPurchases, userProgress] =
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
        db.lessonPurchase.findMany({
          where: { userId: user.id },
          include: {
            lesson: {
              include: {
                chapter: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
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

    for (const lp of lessonPurchases) {
      const course = lp.lesson.chapter.course;
      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          id: course.id,
          title: course.title,
          videos: [],
        });
      }
      const courseEntry = coursesMap.get(course.id)!;
      if (courseEntry.videos.some((v) => v.lessonId === lp.lessonId)) continue;
      courseEntry.videos.push({
        lessonId: lp.lessonId,
        title: lp.lesson.title,
        progressPercent: getPercent(lp.lessonId),
        courseId: course.id,
      });
    }

    const courses = Array.from(coursesMap.values());
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[courses-progress]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
