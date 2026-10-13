import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { getLessonNotesAccess, LessonNotesAccessError } from '@/lib/lesson-notes';

export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'no-store, private, max-age=0' };

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const courseId = request.nextUrl.searchParams.get('courseId');
    const lessonId = request.nextUrl.searchParams.get('lessonId');
    const targetUserId = request.nextUrl.searchParams.get('userId') || user.id;
    if (!courseId || !lessonId) return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 });
    const access = await getLessonNotesAccess({ userId: user.id, userEmail: user.email, courseId, lessonId });
    if (!access.isPrivileged && targetUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const note = await db.lessonNote.findFirst({ where: { userId: targetUserId, courseId, lessonId } });
    return NextResponse.json({ note }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof LessonNotesAccessError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[dashboard:notes:get]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.courseId !== 'string' || typeof body.lessonId !== 'string' ||
      typeof body.content !== 'string' || (body.isBold !== undefined && typeof body.isBold !== 'boolean') ||
      (body.isItalic !== undefined && typeof body.isItalic !== 'boolean')) {
      return NextResponse.json({ error: 'Invalid note' }, { status: 400 });
    }
    const courseId = body.courseId.trim();
    const lessonId = body.lessonId.trim();
    if (!courseId || !lessonId) return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 });
    await getLessonNotesAccess({ userId: user.id, userEmail: user.email, courseId, lessonId });
    const rawFontSize = Number(body.fontSize);
    const fontSize = Number.isFinite(rawFontSize) ? Math.max(11, Math.min(14, Math.floor(rawFontSize))) : 13;
    const data = { courseId, content: body.content, isBold: body.isBold ?? false, isItalic: body.isItalic ?? false, fontSize };
    const saved = await db.lessonNote.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, ...data }, update: data,
    });
    return NextResponse.json({ ok: true, note: saved }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof LessonNotesAccessError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[dashboard:notes:put]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
