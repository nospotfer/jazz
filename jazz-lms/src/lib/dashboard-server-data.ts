import { cache } from 'react';
import { unstable_cache } from 'next/cache';

import { db } from '@/lib/db';
import type { SupportedLanguage } from '@/lib/language';

const getFirstPublishedCourseIdCached = unstable_cache(
  async () => {
    const firstCourse = await db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return firstCourse?.id ?? null;
  },
  ['dashboard-first-published-course-id'],
  { revalidate: 300 },
);

export const getFirstPublishedCourseId = cache(async () => {
  try {
    return await getFirstPublishedCourseIdCached();
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load first published course.', error);
    return null;
  }
});

const getPublishedCourseOutlineCached = unstable_cache(
  async () => {
    return db.course.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'asc' },
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
              },
            },
          },
        },
      },
    });
  },
  ['dashboard-published-course-outline'],
  { revalidate: 180 },
);

export const getPublishedCourseOutline = cache(async () => {
  try {
    return await getPublishedCourseOutlineCached();
  } catch (error) {
    console.error('[dashboard-server-data] Unable to load published course outline.', error);
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
    console.error('[dashboard-server-data] Unable to load published courses for pdf view.', error);
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
    console.error('[dashboard-server-data] Unable to load published lesson course tree.', error);
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