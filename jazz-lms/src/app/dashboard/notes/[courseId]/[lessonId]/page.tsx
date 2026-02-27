import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { LessonNotesEditor } from '@/components/dashboard/lesson-notes-editor';
import { isAdminRole } from '@/lib/admin/permissions';
import { ensureLessonNotesTable } from '@/lib/lesson-notes';

interface RawLessonNote {
  userId: string;
  content: string;
  isBold: number;
  isItalic: number;
  fontSize: number;
  updatedAt: string;
}

export default async function LessonNotesPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect('/dashboard');
  }

  const orderedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const lessonIndex = orderedLessons.findIndex((lesson) => lesson.id === params.lessonId);

  if (lessonIndex < 0) {
    return redirect('/dashboard');
  }

  const lesson = orderedLessons[lessonIndex];
  const firstLessonId = orderedLessons[0]?.id;

  const [hasFullPurchase, hasLessonPurchase] = await Promise.all([
    db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    }),
    db.lessonPurchase.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
    }),
  ]);

  const dbUser = user.email
    ? await db.user.findUnique({
        where: { email: user.email },
        select: { role: true },
      })
    : null;

  const professorEmail = (process.env.PROFESSOR_EMAIL || '').trim().toLowerCase();
  const isProfessor = !!professorEmail && user.email?.toLowerCase() === professorEmail;
  const isPrivilegedViewer = isProfessor || isAdminRole(dbUser?.role ?? null);

  await ensureLessonNotesTable();

  const studentNotes = isPrivilegedViewer
    ? await db.$queryRaw<RawLessonNote[]>`
        SELECT userId, content, isBold, isItalic, fontSize, updatedAt
        FROM LessonNote
        WHERE courseId = ${params.courseId}
          AND lessonId = ${params.lessonId}
          AND content <> ''
        ORDER BY updatedAt DESC
      `
    : [];

  const studentUserIds = Array.from(new Set(studentNotes.map((note) => note.userId)));
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
      userEmail: owner?.email ?? '',
      userName: owner?.name ?? null,
      content: note.content,
      isBold: Boolean(note.isBold),
      isItalic: Boolean(note.isItalic),
      fontSize: note.fontSize,
      updatedAt: new Date(note.updatedAt).toISOString(),
    };
  });

  const canAccessNotes =
    isPrivilegedViewer ||
    lesson.id === firstLessonId ||
    !!hasFullPurchase ||
    !!hasLessonPurchase;

  if (!canAccessNotes) {
    return redirect(`/courses/${params.courseId}?locked=true`);
  }

  return (
    <LessonNotesEditor
      courseId={params.courseId}
      lessonId={params.lessonId}
      classLabel={`Class ${lessonIndex + 1}`}
      lessonTitle={lesson.title}
      isPrivilegedViewer={isPrivilegedViewer}
      studentNotes={notesForViewer}
    />
  );
}
