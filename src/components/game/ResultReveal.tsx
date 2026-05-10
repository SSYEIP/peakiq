'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { RoundResult } from '@/types';
import { getScoreColor } from '@/lib/scoring';
import type { Unit } from './GameOrchestrator';

function formatElev(m: number, unit: Unit): string {
  if (unit === 'ft') {
    const ft = Math.round(m * 3.28084);
    return ft >= 0 ? `+${ft.toLocaleString()} ft` : `${ft.toLocaleString()} ft`;
  }
  return m >= 0 ? `+${m.toLocaleString()} m` : `${m.toLocaleString()} m`;
}

interface ResultRevealProps {
  result: RoundResult;
  onNext: () => void;
  isLastRound: boolean;
  unit?: Unit;
}

export function ResultReveal({ result, onNext, isLastRound, unit = 'm' }: ResultRevealProps) {
  const delta = result.actualElevation - result.guess;
  const absDelta = Math.abs(unit === 'ft' ? Math.round(delta * 3.28084) : delta);
  const unitLabel = unit === 'ft' ? 'ft' : 'm';
  const deltaText = delta > 0
    ? `${absDelta.toLocaleString()}${unitLabel} too low`
    : delta < 0
    ? `${absDelta.toLocaleString()}${unitLabel} too high`
    : 'Perfect!';
  const scoreColor = getScoreColor(result.score);
  const scorePercent = (result.score / 1000) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Location reveal */}
      <div className="text-center">
        <p className="text-gray-400 text-sm font-mono uppercase tracking-wider mb-1">
          Location Revealed
        </p>
        <h3 className="text-2xl font-bold text-white">{result.locationName}</h3>
      </div>

      {/* Elevation comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-charcoal-900/50 rounded-xl p-4 text-center border border-charcoal-700">
          <p className="text-xs text-gray-500 font-mono uppercase mb-1">Your Guess</p>
          <p className="text-xl font-bold font-mono text-white">
            {formatElev(result.guess, unit)}
          </p>
        </div>
        <div className="bg-charcoal-900/50 rounded-xl p-4 text-center border border-amber-400/30">
          <p className="text-xs text-amber-400/70 font-mono uppercase mb-1">Actual</p>
          <p className="text-xl font-bold font-mono text-amber-400">
            {formatElev(result.actualElevation, unit)}
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-mono" style={{ color: scoreColor }}>
          {deltaText}
        </p>
      </div>

      {/* Score bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400 font-mono">Score</span>
          <span className="font-bold font-mono" style={{ color: scoreColor }}>
            {result.score} / 1000
          </span>
        </div>
        <div className="h-3 bg-charcoal-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${scorePercent}%`,
              background: scoreColor,
              boxShadow: `0 0 12px ${scoreColor}60`,
            }}
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        className="w-full"
      >
        {isLastRound ? '🏁 See Final Results' : '▶ Next Round'}
      </Button>
    </div>
  );
}
