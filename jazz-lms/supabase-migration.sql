-- Jazz LMS Database Schema Migration (idempotent)
-- Run this SQL in Supabase SQL Editor (safe to re-run).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmailVerification" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Chapter_courseId_position_key" UNIQUE ("courseId", "position")
);

CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lesson_chapterId_position_key" UNIQUE ("chapterId", "position")
);

CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_userId_courseId_key" UNIQUE ("userId", "courseId")
);

CREATE TABLE IF NOT EXISTS "UserProgress" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "minutesRemaining" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProgress_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

CREATE TABLE IF NOT EXISTS "LessonPurchase" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonPurchase_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonPurchase_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

CREATE TABLE IF NOT EXISTS "LessonNote" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "isBold" BOOLEAN NOT NULL DEFAULT false,
    "isItalic" BOOLEAN NOT NULL DEFAULT false,
    "fontSize" INTEGER NOT NULL DEFAULT 13,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonNote_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

ALTER TABLE "UserProgress"
  ADD COLUMN IF NOT EXISTS "progressPercent" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "UserProgress"
  ADD COLUMN IF NOT EXISTS "minutesRemaining" INTEGER NOT NULL DEFAULT 20;

CREATE INDEX IF NOT EXISTS "EmailVerification_email_code_idx" ON "EmailVerification"("email", "code");
CREATE INDEX IF NOT EXISTS "Attachment_lessonId_idx" ON "Attachment"("lessonId");
CREATE INDEX IF NOT EXISTS "Purchase_courseId_idx" ON "Purchase"("courseId");
CREATE INDEX IF NOT EXISTS "UserProgress_lessonId_idx" ON "UserProgress"("lessonId");
CREATE INDEX IF NOT EXISTS "LessonPurchase_lessonId_idx" ON "LessonPurchase"("lessonId");
CREATE INDEX IF NOT EXISTS "LessonNote_lessonId_idx" ON "LessonNote"("lessonId");
CREATE INDEX IF NOT EXISTS "LessonNote_courseId_idx" ON "LessonNote"("courseId");

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_updated_at') THEN
    CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_updated_at') THEN
    CREATE TRIGGER update_course_updated_at BEFORE UPDATE ON "Course"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chapter_updated_at') THEN
    CREATE TRIGGER update_chapter_updated_at BEFORE UPDATE ON "Chapter"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lesson_updated_at') THEN
    CREATE TRIGGER update_lesson_updated_at BEFORE UPDATE ON "Lesson"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attachment_updated_at') THEN
    CREATE TRIGGER update_attachment_updated_at BEFORE UPDATE ON "Attachment"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_updated_at') THEN
    CREATE TRIGGER update_purchase_updated_at BEFORE UPDATE ON "Purchase"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_progress_updated_at') THEN
    CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON "UserProgress"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lesson_purchase_updated_at') THEN
    CREATE TRIGGER update_lesson_purchase_updated_at BEFORE UPDATE ON "LessonPurchase"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lesson_note_updated_at') THEN
    CREATE TRIGGER update_lesson_note_updated_at BEFORE UPDATE ON "LessonNote"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'User',
    'EmailVerification',
    'Course',
    'Chapter',
    'Lesson',
    'Attachment',
    'Purchase',
    'UserProgress',
    'LessonPurchase',
    'LessonNote'
  )
ORDER BY tablename;

