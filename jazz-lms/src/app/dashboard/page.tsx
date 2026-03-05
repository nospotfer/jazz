import { redirect } from 'next/navigation';
import { CourseViewClient } from '@/components/course/course-view-client';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

type DashboardPageProps = {
  searchParams?: {
    purchase?: string | string[];
    source?: string | string[];
    session_id?: string | string[];
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const purchaseStatus = Array.isArray(searchParams?.purchase)
    ? searchParams?.purchase[0]
    : searchParams?.purchase;
  const purchaseSource = Array.isArray(searchParams?.source)
    ? searchParams?.source[0]
    : searchParams?.source;
  const sessionId = Array.isArray(searchParams?.session_id)
    ? searchParams?.session_id[0]
    : searchParams?.session_id;

  if (purchaseStatus === 'success' && purchaseSource === 'dashboard' && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const sessionUserId = session.metadata?.userId;
      const sessionCourseId = session.metadata?.courseId;
      const sessionPurchaseType = session.metadata?.purchaseType;

      if (
        session.payment_status === 'paid' &&
        sessionUserId === user.id &&
        sessionPurchaseType === 'course' &&
        sessionCourseId
      ) {
        await db.purchase.upsert({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: sessionCourseId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            courseId: sessionCourseId,
          },
        });
      }
    } catch (error) {
      console.error('[dashboard] Unable to confirm Stripe checkout session.', error);
    }
  }

  let course: {
    id: string;
    chapters: { lessons: { id: string; title: string }[] }[];
  } | null = null;

  let hasPurchased = false;

  try {
    course = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            lessons: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    hasPurchased = course
      ? !!(await db.purchase.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: course.id,
            },
          },
        }))
      : false;
  } catch (error) {
    console.error('[dashboard] Database unavailable. Rendering fallback state.', error);
  }

  const lessonRoutesByTitle = course
    ? Object.fromEntries(
        course.chapters
          .flatMap((chapter) => chapter.lessons)
          .map((lesson) => [
            lesson.title.toLowerCase().trim(),
            `/courses/${course.id}/lessons/${lesson.id}`,
          ])
      )
    : {};

  const orderedLessons = course
    ? course.chapters.flatMap((chapter) => chapter.lessons)
    : [];

  const lessonRoutesInOrder = orderedLessons.map(
    (lesson) => `/courses/${course?.id}/lessons/${lesson.id}`
  );

  const lessonIdsInOrder = orderedLessons.map((lesson) => lesson.id);
  const lessonTitlesInOrder = orderedLessons.map((lesson) => lesson.title);

  return (
    <CourseViewClient
      userName={user.user_metadata?.full_name || user.email || 'Estudiante de Jazz'}
      hasPurchased={hasPurchased}
      courseId={course?.id ?? null}
      lessonRoutesByTitle={lessonRoutesByTitle}
      lessonRoutesInOrder={lessonRoutesInOrder}
      lessonIdsInOrder={lessonIdsInOrder}
      lessonTitlesInOrder={lessonTitlesInOrder}
    />
  );
}
