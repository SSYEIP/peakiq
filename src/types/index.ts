export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type GameMode = 'normal' | 'hard';

export interface Location {
  id: string;
  name: string;
  region: string;
  country: string;
  continent: string;
  difficulty: Difficulty;
  elevation: number;      // metres, can be negative
  lat: number;
  lng: number;
  description: string;   // 2-3 sentences, NO elevation mentioned
  clueRegion: string;    // vague region clue
  mapZoom: number;       // 8-14
}

export type GamePhase = 'idle' | 'loading' | 'round_active' | 'round_submitted' | 'game_over' | 'leaderboard_submitted';

export interface RoundClue {
  roundIndex: number;
  locationId: string;
  clueRegion: string;
  country: string;
  continent: string;
  difficulty: Difficulty;
  description: string;
  lat: number;
  lng: number;
  mapZoom: number;
}

export interface RoundResult {
  roundIndex: number;
  locationId: string;
  locationName: string;
  actualElevation: number;
  guess: number;
  delta: number;
  score: number;
  multiplier?: number;
  maxScore?: number;
}

export interface GameState {
  phase: GamePhase;
  sessionId: string | null;
  rounds: RoundClue[];
  currentRound: number;
  currentGuess: number;
  results: RoundResult[];
  totalScore: number;
  error: string | null;
}
