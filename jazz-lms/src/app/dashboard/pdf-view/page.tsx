import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { PdfViewClient } from '@/components/dashboard/pdf-view-client';
import { isAdminRole } from '@/lib/admin/permissions';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';
import { getLocalizedJazzClassLabel } from '@/lib/course-lessons';
import { getCourseTranslationBundle, resolveLessonTitle } from '@/lib/course-translations';
import {
  getCourseNoteClassNumber,
  getCourseNoteIdentity,
  isAuxiliaryCourseNote,
  isCourseNoteAttachment,
} from '@/lib/course-notes';

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

  const [fullPurchases, publishedCourses] = await Promise.all([
    db.purchase.findMany({
      where: { userId: user.id },
      select: { courseId: true },
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

  const orderedLessons = publishedCourses.flatMap((course) =>
    course.chapters.flatMap((chapter) => chapter.lessons)
  );

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

  const dedupedItems = new Map<string, {
    id: string;
    lessonId: string;
    title: string;
    classLabel: string;
    url: string;
    classNumber: number;
    isAuxiliary: boolean;
  }>();

  publishedCourses
    .flatMap((course) => {
      const lessons = course.chapters.flatMap((chapter) => chapter.lessons);

      return lessons.flatMap((lesson, index) => {
        const hasAccess =
          isPrivilegedViewer ||
          purchasedCourseIds.has(course.id);

        if (!hasAccess) return [];

        return lesson.attachments.map((attachment) => {
          if (!isCourseNoteAttachment(attachment.name, attachment.url)) {
            return null;
          }

          const isAuxiliary = isAuxiliaryCourseNote(attachment.name, attachment.url);
          const classNumber = getCourseNoteClassNumber(attachment.url || attachment.name) ?? lesson.position ?? index + 1;
          const resolvedClassNumber = classNumber;
          const attachmentIdentity = getCourseNoteIdentity(attachment.url, attachment.name);
          const identity = `${isAuxiliary ? 'aux' : 'class'}:${attachmentIdentity || `${resolvedClassNumber}:${attachment.id}`}`;

          if (dedupedItems.has(identity)) {
            return null;
          }

          const item = {
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

          dedupedItems.set(identity, item);

          return item;
        });
      });
    })
    .filter(Boolean);

  const items = Array.from(dedupedItems.values())
    .sort((a, b) => {
      if (a.isAuxiliary !== b.isAuxiliary) {
        return a.isAuxiliary ? 1 : -1;
      }

      return a.classNumber - b.classNumber;
    })
    .map(({ classNumber, isAuxiliary, ...item }) => item);

  return <PdfViewClient items={items} />;
}
