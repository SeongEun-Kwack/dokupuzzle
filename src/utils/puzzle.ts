import { BoardSize, PuzzleData } from '../types';

export const PALETTE = [
  '#9a5546', // 버건디 벽돌
  '#7f8b5e', // 모스 그린
  '#5f7487', // 슬레이트 블루
  '#76628a', // 플럼
  '#527c78', // 딥 틸
  '#b8924a', // 머스터드
  '#c7b08a', // 양피지
  '#4a5670', // 네이비
  '#8a6a4f', // 담배잎 브라운
];

/** 게임 규칙은 생성, 검증, UI 판정에서 공통으로 사용한다. */
export type Cell = readonly [row: number, col: number];

export function cellsTouch(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

export function queensConflict(regions: number[][], a: Cell, b: Cell, hardMode = false): boolean {
  const [r1, c1] = a;
  const [r2, c2] = b;
  if (r1 === r2 && c1 === c2) return true;
  const n = regions.length;
  const sameLongDiagonal = hardMode && (
    (r1 === c1 && r2 === c2) ||
    (r1 + c1 === n - 1 && r2 + c2 === n - 1)
  );
  return r1 === r2 || c1 === c2 || regions[r1][c1] === regions[r2][c2] || cellsTouch(r1, c1, r2, c2) || sameLongDiagonal;
}

export function isSolved(regions: number[][], queens: Cell[], hardMode = false): boolean {
  const n = regions.length;
  if (queens.length !== n) return false;
  for (const [r, c] of queens) {
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= n || c >= n) return false;
  }
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (queensConflict(regions, queens[i], queens[j], hardMode)) return false;
    }
  }
  return true;
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const sameSolution = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

function randomPlacement(n: number, rng: () => number, hardMode = false): number[] | null {
  const placement: number[] = [];
  const usedColumns = Array(n).fill(false) as boolean[];
  const search = (row: number): boolean => {
    if (row === n) return true;
    for (const col of shuffle(Array.from({ length: n }, (_, i) => i), rng)) {
      if (usedColumns[col] || (row > 0 && cellsTouch(row, col, row - 1, placement[row - 1])) ||
        (hardMode && placement.some((prevCol, prevRow) =>
          (row === col && prevRow === prevCol) ||
          (row + col === n - 1 && prevRow + prevCol === n - 1)
        ))) continue;
      usedColumns[col] = true;
      placement[row] = col;
      if (search(row + 1)) return true;
      usedColumns[col] = false;
    }
    return false;
  };
  return search(0) ? placement : null;
}

function growRegions(n: number, placement: number[], rng: () => number): number[][] | null {
  const regions = Array.from({ length: n }, () => Array(n).fill(-1) as number[]);
  const frontier: Cell[] = [];
  placement.forEach((col, row) => {
    regions[row][col] = row;
    frontier.push([row, col]);
  });

  let filled = n;
  while (filled < n * n && frontier.length) {
    const index = Math.floor(rng() * frontier.length);
    const [row, col] = frontier[index];
    const neighbors: Cell[] = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      .map(([dr, dc]) => [row + dr, col + dc] as const)
      .filter(([r, c]) => r >= 0 && c >= 0 && r < n && c < n && regions[r][c] === -1);
    if (!neighbors.length) {
      frontier.splice(index, 1);
      continue;
    }
    const [r, c] = neighbors[Math.floor(rng() * neighbors.length)];
    regions[r][c] = regions[row][col];
    frontier.push([r, c]);
    filled++;
  }
  return filled === n * n ? regions : null;
}

export function validateRegions(regions: number[][], n: number): string | null {
  if (regions.length !== n || regions.some(row => row.length !== n)) return '판 크기가 n×n이 아님';
  const cells: Cell[][] = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const region = regions[r][c];
      if (!Number.isInteger(region) || region < 0 || region >= n) return `잘못된 영역 id ${region} at (${r},${c})`;
      cells[region].push([r, c]);
    }
  }
  for (let region = 0; region < n; region++) {
    if (!cells[region].length) return `영역 ${region}이 비어 있음`;
    const seen = new Set<number>();
    const stack = [cells[region][0]];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      const key = r * n + c;
      if (seen.has(key)) continue;
      seen.add(key);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < n && nc < n && regions[nr][nc] === region && !seen.has(nr * n + nc)) {
          stack.push([nr, nc]);
        }
      }
    }
    if (seen.size !== cells[region].length) return `영역 ${region}이 끊어져 있음`;
  }
  return null;
}

function findSolutions(regions: number[][], n: number, limit = 2, hardMode = false): number[][] {
  const solutions: number[][] = [];
  const queens: Cell[] = [];
  const search = (row: number) => {
    if (solutions.length >= limit) return;
    if (row === n) {
      solutions.push(queens.map(([, col]) => col));
      return;
    }
    for (let col = 0; col < n && solutions.length < limit; col++) {
      const cell: Cell = [row, col];
      if (queens.some(queen => queensConflict(regions, queen, cell, hardMode))) continue;
      queens.push(cell);
      search(row + 1);
      queens.pop();
    }
  };
  search(0);
  return solutions;
}

type LogicResult = { solved: boolean; level: number; solution: number[] | null };

function logicSolve(regions: number[][], n: number, hardMode = false): LogicResult {
  const cellCount = n * n;
  const candidates = new Uint8Array(cellCount).fill(1);
  const placed = new Uint8Array(cellCount);
  const units: number[][] = [];
  for (let r = 0; r < n; r++) units.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) units.push(Array.from({ length: n }, (_, r) => r * n + c));
  for (let g = 0; g < n; g++) units.push([]);
  for (let i = 0; i < cellCount; i++) units[2 * n + regions[Math.floor(i / n)][i % n]].push(i);
  if (hardMode) {
    const mainDiagonal: number[] = [];
    const antiDiagonal: number[] = [];
    for (let r = 0; r < n; r++) {
      mainDiagonal.push(r * n + r);
      antiDiagonal.push(r * n + (n - 1 - r));
    }
    units.push(mainDiagonal, antiDiagonal);
  }

  const conflicts = new Uint8Array(cellCount * cellCount);
  for (let i = 0; i < cellCount; i++) {
    for (let j = 0; j < cellCount; j++) {
      if (i !== j && queensConflict(regions, [Math.floor(i / n), i % n], [Math.floor(j / n), j % n], hardMode)) {
        conflicts[i * cellCount + j] = 1;
      }
    }
  }
  const place = (cd: Uint8Array, pl: Uint8Array, cell: number) => {
    pl[cell] = 1;
    for (let j = 0; j < cellCount; j++) if (cd[j] && conflicts[cell * cellCount + j]) cd[j] = 0;
  };
  const hasCandidate = (unit: number[], cd: Uint8Array, pl: Uint8Array) =>
    unit.some(cell => pl[cell] || cd[cell]);
  const hasDeadUnit = (cd: Uint8Array, pl: Uint8Array) =>
    units.some(unit => !unit.some(cell => pl[cell]) && !unit.some(cell => cd[cell]));
  const placementIsConsistent = (cd: Uint8Array, pl: Uint8Array, cell: number) => {
    const row = Math.floor(cell / n);
    const col = cell % n;
    const region = regions[row][col];
    return [units[row], units[n + col], units[2 * n + region]].every(unit => hasCandidate(unit, cd, pl));
  };

  let level = 0;
  let placedCount = 0;
  while (placedCount < n) {
    let progress = false;

    // Lv1: 유닛에 남은 후보가 하나뿐이면 그 칸에 배치한다.
    const singles = new Set<number>();
    for (const unit of units) {
      if (unit.some(cell => placed[cell])) continue;
      const remaining = unit.filter(cell => candidates[cell]);
      if (!remaining.length) return { solved: false, level, solution: null };
      if (remaining.length === 1) singles.add(remaining[0]);
    }
    if (singles.size) {
      const forced = [...singles];
      for (let i = 0; i < forced.length; i++) {
        for (let j = i + 1; j < forced.length; j++) {
          if (conflicts[forced[i] * cellCount + forced[j]]) return { solved: false, level, solution: null };
        }
      }
      for (const cell of forced) {
        if (placed[cell]) continue;
        place(candidates, placed, cell);
        placedCount++;
      }
      level = Math.max(level, 1);
      continue;
    }

    // Lv2: 한 유닛의 후보가 다른 유닛 안에 모두 있으면 나머지 후보를 제거한다.
    for (const source of units) {
      if (source.some(cell => placed[cell])) continue;
      const sourceCandidates = source.filter(cell => candidates[cell]);
      if (!sourceCandidates.length) continue;
      for (const target of units) {
        if (target === source || target.some(cell => placed[cell])) continue;
        if (!sourceCandidates.every(cell => target.includes(cell))) continue;
        for (const cell of target) {
          if (candidates[cell] && !sourceCandidates.includes(cell)) {
            candidates[cell] = 0;
            progress = true;
          }
        }
      }
    }
    if (progress) {
      level = Math.max(level, 2);
      continue;
    }

    // Lv3: 한 후보를 가정했을 때 충돌이나 빈 유닛이 생기면 후보에서 제외한다.
    for (let cell = 0; cell < cellCount; cell++) {
      if (!candidates[cell] || placed[cell]) continue;
      const nextCandidates = candidates.slice();
      const nextPlaced = placed.slice();
      place(nextCandidates, nextPlaced, cell);
      if (!placementIsConsistent(nextCandidates, nextPlaced, cell) || hasDeadUnit(nextCandidates, nextPlaced)) {
        candidates[cell] = 0;
        progress = true;
      }
    }
    if (progress) {
      level = Math.max(level, 3);
      continue;
    }
    return { solved: false, level, solution: null };
  }

  const solution = Array(n).fill(-1) as number[];
  for (let i = 0; i < cellCount; i++) if (placed[i]) solution[Math.floor(i / n)] = i % n;
  return { solved: true, level, solution };
}

export type VerifyResult = { ok: true; level: number } | { ok: false; reason: string };

export function verifyPuzzle(puzzle: PuzzleData): VerifyResult {
  const n = puzzle.regions.length;
  const regionError = validateRegions(puzzle.regions, n);
  if (regionError) return { ok: false, reason: regionError };
  if (puzzle.solution.length !== n || puzzle.solution.some(col => !Number.isInteger(col) || col < 0 || col >= n)) {
    return { ok: false, reason: '정답 배열 형식 오류' };
  }
  const solutionCells = puzzle.solution.map((col, row) => [row, col] as const);
  if (!isSolved(puzzle.regions, solutionCells, puzzle.hardMode)) return { ok: false, reason: '저장된 정답이 게임 규칙을 어김' };
  const solutions = findSolutions(puzzle.regions, n, 2, puzzle.hardMode);
  if (!solutions.length) return { ok: false, reason: '해가 없음' };
  if (solutions.length > 1) return { ok: false, reason: '해가 2개 이상' };
  if (!sameSolution(solutions[0], puzzle.solution)) return { ok: false, reason: '찾은 해가 저장된 정답과 다름' };
  const logic = logicSolve(puzzle.regions, n, puzzle.hardMode);
  if (!logic.solved || !logic.solution || !sameSolution(logic.solution, puzzle.solution)) {
    return { ok: false, reason: '논리 풀이만으로 풀리지 않음' };
  }
  return { ok: true, level: logic.level };
}

/** 마지막 안전망: n-1개의 정답 칸을 단일 칸 영역으로 만들어 논리적으로 풀리는 판을 구성한다. */
function generateEmergencyPuzzle(n: BoardSize, seed: number): PuzzleData | null {
  const rng = mulberry32(seed ^ 0x5f3759df);
  for (let attempt = 0; attempt < 10000; attempt++) {
    const solution = randomPlacement(n, rng);
    if (!solution) continue;
    const regions = Array.from({ length: n }, () => Array(n).fill(n - 1) as number[]);
    for (let row = 0; row < n - 1; row++) regions[row][solution[row]] = row;
    const candidate: PuzzleData = { regions, solution, level: 1 };
    const result = verifyPuzzle(candidate);
    if (result.ok) return { ...candidate, level: result.level };
  }
  return null;
}

/** 이전 호출부와 호환되는 생성기. 검증되지 않은 판은 반환하지 않는다. */
export function generatePuzzle(n: BoardSize, level: number, hardMode = false, randomSeed?: number): PuzzleData {
  const seed = randomSeed === undefined
    ? (n * 100003 + level * 7919 + (hardMode ? 0x6d2b79f5 : 0)) | 0
    : randomSeed | 0;
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const solution = randomPlacement(n, rng, hardMode);
    if (!solution) continue;
    const regions = growRegions(n, solution, rng);
    if (!regions) continue;
    const candidate: PuzzleData = { regions, solution, level: 0, hardMode };
    const result = verifyPuzzle(candidate);
    if (result.ok) return { ...candidate, level: result.level };
  }
  const emergency = hardMode ? null : generateEmergencyPuzzle(n, seed);
  if (emergency) return emergency;
  throw new Error(`논리적으로 풀리는 퍼즐 생성 실패 (n=${n}, level=${level})`);
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
