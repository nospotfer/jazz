import { redirect } from 'next/navigation';
import { CourseViewClient } from '@/components/course/course-view-client';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { isLocalhostHost } from '@/lib/test-mode';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: {
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

  const lessonRoutesByTitle = course
    ? Object.fromEntries(
        course.chapters
          .flatMap((chapter) => chapter.lessons)
          .map((lesson) => [
            lesson.title.toLowerCase().trim(),
            `/courses/${course.id}/lessons/${lesson.id}`,
          ])
      )
    : {};

  const orderedLessons = course
    ? course.chapters.flatMap((chapter) => chapter.lessons)
    : [];

  const lessonRoutesInOrder = orderedLessons.map(
    (lesson) => `/courses/${course?.id}/lessons/${lesson.id}`
  );

  const lessonIdsInOrder = orderedLessons.map((lesson) => lesson.id);
  const lessonTitlesInOrder = orderedLessons.map((lesson) => lesson.title);

  const hasPurchased = course
    ? !!(await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      }))
    : false;

  const isLocalTestMode =
    process.env.NODE_ENV !== 'production' && isLocalhostHost(headers().get('host'));

  return (
    <CourseViewClient
      userName={user.user_metadata?.full_name || user.email || 'Jazz Student'}
      hasPurchased={hasPurchased}
      courseId={course?.id ?? null}
      lessonRoutesByTitle={lessonRoutesByTitle}
      lessonRoutesInOrder={lessonRoutesInOrder}
      lessonIdsInOrder={lessonIdsInOrder}
      lessonTitlesInOrder={lessonTitlesInOrder}
      isLocalTestMode={isLocalTestMode}
    />
  );
}
