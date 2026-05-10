import { describe, it, expect } from 'vitest';
import { calculateScore, getPerformanceLabel } from './scoring';

describe('calculateScore', () => {
  it('returns 1000 for a perfect guess', () => {
    expect(calculateScore(100, 100)).toBe(1000);
  });

  it('returns 1000 for Everest base camp perfect guess', () => {
    expect(calculateScore(5364, 5364)).toBe(1000);
  });

  it('returns 0 for a guess at the opposite extreme', () => {
    // Guess Everest when actual is Dead Sea
    expect(calculateScore(-427, 8849)).toBe(0);
  });

  it('returns positive score for close guess', () => {
    const score = calculateScore(100, 150);
    expect(score).toBeGreaterThan(990);
    expect(score).toBeLessThanOrEqual(1000);
  });

  it('never returns negative score', () => {
    expect(calculateScore(-427, 8849)).toBeGreaterThanOrEqual(0);
    expect(calculateScore(0, 10000)).toBeGreaterThanOrEqual(0);
  });

  it('is symmetric', () => {
    expect(calculateScore(500, 1000)).toBe(calculateScore(1000, 500));
  });

  it('penalizes large errors more', () => {
    const smallError = calculateScore(100, 200);
    const largeError = calculateScore(100, 1000);
    expect(smallError).toBeGreaterThan(largeError);
  });
});

describe('getPerformanceLabel', () => {
  it('returns top label for high scores', () => {
    expect(getPerformanceLabel(5000)).toBe('Cartographer Extraordinaire');
  });

  it('returns rookie label for low scores', () => {
    expect(getPerformanceLabel(100)).toBe('Sea Level Rookie');
  });
});
