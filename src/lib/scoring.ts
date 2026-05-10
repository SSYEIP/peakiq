const ELEVATION_RANGE = 9276; // 8849 - (-427)

export function calculateScore(actual: number, guess: number): number {
  return Math.max(0, Math.round(1000 * (1 - Math.abs(actual - guess) / ELEVATION_RANGE)));
}

export function getPerformanceLabel(totalScore: number): string {
  if (totalScore >= 4500) return 'Cartographer Extraordinaire';
  if (totalScore >= 3500) return 'Mountain Sage';
  if (totalScore >= 2500) return 'Altitude Apprentice';
  if (totalScore >= 1500) return 'Valley Wanderer';
  return 'Sea Level Rookie';
}

export function getScoreColor(score: number): string {
  if (score >= 800) return '#4ade80'; // topo-green
  if (score >= 500) return '#fbbf24'; // amber-400
  return '#f87171'; // topo-red
}
