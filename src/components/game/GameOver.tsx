'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getPerformanceLabel, getScoreColor } from '@/lib/scoring';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { RoundResult } from '@/types';

interface GameOverProps {
  results: RoundResult[];
  totalScore: number;
  sessionId: string;
  onPlayAgain: () => void;
  onLeaderboardSubmitted: () => void;
}

export function GameOver({
  results,
  totalScore,
  sessionId,
  onPlayAgain,
  onLeaderboardSubmitted,
}: GameOverProps) {
  const [playerName, setPlayerName] = useLocalStorage('elevation-player-name', '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const performanceLabel = getPerformanceLabel(totalScore);
  const maxScore = results.length * 1000;
  const percentage = Math.round((totalScore / maxScore) * 100);

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          sessionId,
          // totalScore and roundScores are now computed server-side
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to submit score');
      }

      setSubmitted(true);
      onLeaderboardSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-bold text-white font-sans">Game Complete!</h2>
          <p className="text-amber-400 font-mono text-lg">{performanceLabel}</p>
        </div>

        {/* Total score */}
        <div className="bg-charcoal-800 rounded-2xl p-6 border border-amber-400/20 text-center">
          <p className="text-gray-400 text-sm font-mono uppercase tracking-wider mb-2">
            Total Score
          </p>
          <p className="text-5xl font-bold font-mono text-amber-400">
            {totalScore.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm font-mono mt-1">
            {percentage}% accuracy • {totalScore} / {maxScore}
          </p>
        </div>

        {/* Round breakdown */}
        <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700 space-y-3">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">
            Round Breakdown
          </h3>
          {results.map((result, i) => {
            const color = getScoreColor(result.score);
            return (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-charcoal-700 last:border-0"
              >
                <div>
                  <p className="text-white font-semibold text-sm">{result.locationName}</p>
                  <p className="text-gray-500 text-xs font-mono">
                    Actual: {result.actualElevation >= 0 ? '+' : ''}{result.actualElevation}m
                    {' '}| Guess: {result.guess >= 0 ? '+' : ''}{result.guess}m
                  </p>
                </div>
                <div
                  className="text-xl font-bold font-mono"
                  style={{ color }}
                >
                  {result.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard submission */}
        {!submitted ? (
          <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700">
            <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
              Submit to Leaderboard
            </h3>
            <form onSubmit={handleSubmitScore} className="space-y-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name..."
                maxLength={32}
                className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg px-4 py-3
                           text-white placeholder-gray-600 font-mono focus:outline-none
                           focus:border-amber-400 transition-colors"
                aria-label="Player name for leaderboard"
              />
              {submitError && (
                <p className="text-topo-red text-sm font-mono">{submitError}</p>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={!playerName.trim()}
                className="w-full"
              >
                🏆 Submit Score
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-topo-green/10 border border-topo-green/30 rounded-2xl p-4 text-center">
            <p className="text-topo-green font-mono">✓ Score submitted successfully!</p>
            <a
              href="/leaderboard"
              className="text-amber-400 hover:underline text-sm font-mono mt-1 inline-block"
            >
              View leaderboard →
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={onPlayAgain} className="flex-1">
            Play Again
          </Button>
          <a href="/leaderboard" className="flex-1">
            <Button variant="ghost" size="lg" className="w-full">
              Leaderboard
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
