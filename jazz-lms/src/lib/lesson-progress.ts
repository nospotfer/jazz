export const LESSON_PROGRESS_SAVE_STEP_PERCENT = 5;
export const LESSON_PROGRESS_AUTOCOMPLETE_PERCENT = 95;
export const LESSON_PROGRESS_SAVED_FALLBACK_PERCENT = 90;

export function calculateLessonProgressPercent(currentSeconds: number, durationSeconds: number) {
  if (!Number.isFinite(currentSeconds) || currentSeconds <= 0) {
    return 0;
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((currentSeconds / durationSeconds) * 100)));
}

export function calculateLessonMinutesRemaining(currentSeconds: number, durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  const safeCurrentSeconds = Number.isFinite(currentSeconds) ? currentSeconds : 0;
  return Math.max(0, Math.ceil((durationSeconds - safeCurrentSeconds) / 60));
}

export function shouldPersistLessonProgress(percent: number, lastSavedPercent: number) {
  return percent >= 1 && percent < 100 && percent - lastSavedPercent >= LESSON_PROGRESS_SAVE_STEP_PERCENT;
}

export function shouldAutoCompleteLessonByPlayback(watchedPercent: number, lastSavedPercent: number) {
  return watchedPercent >= LESSON_PROGRESS_AUTOCOMPLETE_PERCENT
    || lastSavedPercent >= LESSON_PROGRESS_SAVED_FALLBACK_PERCENT;
}