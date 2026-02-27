import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';
import { ensureLessonNotesTable } from '@/lib/lesson-notes';

interface RawLessonNote {
  userId: string;
  courseId: string;
  lessonId: string;
  content: string;
  isBold: number;
  isItalic: number;
  fontSize: number;
  updatedAt: string;
}

function isPrivilegedUser(email: string | undefined, role: string | null | undefined) {
  const professorEmail = (process.env.PROFESSOR_EMAIL || '').trim().toLowerCase();
  const isProfessor = !!professorEmail && !!email && email.toLowerCase() === professorEmail;
  return isProfessor || isAdminRole(role ?? null);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');
    const lessonId = request.nextUrl.searchParams.get('lessonId');
    const targetUserId = request.nextUrl.searchParams.get('userId');

    if (!courseId || !lessonId) {
      return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 });
    }

    const dbUser = user.email
      ? await db.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        })
      : null;

    const privileged = isPrivilegedUser(user.email, dbUser?.role);
    const requestedUserId = targetUserId || user.id;

    if (!privileged && requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureLessonNotesTable();

    const rows = await db.$queryRaw<RawLessonNote[]>`
      SELECT userId, courseId, lessonId, content, isBold, isItalic, fontSize, updatedAt
      FROM LessonNote
      WHERE userId = ${requestedUserId}
        AND lessonId = ${lessonId}
      LIMIT 1
    `;
    const note = rows[0] ?? null;

    return NextResponse.json({
      note: note
        ? {
            userId: note.userId,
            courseId: note.courseId,
            lessonId: note.lessonId,
            content: note.content,
            isBold: Boolean(note.isBold),
            isItalic: Boolean(note.isItalic),
            fontSize: note.fontSize,
            updatedAt: note.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('[dashboard:notes:get]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const courseId = String(body.courseId || '').trim();
    const lessonId = String(body.lessonId || '').trim();
    const content = String(body.content || '');

    if (!courseId || !lessonId) {
      return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 });
    }

    const isBold = Boolean(body.isBold);
    const isItalic = Boolean(body.isItalic);
    const rawFontSize = Number(body.fontSize);
    const fontSize = Number.isFinite(rawFontSize) ? Math.max(11, Math.min(14, rawFontSize)) : 13;

    await ensureLessonNotesTable();

    await db.$executeRaw`
      INSERT INTO LessonNote (id, userId, courseId, lessonId, content, isBold, isItalic, fontSize, createdAt, updatedAt)
      VALUES (
        ${crypto.randomUUID()},
        ${user.id},
        ${courseId},
        ${lessonId},
        ${content},
        ${isBold ? 1 : 0},
        ${isItalic ? 1 : 0},
        ${fontSize},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(userId, lessonId) DO UPDATE SET
        courseId = excluded.courseId,
        content = excluded.content,
        isBold = excluded.isBold,
        isItalic = excluded.isItalic,
        fontSize = excluded.fontSize,
        updatedAt = CURRENT_TIMESTAMP
    `;

    const savedRows = await db.$queryRaw<RawLessonNote[]>`
      SELECT userId, courseId, lessonId, content, isBold, isItalic, fontSize, updatedAt
      FROM LessonNote
      WHERE userId = ${user.id}
        AND lessonId = ${lessonId}
      LIMIT 1
    `;
    const saved = savedRows[0];

    if (!saved) {
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      note: {
        content: saved.content,
        isBold: Boolean(saved.isBold),
        isItalic: Boolean(saved.isItalic),
        fontSize: saved.fontSize,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    console.error('[dashboard:notes:put]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
