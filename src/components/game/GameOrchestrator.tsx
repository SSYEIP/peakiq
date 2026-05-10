'use client';

import React, { useReducer, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { gameReducer, initialState } from '@/lib/gameReducer';
import { ElevationSlider } from './ElevationSlider';
import { LocationClue } from './LocationClue';
import { RoundProgress } from './RoundProgress';
import { ResultReveal } from './ResultReveal';
import { GameOver } from './GameOver';
import { Button } from '@/components/ui/Button';
import { TopoBackground } from '@/components/ui/TopoBackground';
import type { RoundResult, RoundClue } from '@/types';

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
}

export function GameOrchestrator() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

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
      dispatch({ type: 'GAME_OVER' });
    } else {
      dispatch({ type: 'NEXT_ROUND' });
    }
  }, [state.currentRound, state.rounds.length]);

  // IDLE state — show home screen
  if (state.phase === 'idle') {
    return (
      <main className="relative min-h-screen bg-charcoal-900 flex flex-col items-center justify-center overflow-hidden">
        <TopoBackground />

        <div className="relative z-10 text-center space-y-8 px-4 max-w-2xl mx-auto">
          <div className="space-y-3">
            <div className="text-7xl mb-4">⛰️</div>
            <h1 className="text-5xl md:text-6xl font-bold text-white font-sans tracking-tight">
              Elevation <span className="text-amber-400">Guesser</span>
            </h1>
            <p className="text-gray-400 text-lg font-sans max-w-md mx-auto leading-relaxed">
              Can you guess the elevation of famous locations around the world?
              Five rounds. One slider. Pure geography.
            </p>
          </div>

          {state.error && (
            <div className="bg-topo-red/10 border border-topo-red/30 rounded-xl p-4">
              <p className="text-topo-red font-mono text-sm">{state.error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={startGame}
              isLoading={false}
              className="text-xl px-12 py-5"
            >
              Play Now
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

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Locations', value: '55+' },
              { label: 'Rounds', value: '5' },
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
        onLeaderboardSubmitted={() => dispatch({ type: 'LEADERBOARD_SUBMITTED' })}
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
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg font-sans">⛰ Elevation Guesser</span>
          </div>
          <RoundProgress
            currentRound={state.currentRound}
            totalRounds={state.rounds.length}
            results={state.results}
          />
        </header>

        {/* Main content */}
        <div className="flex-1 grid md:grid-cols-2 gap-0 overflow-hidden min-h-0">
          {/* Map pane */}
          <div className="relative min-h-[40vh] md:min-h-0 bg-charcoal-900 p-2">
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

              {/* Slider or Result */}
              {!isSubmitted ? (
                <div className="space-y-4">
                  <ElevationSlider
                    value={state.currentGuess}
                    onChange={(v) => dispatch({ type: 'SET_GUESS', payload: v })}
                    disabled={isLoading}
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
