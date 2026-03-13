import { cache } from 'react';

import { db } from '@/lib/db';

export const getFirstPublishedCourseId = cache(async () => {
  try {
    const firstCourse = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return firstCourse?.id ?? null;
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load first published course.', error);
    return null;
  }
});

export const hasAnyCoursePurchase = cache(async (userId: string) => {
  try {
    const purchase = await db.purchase.findFirst({
      where: { userId },
      select: { id: true },
    });

    return Boolean(purchase);
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load course purchase state.', error);
    return false;
  }
});