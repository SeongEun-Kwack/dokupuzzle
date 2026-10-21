export type BoardSize = 5 | 6 | 7 | 8;

export type CellState = 0 | 1 | 2; // 0: Empty, 1: X (Elimination), 2: Detective placed

export type Language = 'ko' | 'en';

export interface PuzzleData {
  regions: number[][]; // [r][c] => regionIndex (0..n-1)
  solution: number[];  // solution[r] = col
  level: number;       // 1: Observation, 2: Deduction, 3: Elimination
}

export interface SavedGameState {
  n: BoardSize;
  level: number;
  marks: number[];
  cover: number;
  hintsLeft: number;
  elapsed: number; // in milliseconds
  undoStack: number[][];
  over: boolean;
  isSolved: boolean;
  statusKey: string;
  statusVars?: Record<string, any>;
  savedAt: number;
  score?: number;
  combo?: boolean;
  autoClearUsed?: boolean;
}

export interface LevelRecord {
  level: number;
  timeMs: number;
  score?: number;
  stars: number;
  hintsUsed: number;
  solvedAt: number;
}

export interface UserSettings {
  language: Language;
  boardSize: BoardSize;
  soundEnabled: boolean;
  tutorialCompleted: boolean;
}

export interface ThreadEffect {
  id: number;
  r: number;
  c: number;
}
