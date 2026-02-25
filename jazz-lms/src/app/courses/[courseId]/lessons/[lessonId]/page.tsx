import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CoursePlayer } from '@/components/course/course-player';
import { db } from '@/lib/db';

const LessonPage = async ({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        orderBy: {
          position: 'asc',
        },
        include: {
          lessons: {
            orderBy: {
              position: 'asc',
            },
            include: {
              attachments: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect('/dashboard');
  }

  const lesson = course.chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.id === params.lessonId);
  const firstLessonId = course.chapters
    .flatMap((chapter) => chapter.lessons)
    .at(0)?.id;


  if (!lesson) {
    return redirect('/dashboard');
  }

  const hasFullPurchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      },
    },
  });

  const hasLessonPurchase = await db.lessonPurchase.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: params.lessonId,
      },
    },
  });

  const canAccessLesson =
    lesson.isPublished &&
    (lesson.id === firstLessonId || !!hasFullPurchase || !!hasLessonPurchase);

  if (!canAccessLesson) {
    return redirect(`/courses/${params.courseId}?locked=true`);
  }

  return (
    <div>
      <CoursePlayer course={course} lesson={lesson} lessonId={params.lessonId} />
    </div>
  );
};

export default LessonPage;
