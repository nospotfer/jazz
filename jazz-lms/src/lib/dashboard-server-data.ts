import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { db } from '@/lib/db';
import type { SupportedLanguage } from '@/lib/language';
import { getKnownCatalogPrice } from '@/lib/pricing';

const getFirstPublishedCourseSummaryCached = unstable_cache(
  async () => {
    const firstCourse = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, price: true },
    });

    if (!firstCourse) return null;
    return {
      id: firstCourse.id,
      price: getKnownCatalogPrice(firstCourse.price),
    };
  },
  ['dashboard-first-published-course-summary'],
  { revalidate: 300 },
);

export const getFirstPublishedCourseSummary = cache(async () => {
  try {
    return await getFirstPublishedCourseSummaryCached();
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load first published course.', safeErrorDiagnostic(error));
    return null;
  }
});

export const getFirstPublishedCourseId = cache(async () => (
  (await getFirstPublishedCourseSummary())?.id ?? null
));

const getPublishedCourseOutlineCached = unstable_cache(
  async () => {
    const course = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        price: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
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
    return course ? { ...course, price: getKnownCatalogPrice(course.price) } : null;
  },
  ['dashboard-published-course-outline-with-price'],
  { revalidate: 180 },
);

export const getPublishedCourseOutline = cache(async () => {
  try {
    return await getPublishedCourseOutlineCached();
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load published course outline.', safeErrorDiagnostic(error));
    return null;
  }
});

const getPublishedCoursesForPdfViewCached = unstable_cache(
  async (language: SupportedLanguage) => {
    return db.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                position: true,
                attachments: {
                  where: {
                    language,
                  },
                  select: {
                    id: true,
                    name: true,
                    url: true,
                    documentKey: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ['dashboard-pdf-view-published-courses'],
  { revalidate: 180 },
);

export const getPublishedCoursesForPdfView = cache(async (language: SupportedLanguage) => {
  try {
    return await getPublishedCoursesForPdfViewCached(language);
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load published courses for pdf view.', safeErrorDiagnostic(error));
    return [];
  }
});

const getPublishedCourseForLessonPageCached = unstable_cache(
  async (courseId: string) => {
    return db.course.findFirst({
      where: {
        id: courseId,
        isPublished: true,
      },
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { position: 'asc' },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });
  },
  ['lesson-page-published-course-tree'],
  { revalidate: 180 },
);

export const getPublishedCourseForLessonPage = cache(async (courseId: string) => {
  try {
    return await getPublishedCourseForLessonPageCached(courseId);
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load published lesson course tree.', safeErrorDiagnostic(error));
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
    console.error('[dashboard-server-data] Unable to load course purchase state.', safeErrorDiagnostic(error));
    return false;
  }
});
