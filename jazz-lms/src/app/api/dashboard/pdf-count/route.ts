import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const [fullPurchases, lessonPurchases, publishedCourses] = await Promise.all([
      db.purchase.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      }),
      db.lessonPurchase.findMany({
        where: { userId: user.id },
        select: { lessonId: true },
      }),
      db.course.findMany({
        where: { isPublished: true },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { position: 'asc' },
                include: {
                  attachments: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const purchasedCourseIds = new Set(fullPurchases.map((purchase) => purchase.courseId));
    const purchasedLessonIds = new Set(lessonPurchases.map((purchase) => purchase.lessonId));

    const count = publishedCourses.reduce((total, course) => {
      const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
      const firstLessonId = lessons[0]?.id;

      const accessibleAttachments = lessons.reduce((lessonTotal, lesson) => {
        const hasAccess =
          lesson.id === firstLessonId ||
          purchasedCourseIds.has(course.id) ||
          purchasedLessonIds.has(lesson.id);

        if (!hasAccess) return lessonTotal;
        return lessonTotal + lesson.attachments.length;
      }, 0);

      return total + accessibleAttachments;
    }, 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('[pdf-count]', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
