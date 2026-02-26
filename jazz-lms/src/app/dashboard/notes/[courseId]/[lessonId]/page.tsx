import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { LessonNotesEditor } from '@/components/dashboard/lesson-notes-editor';

export default async function LessonNotesPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId },
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

  if (!course) {
    return redirect('/dashboard');
  }

  const orderedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonIndex = orderedLessons.findIndex((lesson) => lesson.id === params.lessonId);

  if (lessonIndex < 0) {
    return redirect('/dashboard');
  }

  const lesson = orderedLessons[lessonIndex];
  const firstLessonId = orderedLessons[0]?.id;

  const [hasFullPurchase, hasLessonPurchase] = await Promise.all([
    db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    }),
    db.lessonPurchase.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
    }),
  ]);

  const canAccessNotes =
    lesson.id === firstLessonId || !!hasFullPurchase || !!hasLessonPurchase;

  if (!canAccessNotes) {
    return redirect(`/courses/${params.courseId}?locked=true`);
  }

  return (
    <LessonNotesEditor
      courseId={params.courseId}
      lessonId={params.lessonId}
      classLabel={`Class ${lessonIndex + 1}`}
      lessonTitle={lesson.title}
    />
  );
}
