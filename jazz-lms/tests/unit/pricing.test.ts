import { describe, expect, test } from 'vitest';
import {
  DEFAULT_FULL_COURSE_PRICE_EUR,
  DEFAULT_LESSON_DURATION_MINUTES,
  DEFAULT_COURSE_LESSON_COUNT,
} from '@/lib/pricing';

describe('pricing constants', () => {
  test('exports expected course price in EUR', () => {
    expect(DEFAULT_FULL_COURSE_PRICE_EUR).toBe(29.99);
    expect(typeof DEFAULT_FULL_COURSE_PRICE_EUR).toBe('number');
  });

  test('exports expected lesson duration', () => {
    expect(DEFAULT_LESSON_DURATION_MINUTES).toBe(20);
    expect(DEFAULT_LESSON_DURATION_MINUTES).toBeGreaterThan(0);
  });

  test('exports expected lesson count', () => {
    expect(DEFAULT_COURSE_LESSON_COUNT).toBe(15);
    expect(DEFAULT_COURSE_LESSON_COUNT).toBeGreaterThan(0);
  });
});
