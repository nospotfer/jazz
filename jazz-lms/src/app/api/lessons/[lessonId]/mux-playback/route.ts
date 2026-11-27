import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/admin/permissions";
import { createMuxPlaybackTokens } from "@/lib/mux";
import { extractMuxPlaybackId, isValidMuxPlaybackId } from "@/lib/mux-playback";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        isPublished: true,
        videoUrl: true,
        chapter: {
          select: {
            courseId: true,
            isPublished: true,
            course: { select: { isPublished: true } },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.chapter.courseId;
    const adminOwnerEmail = (process.env.ADMIN_OWNER_EMAIL ?? "").trim().toLowerCase();
    const userEmail = (user.email ?? "").trim().toLowerCase();
    const isAdminOwner = Boolean(adminOwnerEmail && userEmail && userEmail === adminOwnerEmail);
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    const isAdmin = isAdminRole(dbUser?.role ?? null);
    if (!isAdminOwner && !isAdmin && (!lesson.isPublished || !lesson.chapter.isPublished || !lesson.chapter.course.isPublished)) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const [hasCoursePurchase, hasLessonPurchase, firstLessonInCourse] =
      await Promise.all([
        db.purchase.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId,
            },
          },
        }),
        db.lessonPurchase.findUnique({
          where: {
            userId_lessonId: {
              userId: user.id,
              lessonId: lesson.id,
            },
          },
        }),
        db.lesson.findFirst({
          where: {
            isPublished: true,
            chapter: {
              courseId,
              isPublished: true,
              course: { isPublished: true },
            },
          },
          orderBy: [{ chapter: { position: "asc" } }, { position: "asc" }],
          select: {
            id: true,
          },
        }),
      ]);

    const isFreePreview = firstLessonInCourse?.id === lesson.id;
    const canAccess = Boolean(
      isAdminOwner ||
        isAdmin ||
        isFreePreview ||
        hasCoursePurchase ||
        hasLessonPurchase,
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Purchase required" }, { status: 403 });
    }

    const playbackId = extractMuxPlaybackId(lesson.videoUrl);

    if (!playbackId) {
      return NextResponse.json(
        { error: "Playback is not configured for this lesson" },
        { status: 422 },
      );
    }

    if (!isValidMuxPlaybackId(playbackId)) {
      return NextResponse.json(
        { error: "Invalid playback configuration for this lesson" },
        { status: 422 },
      );
    }

    let tokens: ReturnType<typeof createMuxPlaybackTokens> | null = null;

    try {
      tokens = createMuxPlaybackTokens(playbackId);
    } catch (tokenError) {
      console.error("[MUX_PLAYBACK_TOKEN_ERROR]", safeErrorDiagnostic(tokenError));

      return NextResponse.json(
        {
          error:
            "Video playback is temporarily unavailable. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        playbackId,
        playbackToken: tokens?.playbackToken ?? null,
        thumbnailToken: tokens?.thumbnailToken ?? null,
        storyboardToken: tokens?.storyboardToken ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store, private, max-age=0",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("[MUX_PLAYBACK_ROUTE_ERROR]", safeErrorDiagnostic(error));
    return NextResponse.json(
      { error: "Failed to generate playback token" },
      { status: 500 },
    );
  }
}
