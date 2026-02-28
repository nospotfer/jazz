import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { createMuxPlaybackTokens } from '@/lib/mux';
import { extractMuxPlaybackId, isValidMuxPlaybackId } from '@/lib/mux-playback';

export async function GET(
  _request: Request,
  { params }: { params: { lessonId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const courseId = lesson.chapter.course.id;

    const [hasCoursePurchase, hasLessonPurchase, courseWithLessons] = await Promise.all([
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
      db.course.findUnique({
        where: {
          id: courseId,
        },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    const firstLessonInCourse = courseWithLessons?.chapters.flatMap((chapter) => chapter.lessons).at(0);
    const isFreePreview = firstLessonInCourse?.id === lesson.id;
    const canAccess = Boolean(isFreePreview || hasCoursePurchase || hasLessonPurchase);

    if (!canAccess) {
      return NextResponse.json({ error: 'Purchase required' }, { status: 403 });
    }

    const playbackId = extractMuxPlaybackId(lesson.videoUrl);

    if (!playbackId) {
      return NextResponse.json({ error: 'Playback is not configured for this lesson' }, { status: 422 });
    }

    if (!isValidMuxPlaybackId(playbackId)) {
      return NextResponse.json({ error: 'Invalid playback configuration for this lesson' }, { status: 422 });
    }

    let tokens: ReturnType<typeof createMuxPlaybackTokens> | null = null;

    try {
      tokens = createMuxPlaybackTokens(playbackId);
    } catch (tokenError) {
      const tokenErrorMessage = tokenError instanceof Error
        ? tokenError.message
        : 'Unable to create Mux playback token.';

      console.error('[MUX_PLAYBACK_TOKEN_ERROR]', tokenErrorMessage);

      return NextResponse.json(
        {
          error:
            'Mux playback signing is not configured correctly. Provide valid MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY (PEM or base64 PEM) and restart the server.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      playbackId,
      playbackToken: tokens?.playbackToken ?? null,
      thumbnailToken: tokens?.thumbnailToken ?? null,
      storyboardToken: tokens?.storyboardToken ?? null,
    }, {
      headers: {
        'Cache-Control': 'no-store, private, max-age=0',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('[MUX_PLAYBACK_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate playback token' }, { status: 500 });
  }
}
