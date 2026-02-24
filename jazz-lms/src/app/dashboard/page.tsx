import { redirect } from 'next/navigation';
import { CourseViewClient } from '@/components/course/course-view-client';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { isLocalhostHost } from '@/lib/test-mode';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const hasPurchased = course
    ? !!(await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      }))
    : false;

  const hasTestAccess = isLocalhostHost(headers().get('host'));

  return (
    <CourseViewClient
      userName={user.user_metadata?.full_name || user.email || 'Jazz Student'}
      hasPurchased={hasPurchased || hasTestAccess}
      courseId={course?.id ?? null}
    />
  );
}
