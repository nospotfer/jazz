import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { CoursePlayer } from '@/components/course/course-player';
import { db } from '@/lib/db';
import { LESSON_QUIZ_QUESTION_COUNT } from '@/lib/lesson-quiz';
import { getLessonQuizQuestionBankCount, getLessonQuizSummary } from '@/lib/lesson-quiz-server';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';
import { getCourseTranslationBundle, resolveCourseText, resolveLessonTitle } from '@/lib/course-translations';

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

  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
  const orderedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonClassById = new Map(orderedLessons.map((item, index) => [item.id, index + 1]));

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: [course.id],
    chapterIds: course.chapters.map((chapter) => chapter.id),
    lessonIds: orderedLessons.map((item) => item.id),
  });

  const localizedCourse = {
    ...course,
    ...resolveCourseText(translationBundle.courses, course.id, course.title, course.description),
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      ...resolveCourseText(translationBundle.chapters, chapter.id, chapter.title, chapter.description),
      lessons: chapter.lessons.map((item) => ({
        ...item,
        title: resolveLessonTitle(
          translationBundle.lessons,
          item.id,
          item.title,
          language,
          lessonClassById.get(item.id)
        ),
      })),
    })),
  };

  const lesson = localizedCourse.chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.id === params.lessonId);


  if (!lesson || !lesson.isPublished) {
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

  const canAccessLesson = !!hasFullPurchase;
  const isAdminOwner =
    user.email?.toLowerCase() === (process.env.ADMIN_OWNER_EMAIL ?? '').toLowerCase();
  const canAccessAttachments = Boolean(canAccessLesson || isAdminOwner);

  const [userProgress, initialQuizSummary, quizQuestionBankCount] = await Promise.all([
    db.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
      select: {
        isCompleted: true,
        progressPercent: true,
      },
    }),
    getLessonQuizSummary(user.id, params.lessonId),
    getLessonQuizQuestionBankCount(params.lessonId),
  ]);

  const initialIsCompleted =
    Boolean(userProgress?.isCompleted) || (userProgress?.progressPercent ?? 0) >= 100;
  const initialProgressPercent = initialIsCompleted
    ? 100
    : userProgress?.progressPercent ?? 0;
  const hasQuizAvailable = quizQuestionBankCount >= LESSON_QUIZ_QUESTION_COUNT;

  if (!canAccessLesson) {
    return redirect(`/courses/${params.courseId}?locked=true`);
  }

  return (
    <div>
      <CoursePlayer
        course={localizedCourse}
        lesson={lesson}
        lessonId={params.lessonId}
        initialIsCompleted={initialIsCompleted}
        initialProgressPercent={initialProgressPercent}
        initialQuizSummary={initialQuizSummary}
        hasQuizAvailable={hasQuizAvailable}
        canAccessLesson={canAccessLesson}
        canAccessAttachments={canAccessAttachments}
      />
    </div>
  );
};

export default LessonPage;
