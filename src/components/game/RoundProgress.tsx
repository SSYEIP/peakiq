import React from 'react';
import type { RoundResult } from '@/types';

interface RoundProgressProps {
  currentRound: number;
  totalRounds: number;
  results: RoundResult[];
}

function getScoreColor(score: number): string {
  if (score >= 800) return '#4ade80';
  if (score >= 500) return '#fbbf24';
  return '#f87171';
}

export function RoundProgress({ currentRound, totalRounds, results }: RoundProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalRounds }, (_, i) => {
        const result = results[i];
        const isComplete = i < currentRound || (result !== undefined);
        const isActive = i === currentRound && result === undefined;

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${isActive
                  ? 'bg-amber-400 text-charcoal-900 scale-110 shadow-lg shadow-amber-400/30'
                  : isComplete && result
                    ? 'scale-100 border-2'
                    : 'bg-charcoal-700 text-gray-500 border-2 border-charcoal-700'
                }
              `}
              style={
                isComplete && result
                  ? {
                      borderColor: getScoreColor(result.score),
                      color: getScoreColor(result.score),
                      background: `${getScoreColor(result.score)}20`,
                    }
                  : {}
              }
            >
              {isComplete && result ? (
                <span className="font-mono text-[10px]">{result.score}</span>
              ) : (
                i + 1
              )}
            </div>
          </div>
        );
      })}
      <div className="ml-2 text-right">
        <p className="text-xs text-gray-500 font-mono">Total</p>
        <p className="text-amber-400 font-bold font-mono">
          {results.reduce((sum, r) => sum + r.score, 0)}
        </p>
      </div>
    </div>
  );
}
