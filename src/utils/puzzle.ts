import { BoardSize, PuzzleData } from '../types';

export const PALETTE = [
  "#9a5546", // 버건디 벽돌
  "#7f8b5e", // 모스 그린
  "#5f7487", // 슬레이트 블루
  "#76628a", // 플럼
  "#527c78", // 딥 틸
  "#b8924a", // 머스터드
  "#c7b08a", // 양피지
  "#4a5670", // 네이비
  "#8a6a4f", // 담배잎 브라운
];

/* =========================================================================
 * 게임 규칙 (유일한 기준)
 * 생성기, 유일해 검사, 논리 풀이, UI 정답 판정이 모두 이 함수만 쓴다.
 * 규칙을 바꿔야 하면 여기만 고치면 된다.
 *   - 같은 행 X / 같은 열 X / 같은 색 영역 X
 *   - 대각선 포함 8방향으로 닿으면 X
 * ========================================================================= */
export type Cell = readonly [number, number];

export function cellsTouch(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

export function queensConflict(regions: number[][], a: Cell, b: Cell): boolean {
  const [r1, c1] = a;
  const [r2, c2] = b;
  if (r1 === r2 && c1 === c2) return true; // 같은 칸에 두 번 놓는 것도 위반
  return (
    r1 === r2 ||
    c1 === c2 ||
    regions[r1][c1] === regions[r2][c2] ||
    cellsTouch(r1, c1, r2, c2)
  );
}

/** UI 정답 판정용. 게임 화면에서도 반드시 이 함수를 쓸 것. */
export function isSolved(regions: number[][], queens: Cell[]): boolean {
  const n = regions.length;
  if (queens.length !== n) return false;
  for (const [r, c] of queens) {
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= n || c >= n) {
      return false;
    }
  }
  // 퀸 n개가 서로 충돌하지 않으면 행/열/영역마다 정확히 1개씩이 된다.
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (queensConflict(regions, queens[i], queens[j])) return false;
    }
  }
  return true;
}

/* =========================================================================
 * 난수 / 유틸
 * ========================================================================= */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sameSolution = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const mod = (a: number, m: number) => ((a % m) + m) % m;

/* =========================================================================
 * 판 생성
 * ========================================================================= */
function randomPlacement(n: number, rng: () => number): number[] | null {
  const perm: number[] = [];
  const used = Array(n).fill(false);

  const bt = (r: number): boolean => {
    if (r === n) return true;
    const cols = shuffle([...Array(n).keys()], rng);
    for (const c of cols) {
      if (used[c]) continue;
      // 행마다 1개씩이므로 바로 윗행과 닿는지만 보면 된다 (cellsTouch 규칙 공유)
      if (r > 0 && cellsTouch(r, c, r - 1, perm[r - 1])) continue;
      used[c] = true;
      perm[r] = c;
      if (bt(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };

  return bt(0) ? perm : null;
}

function growRegions(n: number, perm: number[], rng: () => number): number[][] | null {
  const reg: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  const frontier: [number, number][] = [];

  perm.forEach((c, r) => {
    reg[r][c] = r;
    frontier.push([r, c]);
  });

  let filled = n;
  while (filled < n * n && frontier.length) {
    const i = Math.floor(rng() * frontier.length);
    const [r, c] = frontier[i];
    const nb = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      .map(([dr, dc]): [number, number] => [r + dr, c + dc])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && reg[a][b] === -1);

    if (!nb.length) {
      frontier.splice(i, 1);
      continue;
    }

    const [a, b] = nb[Math.floor(rng() * nb.length)];
    reg[a][b] = reg[r][c];
    frontier.push([a, b]);
    filled++;
  }

  // 덜 채워진 판은 폐기
  return filled === n * n ? reg : null;
}

/* =========================================================================
 * 검사기
 * ========================================================================= */

/** 영역 구조 검증: 크기, id 범위, 빈 영역, 영역이 끊기지 않았는지 */
export function validateRegions(regions: number[][], n: number): string | null {
  if (regions.length !== n || regions.some(row => row.length !== n)) {
    return '판 크기가 n×n이 아님';
  }
  const cells: [number, number][][] = Array.from({ length: n }, () => []);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const g = regions[r][c];
      if (!Number.isInteger(g) || g < 0 || g >= n) return `잘못된 영역 id ${g} at (${r},${c})`;
      cells[g].push([r, c]);
    }
  }
  for (let g = 0; g < n; g++) {
    if (!cells[g].length) return `영역 ${g}이 비어 있음`;
    const seen = new Set<number>();
    const stack = [cells[g][0]];
    seen.add(cells[g][0][0] * n + cells[g][0][1]);
    while (stack.length) {
      const [r, c] = stack.pop()!;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = r + dr;
        const b = c + dc;
        if (a < 0 || b < 0 || a >= n || b >= n || regions[a][b] !== g) continue;
        const k = a * n + b;
        if (seen.has(k)) continue;
        seen.add(k);
        stack.push([a, b]);
      }
    }
    if (seen.size !== cells[g].length) return `영역 ${g}이 끊어져 있음`;
  }
  return null;
}

/**
 * 해를 최대 limit개까지 찾는다. 판정은 queensConflict 하나만 쓴다.
 * 올바른 해는 항상 행마다 퀸이 정확히 1개라서, 행 단위로 탐색해도 빠지는 해가 없다.
 */
function findSolutions(reg: number[][], n: number, limit = 2): number[][] {
  const solutions: number[][] = [];
  const queens: Cell[] = [];

  const bt = (r: number) => {
    if (solutions.length >= limit) return;
    if (r === n) {
      solutions.push(queens.map(([, c]) => c));
      return;
    }
    for (let c = 0; c < n && solutions.length < limit; c++) {
      const cell: Cell = [r, c];
      if (queens.some(q => queensConflict(reg, q, cell))) continue;
      queens.push(cell);
      bt(r + 1);
      queens.pop();
    }
  };

  bt(0);
  return solutions;
}

function logicSolve(
  reg: number[][],
  n: number
): { solved: boolean; level: number; solution: number[] | null } {
  const N = n * n;
  const cand = new Uint8Array(N).fill(1);
  const placed = new Uint8Array(N);
  const units: number[][] = [];

  for (let r = 0; r < n; r++) {
    const u: number[] = [];
    for (let c = 0; c < n; c++) u.push(r * n + c);
    units.push(u);
  }
  for (let c = 0; c < n; c++) {
    const u: number[] = [];
    for (let r = 0; r < n; r++) u.push(r * n + c);
    units.push(u);
  }
  for (let g = 0; g < n; g++) units.push([]);
  for (let i = 0; i < N; i++) {
    units[2 * n + reg[Math.floor(i / n)][i % n]].push(i);
  }

  // 충돌 표를 미리 계산 (규칙은 queensConflict와 같음)
  const conflict = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i !== j && queensConflict(reg, [Math.floor(i / n), i % n], [Math.floor(j / n), j % n])) {
        conflict[i * N + j] = 1;
      }
    }
  }

  const place = (cd: Uint8Array, pl: Uint8Array, i: number) => {
    pl[i] = 1;
    for (let j = 0; j < N; j++) {
      if (cd[j] && conflict[i * N + j]) cd[j] = 0;
    }
  };

  const dead = (cd: Uint8Array, pl: Uint8Array) =>
    units.some(u => !u.some(i => pl[i]) && !u.some(i => cd[i]));

  let level = 0;
  let count = 0;

  while (count < n) {
    let progress = false;

    // Lv1: 남은 후보가 1칸뿐인 줄/영역
    for (const u of units) {
      if (u.some(i => placed[i])) continue;
      const cs = u.filter(i => cand[i]);
      if (!cs.length) return { solved: false, level, solution: null };
      if (cs.length === 1) {
        place(cand, placed, cs[0]);
        count++;
        progress = true;
        level = Math.max(level, 1);
      }
    }
    if (progress) continue;

    // Lv2: 한 줄/영역의 후보가 모두 다른 줄/영역 안에 있으면 그쪽의 나머지 후보 제거
    for (const a of units) {
      if (a.some(i => placed[i])) continue;
      const cs = a.filter(i => cand[i]);
      if (!cs.length) continue;
      for (const b of units) {
        if (b === a || !cs.every(i => b.includes(i))) continue;
        for (const j of b) {
          if (cand[j] && !placed[j] && !cs.includes(j)) {
            cand[j] = 0;
            progress = true;
          }
        }
      }
    }
    if (progress) {
      level = Math.max(level, 2);
      continue;
    }

    // Lv3: 놓았을 때 다른 줄/영역이 막히는 칸 제거
    for (let i = 0; i < N; i++) {
      if (!cand[i] || placed[i]) continue;
      const cd = cand.slice();
      const pl = placed.slice();
      place(cd, pl, i);
      if (dead(cd, pl)) {
        cand[i] = 0;
        progress = true;
      }
    }
    if (progress) {
      level = Math.max(level, 3);
      continue;
    }

    return { solved: false, level, solution: null };
  }

  const solution = Array(n).fill(-1);
  for (let i = 0; i < N; i++) if (placed[i]) solution[Math.floor(i / n)] = i % n;
  return { solved: true, level, solution };
}

/* =========================================================================
 * 퍼즐 검증 (생성한 판, 예비 퍼즐, 비상용 퍼즐 모두 이걸 통과해야 함)
 * ========================================================================= */
export type VerifyResult = { ok: true; level: number } | { ok: false; reason: string };

export function verifyPuzzle(p: PuzzleData): VerifyResult {
  const n = p.regions.length;

  const regionError = validateRegions(p.regions, n);
  if (regionError) return { ok: false, reason: regionError };

  if (
    p.solution.length !== n ||
    p.solution.some(c => !Number.isInteger(c) || c < 0 || c >= n)
  ) {
    return { ok: false, reason: '정답 배열 형식 오류' };
  }

  const solCells: Cell[] = p.solution.map((c, r) => [r, c] as const);
  if (!isSolved(p.regions, solCells)) {
    return { ok: false, reason: '저장된 정답이 게임 규칙을 어김' };
  }

  // 해가 정확히 1개인지
  const sols = findSolutions(p.regions, n, 2);
  if (sols.length === 0) return { ok: false, reason: '해가 없음' };
  if (sols.length > 1) return { ok: false, reason: '해가 2개 이상' };
  if (!sameSolution(sols[0], p.solution)) return { ok: false, reason: '찾은 해가 저장된 정답과 다름' };

  // 추측 없이 논리만으로 풀리는지
  const ls = logicSolve(p.regions, n);
  if (!ls.solved || !ls.solution || !sameSolution(ls.solution, p.solution)) {
    return { ok: false, reason: '논리 풀이만으로 풀리지 않음' };
  }

  return { ok: true, level: ls.level };
}

/* =========================================================================
 * 예비 퍼즐
 * buildBackupPuzzles()로 미리 만든 JSON을 여기에 붙여 넣는다.
 * 붙여 넣은 뒤에도 실제로 쓸 때 verifyPuzzle을 다시 거친다.
 * ========================================================================= */
export const BACKUP_PUZZLES: Partial<Record<BoardSize, PuzzleData[]>> = {
  // 5: [{ regions: [...], solution: [...], level: 1 }, ...],
};

const verifiedBackupCache = new Map<PuzzleData, VerifyResult>();

function pickBackup(n: BoardSize, stage: number): PuzzleData | null {
  const list = BACKUP_PUZZLES[n] ?? [];
  for (let k = 0; k < list.length; k++) {
    const p = list[mod(stage + k, list.length)];
    let v = verifiedBackupCache.get(p);
    if (!v) {
      v = verifyPuzzle(p);
      verifiedBackupCache.set(p, v);
      if (!v.ok) console.warn(`[puzzle] 예비 퍼즐 검증 실패 (n=${n}): ${v.reason}`);
    }
    if (v.ok) return { ...p, level: v.level };
  }
  return null;
}

/** 호출부에서 예비 퍼즐을 직접 꺼낼 때 사용 */
export function getBackupPuzzle(n: BoardSize, stage: number): PuzzleData | null {
  return pickBackup(n, stage);
}

/**
 * 비상용 퍼즐: 정답 퀸 n-1개를 각각 1칸짜리 영역으로 만들고, 나머지 칸은 한 영역으로 묶는다.
 * 해가 하나뿐인 게 보장되지만 쉽다. 이것도 verifyPuzzle을 통과해야 반환한다.
 */
export function buildEmergencyPuzzle(n: BoardSize, stage: number): PuzzleData | null {
  const rng = mulberry32((n * 31337 + stage * 1009) | 0);
  for (let t = 0; t < 50; t++) {
    const perm = randomPlacement(n, rng);
    if (!perm) continue;

    const big = n - 1;
    const regions = Array.from({ length: n }, () => Array(n).fill(big));
    for (let r = 0; r < n - 1; r++) regions[r][perm[r]] = r;

    const p: PuzzleData = { regions, solution: perm, level: 0 };
    const v = verifyPuzzle(p);
    if (v.ok) return { ...p, level: v.level };
  }
  return null;
}

/* =========================================================================
 * 생성 API
 * ========================================================================= */
export type PuzzleSource = 'generated' | 'backup' | 'emergency';

export type PuzzleResult =
  | { ok: true; puzzle: PuzzleData; source: PuzzleSource }
  | { ok: false; reason: string };

export interface GenerateOptions {
  maxAttempts?: number;
  /** 재시도 번호. 0이면 기존과 같은 퍼즐이 나오고, 1부터는 시드가 바뀐다. */
  retry?: number;
  /** 실패했을 때 예비 퍼즐로 넘어갈지 여부 */
  allowBackup?: boolean;
}

/** stage: 시드용 스테이지 번호 (반환값의 level은 난이도라서 이름을 구분함) */
export function usePuzzleResult(
  n: BoardSize,
  stage: number,
  { maxAttempts = 2000, retry = 0, allowBackup = true }: GenerateOptions = {}
): PuzzleResult {
  // retry = 0이면 기존 시드와 같아서, 이미 나오던 퍼즐은 바뀌지 않는다
  const rng = mulberry32((n * 100003 + stage * 7919 + retry * 104729) | 0);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const perm = randomPlacement(n, rng);
    if (!perm) continue;
    const regions = growRegions(n, perm, rng);
    if (!regions) continue;

    const candidate: PuzzleData = { regions, solution: perm, level: 0 };
    const v = verifyPuzzle(candidate);
    if (v.ok) {
      return { ok: true, puzzle: { ...candidate, level: v.level }, source: 'generated' };
    }
  }

  // 검증 안 된 판은 절대 내보내지 않음 → 예비 퍼즐 또는 실패
  if (allowBackup) {
    const backup = pickBackup(n, stage);
    if (backup) return { ok: true, puzzle: backup, source: 'backup' };
  }

  return {
    ok: false,
    reason: `n=${n}, stage=${stage}, retry=${retry}: ${maxAttempts}회 안에 유일해 퍼즐 생성 실패`,
  };
}

export class PuzzleGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PuzzleGenerationError';
  }
}

/** 기존 호출부 호환용. 실패하면 검증 안 된 판 대신 예외를 던진다. (새 코드는 usePuzzle 사용) */
export function usePuzzle(n: BoardSize, stage: number): PuzzleData {
  const res = usePuzzleResult(n, stage);
  if (!res.ok) throw new PuzzleGenerationError(res.reason);
  return res.puzzle;
}

/** 오프라인에서 예비 퍼즐을 만들 때 쓰는 함수 (빌드 스크립트에서 실행 후 JSON으로 저장) */
export function buildBackupPuzzles(n: BoardSize, count: number, startStage = 100000): PuzzleData[] {
  const out: PuzzleData[] = [];
  for (let s = startStage; out.length < count && s < startStage + count * 50; s++) {
    const res = usePuzzleResult(n, s, { allowBackup: false });
    if (res.ok) out.push(res.puzzle);
  }
  return out;
}

/* ========================================================================= */
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
