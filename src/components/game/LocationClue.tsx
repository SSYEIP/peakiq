import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { RoundClue } from '@/types';

interface LocationClueProps {
  clue: RoundClue;
  roundNumber: number;
  totalRounds: number;
}

export function LocationClue({ clue, roundNumber, totalRounds }: LocationClueProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="difficulty" difficulty={clue.difficulty}>
          {clue.difficulty}
        </Badge>
        <Badge variant="continent">
          {clue.continent}
        </Badge>
        <span className="text-gray-500 text-xs font-mono">
          {clue.country}
        </span>
      </div>

      <div className="bg-charcoal-900/50 rounded-xl p-4 border border-charcoal-700">
        <p className="text-sm text-gray-400 font-mono uppercase tracking-wider mb-2">
          Location Description
        </p>
        <p className="text-white leading-relaxed text-sm">
          {clue.description}
        </p>
      </div>

      <div className="bg-charcoal-900/50 rounded-xl p-3 border border-amber-400/20">
        <p className="text-xs text-amber-400/70 font-mono uppercase tracking-wider mb-1">
          Region Clue
        </p>
        <p className="text-amber-400 font-semibold">
          {clue.clueRegion}
        </p>
      </div>

      <p className="text-gray-500 text-xs font-mono text-right">
        Round {roundNumber} / {totalRounds}
      </p>
    </div>
  );
}
