import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { PdfViewClient } from '@/components/dashboard/pdf-view-client';
import { isAdminRole } from '@/lib/admin/permissions';

export default async function PdfViewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
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
                attachments: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const purchasedCourseIds = new Set(fullPurchases.map((purchase) => purchase.courseId));
  const purchasedLessonIds = new Set(lessonPurchases.map((purchase) => purchase.lessonId));

  const items = publishedCourses.flatMap((course) => {
    const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
    const firstLessonId = lessons[0]?.id;

    return lessons.flatMap((lesson, index) => {
      const hasAccess =
        isPrivilegedViewer ||
        lesson.id === firstLessonId ||
        purchasedCourseIds.has(course.id) ||
        purchasedLessonIds.has(lesson.id);

      if (!hasAccess) return [];

      return lesson.attachments.map((attachment) => ({
        id: attachment.id,
        lessonId: lesson.id,
        title: lesson.title,
        classLabel: `Class ${index + 1}`,
        url: attachment.url,
      }));
    });
  });

  return <PdfViewClient items={items} />;
}
