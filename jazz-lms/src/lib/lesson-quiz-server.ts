import 'server-only';

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

function serializeAttempt(attempt: {
  id: string;
  answers: Array<{
    id: string;
    orderIndex: number;
    questionId: string;
    selectedOptionId: string | null;
    answeredAt: Date | null;
    question: {
      prompt: string;
      sourceLabel: string | null;
      options: Array<{
        id: string;
        label: string;
        text: string;
        position: number;
      }>;
    };
  }>;
}): LessonQuizAttemptPayload {
  const questions = [...attempt.answers]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((answer) => ({
      answerId: answer.id,
      orderIndex: answer.orderIndex,
      questionId: answer.questionId,
      prompt: answer.question.prompt,
      sourceLabel: answer.question.sourceLabel,
      selectedOptionId: answer.selectedOptionId,
      isAnswered: Boolean(answer.answeredAt),
      options: [...answer.question.options]
        .sort((left, right) => left.position - right.position)
        .map((option) => ({
          id: option.id,
          label: option.label,
          text: option.text,
          position: option.position,
        })),
    }));

  const answeredCount = questions.filter((question) => question.isAnswered).length;

  return {
    attemptId: attempt.id,
    questionCount: questions.length,
    answeredCount,
    questions,
  };
}

function buildResultPayload(attemptId: string, answers: Array<{ orderIndex: number; isCorrect: boolean | null }>): LessonQuizResultPayload {
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

async function loadAttemptForClient(attemptId: string) {
  return db.lessonQuizAttempt.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      answers: {
        orderBy: {
          orderIndex: 'asc',
        },
        include: {
          question: {
            include: {
              options: {
                orderBy: {
                  position: 'asc',
                },
              },
            },
          },
        },
      },
    },
  });
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
  const { userId, lessonId, restart = false } = params;

  if (!restart) {
    const existingAttempt = await db.lessonQuizAttempt.findFirst({
      where: {
        userId,
        lessonId,
        completedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        answers: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            question: {
              include: {
                options: {
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (existingAttempt && existingAttempt.answers.length === LESSON_QUIZ_QUESTION_COUNT) {
      return {
        attempt: serializeAttempt(existingAttempt),
        summary: await getLessonQuizSummary(userId, lessonId),
      };
    }
  }

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

  const eligibleQuestions = bank.filter(isQuestionEligible);

  if (eligibleQuestions.length < LESSON_QUIZ_QUESTION_COUNT) {
    throw new LessonQuizError('Quiz not ready for this lesson yet.', 409, 'QUIZ_NOT_READY');
  }

  const selectedQuestions = shuffleArray(eligibleQuestions).slice(0, LESSON_QUIZ_QUESTION_COUNT);

  const attempt = await db.lessonQuizAttempt.create({
    data: {
      userId,
      lessonId,
      questionCount: LESSON_QUIZ_QUESTION_COUNT,
      answers: {
        create: selectedQuestions.map((question, orderIndex) => ({
          questionId: question.id,
          orderIndex,
        })),
      },
    },
  });

  const hydratedAttempt = await loadAttemptForClient(attempt.id);

  if (!hydratedAttempt) {
    throw new LessonQuizError('Unable to load lesson quiz attempt.', 500, 'QUIZ_ATTEMPT_LOAD_FAILED');
  }

  return {
    attempt: serializeAttempt(hydratedAttempt),
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

  const response = await db.$transaction(async (tx) => {
    const attempt = await tx.lessonQuizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        lessonId,
      },
      include: {
        answers: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            question: {
              include: {
                options: {
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new LessonQuizError('Lesson quiz attempt not found.', 404, 'QUIZ_ATTEMPT_NOT_FOUND');
    }

    if (attempt.completedAt) {
      throw new LessonQuizError('This lesson quiz attempt is already complete.', 409, 'QUIZ_ATTEMPT_COMPLETED');
    }

    const answer = attempt.answers.find((item) => item.questionId === questionId);
    if (!answer) {
      throw new LessonQuizError('Question does not belong to this attempt.', 400, 'QUIZ_QUESTION_NOT_IN_ATTEMPT');
    }

    const option = answer.question.options.find((item) => item.id === optionId);
    if (!option) {
      throw new LessonQuizError('Selected option does not belong to this question.', 400, 'QUIZ_OPTION_NOT_IN_QUESTION');
    }

    if (!answer.answeredAt) {
      await tx.lessonQuizAttemptAnswer.update({
        where: {
          id: answer.id,
        },
        data: {
          selectedOptionId: optionId,
          isCorrect: option.isCorrect,
          answeredAt: new Date(),
        },
      });
    }

    const refreshedAnswers = await tx.lessonQuizAttemptAnswer.findMany({
      where: {
        attemptId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      select: {
        orderIndex: true,
        questionId: true,
        isCorrect: true,
        answeredAt: true,
      },
    });

    const answeredCount = refreshedAnswers.filter((item) => item.answeredAt).length;
    let result: LessonQuizResultPayload | null = null;
    let summary: LessonQuizSummarySnapshot | null = null;

    if (answeredCount === refreshedAnswers.length) {
      result = buildResultPayload(attemptId, refreshedAnswers);

      await tx.lessonQuizAttempt.update({
        where: {
          id: attemptId,
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

      summary = serializeSummary(updatedSummary);
    }

    return {
      attemptId,
      questionId,
      isCorrect: Boolean(option.isCorrect),
      answeredCount,
      result,
      summary,
    } satisfies LessonQuizAnswerResponse;
  });

  return response;
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