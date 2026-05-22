import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';
import { getCourseNoteIdentity, isCourseNoteAttachment } from '@/lib/course-notes';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage } from '@/lib/language';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
  const language = normalizeLanguage(request.cookies.get(LANGUAGE_COOKIE_KEY)?.value);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 401 });
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

    if (!isPrivilegedViewer) {
      const hasFullPurchase = await db.purchase.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!hasFullPurchase) {
        return NextResponse.json({ count: 0 });
      }
    }

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
                  attachments: {
                      where: { language },
                      select: { id: true, url: true, name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const purchasedCourseIds = new Set(fullPurchases.map((purchase) => purchase.courseId));

    const accessiblePdfKeys = new Set<string>();

    publishedCourses.forEach((course) => {
      const lessons = course.chapters.flatMap((chapter) => chapter.lessons);

      lessons.forEach((lesson) => {
        if (isPrivilegedViewer) {
          lesson.attachments.forEach((attachment) => {
            if (!isCourseNoteAttachment(attachment.name, attachment.url)) {
              return;
            }

            const identity = getCourseNoteIdentity(attachment.url, attachment.name);
            if (identity) {
              accessiblePdfKeys.add(identity);
            }
          });
          return;
        }

        const hasAccess = purchasedCourseIds.has(course.id);

        if (!hasAccess) return;

        lesson.attachments.forEach((attachment) => {
          if (!isCourseNoteAttachment(attachment.name, attachment.url)) {
            return;
          }

          const identity = getCourseNoteIdentity(attachment.url, attachment.name);
          if (identity) {
            accessiblePdfKeys.add(identity);
          }
        });
      });
    });

    return NextResponse.json({ count: accessiblePdfKeys.size });
  } catch (error) {
    console.error('[pdf-count]', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
