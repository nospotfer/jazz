import { db } from '@/lib/db';

let ensurePromise: Promise<void> | null = null;

export async function ensureLessonNotesTable() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LessonNote" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "courseId" TEXT NOT NULL,
          "lessonId" TEXT NOT NULL,
          "content" TEXT NOT NULL DEFAULT '',
          "isBold" INTEGER NOT NULL DEFAULT 0,
          "isItalic" INTEGER NOT NULL DEFAULT 0,
          "fontSize" INTEGER NOT NULL DEFAULT 13,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.$executeRawUnsafe(
        'CREATE UNIQUE INDEX IF NOT EXISTS "LessonNote_userId_lessonId_key" ON "LessonNote"("userId", "lessonId")'
      );
      await db.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "LessonNote_lessonId_idx" ON "LessonNote"("lessonId")'
      );
      await db.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS "LessonNote_courseId_idx" ON "LessonNote"("courseId")'
      );
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
