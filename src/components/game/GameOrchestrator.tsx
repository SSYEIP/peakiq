'use client';

import React, { useReducer, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { gameReducer, initialState } from '@/lib/gameReducer';
import { ElevationSlider } from './ElevationSlider';
import { LocationClue } from './LocationClue';
import { RoundProgress } from './RoundProgress';
import { ResultReveal } from './ResultReveal';
import { GameOver } from './GameOver';
import { AlreadyPlayed } from './AlreadyPlayed';
import type { DailyResult } from './AlreadyPlayed';
import { Button } from '@/components/ui/Button';
import { TopoBackground } from '@/components/ui/TopoBackground';
import type { RoundClue, RoundResult } from '@/types';

export type Unit = 'm' | 'ft';

const STORAGE_KEY = 'eg_daily';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const [y = 2000, mo = 1, d = 1] = parts;
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// SSR-disabled map
const GameMap = dynamic(
  () => import('./GameMap').then((m) => m.GameMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-charcoal-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 font-mono text-sm">Loading map…</p>
      </div>
    ),
  }
);

interface StartResponse {
  sessionId: string;
  clues: RoundClue[];
  date: string;
}

export function GameOrchestrator() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [unit, setUnit] = useState<Unit>('m');

  // Load today's result from localStorage once on mount (lazy initializer)
  const [daily, setDaily] = useState<DailyResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DailyResult;
        if (parsed.date === getTodayString()) return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  const startGame = useCallback(async () => {
    dispatch({ type: 'START_LOADING' });
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start game');
      const data = await res.json() as StartResponse;
      dispatch({
        type: 'GAME_STARTED',
        payload: { sessionId: data.sessionId, rounds: data.clues },
      });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to start game',
      });
    }
  }, []);

  const submitGuess = useCallback(async () => {
    if (!state.sessionId) return;
    const currentClue = state.rounds[state.currentRound];
    if (!currentClue) return;

    dispatch({ type: 'SUBMIT_GUESS' });
    try {
      const res = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          roundIndex: state.currentRound,
          guess: state.currentGuess,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit guess');
      const result = await res.json() as RoundResult;
      dispatch({ type: 'ROUND_RESULT', payload: result });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to submit guess',
      });
    }
  }, [state.sessionId, state.currentRound, state.currentGuess, state.rounds]);

  const handleNext = useCallback(() => {
    if (state.currentRound >= state.rounds.length - 1) {
      // Save completed daily result before transitioning to game_over
      const result: DailyResult = {
        date: getTodayString(),
        totalScore: state.totalScore,
        results: state.results,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch { /* ignore */ }
      setDaily(result);
      dispatch({ type: 'GAME_OVER' });
    } else {
      dispatch({ type: 'NEXT_ROUND' });
    }
  }, [state.currentRound, state.rounds.length, state.totalScore, state.results]);

  // IDLE state — show home screen
  if (state.phase === 'idle') {
    const today = getTodayString();
    return (
      <main className="relative min-h-screen bg-charcoal-900 flex flex-col items-center justify-center overflow-hidden">
        <TopoBackground />

        <div className="relative z-10 text-center space-y-8 px-4 max-w-2xl mx-auto w-full">
          <div className="space-y-2">
            <div className="text-6xl mb-2">⛰️</div>
            <h1 className="text-5xl md:text-6xl font-bold text-white font-sans tracking-tight">
              Peak<span className="text-amber-400">IQ</span>
            </h1>
            <p className="text-amber-400/60 text-xs font-mono uppercase tracking-widest">
              Daily Challenge · {formatDisplayDate(today)}
            </p>
          </div>

          {state.error && (
            <div className="bg-topo-red/10 border border-topo-red/30 rounded-xl p-4">
              <p className="text-topo-red font-mono text-sm">{state.error}</p>
            </div>
          )}

          {daily ? (
            /* Already played today */
            <AlreadyPlayed daily={daily} unit={unit} />
          ) : (
            /* Haven't played yet */
            <>
              <p className="text-gray-400 text-base font-sans max-w-md mx-auto leading-relaxed">
                Five locations. One slider. Can you guess the elevation of each spot on Earth?
              </p>
              <div className="space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startGame}
                  isLoading={false}
                  className="text-xl px-12 py-5"
                >
                  Play Today&apos;s Challenge
                </Button>
                <div>
                  <a
                    href="/leaderboard"
                    className="text-gray-500 hover:text-amber-400 font-mono text-sm transition-colors"
                  >
                    🏆 View Leaderboard
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { label: 'Rounds', value: '5' },
                  { label: 'Resets', value: 'Daily' },
                  { label: 'Max Score', value: '5,000' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-charcoal-800/80 border border-charcoal-700 rounded-xl p-4 backdrop-blur-sm"
                  >
                    <p className="text-2xl font-bold font-mono text-amber-400">{value}</p>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // GAME OVER screen
  if (state.phase === 'game_over' || state.phase === 'leaderboard_submitted') {
    if (!state.sessionId) return null;
    return (
      <GameOver
        results={state.results}
        totalScore={state.totalScore}
        sessionId={state.sessionId}
        onPlayAgain={() => dispatch({ type: 'RESET' })}
        onLeaderboardSubmitted={() => dispatch({ type: 'RESET' })}
      />
    );
  }

  // Active game
  if (state.phase === 'round_active' || state.phase === 'round_submitted' || state.phase === 'loading') {
    const currentClue = state.rounds[state.currentRound];
    const currentResult = state.results[state.currentRound];
    const isSubmitted = state.phase === 'round_submitted';
    const isLoading = state.phase === 'loading';

    if (!currentClue) return null;

    // Accuracy radius based on error in metres
    const accuracyRadius = currentResult
      ? Math.abs(currentResult.actualElevation - currentResult.guess) * 100
      : undefined;

    return (
      <div className="h-screen flex flex-col bg-charcoal-900 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-charcoal-800 border-b border-charcoal-700 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg font-sans">⛰ PeakIQ</span>
            {/* Unit toggle */}
            <button
              onClick={() => setUnit(u => u === 'm' ? 'ft' : 'm')}
              className="flex items-center gap-0.5 bg-charcoal-900 border border-charcoal-600 rounded-md overflow-hidden text-xs font-mono"
              aria-label="Toggle elevation unit"
            >
              <span className={`px-2 py-1 transition-colors ${unit === 'm' ? 'bg-amber-400 text-charcoal-900 font-bold' : 'text-gray-400 hover:text-gray-200'}`}>m</span>
              <span className={`px-2 py-1 transition-colors ${unit === 'ft' ? 'bg-amber-400 text-charcoal-900 font-bold' : 'text-gray-400 hover:text-gray-200'}`}>ft</span>
            </button>
          </div>
          <RoundProgress
            currentRound={state.currentRound}
            totalRounds={state.rounds.length}
            results={state.results}
          />
        </header>

        {/* Accessible live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {state.phase === 'round_submitted' && currentResult
            ? `Score: ${currentResult.score} out of 1000. Actual elevation: ${currentResult.actualElevation} metres.`
            : state.phase === 'round_active'
            ? `Round ${state.currentRound + 1}. Guess the elevation.`
            : ''}
        </div>

        {/* Main content */}
        <div className="flex-1 grid md:grid-cols-2 gap-0 overflow-hidden min-h-0">
          {/* Map pane */}
          <div className="relative h-[40vh] md:h-full bg-charcoal-900 p-2">
            <GameMap
              lat={currentClue.lat}
              lng={currentClue.lng}
              zoom={currentClue.mapZoom}
              showResult={isSubmitted}
              accuracyRadius={accuracyRadius}
              score={currentResult?.score}
            />
          </div>

          {/* Controls pane */}
          <div className="flex flex-col bg-charcoal-800 border-l border-charcoal-700 overflow-y-auto">
            <div className="flex-1 p-4 md:p-6 space-y-6">
              {/* Location clue */}
              <LocationClue
                clue={currentClue}
                roundNumber={state.currentRound + 1}
                totalRounds={state.rounds.length}
              />

              {/* Error banner */}
              {state.error && (
                <div
                  role="alert"
                  className="bg-topo-red/10 border border-topo-red/30 rounded-xl p-3"
                >
                  <p className="text-topo-red font-mono text-sm">
                    ⚠ {state.error} — please try again.
                  </p>
                </div>
              )}

              {/* Slider or Result */}
              {!isSubmitted ? (
                <div className="space-y-4">
                  <ElevationSlider
                    value={state.currentGuess}
                    onChange={(v) => dispatch({ type: 'SET_GUESS', payload: v })}
                    disabled={isLoading}
                    unit={unit}
                  />
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={submitGuess}
                    isLoading={isLoading}
                    className="w-full"
                  >
                    Submit Guess
                  </Button>
                </div>
              ) : currentResult ? (
                <ResultReveal
                  result={currentResult}
                  onNext={handleNext}
                  isLastRound={state.currentRound >= state.rounds.length - 1}
                  unit={unit}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
