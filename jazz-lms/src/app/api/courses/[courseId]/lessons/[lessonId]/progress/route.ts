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
    const { isCompleted } = await req.json();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userProgress = await db.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        userId: user.id,
        lessonId: params.lessonId,
        isCompleted,
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.log('[LESSON_PROGRESS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
