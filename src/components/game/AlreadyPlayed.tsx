'use client';

import React, { useEffect, useState } from 'react';
import type { RoundResult } from '@/types';
import { getPerformanceLabel, getScoreColor } from '@/lib/scoring';
import type { Unit } from './GameOrchestrator';

export interface DailyResult {
  date: string;
  totalScore: number;
  results: RoundResult[];
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, (mo ?? 1) - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function formatElev(m: number, unit: Unit): string {
  if (unit === 'ft') {
    const ft = Math.round(m * 3.28084);
    return ft >= 0 ? `+${ft.toLocaleString()} ft` : `${ft.toLocaleString()} ft`;
  }
  return m >= 0 ? `+${m.toLocaleString()} m` : `${m.toLocaleString()} m`;
}

interface Props {
  daily: DailyResult;
  unit: Unit;
}

export function AlreadyPlayed({ daily, unit }: Props) {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const label = getPerformanceLabel(daily.totalScore);
  const pct = (daily.totalScore / 5000) * 100;

  return (
    <div className="space-y-6 max-w-lg mx-auto w-full px-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs font-mono text-amber-400/70 uppercase tracking-widest">
          {formatDate(daily.date)}
        </p>
        <h2 className="text-2xl font-bold text-white">Challenge Complete</h2>
        <p className="text-gray-400 text-sm font-mono">{label}</p>
      </div>

      {/* Score bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-4xl font-bold font-mono text-amber-400">
            {daily.totalScore.toLocaleString()}
          </span>
          <span className="text-gray-500 font-mono text-sm">/ 5,000</span>
        </div>
        <div className="h-2 bg-charcoal-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: '#fbbf24' }}
          />
        </div>
      </div>

      {/* Round breakdown */}
      <div className="space-y-2">
        {daily.results.map((r, i) => {
          const color = getScoreColor(r.score);
          return (
            <div
              key={r.roundIndex}
              className="flex items-center gap-3 bg-charcoal-800 border border-charcoal-700 rounded-lg px-3 py-2"
            >
              <span className="text-xs font-mono text-gray-600 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-sans truncate">{r.locationName}</p>
                <p className="text-[11px] font-mono text-gray-500">
                  Guessed {formatElev(r.guess, unit)} · Actual {formatElev(r.actualElevation, unit)}
                </p>
              </div>
              <span className="text-sm font-bold font-mono shrink-0" style={{ color }}>
                {r.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Countdown */}
      <div className="text-center border border-charcoal-700 rounded-xl p-4 bg-charcoal-800/60">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">
          Next challenge in
        </p>
        <p className="text-3xl font-bold font-mono text-white tabular-nums">{countdown}</p>
      </div>

      <a
        href="/leaderboard"
        className="block text-center text-gray-500 hover:text-amber-400 font-mono text-sm transition-colors"
      >
        🏆 View Leaderboard
      </a>
    </div>
  );
}
