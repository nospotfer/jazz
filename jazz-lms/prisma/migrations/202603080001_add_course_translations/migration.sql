DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LanguageCode') THEN
    CREATE TYPE "LanguageCode" AS ENUM ('es', 'en', 'fr', 'pt');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CourseTranslation" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "language" "LanguageCode" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChapterTranslation" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "language" "LanguageCode" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChapterTranslation_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LessonTranslation" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "language" "LanguageCode" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonTranslation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonTranslation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourseTranslation_courseId_language_key" ON "CourseTranslation"("courseId", "language");
CREATE UNIQUE INDEX IF NOT EXISTS "ChapterTranslation_chapterId_language_key" ON "ChapterTranslation"("chapterId", "language");
CREATE UNIQUE INDEX IF NOT EXISTS "LessonTranslation_lessonId_language_key" ON "LessonTranslation"("lessonId", "language");

CREATE INDEX IF NOT EXISTS "CourseTranslation_language_idx" ON "CourseTranslation"("language");
CREATE INDEX IF NOT EXISTS "ChapterTranslation_language_idx" ON "ChapterTranslation"("language");
CREATE INDEX IF NOT EXISTS "LessonTranslation_language_idx" ON "LessonTranslation"("language");

INSERT INTO "CourseTranslation" ("id", "courseId", "language", "title", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."id", 'es'::"LanguageCode", c."title", c."description", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Course" c
ON CONFLICT ("courseId", "language") DO NOTHING;

INSERT INTO "ChapterTranslation" ("id", "chapterId", "language", "title", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."id", 'es'::"LanguageCode", c."title", c."description", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Chapter" c
ON CONFLICT ("chapterId", "language") DO NOTHING;

INSERT INTO "LessonTranslation" ("id", "lessonId", "language", "title", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, l."id", 'es'::"LanguageCode", l."title", l."description", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Lesson" l
ON CONFLICT ("lessonId", "language") DO NOTHING;
