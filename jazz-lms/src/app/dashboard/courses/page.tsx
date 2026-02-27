import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { MyCoursesClient, type PurchasedVideoItem } from '@/components/dashboard/my-courses-client';
import {
  DEFAULT_LESSON_DURATION_MINUTES,
} from '@/lib/pricing';
import { isLocalhostHost } from '@/lib/test-mode';

export default async function MyCoursesPage() {
  const headersList = headers();
  const hostHeader = headersList.get('host') || headersList.get('x-forwarded-host');
  const isLocalTestMode = process.env.NODE_ENV !== 'production' && isLocalhostHost(hostHeader);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const [fullCoursePurchases, singleLessonPurchases, userProgress] = await Promise.all([
    db.purchase.findMany({
      where: { userId: user.id },
      include: {
        course: {
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
        },
      },
    }),
    db.lessonPurchase.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    }),
    db.userProgress.findMany({
      where: { userId: user.id },
    }),
  ]);

  const progressMap = new Map(
    userProgress.map((p) => [p.lessonId, p])
  );

  const purchasedVideosMap = new Map<string, PurchasedVideoItem>();

  for (const purchase of fullCoursePurchases) {
    for (const chapter of purchase.course.chapters) {
      for (const lesson of chapter.lessons) {
        const progress = progressMap.get(lesson.id);
        const progressPercent = progress?.isCompleted
          ? 100
          : progress?.progressPercent || 0;
        const minutesRemaining = progress?.isCompleted
          ? 0
          : progress?.minutesRemaining ?? DEFAULT_LESSON_DURATION_MINUTES;

        purchasedVideosMap.set(lesson.id, {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          courseId: purchase.course.id,
          courseTitle: purchase.course.title,
          chapterTitle: chapter.title,
          classOrder: chapter.position * 1000 + lesson.position,
          progressPercent,
          minutesRemaining,
          isCompleted: progressPercent >= 100,
          accessType: 'full-course',
        });
      }
    }
  }

  for (const lessonPurchase of singleLessonPurchases) {
    const lesson = lessonPurchase.lesson;
    const progress = progressMap.get(lesson.id);
    const progressPercent = progress?.isCompleted
      ? 100
      : progress?.progressPercent || 0;
    const minutesRemaining = progress?.isCompleted
      ? 0
      : progress?.minutesRemaining ?? DEFAULT_LESSON_DURATION_MINUTES;

    if (!purchasedVideosMap.has(lesson.id)) {
      purchasedVideosMap.set(lesson.id, {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: lesson.chapter.course.id,
        courseTitle: lesson.chapter.course.title,
        chapterTitle: lesson.chapter.title,
        classOrder: lesson.chapter.position * 1000 + lesson.position,
        progressPercent,
        minutesRemaining,
        isCompleted: progressPercent >= 100,
        accessType: 'single-video',
      });
    }
  }

  const purchasedVideos = Array.from(purchasedVideosMap.values()).sort((a, b) => {
    if (a.courseTitle === b.courseTitle) {
      return a.classOrder - b.classOrder;
    }
    return a.courseTitle.localeCompare(b.courseTitle);
  });

  return (
    <MyCoursesClient
      videos={purchasedVideos}
      isLocalTestMode={isLocalTestMode}
    />
  );
}
