import React from 'react';
import Link from 'next/link';
import { db } from '@/db/client';
import { leaderboardEntries } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { getPerformanceLabel } from '@/lib/scoring';

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface LeaderboardEntry {
  id: number;
  playerName: string;
  totalScore: number;
  roundScores: string;
  sessionId: string;
  createdAt: number;
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const entries = await db
      .select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.totalScore))
      .limit(100);
    return entries;
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <main className="min-h-screen bg-charcoal-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="text-gray-500 hover:text-amber-400 font-mono text-sm transition-colors block"
          >
            ← Back to game
          </Link>
          <div className="text-5xl">🏆</div>
          <h1 className="text-4xl font-bold text-white font-sans">Leaderboard</h1>
          <p className="text-gray-400 font-mono text-sm">
            Top elevation guessers from around the world
          </p>
        </div>

        {/* Play button */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-amber-400 text-charcoal-900 font-bold px-8 py-3 rounded-lg hover:bg-amber-500 transition-colors font-sans"
          >
            ⛰ Play Now
          </Link>
        </div>

        {/* Leaderboard table */}
        {entries.length === 0 ? (
          <div className="bg-charcoal-800 rounded-2xl p-12 text-center border border-charcoal-700">
            <p className="text-gray-400 font-mono text-lg">No scores yet.</p>
            <p className="text-gray-500 font-mono text-sm mt-2">
              Be the first to play and submit your score!
            </p>
          </div>
        ) : (
          <div className="bg-charcoal-800 rounded-2xl border border-charcoal-700 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-6 py-4 border-b border-charcoal-700 bg-charcoal-900/50">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Rank</span>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Player</span>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider text-right">Score</span>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider text-right hidden sm:block">Date</span>
            </div>

            {/* Entries */}
            <div className="divide-y divide-charcoal-700">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const roundScores = JSON.parse(entry.roundScores) as number[];

                return (
                  <div
                    key={entry.id}
                    className={`
                      grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-6 py-4 items-center
                      transition-colors hover:bg-charcoal-700/50
                      ${isTop3 ? 'bg-amber-400/5' : ''}
                    `}
                  >
                    {/* Rank */}
                    <div className="font-bold font-mono text-center">
                      {isTop3 ? (
                        <span className="text-xl">{getMedalEmoji(rank)}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">{rank}</span>
                      )}
                    </div>

                    {/* Player info */}
                    <div>
                      <p className={`font-bold font-sans ${isTop3 ? 'text-amber-400' : 'text-white'}`}>
                        {entry.playerName}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {getPerformanceLabel(entry.totalScore)}
                      </p>
                      {/* Round scores */}
                      <div className="flex gap-1 mt-1">
                        {roundScores.map((score, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1 py-0.5 rounded bg-charcoal-700 text-gray-400"
                          >
                            {score}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Total score */}
                    <div className="text-right">
                      <p className={`text-xl font-bold font-mono ${isTop3 ? 'text-amber-400' : 'text-white'}`}>
                        {entry.totalScore.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">daily total</p>
                    </div>

                    {/* Date */}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500 font-mono">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 font-mono text-xs">
          Scores updated every 60 seconds • Top 100 displayed
        </p>
      </div>
    </main>
  );
}
