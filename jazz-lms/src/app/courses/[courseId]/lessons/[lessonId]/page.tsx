import { CoursePlayer } from "@/components/course/course-player";
import {
  getCourseTranslationBundle,
  resolveCourseText,
  resolveLessonTitle,
} from "@/lib/course-translations";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "@/lib/language";
import { LESSON_QUIZ_QUESTION_COUNT } from "@/lib/lesson-quiz";
import {
  getLessonQuizQuestionBankCount,
  getLessonQuizSummary,
} from "@/lib/lesson-quiz-server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LessonPage = async ({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) => {
  const { courseId, lessonId } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth");
  }

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      chapters: {
        orderBy: {
          position: "asc",
        },
        include: {
          lessons: {
            orderBy: {
              position: "asc",
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
    return redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const language = normalizeLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );
  const orderedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonClassById = new Map(
    orderedLessons.map((item, index) => [item.id, index + 1]),
  );

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: [course.id],
    chapterIds: course.chapters.map((chapter) => chapter.id),
    lessonIds: orderedLessons.map((item) => item.id),
  });

  const localizedCourse = {
    ...course,
    ...resolveCourseText(
      translationBundle.courses,
      course.id,
      course.title,
      course.description,
    ),
    chapters: course.chapters.map((chapter) => ({
      ...chapter,
      ...resolveCourseText(
        translationBundle.chapters,
        chapter.id,
        chapter.title,
        chapter.description,
      ),
      lessons: chapter.lessons.map((item) => ({
        ...item,
        title: resolveLessonTitle(
          translationBundle.lessons,
          item.id,
          item.title,
          language,
          lessonClassById.get(item.id),
        ),
      })),
    })),
  };

  const lesson = localizedCourse.chapters
    .flatMap((chapter) => chapter.lessons)
    .find((lesson) => lesson.id === lessonId);

  if (!lesson || !lesson.isPublished) {
    return redirect("/dashboard");
  }

  const hasFullPurchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  const hasLessonPurchase = await db.lessonPurchase.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId,
      },
    },
  });

  const canAccessLesson = !!hasFullPurchase || !!hasLessonPurchase;
  const isAdminOwner =
    user.email?.toLowerCase() ===
    (process.env.ADMIN_OWNER_EMAIL ?? "").toLowerCase();
  const canAccessAttachments = Boolean(canAccessLesson || isAdminOwner);

  const [userProgress, initialQuizSummary, quizQuestionBankCount] =
    await Promise.all([
      db.userProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId,
          },
        },
        select: {
          isCompleted: true,
          progressPercent: true,
        },
      }),
      getLessonQuizSummary(user.id, lessonId),
      getLessonQuizQuestionBankCount(lessonId),
    ]);

  const initialIsCompleted =
    Boolean(userProgress?.isCompleted) ||
    (userProgress?.progressPercent ?? 0) >= 100;
  const initialProgressPercent = initialIsCompleted
    ? 100
    : (userProgress?.progressPercent ?? 0);
  const hasQuizAvailable = quizQuestionBankCount >= LESSON_QUIZ_QUESTION_COUNT;

  if (!canAccessLesson) {
    return redirect(`/courses/${courseId}?locked=true`);
  }

  return (
    <div>
      <CoursePlayer
        course={localizedCourse}
        lesson={lesson}
        lessonId={lessonId}
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
