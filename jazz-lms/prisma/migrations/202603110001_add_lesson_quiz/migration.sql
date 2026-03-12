DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuizMedalTier') THEN
    CREATE TYPE "QuizMedalTier" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LessonQuizQuestion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "explanation" TEXT,
  "sourceLabel" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonQuizQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonQuizQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LessonQuizOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonQuizOption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonQuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LessonQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LessonQuizAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "scorePercent" INTEGER,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "questionCount" INTEGER NOT NULL DEFAULT 12,
  "medal" "QuizMedalTier" NOT NULL DEFAULT 'NONE',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonQuizAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonQuizAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LessonQuizAttemptAnswer" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionId" TEXT,
  "orderIndex" INTEGER NOT NULL,
  "isCorrect" BOOLEAN,
  "answeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonQuizAttemptAnswer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonQuizAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LessonQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonQuizAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LessonQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonQuizAttemptAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "LessonQuizOption"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LessonQuizSummary" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "bestAttemptId" TEXT,
  "bestScorePercent" INTEGER NOT NULL DEFAULT 0,
  "bestCorrectCount" INTEGER NOT NULL DEFAULT 0,
  "bestMedal" "QuizMedalTier" NOT NULL DEFAULT 'NONE',
  "totalAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonQuizSummary_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonQuizSummary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LessonQuizQuestion_lessonId_isActive_idx" ON "LessonQuizQuestion"("lessonId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "LessonQuizOption_questionId_position_key" ON "LessonQuizOption"("questionId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "LessonQuizOption_questionId_label_key" ON "LessonQuizOption"("questionId", "label");
CREATE INDEX IF NOT EXISTS "LessonQuizOption_questionId_idx" ON "LessonQuizOption"("questionId");

CREATE INDEX IF NOT EXISTS "LessonQuizAttempt_userId_lessonId_createdAt_idx" ON "LessonQuizAttempt"("userId", "lessonId", "createdAt");
CREATE INDEX IF NOT EXISTS "LessonQuizAttempt_lessonId_completedAt_idx" ON "LessonQuizAttempt"("lessonId", "completedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "LessonQuizAttemptAnswer_attemptId_orderIndex_key" ON "LessonQuizAttemptAnswer"("attemptId", "orderIndex");
CREATE UNIQUE INDEX IF NOT EXISTS "LessonQuizAttemptAnswer_attemptId_questionId_key" ON "LessonQuizAttemptAnswer"("attemptId", "questionId");
CREATE INDEX IF NOT EXISTS "LessonQuizAttemptAnswer_attemptId_idx" ON "LessonQuizAttemptAnswer"("attemptId");
CREATE INDEX IF NOT EXISTS "LessonQuizAttemptAnswer_questionId_idx" ON "LessonQuizAttemptAnswer"("questionId");
CREATE INDEX IF NOT EXISTS "LessonQuizAttemptAnswer_selectedOptionId_idx" ON "LessonQuizAttemptAnswer"("selectedOptionId");

CREATE UNIQUE INDEX IF NOT EXISTS "LessonQuizSummary_userId_lessonId_key" ON "LessonQuizSummary"("userId", "lessonId");
CREATE INDEX IF NOT EXISTS "LessonQuizSummary_lessonId_idx" ON "LessonQuizSummary"("lessonId");
CREATE INDEX IF NOT EXISTS "LessonQuizSummary_bestAttemptId_idx" ON "LessonQuizSummary"("bestAttemptId");