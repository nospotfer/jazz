import { CourseViewClient } from "@/components/course/course-view-client";
import {
  getCourseTranslationBundle,
  resolveLessonTitle,
} from "@/lib/course-translations";
import { hasAnyCoursePurchase } from "@/lib/dashboard-server-data";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "@/lib/language";
import { getServerUser } from "@/lib/server-user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const language = normalizeLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );
  const user = await getServerUser();

  if (!user) {
    return redirect("/auth");
  }

  let course: {
    id: string;
    chapters: { id: string; lessons: { id: string; title: string }[] }[];
  } | null = null;

  let hasPurchased = false;

  try {
    course = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: {
            id: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    hasPurchased = await hasAnyCoursePurchase(user.id);
  } catch (error) {
    console.error(
      "[dashboard] Database unavailable. Rendering fallback state.",
      error,
    );
  }

  const lessonRoutesByTitle = course
    ? Object.fromEntries(
        course.chapters
          .flatMap((chapter) => chapter.lessons)
          .map((lesson) => [
            lesson.title.toLowerCase().trim(),
            `/courses/${course.id}/lessons/${lesson.id}`,
          ]),
      )
    : {};

  const orderedLessons = course
    ? course.chapters.flatMap((chapter) => chapter.lessons)
    : [];
  const lessonClassById = new Map(
    orderedLessons.map((lesson, index) => [lesson.id, index + 1]),
  );

  const translationBundle = course
    ? await getCourseTranslationBundle({
        language,
        courseIds: [course.id],
        chapterIds: course.chapters.map((chapter) => chapter.id),
        lessonIds: orderedLessons.map((lesson) => lesson.id),
      })
    : null;

  const lessonRoutesInOrder = orderedLessons.map(
    (lesson) => `/courses/${course?.id}/lessons/${lesson.id}`,
  );

  const lessonIdsInOrder = orderedLessons.map((lesson) => lesson.id);
  const lessonTitlesInOrder = orderedLessons.map((lesson) =>
    translationBundle
      ? resolveLessonTitle(
          translationBundle.lessons,
          lesson.id,
          lesson.title,
          language,
          lessonClassById.get(lesson.id),
        )
      : lesson.title,
  );

  return (
    <CourseViewClient
      userName={
        user.user_metadata?.full_name || user.email || "Estudiante de Jazz"
      }
      hasPurchased={hasPurchased}
      courseId={course?.id ?? null}
      lessonRoutesByTitle={lessonRoutesByTitle}
      lessonRoutesInOrder={lessonRoutesInOrder}
      lessonIdsInOrder={lessonIdsInOrder}
      lessonTitlesInOrder={lessonTitlesInOrder}
    />
  );
}
