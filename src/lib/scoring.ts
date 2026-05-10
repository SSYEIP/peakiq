import { ELEVATION_RANGE } from './constants';
import type { Difficulty } from '@/types';

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.15,
  hard: 1.4,
  extreme: 1.7,
};

export function calculateScore(actual: number, guess: number): number {
  return Math.max(0, Math.round(1000 * (1 - Math.abs(actual - guess) / ELEVATION_RANGE)));
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return DIFFICULTY_MULTIPLIER[difficulty];
}

export function getMaxRoundScore(difficulty: Difficulty): number {
  return Math.round(1000 * getDifficultyMultiplier(difficulty));
}

export function getPerformanceLabel(totalScore: number): string {
  if (totalScore >= 4500) return 'Cartographer Extraordinaire';
  if (totalScore >= 3500) return 'Mountain Sage';
  if (totalScore >= 2500) return 'Altitude Apprentice';
  if (totalScore >= 1500) return 'Valley Wanderer';
  return 'Sea Level Rookie';
}

export function getScoreColor(score: number, maxScore = 1000): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return '#4ade80'; // topo-green
  if (ratio >= 0.5) return '#fbbf24'; // amber-400
  return '#f87171'; // topo-red
}
