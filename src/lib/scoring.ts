import { ELEVATION_RANGE } from './constants';
import type { Difficulty } from '@/types';

// New max scores: sum across sequence [easy,medium,medium,hard,extreme] = 1000
// Base unit = 1000/6.4 ≈ 156.25; multipliers preserved proportionally
const MAX_ROUND_SCORE: Record<Difficulty, number> = {
  easy:    156,  // ×1.0
  medium:  180,  // ×1.15
  hard:    219,  // ×1.4
  extreme: 265,  // ×1.7  → total = 156+180+180+219+265 = 1000
};

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.15,
  hard: 1.4,
  extreme: 1.7,
};

/** Score for a single round, scaled to maxScore ceiling */
export function calculateScore(actual: number, guess: number, maxScore?: number): number {
  const ceiling = maxScore ?? 1000;
  return Math.max(0, Math.round(ceiling * (1 - Math.abs(actual - guess) / ELEVATION_RANGE)));
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return DIFFICULTY_MULTIPLIER[difficulty];
}

export function getMaxRoundScore(difficulty: Difficulty): number {
  return MAX_ROUND_SCORE[difficulty];
}

export function getPerformanceLabel(totalScore: number): string {
  if (totalScore >= 900) return 'Cartographer Extraordinaire';
  if (totalScore >= 700) return 'Mountain Sage';
  if (totalScore >= 500) return 'Altitude Apprentice';
  if (totalScore >= 300) return 'Valley Wanderer';
  return 'Sea Level Rookie';
}

export function getScoreColor(score: number, maxScore = 1000): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return '#4ade80';
  if (ratio >= 0.5) return '#fbbf24';
  return '#f87171';
}
