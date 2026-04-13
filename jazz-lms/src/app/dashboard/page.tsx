import { CourseViewClient } from "@/components/course/course-view-client";
import {
  getCourseTranslationBundle,
  resolveLessonTitle,
} from "@/lib/course-translations";
import {
  getPublishedCourseOutline,
  hasAnyCoursePurchase,
} from "@/lib/dashboard-server-data";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "@/lib/language";
import { getCurrentUser } from "@/lib/admin";
import { isAdminRole } from "@/lib/admin/permissions";
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

  const [dbUserResult, courseResult, purchasedResult] = await Promise.allSettled([
    getCurrentUser(),
    getPublishedCourseOutline(),
    hasAnyCoursePurchase(user.id),
  ]);

  if (dbUserResult.status === "rejected") {
    console.error(
      "[dashboard] Unable to resolve admin role. Falling back to non-admin.",
      dbUserResult.reason,
    );
  }

  if (courseResult.status === "rejected") {
    console.error(
      "[dashboard] Database unavailable while loading course. Rendering fallback state.",
      courseResult.reason,
    );
  }

  if (purchasedResult.status === "rejected") {
    console.error(
      "[dashboard] Failed loading purchase state. Falling back to locked mode.",
      purchasedResult.reason,
    );
  }

  const isAdmin =
    dbUserResult.status === "fulfilled"
      ? isAdminRole(dbUserResult.value?.role ?? null)
      : false;

  const course = courseResult.status === "fulfilled" ? courseResult.value : null;
  const hasPurchased = purchasedResult.status === "fulfilled" ? purchasedResult.value : false;

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
      hasPurchased={hasPurchased || isAdmin}
      courseId={course?.id ?? null}
      lessonRoutesByTitle={lessonRoutesByTitle}
      lessonRoutesInOrder={lessonRoutesInOrder}
      lessonIdsInOrder={lessonIdsInOrder}
      lessonTitlesInOrder={lessonTitlesInOrder}
    />
  );
}
