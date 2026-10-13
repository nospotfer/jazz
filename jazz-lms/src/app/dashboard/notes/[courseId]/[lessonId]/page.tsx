import { LessonNotesEditor } from "@/components/dashboard/lesson-notes-editor";
import { isCourseNoteAttachment } from "@/lib/course-notes";
import { getLocalizedJazzClassLabel } from "@/lib/course-lessons";
import {
  getCourseTranslationBundle,
  resolveLessonTitle,
} from "@/lib/course-translations";
import { db } from "@/lib/db";
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from "@/lib/language";
import { getLessonNotesAccess, LessonNotesAccessError } from "@/lib/lesson-notes";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface LessonPdfAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
}

export default async function LessonNotesPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect("/auth");
  }

  const access = await getLessonNotesAccess({ userId: user.id, userEmail: user.email, courseId, lessonId }).catch((error) => {
    if (error instanceof LessonNotesAccessError) return redirect(`/courses/${courseId}?locked=true`);
    throw error;
  });
  const isPrivilegedViewer = access.isPrivileged;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        where: isPrivilegedViewer ? undefined : { isPublished: true },
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: isPrivilegedViewer ? undefined : { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              attachments: {
                select: {
                  id: true,
                  lessonId: true,
                  name: true,
                  url: true,
                },
              },
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
  const lessonIndex = orderedLessons.findIndex(
    (lesson) => lesson.id === lessonId,
  );

  if (lessonIndex < 0) {
    return redirect("/dashboard");
  }

  const lesson = orderedLessons[lessonIndex];

  const lessonPdfAttachments: LessonPdfAttachment[] = lesson.attachments
    .filter((attachment) => {
      const loweredName = (attachment.name || "").toLowerCase();
      const loweredUrl = (attachment.url || "").toLowerCase();

      if (isCourseNoteAttachment(attachment.name || "", attachment.url || "")) {
        return true;
      }

      return loweredName.endsWith(".pdf") || loweredUrl.includes(".pdf");
    })
    .map((attachment) => ({
      id: attachment.id,
      lessonId: attachment.lessonId,
      name: attachment.name,
      url: attachment.url,
    }));

  const translationBundle = await getCourseTranslationBundle({
    language,
    courseIds: [course.id],
    chapterIds: course.chapters.map((chapter) => chapter.id),
    lessonIds: orderedLessons.map((item) => item.id),
  });

  const localizedLessonTitle = resolveLessonTitle(
    translationBundle.lessons,
    lesson.id,
    lesson.title,
    language,
    lessonIndex + 1,
  );

  const studentNotes = isPrivilegedViewer
    ? await db.lessonNote.findMany({
        where: { courseId, lessonId, content: { not: '' } },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  const studentUserIds = Array.from(
    new Set(studentNotes.map((note) => note.userId)),
  );
  const studentUsers = studentUserIds.length
    ? await db.user.findMany({
        where: { id: { in: studentUserIds } },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
    : [];

  const studentMap = new Map(studentUsers.map((entry) => [entry.id, entry]));

  const notesForViewer = studentNotes.map((note) => {
    const owner = studentMap.get(note.userId);
    return {
      userId: note.userId,
      userEmail: owner?.email ?? "",
      userName: owner?.name ?? null,
      content: note.content,
      isBold: Boolean(note.isBold),
      isItalic: Boolean(note.isItalic),
      fontSize: note.fontSize,
      updatedAt: new Date(note.updatedAt).toISOString(),
    };
  });

  return (
    <LessonNotesEditor
      courseId={courseId}
      lessonId={lessonId}
      classLabel={getLocalizedJazzClassLabel(lessonIndex + 1, language)}
      lessonTitle={localizedLessonTitle}
      pdfAttachments={lessonPdfAttachments}
      isPrivilegedViewer={isPrivilegedViewer}
      studentNotes={notesForViewer}
    />
  );
}
