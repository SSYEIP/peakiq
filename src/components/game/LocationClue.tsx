import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { RoundClue } from '@/types';

interface LocationClueProps {
  clue: RoundClue;
  showRegionClue?: boolean;
}

export function LocationClue({ clue, showRegionClue = true }: LocationClueProps) {
  return (
    <div className="space-y-3">
      {/* City name + difficulty */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {clue.name}
        </h2>
        <Badge variant="difficulty" difficulty={clue.difficulty}>
          {clue.difficulty}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-gray-300 leading-relaxed text-sm md:text-base">
        {clue.description}
      </p>

      {/* Region clue (hard mode only) */}
      {showRegionClue && (
        <div className="bg-charcoal-900/50 rounded-xl p-3 border border-amber-400/20">
          <p className="text-xs text-amber-400/70 font-mono uppercase tracking-wider mb-1">
            Region Clue
          </p>
          <p className="text-amber-400 font-semibold">
            {clue.clueRegion}
          </p>
        </div>
      )}
    </div>
  );
}
