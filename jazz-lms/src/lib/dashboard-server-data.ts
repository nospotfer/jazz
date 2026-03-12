import { cache } from 'react';

import { db } from '@/lib/db';

export const getFirstPublishedCourseId = cache(async () => {
  const firstCourse = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return firstCourse?.id ?? null;
});

export const hasAnyCoursePurchase = cache(async (userId: string) => {
  const purchase = await db.purchase.findFirst({
    where: { userId },
    select: { id: true },
  });

  return Boolean(purchase);
});