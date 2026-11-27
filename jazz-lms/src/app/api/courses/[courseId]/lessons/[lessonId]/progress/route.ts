import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { expectedUserConsistencyResponse } from '@/lib/expected-user-consistency';
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { assertLessonQuizAccess, isLessonQuizError } from "@/lib/lesson-quiz-server";
import { NextResponse } from "next/server";

export async function PUT(
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

    const mismatch = expectedUserConsistencyResponse(req, user.id);
    if (mismatch) return mismatch;

    await assertLessonQuizAccess({ userId: user.id, userEmail: user.email, courseId, lessonId, allowFreePreview: true });
    const { isCompleted, progressPercent, minutesRemaining } = await req.json();
    if (
      (isCompleted !== undefined && typeof isCompleted !== "boolean") ||
      (progressPercent !== undefined && !Number.isFinite(progressPercent)) ||
      (minutesRemaining !== undefined && !Number.isFinite(minutesRemaining))
    ) {
      return new NextResponse("Invalid progress", { status: 400 });
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
          lessonId,
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
        lessonId,
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
    if (isLessonQuizError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.log("[LESSON_PROGRESS_ERROR]", safeErrorDiagnostic(error));
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
