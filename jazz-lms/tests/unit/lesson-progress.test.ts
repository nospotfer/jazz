import { describe, expect, test } from 'vitest';

import {
  LESSON_PROGRESS_SAVE_STEP_PERCENT,
  calculateLessonMinutesRemaining,
  calculateLessonProgressPercent,
  shouldAutoCompleteLessonByPlayback,
  shouldPersistLessonProgress,
} from '@/lib/lesson-progress';

describe('lesson progress helpers', () => {
  test('calculates a bounded progress percent', () => {
    expect(calculateLessonProgressPercent(30, 120)).toBe(25);
    expect(calculateLessonProgressPercent(240, 120)).toBe(100);
    expect(calculateLessonProgressPercent(10, 0)).toBe(0);
  });

  test('calculates remaining minutes from playback time', () => {
    expect(calculateLessonMinutesRemaining(61, 600)).toBe(9);
    expect(calculateLessonMinutesRemaining(600, 600)).toBe(0);
    expect(calculateLessonMinutesRemaining(10, 0)).toBe(0);
  });

  test('persists only when the next save step is reached', () => {
    expect(shouldPersistLessonProgress(LESSON_PROGRESS_SAVE_STEP_PERCENT, 0)).toBe(true);
    expect(shouldPersistLessonProgress(4, 0)).toBe(false);
    expect(shouldPersistLessonProgress(100, 95)).toBe(false);
  });

  test('auto-completes near playback end or when saved progress already passed fallback', () => {
    expect(shouldAutoCompleteLessonByPlayback(95, 80)).toBe(true);
    expect(shouldAutoCompleteLessonByPlayback(80, 90)).toBe(true);
    expect(shouldAutoCompleteLessonByPlayback(80, 85)).toBe(false);
  });
});