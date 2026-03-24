import { NextResponse } from "next/server";

import {
  assertLessonQuizAccess,
  isLessonQuizError,
  submitLessonQuizAnswer,
} from "@/lib/lesson-quiz-server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ courseId: string; lessonId: string; attemptId: string }>;
  },
) {
  try {
    const { courseId, lessonId, attemptId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const questionId =
      typeof body?.questionId === "string" ? body.questionId : "";
    const optionId = typeof body?.optionId === "string" ? body.optionId : "";
    const answers = Array.isArray(body?.answers)
      ? (
          body.answers as Array<{
            questionId?: unknown;
            selectedOptionId?: unknown;
          }>
        ).flatMap((entry) => {
          if (
            typeof entry?.questionId !== "string" ||
            typeof entry?.selectedOptionId !== "string"
          ) {
            return [];
          }

          return [
            {
              questionId: entry.questionId,
              selectedOptionId: entry.selectedOptionId,
            },
          ];
        })
      : [];

    if (!questionId || !optionId) {
      return NextResponse.json(
        {
          error: "Question and option are required.",
          code: "QUIZ_ANSWER_INVALID_PAYLOAD",
        },
        { status: 400 },
      );
    }

    await assertLessonQuizAccess({
      userId: user.id,
      courseId,
      lessonId,
    });

    const payload = await submitLessonQuizAnswer({
      userId: user.id,
      lessonId,
      attemptId,
      questionId,
      optionId,
      answers,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (isLessonQuizError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    console.log("[LESSON_QUIZ_ANSWER_ERROR]", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code: "LESSON_QUIZ_ANSWER_ERROR",
      },
      { status: 500 },
    );
  }
}
