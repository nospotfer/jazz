import 'server-only';

import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { isAdminRole } from '@/lib/admin/permissions';
import { resolveLessonAccessPolicy } from '@/lib/lesson-access';
import {
  LESSON_QUIZ_OPTIONS_PER_QUESTION,
  LESSON_QUIZ_QUESTION_COUNT,
  type LessonQuizAnswerResponse,
  type LessonQuizAttemptPayload,
  type LessonQuizLaunchResponse,
  type LessonQuizResultPayload,
  type LessonQuizSummarySnapshot,
  calculateQuizScorePercent,
  getQuizMedalTier,
} from '@/lib/lesson-quiz';

class LessonQuizError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'LESSON_QUIZ_ERROR') {
    super(message);
    this.name = 'LessonQuizError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type EligibleQuestion = {
  id: string;
  prompt: string;
  sourceLabel: string | null;
  options: Array<{
    id: string;
    label: string;
    text: string;
    position: number;
    isCorrect: boolean;
  }>;
};

type SupportedQuizLanguage = 'es' | 'en' | 'fr' | 'pt';

const attemptInclude = {
  answers: {
    orderBy: { orderIndex: 'asc' as const },
    include: { question: { include: { options: { orderBy: { position: 'asc' as const } } } } },
  },
};
type StoredAttempt = Prisma.LessonQuizAttemptGetPayload<{ include: typeof attemptInclude }>;

async function lockUserLessonQuiz(tx: Prisma.TransactionClient, userId: string, lessonId: string) {
  // Serialize launches, answer changes and summary updates across instances.
  const key = `lesson-quiz:${userId}:${lessonId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}

function shuffleArray<T>(items: T[]) {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function isQuestionEligible(question: {
  options: Array<{ isCorrect: boolean }>;
}) {
  if (question.options.length !== LESSON_QUIZ_OPTIONS_PER_QUESTION) {
    return false;
  }

  const correctOptions = question.options.filter((option) => option.isCorrect);
  return correctOptions.length === 1;
}

function serializeSummary(summary: {
  bestScorePercent: number;
  bestCorrectCount: number;
  bestMedal: string;
  totalAttempts: number;
  lastAttemptAt: Date | null;
} | null): LessonQuizSummarySnapshot | null {
  if (!summary) {
    return null;
  }

  return {
    bestScorePercent: summary.bestScorePercent,
    bestCorrectCount: summary.bestCorrectCount,
    bestMedal: summary.bestMedal as LessonQuizSummarySnapshot['bestMedal'],
    totalAttempts: summary.totalAttempts,
    lastAttemptAt: summary.lastAttemptAt?.toISOString() ?? null,
  };
}

function serializeAttempt(params: {
  attempt: StoredAttempt;
  questions: EligibleQuestion[];
}): LessonQuizAttemptPayload {
  return {
    attemptId: params.attempt.id,
    questionCount: params.attempt.questionCount,
    answeredCount: params.attempt.answers.filter((answer) => answer.answeredAt !== null).length,
    questions: params.questions.map((question, orderIndex) => ({
      correctOptionId: params.attempt.answers[orderIndex].answeredAt
        ? question.options.find((option) => option.isCorrect)?.id ?? null
        : null,
      isCorrect: params.attempt.answers[orderIndex].isCorrect,
      orderIndex,
      questionId: question.id,
      prompt: question.prompt,
      sourceLabel: question.sourceLabel,
      selectedOptionId: params.attempt.answers[orderIndex].selectedOptionId,
      isAnswered: params.attempt.answers[orderIndex].answeredAt !== null,
      options: [...question.options]
        .sort((left, right) => left.position - right.position)
        .map((option) => ({
          id: option.id,
          label: option.label,
          text: option.text,
          position: option.position,
        })),
    })),
  };
}

async function translateText(text: string, targetLanguage: SupportedQuizLanguage) {
  if (!text.trim() || targetLanguage === 'pt') {
    return text;
  }

  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: targetLanguage,
      dt: 't',
      q: text,
    });

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return text;
    }

    const payload = (await response.json()) as unknown;

    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      return text;
    }

    const translated = (payload[0] as unknown[])
      .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
      .join('')
      .trim();

    return translated || text;
  } catch {
    return text;
  }
}

async function localizeQuestions(
  questions: EligibleQuestion[],
  language: SupportedQuizLanguage
): Promise<EligibleQuestion[]> {
  if (language === 'pt') {
    return questions;
  }

  const cache = new Map<string, string>();

  const translateCached = async (text: string) => {
    if (!text.trim()) {
      return text;
    }

    if (cache.has(text)) {
      return cache.get(text) as string;
    }

    const translated = await translateText(text, language);
    cache.set(text, translated);
    return translated;
  };

  const localizedQuestions = await Promise.all(
    questions.map(async (question) => {
      const [prompt, sourceLabel, options] = await Promise.all([
        translateCached(question.prompt),
        question.sourceLabel ? translateCached(question.sourceLabel) : Promise.resolve(null),
        Promise.all(
          question.options.map(async (option) => ({
            ...option,
            text: await translateCached(option.text),
          }))
        ),
      ]);

      return {
        ...question,
        prompt,
        sourceLabel,
        options,
      };
    })
  );

  return localizedQuestions;
}

function buildResultPayload(
  attemptId: string,
  answers: Array<{ orderIndex: number; isCorrect: boolean | null }>
): LessonQuizResultPayload {
  const orderedAnswers = [...answers].sort((left, right) => left.orderIndex - right.orderIndex);
  const correctQuestionNumbers = orderedAnswers
    .filter((answer) => answer.isCorrect)
    .map((answer) => answer.orderIndex + 1);
  const incorrectQuestionNumbers = orderedAnswers
    .filter((answer) => answer.isCorrect === false)
    .map((answer) => answer.orderIndex + 1);
  const questionCount = orderedAnswers.length;
  const correctCount = correctQuestionNumbers.length;
  const scorePercent = calculateQuizScorePercent(correctCount, questionCount);

  return {
    attemptId,
    scorePercent,
    correctCount,
    questionCount,
    medal: getQuizMedalTier(scorePercent),
    correctQuestionNumbers,
    incorrectQuestionNumbers,
  };
}

export async function getLessonQuizSummary(userId: string, lessonId: string) {
  const summary = await db.lessonQuizSummary.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    select: {
      bestScorePercent: true,
      bestCorrectCount: true,
      bestMedal: true,
      totalAttempts: true,
      lastAttemptAt: true,
    },
  });

  return serializeSummary(summary);
}

export async function getLessonQuizQuestionBankCount(lessonId: string) {
  const questions = await db.lessonQuizQuestion.findMany({
    where: {
      lessonId,
      isActive: true,
    },
    select: {
      id: true,
      options: {
        select: {
          isCorrect: true,
        },
      },
    },
  });

  return questions.filter(isQuestionEligible).length;
}

export async function createOrResumeLessonQuizAttempt(params: {
  userId: string;
  lessonId: string;
  restart?: boolean;
  language?: SupportedQuizLanguage;
}): Promise<LessonQuizLaunchResponse> {
  const { userId, lessonId } = params;
  const attempt = await db.$transaction(async (tx) => {
    await lockUserLessonQuiz(tx, userId, lessonId);
    if (!params.restart) {
      const pending = await tx.lessonQuizAttempt.findFirst({
        where: { userId, lessonId },
        orderBy: { createdAt: 'desc' },
        include: attemptInclude,
      });
      // A restart supersedes earlier unfinished attempts. After the latest
      // attempt is complete, start a fresh round instead of reviving an old one.
      if (pending && !pending.completedAt) return pending;
    }

    const bank = await tx.lessonQuizQuestion.findMany({
      where: { lessonId, isActive: true },
      include: { options: { orderBy: { position: 'asc' } } },
    });
    const eligibleQuestions = bank.filter(isQuestionEligible);
    if (eligibleQuestions.length < LESSON_QUIZ_QUESTION_COUNT) {
      throw new LessonQuizError('Quiz not ready for this lesson yet.', 409, 'QUIZ_NOT_READY');
    }
    const questions = shuffleArray(eligibleQuestions).slice(0, LESSON_QUIZ_QUESTION_COUNT);
    return tx.lessonQuizAttempt.create({
      data: {
        userId, lessonId, questionCount: questions.length,
        answers: { create: questions.map((question, orderIndex) => ({ questionId: question.id, orderIndex })) },
      },
      include: attemptInclude,
    });
  }, { maxWait: 10_000, timeout: 5_000 });

  // External translations happen after the DB lock and transaction are released.
  const localizedQuestions = await localizeQuestions(
    attempt.answers.map((answer) => answer.question),
    params.language ?? 'es',
  );
  return {
    attempt: serializeAttempt({ attempt, questions: localizedQuestions }),
    summary: await getLessonQuizSummary(userId, lessonId),
  };
}

export async function submitLessonQuizAnswer(params: {
  userId: string;
  lessonId: string;
  attemptId: string;
  questionId: string;
  optionId: string;
}): Promise<LessonQuizAnswerResponse> {
  const { userId, lessonId, attemptId, questionId, optionId } = params;
  return db.$transaction(async (tx) => {
    await lockUserLessonQuiz(tx, userId, lessonId);
    const attempt = await tx.lessonQuizAttempt.findFirst({
      where: { id: attemptId, userId, lessonId },
      include: attemptInclude,
    });
    if (!attempt) {
      throw new LessonQuizError('Quiz attempt not found.', 404, 'QUIZ_ATTEMPT_NOT_FOUND');
    }
    const currentAnswer = attempt.answers.find((answer) => answer.questionId === questionId);
    if (!currentAnswer) {
      throw new LessonQuizError('Question does not belong to this attempt.', 400, 'QUIZ_QUESTION_NOT_IN_ATTEMPT');
    }
    const currentOption = currentAnswer.question.options.find((option) => option.id === optionId);
    if (!currentOption) {
      throw new LessonQuizError('Selected option does not belong to this question.', 400, 'QUIZ_OPTION_NOT_IN_QUESTION');
    }
    if (currentAnswer.answeredAt && currentAnswer.selectedOptionId !== optionId) {
      throw new LessonQuizError('This answer has already been recorded.', 409, 'QUIZ_ANSWER_LOCKED');
    }
    if (!currentAnswer.answeredAt && attempt.completedAt) {
      throw new LessonQuizError('This attempt has already been completed.', 409, 'QUIZ_ATTEMPT_COMPLETED');
    }

    const isNewAnswer = currentAnswer.answeredAt === null;
    if (isNewAnswer) {
      await tx.lessonQuizAttemptAnswer.update({
        where: { id: currentAnswer.id },
        data: { selectedOptionId: optionId, isCorrect: currentOption.isCorrect, answeredAt: new Date() },
      });
    }
    const answers = attempt.answers.map((answer) => answer.id === currentAnswer.id && isNewAnswer
      ? { ...answer, selectedOptionId: optionId, isCorrect: currentOption.isCorrect, answeredAt: new Date() }
      : answer);
    const answeredCount = answers.filter((answer) => answer.answeredAt !== null).length;
    const isComplete = answeredCount === attempt.questionCount;
    const result = isComplete ? buildResultPayload(attempt.id, answers) : null;
    let summary = null;

    // The user/lesson lock makes this transition once-only under concurrent
    // final answers and retries. Client answer lists never enter scoring.
    if (isComplete && !attempt.completedAt && result) {
      await tx.lessonQuizAttempt.update({
        where: { id: attempt.id },
        data: { scorePercent: result.scorePercent, correctCount: result.correctCount, medal: result.medal, completedAt: new Date() },
      });
      const currentSummary = await tx.lessonQuizSummary.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      const shouldReplaceBest = !currentSummary || result.scorePercent >= currentSummary.bestScorePercent;
      summary = await tx.lessonQuizSummary.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: {
          userId, lessonId, bestAttemptId: attempt.id, bestScorePercent: result.scorePercent,
          bestCorrectCount: result.correctCount, bestMedal: result.medal, totalAttempts: 1, lastAttemptAt: new Date(),
        },
        update: {
          totalAttempts: { increment: 1 }, lastAttemptAt: new Date(),
          ...(shouldReplaceBest ? { bestAttemptId: attempt.id, bestScorePercent: result.scorePercent, bestCorrectCount: result.correctCount, bestMedal: result.medal } : {}),
        },
      });
    } else if (isComplete) {
      summary = await tx.lessonQuizSummary.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
    }

    return {
      attemptId: attempt.id, questionId,
      isCorrect: Boolean(isNewAnswer ? currentOption.isCorrect : currentAnswer.isCorrect),
      correctOptionId: currentAnswer.question.options.find((option) => option.isCorrect)?.id ?? '',
      answeredCount, isComplete, result, summary: serializeSummary(summary),
    };
  }, { maxWait: 10_000, timeout: 5_000 });
}

export async function assertLessonQuizAccess(params: {
  userId: string;
  courseId: string;
  lessonId: string;
  userEmail?: string | null;
  allowFreePreview?: boolean;
}) {
  const { userId, courseId, lessonId, userEmail } = params;

  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      isPublished: true,
      chapter: {
        courseId,
        isPublished: true,
        course: { isPublished: true },
      },
    },
    select: {
      id: true,
      chapter: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new LessonQuizError('Lesson not found.', 404, 'LESSON_NOT_FOUND');
  }

  const [fullPurchase, singleLessonPurchase, dbUser, firstPublishedLesson] = await Promise.all([
    db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        id: true,
      },
    }),
    db.lessonPurchase.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      select: {
        id: true,
      },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    params.allowFreePreview
      ? db.lesson.findFirst({
          where: { isPublished: true, chapter: { courseId, isPublished: true, course: { isPublished: true } } },
          orderBy: [{ chapter: { position: 'asc' } }, { position: 'asc' }],
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const normalizedOwnerEmail = (process.env.ADMIN_OWNER_EMAIL ?? '').trim().toLowerCase();
  const normalizedUserEmail = (userEmail ?? '').trim().toLowerCase();
  const isAdminOwner =
    normalizedOwnerEmail.length > 0 && normalizedOwnerEmail === normalizedUserEmail;
  const access = resolveLessonAccessPolicy({
    isAdminOwner, isAdminRole: isAdminRole(dbUser?.role),
    hasFullPurchase: Boolean(fullPurchase), hasLessonPurchase: Boolean(singleLessonPurchase),
    isFreePreviewLesson: firstPublishedLesson?.id === lessonId,
  });
  if (!(params.allowFreePreview ? access.canAccessLesson : access.canUseGamification)) {
    throw new LessonQuizError('Purchase required.', 403, 'LESSON_QUIZ_UNAUTHORIZED');
  }

  return lesson;
}

export function isLessonQuizError(error: unknown): error is LessonQuizError {
  return error instanceof LessonQuizError;
}
