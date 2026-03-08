import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { SupportedLanguage } from '@/lib/language';
import { getLocalizedJazzSubtitle } from '@/lib/course-lessons';

type TranslationMap = Map<string, { title: string; description: string | null }>;

interface TranslationBundle {
  courses: TranslationMap;
  chapters: TranslationMap;
  lessons: TranslationMap;
}

function withFallback(
  preferred: TranslationMap,
  fallback: TranslationMap
): TranslationMap {
  const merged = new Map<string, { title: string; description: string | null }>(fallback);

  for (const [id, value] of preferred.entries()) {
    merged.set(id, value);
  }

  return merged;
}

async function queryCourseTranslations(ids: string[], language: SupportedLanguage): Promise<TranslationMap> {
  if (ids.length === 0) return new Map();

  const rows = await db.$queryRaw<Array<{ courseId: string; title: string; description: string | null }>>(
    Prisma.sql`
      SELECT "courseId", title, description
      FROM "CourseTranslation"
      WHERE language = ${language}::"LanguageCode"
        AND "courseId" IN (${Prisma.join(ids)})
    `
  );

  return new Map(rows.map((row) => [row.courseId, { title: row.title, description: row.description }]));
}

async function queryChapterTranslations(ids: string[], language: SupportedLanguage): Promise<TranslationMap> {
  if (ids.length === 0) return new Map();

  const rows = await db.$queryRaw<Array<{ chapterId: string; title: string; description: string | null }>>(
    Prisma.sql`
      SELECT "chapterId", title, description
      FROM "ChapterTranslation"
      WHERE language = ${language}::"LanguageCode"
        AND "chapterId" IN (${Prisma.join(ids)})
    `
  );

  return new Map(rows.map((row) => [row.chapterId, { title: row.title, description: row.description }]));
}

async function queryLessonTranslations(ids: string[], language: SupportedLanguage): Promise<TranslationMap> {
  if (ids.length === 0) return new Map();

  const rows = await db.$queryRaw<Array<{ lessonId: string; title: string; description: string | null }>>(
    Prisma.sql`
      SELECT "lessonId", title, description
      FROM "LessonTranslation"
      WHERE language = ${language}::"LanguageCode"
        AND "lessonId" IN (${Prisma.join(ids)})
    `
  );

  return new Map(rows.map((row) => [row.lessonId, { title: row.title, description: row.description }]));
}

export async function getCourseTranslationBundle(options: {
  language: SupportedLanguage;
  courseIds: string[];
  chapterIds: string[];
  lessonIds: string[];
}): Promise<TranslationBundle> {
  const { language, courseIds, chapterIds, lessonIds } = options;

  if (language === 'es') {
    return {
      courses: new Map(),
      chapters: new Map(),
      lessons: new Map(),
    };
  }

  try {
    const [coursePreferred, chapterPreferred, lessonPreferred, courseSpanish, chapterSpanish, lessonSpanish] =
      await Promise.all([
        queryCourseTranslations(courseIds, language),
        queryChapterTranslations(chapterIds, language),
        queryLessonTranslations(lessonIds, language),
        queryCourseTranslations(courseIds, 'es'),
        queryChapterTranslations(chapterIds, 'es'),
        queryLessonTranslations(lessonIds, 'es'),
      ]);

    return {
      courses: withFallback(coursePreferred, courseSpanish),
      chapters: withFallback(chapterPreferred, chapterSpanish),
      lessons: withFallback(lessonPreferred, lessonSpanish),
    };
  } catch {
    return {
      courses: new Map(),
      chapters: new Map(),
      lessons: new Map(),
    };
  }
}

export function resolveCourseText(
  map: TranslationMap,
  id: string,
  baseTitle: string,
  baseDescription?: string | null
) {
  const translation = map.get(id);

  return {
    title: translation?.title || baseTitle,
    description: translation?.description ?? baseDescription ?? null,
  };
}

export function resolveLessonTitle(
  map: TranslationMap,
  lessonId: string,
  baseTitle: string,
  language: SupportedLanguage,
  classNumber?: number | null
) {
  const translation = map.get(lessonId);
  if (translation?.title) return translation.title;

  if (classNumber && language !== 'es') {
    const fallbackSubtitle = getLocalizedJazzSubtitle(classNumber, language);
    if (fallbackSubtitle) return fallbackSubtitle;
  }

  return baseTitle;
}
