import { redirect } from 'next/navigation';

import { LemonSandboxPanel } from '@/components/dashboard/lemon-sandbox-panel';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/server-user';
import { isLocalTestCheckoutEnabled } from '@/lib/test-mode';

export default async function LemonSandboxPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/auth');
  }

  const [courses, purchases] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        price: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            lessons: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),
    db.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        courseId: true,
        providerReferenceId: true,
        finalPrice: true,
        createdAt: true,
      },
    }),
  ]);

  const purchaseByCourseId = new Map(
    purchases.map((purchase) => [purchase.courseId, purchase])
  );

  const sandboxCourses = courses.map((course) => ({
    id: course.id,
    title: course.title,
    price: typeof course.price === 'number' ? course.price : 0,
    firstLessonId: course.chapters.flatMap((chapter) => chapter.lessons)[0]?.id ?? null,
    purchase: purchaseByCourseId.has(course.id)
      ? {
          providerReferenceId: purchaseByCourseId.get(course.id)?.providerReferenceId ?? null,
          finalPrice: purchaseByCourseId.get(course.id)?.finalPrice ?? null,
          createdAt: purchaseByCourseId.get(course.id)?.createdAt.toISOString() ?? null,
        }
      : null,
  }));

  return (
    <LemonSandboxPanel
      courses={sandboxCourses}
      localTestCheckoutEnabled={isLocalTestCheckoutEnabled()}
    />
  );
}