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

  if (!lesson) {
    return redirect('/dashboard');
  }

  return (
    <div>
      <CoursePlayer course={course} lesson={lesson} lessonId={params.lessonId} />
    </div>
  );
};

export default LessonPage;
