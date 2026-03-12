export const LESSON_QUIZ_QUESTION_COUNT = 12;
export const LESSON_QUIZ_OPTIONS_PER_QUESTION = 5;
export const LESSON_QUIZ_AUTO_ADVANCE_MS = 4000;

export const QUIZ_MEDAL_TIERS = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

export type QuizMedalTierValue = (typeof QUIZ_MEDAL_TIERS)[number];

export interface LessonQuizSummarySnapshot {
  bestScorePercent: number;
  bestCorrectCount: number;
  bestMedal: QuizMedalTierValue;
  totalAttempts: number;
  lastAttemptAt: string | null;
}

export interface LessonQuizOptionPayload {
  id: string;
  label: string;
  text: string;
  position: number;
}

export interface LessonQuizQuestionPayload {
  answerId: string;
  orderIndex: number;
  questionId: string;
  prompt: string;
  sourceLabel: string | null;
  selectedOptionId: string | null;
  isAnswered: boolean;
  options: LessonQuizOptionPayload[];
}

export interface LessonQuizAttemptPayload {
  attemptId: string;
  questionCount: number;
  answeredCount: number;
  questions: LessonQuizQuestionPayload[];
}

export interface LessonQuizResultPayload {
  attemptId: string;
  scorePercent: number;
  correctCount: number;
  questionCount: number;
  medal: QuizMedalTierValue;
  correctQuestionNumbers: number[];
  incorrectQuestionNumbers: number[];
}

export interface LessonQuizLaunchResponse {
  attempt: LessonQuizAttemptPayload;
  summary: LessonQuizSummarySnapshot | null;
}

export interface LessonQuizAnswerResponse {
  attemptId: string;
  questionId: string;
  isCorrect: boolean;
  answeredCount: number;
  result: LessonQuizResultPayload | null;
  summary: LessonQuizSummarySnapshot | null;
}

export function clampQuizPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateQuizScorePercent(correctCount: number, questionCount = LESSON_QUIZ_QUESTION_COUNT) {
  if (!Number.isFinite(correctCount) || !Number.isFinite(questionCount) || questionCount <= 0) {
    return 0;
  }

  return clampQuizPercent((correctCount / questionCount) * 100);
}

export function getQuizMedalTier(scorePercent: number): QuizMedalTierValue {
  const safePercent = clampQuizPercent(scorePercent);

  if (safePercent >= 100) {
    return 'PLATINUM';
  }

  if (safePercent >= 90) {
    return 'GOLD';
  }

  if (safePercent >= 70) {
    return 'SILVER';
  }

  if (safePercent >= 50) {
    return 'BRONZE';
  }

  return 'NONE';
}

export function getQuizMedalTierFromCounts(correctCount: number, questionCount = LESSON_QUIZ_QUESTION_COUNT) {
  return getQuizMedalTier(calculateQuizScorePercent(correctCount, questionCount));
}

export function hasMinimumQuizQuestions(questionCount: number, minimum = LESSON_QUIZ_QUESTION_COUNT) {
  return Number.isFinite(questionCount) && questionCount >= minimum;
}

export function isQuizAttemptComplete(answeredCount: number, questionCount = LESSON_QUIZ_QUESTION_COUNT) {
  return answeredCount >= questionCount;
}