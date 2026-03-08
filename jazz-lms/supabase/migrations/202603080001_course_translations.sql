DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LanguageCode') THEN
    CREATE TYPE "LanguageCode" AS ENUM ('es', 'en', 'fr', 'pt');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public."CourseTranslation" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" text NOT NULL REFERENCES public."Course"(id) ON DELETE CASCADE,
  language "LanguageCode" NOT NULL,
  title text NOT NULL,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("courseId", language)
);

CREATE TABLE IF NOT EXISTS public."ChapterTranslation" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "chapterId" text NOT NULL REFERENCES public."Chapter"(id) ON DELETE CASCADE,
  language "LanguageCode" NOT NULL,
  title text NOT NULL,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("chapterId", language)
);

CREATE TABLE IF NOT EXISTS public."LessonTranslation" (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId" text NOT NULL REFERENCES public."Lesson"(id) ON DELETE CASCADE,
  language "LanguageCode" NOT NULL,
  title text NOT NULL,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("lessonId", language)
);

CREATE INDEX IF NOT EXISTS "CourseTranslation_language_idx" ON public."CourseTranslation"(language);
CREATE INDEX IF NOT EXISTS "ChapterTranslation_language_idx" ON public."ChapterTranslation"(language);
CREATE INDEX IF NOT EXISTS "LessonTranslation_language_idx" ON public."LessonTranslation"(language);

INSERT INTO public."CourseTranslation" ("courseId", language, title, description)
SELECT c.id, 'es'::"LanguageCode", c.title, c.description
FROM public."Course" c
ON CONFLICT ("courseId", language) DO NOTHING;

INSERT INTO public."ChapterTranslation" ("chapterId", language, title, description)
SELECT c.id, 'es'::"LanguageCode", c.title, c.description
FROM public."Chapter" c
ON CONFLICT ("chapterId", language) DO NOTHING;

INSERT INTO public."LessonTranslation" ("lessonId", language, title, description)
SELECT l.id, 'es'::"LanguageCode", l.title, l.description
FROM public."Lesson" l
ON CONFLICT ("lessonId", language) DO NOTHING;

ALTER TABLE IF EXISTS public."CourseTranslation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_translation_select_purchased_or_admin ON public."CourseTranslation";
CREATE POLICY course_translation_select_purchased_or_admin
ON public."CourseTranslation"
FOR SELECT
USING (public.has_course_access("courseId"));

DROP POLICY IF EXISTS course_translation_admin_write ON public."CourseTranslation";
CREATE POLICY course_translation_admin_write
ON public."CourseTranslation"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."ChapterTranslation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chapter_translation_select_purchased_or_admin ON public."ChapterTranslation";
CREATE POLICY chapter_translation_select_purchased_or_admin
ON public."ChapterTranslation"
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public."Chapter" c
    WHERE c.id = "ChapterTranslation"."chapterId"
      AND public.has_course_access(c."courseId")
  )
);

DROP POLICY IF EXISTS chapter_translation_admin_write ON public."ChapterTranslation";
CREATE POLICY chapter_translation_admin_write
ON public."ChapterTranslation"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."LessonTranslation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_translation_select_purchased_or_admin ON public."LessonTranslation";
CREATE POLICY lesson_translation_select_purchased_or_admin
ON public."LessonTranslation"
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public."Lesson" l
    JOIN public."Chapter" c ON c.id = l."chapterId"
    WHERE l.id = "LessonTranslation"."lessonId"
      AND public.has_course_access(c."courseId")
  )
);

DROP POLICY IF EXISTS lesson_translation_admin_write ON public."LessonTranslation";
CREATE POLICY lesson_translation_admin_write
ON public."LessonTranslation"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
