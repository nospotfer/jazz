export const LESSON_QUIZ_QUESTION_COUNT = 12;
export const LESSON_QUIZ_OPTIONS_PER_QUESTION = 5;
export const LESSON_QUIZ_AUTO_ADVANCE_MS = 4000;
export const JAZZ_SUPREME_MEDAL_REQUIRED_COUNT = 15;

export const QUIZ_MEDAL_TIERS = ['NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
export const USER_PROFILE_MEDAL_TIERS = [...QUIZ_MEDAL_TIERS, 'SUPREME'] as const;

export type QuizMedalTierValue = (typeof QUIZ_MEDAL_TIERS)[number];
export type UserProfileMedalTierValue = (typeof USER_PROFILE_MEDAL_TIERS)[number];

export interface LessonQuizSummarySnapshot {
  bestScorePercent: number;
  bestCorrectCount: number;
  bestMedal: QuizMedalTierValue;
  totalAttempts: number;
  lastAttemptAt: string | null;
}

export interface UserJazzMedalProgress {
  platinumMedalCount: number;
  totalRequiredPlatinumMedals: number;
  remainingPlatinumMedals: number;
  hasSupremeMedal: boolean;
  activeProfileMedal: UserProfileMedalTierValue;
}

export interface UserJazzLessonMedalSnapshot {
  lessonId: string | null;
  classNumber: number;
  title: string;
  medal: QuizMedalTierValue;
  bestScorePercent: number | null;
  bestCorrectCount: number | null;
}

export interface UserJazzMedalProfileSnapshot {
  progress: UserJazzMedalProgress;
  lessons: UserJazzLessonMedalSnapshot[];
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

export function getQuizMedalRank(medal: QuizMedalTierValue) {
  return QUIZ_MEDAL_TIERS.indexOf(medal);
}

export function getHighestQuizMedal(medals: QuizMedalTierValue[]): QuizMedalTierValue {
  return medals.reduce<QuizMedalTierValue>((highest, medal) => {
    return getQuizMedalRank(medal) > getQuizMedalRank(highest) ? medal : highest;
  }, 'NONE');
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

export function hasUnlockedSupremeJazzMedal(
  platinumMedalCount: number,
  totalRequiredPlatinumMedals = JAZZ_SUPREME_MEDAL_REQUIRED_COUNT
) {
  if (!Number.isFinite(platinumMedalCount) || !Number.isFinite(totalRequiredPlatinumMedals)) {
    return false;
  }

  return platinumMedalCount >= Math.max(1, Math.floor(totalRequiredPlatinumMedals));
}

export function buildUserJazzMedalProgress(
  platinumMedalCount: number,
  totalRequiredPlatinumMedals = JAZZ_SUPREME_MEDAL_REQUIRED_COUNT,
  activeProfileMedal: UserProfileMedalTierValue = 'NONE'
): UserJazzMedalProgress {
  const safeTotal = Math.max(1, Math.floor(totalRequiredPlatinumMedals));
  const safeCount = Math.max(0, Math.floor(platinumMedalCount));
  const hasSupremeMedal = hasUnlockedSupremeJazzMedal(safeCount, safeTotal);

  return {
    platinumMedalCount: safeCount,
    totalRequiredPlatinumMedals: safeTotal,
    remainingPlatinumMedals: Math.max(0, safeTotal - safeCount),
    hasSupremeMedal,
    activeProfileMedal: hasSupremeMedal ? 'SUPREME' : activeProfileMedal,
  };
}