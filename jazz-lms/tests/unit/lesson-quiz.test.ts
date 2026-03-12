import { describe, expect, it } from 'vitest';

import {
  calculateQuizScorePercent,
  getQuizMedalTier,
  getQuizMedalTierFromCounts,
} from '../../src/lib/lesson-quiz';

describe('lesson quiz scoring', () => {
  it('rounds the score percent for 12-question quizzes', () => {
    expect(calculateQuizScorePercent(6, 12)).toBe(50);
    expect(calculateQuizScorePercent(8, 12)).toBe(67);
    expect(calculateQuizScorePercent(9, 12)).toBe(75);
    expect(calculateQuizScorePercent(11, 12)).toBe(92);
    expect(calculateQuizScorePercent(12, 12)).toBe(100);
  });

  it('maps percentage ranges to the expected medals', () => {
    expect(getQuizMedalTier(49)).toBe('NONE');
    expect(getQuizMedalTier(50)).toBe('BRONZE');
    expect(getQuizMedalTier(69)).toBe('BRONZE');
    expect(getQuizMedalTier(70)).toBe('SILVER');
    expect(getQuizMedalTier(89)).toBe('SILVER');
    expect(getQuizMedalTier(90)).toBe('GOLD');
    expect(getQuizMedalTier(99)).toBe('GOLD');
    expect(getQuizMedalTier(100)).toBe('PLATINUM');
  });

  it('matches the requested 12-question medal cutoffs', () => {
    expect(getQuizMedalTierFromCounts(5, 12)).toBe('NONE');
    expect(getQuizMedalTierFromCounts(6, 12)).toBe('BRONZE');
    expect(getQuizMedalTierFromCounts(8, 12)).toBe('BRONZE');
    expect(getQuizMedalTierFromCounts(9, 12)).toBe('SILVER');
    expect(getQuizMedalTierFromCounts(10, 12)).toBe('SILVER');
    expect(getQuizMedalTierFromCounts(11, 12)).toBe('GOLD');
    expect(getQuizMedalTierFromCounts(12, 12)).toBe('PLATINUM');
  });
});