import 'server-only';

import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';
import { resolveLessonAccessPolicy } from '@/lib/lesson-access';

export class LessonNotesAccessError extends Error {
  constructor(message: string, public statusCode: number) { super(message); }
}

export async function getLessonNotesAccess(params: {
  userId: string; userEmail?: string | null; courseId: string; lessonId: string;
}) {
  const { userId, courseId, lessonId } = params;
  const email = params.userEmail?.trim().toLowerCase() ?? '';
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase() ?? '';
  const professorEmail = process.env.PROFESSOR_EMAIL?.trim().toLowerCase() ?? '';
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const isPrivileged = Boolean(
    (email && ownerEmail && email === ownerEmail) ||
    (email && professorEmail && email === professorEmail) || isAdminRole(dbUser?.role),
  );
  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      ...(isPrivileged ? {} : { isPublished: true }),
      chapter: { courseId, ...(isPrivileged ? {} : { isPublished: true, course: { isPublished: true } }) },
    },
    select: { id: true },
  });
  if (!lesson) throw new LessonNotesAccessError('Lesson not found', 404);
  if (isPrivileged) return { lesson, isPrivileged };

  const [fullPurchase, lessonPurchase, firstLesson] = await Promise.all([
    db.purchase.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { id: true } }),
    db.lessonPurchase.findUnique({ where: { userId_lessonId: { userId, lessonId } }, select: { id: true } }),
    db.lesson.findFirst({
      where: { isPublished: true, chapter: { courseId, isPublished: true, course: { isPublished: true } } },
      orderBy: [{ chapter: { position: 'asc' } }, { position: 'asc' }], select: { id: true },
    }),
  ]);
  const access = resolveLessonAccessPolicy({
    isAdminOwner: false, hasFullPurchase: Boolean(fullPurchase), hasLessonPurchase: Boolean(lessonPurchase),
    isFreePreviewLesson: firstLesson?.id === lessonId,
  });
  if (!access.canAccessLesson) throw new LessonNotesAccessError('Purchase required', 403);
  return { lesson, isPrivileged };
}
