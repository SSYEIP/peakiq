import type { GameState, GamePhase, RoundClue, RoundResult } from '@/types';

export type GameAction =
  | { type: 'START_LOADING' }
  | { type: 'GAME_STARTED'; payload: { sessionId: string; rounds: RoundClue[] } }
  | { type: 'SET_GUESS'; payload: number }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'ROUND_RESULT'; payload: RoundResult }
  | { type: 'NEXT_ROUND' }
  | { type: 'GAME_OVER' }
  | { type: 'LEADERBOARD_SUBMITTED' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; payload: string };

export const initialState: GameState = {
  phase: 'idle',
  sessionId: null,
  rounds: [],
  currentRound: 0,
  currentGuess: 0,
  results: [],
  totalScore: 0,
  error: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...initialState, phase: 'loading' };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'round_active',
        sessionId: action.payload.sessionId,
        rounds: action.payload.rounds,
        currentRound: 0,
        currentGuess: 0,
        results: [],
        totalScore: 0,
        error: null,
      };

    case 'SET_GUESS':
      return { ...state, currentGuess: action.payload };

    case 'SUBMIT_GUESS':
      return { ...state, phase: 'loading' };

    case 'ROUND_RESULT': {
      const newResults = [...state.results, action.payload];
      const totalScore = newResults.reduce((sum, r) => sum + r.score, 0);
      return {
        ...state,
        phase: 'round_submitted',
        results: newResults,
        totalScore,
        error: null,
      };
    }

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'round_active',
        currentRound: state.currentRound + 1,
        currentGuess: 0,
      };

    case 'GAME_OVER':
      return { ...state, phase: 'game_over' };

    case 'LEADERBOARD_SUBMITTED':
      return { ...state, phase: 'leaderboard_submitted' };

    case 'RESET':
      return { ...initialState };

    case 'SET_ERROR':
      return { ...state, phase: 'idle', error: action.payload };

    default:
      return state;
  }
}
