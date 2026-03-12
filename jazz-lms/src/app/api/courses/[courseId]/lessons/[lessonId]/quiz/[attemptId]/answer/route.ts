import { NextResponse } from 'next/server';

import {
  assertLessonQuizAccess,
  isLessonQuizError,
  submitLessonQuizAnswer,
} from '@/lib/lesson-quiz-server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; lessonId: string; attemptId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const questionId = typeof body?.questionId === 'string' ? body.questionId : '';
    const optionId = typeof body?.optionId === 'string' ? body.optionId : '';

    if (!questionId || !optionId) {
      return NextResponse.json(
        {
          error: 'Question and option are required.',
          code: 'QUIZ_ANSWER_INVALID_PAYLOAD',
        },
        { status: 400 }
      );
    }

    await assertLessonQuizAccess({
      userId: user.id,
      courseId: params.courseId,
      lessonId: params.lessonId,
    });

    const payload = await submitLessonQuizAnswer({
      userId: user.id,
      lessonId: params.lessonId,
      attemptId: params.attemptId,
      questionId,
      optionId,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (isLessonQuizError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.log('[LESSON_QUIZ_ANSWER_ERROR]', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        code: 'LESSON_QUIZ_ANSWER_ERROR',
      },
      { status: 500 }
    );
  }
}