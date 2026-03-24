import { NextResponse } from "next/server";

import {
  assertLessonQuizAccess,
  createOrResumeLessonQuizAttempt,
  isLessonQuizError,
} from "@/lib/lesson-quiz-server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  try {
    const { courseId, lessonId } = await params;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const restart = body?.restart === true;
    const language =
      body?.language === "es" ||
      body?.language === "en" ||
      body?.language === "fr" ||
      body?.language === "pt"
        ? body.language
        : "es";

    await assertLessonQuizAccess({
      userId: user.id,
      courseId,
      lessonId,
    });

    const payload = await createOrResumeLessonQuizAttempt({
      userId: user.id,
      lessonId,
      restart,
      language,
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

    console.log("[LESSON_QUIZ_START_ERROR]", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code: "LESSON_QUIZ_START_ERROR",
      },
      { status: 500 },
    );
  }
}
