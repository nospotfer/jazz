import 'server-only';

import { randomUUID } from 'crypto';

import { db } from '@/lib/db';
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
  attemptId: string;
  questions: EligibleQuestion[];
}): LessonQuizAttemptPayload {
  return {
    attemptId: params.attemptId,
    questionCount: params.questions.length,
    answeredCount: 0,
    questions: params.questions.map((question, orderIndex) => ({
      answerId: question.options.find((opt) => opt.isCorrect)?.id ?? '',
      orderIndex,
      questionId: question.id,
      prompt: question.prompt,
      sourceLabel: question.sourceLabel,
      selectedOptionId: null,
      isAnswered: false,
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

async function loadEligibleQuestionBank(lessonId: string) {
  const bank = await db.lessonQuizQuestion.findMany({
    where: {
      lessonId,
      isActive: true,
    },
    include: {
      options: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  return bank.filter(isQuestionEligible) as EligibleQuestion[];
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
}): Promise<LessonQuizLaunchResponse> {
  const { userId, lessonId } = params;
  const eligibleQuestions = await loadEligibleQuestionBank(lessonId);

  if (eligibleQuestions.length < LESSON_QUIZ_QUESTION_COUNT) {
    throw new LessonQuizError('Quiz not ready for this lesson yet.', 409, 'QUIZ_NOT_READY');
  }

  return {
    attempt: serializeAttempt({
      attemptId: randomUUID(),
      questions: shuffleArray(eligibleQuestions).slice(0, LESSON_QUIZ_QUESTION_COUNT),
    }),
    summary: await getLessonQuizSummary(userId, lessonId),
  };
}

export async function submitLessonQuizAnswer(params: {
  userId: string;
  lessonId: string;
  attemptId: string;
  questionId: string;
  optionId: string;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
  }>;
}): Promise<LessonQuizAnswerResponse> {
  const { userId, lessonId, attemptId, questionId, optionId, answers } = params;
  const eligibleQuestions = await loadEligibleQuestionBank(lessonId);
  const eligibleQuestionMap = new Map(eligibleQuestions.map((question) => [question.id, question]));

  const currentQuestion = eligibleQuestionMap.get(questionId);
  if (!currentQuestion) {
    throw new LessonQuizError('Question does not belong to this quiz.', 400, 'QUIZ_QUESTION_NOT_IN_ATTEMPT');
  }

  const currentOption = currentQuestion.options.find((item) => item.id === optionId);
  if (!currentOption) {
    throw new LessonQuizError('Selected option does not belong to this question.', 400, 'QUIZ_OPTION_NOT_IN_QUESTION');
  }

  const normalizedAnswers = answers.filter(
    (answer, index, collection) =>
      Boolean(answer.questionId) &&
      Boolean(answer.selectedOptionId) &&
      collection.findIndex((candidate) => candidate.questionId === answer.questionId) === index
  );
  const answeredCount = normalizedAnswers.length;

  if (answeredCount < LESSON_QUIZ_QUESTION_COUNT) {
    return {
      attemptId,
      questionId,
      isCorrect: Boolean(currentOption.isCorrect),
      answeredCount,
      isComplete: false,
      result: null,
      summary: null,
    };
  }

  if (normalizedAnswers.length !== LESSON_QUIZ_QUESTION_COUNT) {
    throw new LessonQuizError('Quiz session is incomplete.', 400, 'QUIZ_SESSION_INCOMPLETE');
  }

  const persistedRows = normalizedAnswers.map((answer, orderIndex) => {
    const question = eligibleQuestionMap.get(answer.questionId);
    if (!question) {
      throw new LessonQuizError('Quiz session contains an invalid question.', 400, 'QUIZ_QUESTION_NOT_IN_ATTEMPT');
    }

    const selectedOption = question.options.find((option) => option.id === answer.selectedOptionId);
    if (!selectedOption) {
      throw new LessonQuizError('Quiz session contains an invalid option.', 400, 'QUIZ_OPTION_NOT_IN_QUESTION');
    }

    return {
      orderIndex,
      questionId: question.id,
      selectedOptionId: selectedOption.id,
      isCorrect: selectedOption.isCorrect,
    };
  });

  const persisted = await db.$transaction(async (tx) => {
    const attempt = await tx.lessonQuizAttempt.create({
      data: {
        userId,
        lessonId,
        questionCount: LESSON_QUIZ_QUESTION_COUNT,
        answers: {
          create: persistedRows.map((row) => ({
            questionId: row.questionId,
            selectedOptionId: row.selectedOptionId,
            orderIndex: row.orderIndex,
            isCorrect: row.isCorrect,
            answeredAt: new Date(),
          })),
        },
      },
      select: {
        id: true,
      },
    });

    const result = buildResultPayload(attempt.id, persistedRows);

    await tx.lessonQuizAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        scorePercent: result.scorePercent,
        correctCount: result.correctCount,
        medal: result.medal,
        completedAt: new Date(),
      },
    });

    const currentSummary = await tx.lessonQuizSummary.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
    const shouldReplaceBest = !currentSummary || result.scorePercent >= currentSummary.bestScorePercent;

    const updatedSummary = await tx.lessonQuizSummary.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        bestAttemptId: result.attemptId,
        bestScorePercent: result.scorePercent,
        bestCorrectCount: result.correctCount,
        bestMedal: result.medal,
        totalAttempts: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        totalAttempts: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
        ...(shouldReplaceBest
          ? {
              bestAttemptId: result.attemptId,
              bestScorePercent: result.scorePercent,
              bestCorrectCount: result.correctCount,
              bestMedal: result.medal,
            }
          : {}),
      },
      select: {
        bestScorePercent: true,
        bestCorrectCount: true,
        bestMedal: true,
        totalAttempts: true,
        lastAttemptAt: true,
      },
    });

    return {
      result,
      summary: serializeSummary(updatedSummary),
    };
  });

  return {
    attemptId: persisted.result.attemptId,
    questionId,
    isCorrect: Boolean(currentOption.isCorrect),
    answeredCount,
    isComplete: true,
    result: persisted.result,
    summary: persisted.summary,
  };
}

export async function assertLessonQuizAccess(params: {
  userId: string;
  courseId: string;
  lessonId: string;
}) {
  const { userId, courseId, lessonId } = params;

  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      isPublished: true,
      chapter: {
        courseId,
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

  const [fullPurchase, singleLessonPurchase] = await Promise.all([
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
  ]);

  if (!fullPurchase && !singleLessonPurchase) {
    throw new LessonQuizError('Unauthorized', 401, 'LESSON_QUIZ_UNAUTHORIZED');
  }

  return lesson;
}

export function isLessonQuizError(error: unknown): error is LessonQuizError {
  return error instanceof LessonQuizError;
}