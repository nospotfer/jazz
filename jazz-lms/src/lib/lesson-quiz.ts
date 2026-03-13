export const LESSON_QUIZ_QUESTION_COUNT = 12;
export const LESSON_QUIZ_OPTIONS_PER_QUESTION = 5;
export const LESSON_QUIZ_AUTO_ADVANCE_MS = 4000;

export const QUIZ_MEDAL_TIERS = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

export type QuizMedalTierValue = (typeof QUIZ_MEDAL_TIERS)[number];
export type UserJazzProfileMedal = QuizMedalTierValue | 'SUPREME';

export interface UserJazzMedalProgress {
  platinumMedalCount: number;
  totalRequiredPlatinumMedals: number;
  hasSupremeMedal: boolean;
  activeProfileMedal: UserJazzProfileMedal;
}

export interface UserJazzMedalLessonSnapshot {
  lessonId: string | null;
  classNumber: number;
  title: string;
  medal: QuizMedalTierValue;
  bestScorePercent: number | null;
  bestCorrectCount: number | null;
}

export interface UserJazzMedalProfileSnapshot {
  progress: UserJazzMedalProgress;
  lessons: UserJazzMedalLessonSnapshot[];
}

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
  isComplete: boolean;
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

export function getHighestQuizMedal(medals: QuizMedalTierValue[]): QuizMedalTierValue {
  const medalOrder = new Map<QuizMedalTierValue, number>(
    QUIZ_MEDAL_TIERS.map((medal, index) => [medal, index])
  );

  return medals.reduce<QuizMedalTierValue>((highest, current) => {
    return (medalOrder.get(current) ?? 0) > (medalOrder.get(highest) ?? 0)
      ? current
      : highest;
  }, 'NONE');
}

export function buildUserJazzMedalProgress(
  platinumMedalCount: number,
  totalRequiredPlatinumMedals: number,
  highestMedal: QuizMedalTierValue
): UserJazzMedalProgress {
  const normalizedPlatinumCount = Math.max(0, Math.trunc(platinumMedalCount || 0));
  const normalizedRequiredCount = Math.max(0, Math.trunc(totalRequiredPlatinumMedals || 0));
  const hasSupremeMedal = normalizedRequiredCount > 0 && normalizedPlatinumCount >= normalizedRequiredCount;

  return {
    platinumMedalCount: normalizedPlatinumCount,
    totalRequiredPlatinumMedals: normalizedRequiredCount,
    hasSupremeMedal,
    activeProfileMedal: hasSupremeMedal ? 'SUPREME' : highestMedal,
  };
}

export function hasMinimumQuizQuestions(questionCount: number, minimum = LESSON_QUIZ_QUESTION_COUNT) {
  return Number.isFinite(questionCount) && questionCount >= minimum;
}

export function isQuizAttemptComplete(answeredCount: number, questionCount = LESSON_QUIZ_QUESTION_COUNT) {
  return answeredCount >= questionCount;
}