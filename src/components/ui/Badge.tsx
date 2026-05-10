import React from 'react';
import type { Difficulty } from '@/types';

type BadgeVariant = 'difficulty' | 'continent' | 'score' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  difficulty?: Difficulty;
  className?: string;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-topo-green/20 text-topo-green border-topo-green/30',
  medium: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
  hard: 'bg-topo-red/20 text-topo-red border-topo-red/30',
  extreme: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function Badge({
  children,
  variant = 'default',
  difficulty,
  className = '',
}: BadgeProps) {
  let colorClass = 'bg-charcoal-700 text-gray-400 border-charcoal-700';

  if (variant === 'difficulty' && difficulty) {
    colorClass = difficultyColors[difficulty];
  } else if (variant === 'continent') {
    colorClass = 'bg-topo-blue/20 text-topo-blue border-topo-blue/30';
  } else if (variant === 'score') {
    colorClass = 'bg-amber-400/20 text-amber-400 border-amber-400/30';
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono
        border tracking-wider uppercase ${colorClass} ${className}
      `}
    >
      {children}
    </span>
  );
}
