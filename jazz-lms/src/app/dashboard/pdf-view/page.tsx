import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { PdfViewClient } from '@/components/dashboard/pdf-view-client';
import { isAdminRole } from '@/lib/admin/permissions';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';
import { getLocalizedJazzClassLabel } from '@/lib/course-lessons';
import { getCourseTranslationBundle, resolveLessonTitle } from '@/lib/course-translations';

function isAuxiliaryAttachment(name: string) {
  return /auxiliar|auxiliares|auxiliary|support/i.test(name);
}

function getClassNumberFromAttachment(pathOrName: string) {
  const match = pathOrName.match(/clase\s*(\d{1,2})/i);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isInteger(value) ? value : null;
}

export default async function PdfViewPage() {
  const supabase = createClient();
  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
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

  const orderedLessons = publishedCourses.flatMap((course) =>
    course.chapters.flatMap((chapter) => chapter.lessons)
  );
  const lessonClassById = new Map(orderedLessons.map((lesson, index) => [lesson.id, index + 1]));

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: publishedCourses.map((course) => course.id),
    chapterIds: publishedCourses.flatMap((course) => course.chapters.map((chapter) => chapter.id)),
    lessonIds: orderedLessons.map((lesson) => lesson.id),
  });

  const auxiliaryLabel = {
    es: 'Apuntes Auxiliares',
    en: 'Auxiliary Notes',
    fr: 'Notes auxiliaires',
    pt: 'Notas auxiliares',
  }[language];

  const items = publishedCourses
    .flatMap((course) => {
    const lessons = course.chapters.flatMap((chapter) => chapter.lessons);

    return lessons.flatMap((lesson, index) => {
      const hasAccess =
        isPrivilegedViewer ||
        purchasedCourseIds.has(course.id) ||
        purchasedLessonIds.has(lesson.id);

      if (!hasAccess) return [];

      return lesson.attachments.map((attachment) => {
        const isAuxiliary = isAuxiliaryAttachment(attachment.name);
        const classNumber = getClassNumberFromAttachment(attachment.url) ?? index + 1;
        const resolvedClassNumber = lessonClassById.get(lesson.id) ?? classNumber;

        return {
          id: attachment.id,
          lessonId: lesson.id,
          title: isAuxiliary
            ? attachment.name
            : resolveLessonTitle(
                translationBundle.lessons,
                lesson.id,
                lesson.title,
                language,
                resolvedClassNumber
              ),
          classLabel: isAuxiliary ? auxiliaryLabel : getLocalizedJazzClassLabel(resolvedClassNumber, language),
          url: attachment.url,
          classNumber: resolvedClassNumber,
          isAuxiliary,
        };
      });
    });
  })
    .sort((a, b) => {
      if (a.isAuxiliary !== b.isAuxiliary) {
        return a.isAuxiliary ? 1 : -1;
      }

      return a.classNumber - b.classNumber;
    })
    .map(({ classNumber, isAuxiliary, ...item }) => item);

  return <PdfViewClient items={items} />;
}
