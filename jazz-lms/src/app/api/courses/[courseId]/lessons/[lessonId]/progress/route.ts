import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { isCompleted, progressPercent, minutesRemaining } = await req.json();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const safeProgressPercent = Number.isFinite(progressPercent)
      ? Math.max(0, Math.min(100, Number(progressPercent)))
      : undefined;

    const safeMinutesRemaining = Number.isFinite(minutesRemaining)
      ? Math.max(0, Math.floor(Number(minutesRemaining)))
      : undefined;

    const userProgress = await db.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
      update: {
        isCompleted,
        ...(safeProgressPercent !== undefined && {
          progressPercent: safeProgressPercent,
        }),
        ...(safeMinutesRemaining !== undefined && {
          minutesRemaining: safeMinutesRemaining,
        }),
        ...(isCompleted && {
          progressPercent: 100,
          minutesRemaining: 0,
        }),
      },
      create: {
        userId: user.id,
        lessonId: params.lessonId,
        isCompleted,
        progressPercent: isCompleted
          ? 100
          : safeProgressPercent !== undefined
          ? safeProgressPercent
          : 0,
        minutesRemaining: isCompleted
          ? 0
          : safeMinutesRemaining !== undefined
          ? safeMinutesRemaining
          : 20,
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.log('[LESSON_PROGRESS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
