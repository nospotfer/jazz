import { CourseEnrollButton } from "@/components/course/course-enroll-button";
import {
  getCourseTranslationBundle,
  resolveCourseText,
  resolveLessonTitle,
} from "@/lib/course-translations";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "@/lib/language";
import { DEFAULT_FULL_COURSE_PRICE_EUR } from "@/lib/pricing";
import { createClient } from "@/utils/supabase/server";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const cookieStore = await cookies();
  const language = normalizeLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );
  const copy = {
    es: {
      chapter: "capítulo",
      chapterPlural: "capítulos",
      lesson: "lección",
      lessonPlural: "lecciones",
      contentTitle: "Contenido del curso",
      chapterLabel: "Capítulo",
      fullAccess: "Acceso completo a las 15 clases",
      securePayment: "Pago seguro gestionado por Lemon Squeezy",
    },
    en: {
      chapter: "chapter",
      chapterPlural: "chapters",
      lesson: "lesson",
      lessonPlural: "lessons",
      contentTitle: "Course content",
      chapterLabel: "Chapter",
      fullAccess: "Full access to all 15 classes",
      securePayment: "Secure payment handled by Lemon Squeezy",
    },
    fr: {
      chapter: "chapitre",
      chapterPlural: "chapitres",
      lesson: "leçon",
      lessonPlural: "leçons",
      contentTitle: "Contenu du cours",
      chapterLabel: "Chapitre",
      fullAccess: "Accès complet aux 15 cours",
      securePayment: "Paiement sécurisé géré par Lemon Squeezy",
    },
    pt: {
      chapter: "capítulo",
      chapterPlural: "capítulos",
      lesson: "aula",
      lessonPlural: "aulas",
      contentTitle: "Conteúdo do curso",
      chapterLabel: "Capítulo",
      fullAccess: "Acesso completo às 15 aulas",
      securePayment: "Pagamento seguro processado pelo Lemon Squeezy",
    },
  }[language];

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
      isPublished: true,
    },
    include: {
      purchases: {
        where: { userId: user.id },
      },
      chapters: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect("/dashboard");
  }

  const hasPurchased = course.purchases.length > 0;
  const displayPrice =
    course.price && course.price > 0 ? DEFAULT_FULL_COURSE_PRICE_EUR : 0;
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0,
  );
  const orderedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonClassById = new Map(
    orderedLessons.map((lesson, index) => [lesson.id, index + 1]),
  );

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: [course.id],
    chapterIds: course.chapters.map((chapter) => chapter.id),
    lessonIds: orderedLessons.map((lesson) => lesson.id),
  });

  const localizedCourse = resolveCourseText(
    translationBundle.courses,
    course.id,
    course.title,
    course.description,
  );

  // If already purchased, redirect to first lesson
  if (hasPurchased) {
    const firstLesson = course.chapters[0]?.lessons[0];
    if (firstLesson) {
      return redirect(`/courses/${course.id}/lessons/${firstLesson.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            {localizedCourse.title}
          </h1>
          {localizedCourse.description && (
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
              {localizedCourse.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.chapters.length}{" "}
              {course.chapters.length !== 1 ? copy.chapterPlural : copy.chapter}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {totalLessons}{" "}
              {totalLessons !== 1 ? copy.lessonPlural : copy.lesson}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course content */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif font-semibold text-foreground">
            {copy.contentTitle}
          </h2>
          <div className="space-y-4">
            {course.chapters.map((chapter, chapterIndex) => {
              const localizedChapter = resolveCourseText(
                translationBundle.chapters,
                chapter.id,
                chapter.title,
                chapter.description,
              );

              return (
                <div
                  key={chapter.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 bg-muted/50 border-b border-border">
                    <h3 className="font-semibold text-foreground">
                      {copy.chapterLabel} {chapterIndex + 1}:{" "}
                      {localizedChapter.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {chapter.lessons.length}{" "}
                      {chapter.lessons.length !== 1
                        ? copy.lessonPlural
                        : copy.lesson}
                    </p>
                  </div>
                  <ul className="divide-y divide-border">
                    {chapter.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <span className="truncate">
                            {resolveLessonTitle(
                              translationBundle.lessons,
                              lesson.id,
                              lesson.title,
                              language,
                              lessonClassById.get(lesson.id),
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Purchase card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                €{displayPrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {copy.fullAccess}
              </p>
            </div>
            <CourseEnrollButton courseId={course.id} price={displayPrice} />
            <div className="text-xs text-center text-muted-foreground">
              {copy.securePayment}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
