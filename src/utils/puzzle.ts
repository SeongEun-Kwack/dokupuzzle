import { BoardSize, PuzzleData } from '../types';

export const PALETTE = [
  '#e8c48e',
  '#c9784f',
  '#9fae78',
  '#8fa8bb',
  '#d29aa0',
  '#e0b04a',
  '#a796bf',
  '#6fa59f'
];

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

function randomPlacement(n: number, rng: () => number): number[] | null {
  const perm: number[] = [];
  const used = Array(n).fill(false);

  const bt = (r: number): boolean => {
    if (r === n) return true;
    const cols = shuffle([...Array(n).keys()], rng);
    for (const c of cols) {
      if (used[c] || (r > 0 && Math.abs(c - perm[r - 1]) <= 1)) continue;
      used[c] = true;
      perm[r] = c;
      if (bt(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };

  return bt(0) ? perm : null;
}

function growRegions(n: number, perm: number[], rng: () => number): number[][] {
  const reg: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  const frontier: [number, number][] = [];

  perm.forEach((c, r) => {
    reg[r][c] = r;
    frontier.push([r, c]);
  });

  let filled = n;
  while (filled < n * n) {
    if (!frontier.length) break;
    const i = Math.floor(rng() * frontier.length);
    const [r, c] = frontier[i];
    const nb: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]
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

  return reg;
}

function countSolutions(reg: number[][], n: number, limit = 2): number {
  let count = 0;
  const colUsed = Array(n).fill(false);
  const regUsed = Array(n).fill(false);

  const bt = (r: number, prev: number) => {
    if (r === n) {
      count++;
      return;
    }
    for (let c = 0; c < n && count < limit; c++) {
      const g = reg[r][c];
      if (colUsed[c] || regUsed[g] || (prev >= 0 && Math.abs(c - prev) <= 1)) continue;
      colUsed[c] = true;
      regUsed[g] = true;
      bt(r + 1, c);
      colUsed[c] = false;
      regUsed[g] = false;
    }
  };

  bt(0, -1);
  return count;
}

function logicSolve(reg: number[][], n: number): { solved: boolean; level: number } {
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
    const r = Math.floor(i / n);
    const c = i % n;
    units[2 * n + reg[r][c]].push(i);
  }

  const conflicts = (i: number, j: number) => {
    const ri = Math.floor(i / n);
    const ci = i % n;
    const rj = Math.floor(j / n);
    const cj = j % n;
    return (
      ri === rj ||
      ci === cj ||
      reg[ri][ci] === reg[rj][cj] ||
      (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)
    );
  };

  const place = (cd: Uint8Array, pl: Uint8Array, i: number) => {
    pl[i] = 1;
    for (let j = 0; j < N; j++) {
      if (j !== i && cd[j] && conflicts(i, j)) {
        cd[j] = 0;
      }
    }
  };

  const dead = (cd: Uint8Array, pl: Uint8Array) =>
    units.some(u => !u.some(i => pl[i]) && !u.some(i => cd[i]));

  let level = 0;
  let count = 0;

  while (count < n) {
    let progress = false;
    for (const u of units) {
      if (u.some(i => placed[i])) continue;
      const cs = u.filter(i => cand[i]);
      if (!cs.length) return { solved: false, level };
      if (cs.length === 1) {
        place(cand, placed, cs[0]);
        count++;
        progress = true;
        level = Math.max(level, 1);
      }
    }
    if (progress) continue;

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

    return { solved: false, level };
  }

  return { solved: true, level };
}

export function generatePuzzle(n: BoardSize, level: number): PuzzleData {
  const seed = n * 100003 + level * 7919;
  const rng = mulberry32(seed);

  let attempts = 0;
  while (attempts < 2000) {
    attempts++;
    const perm = randomPlacement(n, rng);
    if (!perm) continue;
    const reg = growRegions(n, perm, rng);
    if (countSolutions(reg, n) !== 1) continue;
    const ls = logicSolve(reg, n);
    if (ls.solved) {
      return {
        regions: reg,
        solution: perm,
        level: ls.level
      };
    }
  }

  // Fallback fallback if loop limit reached
  const perm = randomPlacement(n, rng) || Array.from({ length: n }, (_, i) => i);
  const reg = growRegions(n, perm, rng);
  return {
    regions: reg,
    solution: perm,
    level: 1
  };
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
