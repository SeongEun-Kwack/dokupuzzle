// puzzle.ts — 십자말풀이 생성기 (8x8 기본)

export const PALETTE = [
  "#9a5546", "#7f8b5e", "#5f7487", "#76628a", "#527c78",
  "#b8924a", "#c7b08a", "#4a5670", "#8a6a4f",
];

<<<<<<< HEAD
<<<<<<< HEAD
/* ───────────────── 타입 ───────────────── */

export type Lang = 'ko' | 'en';
export type Dir = 'across' | 'down';

export interface WordEntry {
  id?: string;
  answer: string;
  clue: string;
  hint?: string;        // 영어: 한국어 뜻 / 한국어: 분류
  category?: string;
  difficulty?: number;  // 1~3
}

export interface PlacedWord {
  id: number;
  number: number;     // 칸에 표시될 번호
  dir: Dir;
  row: number;
  col: number;
  answer: string[];   // 칸 단위로 쪼갠 정답
  clue: string;
  hint?: string;
}

export interface CrosswordData {
  size: number;
  lang: Lang;
  level: number;
  grid: (string | null)[][];      // null = 검은 칸
  numbers: (number | null)[][];   // 시작 칸 번호
  words: PlacedWord[];
}

export function bankForLevel(bank: WordEntry[], level: number): WordEntry[] {
  const maxD = level <= 10 ? 1 : level <= 30 ? 2 : 3;
  const pool = bank.filter(w => (w.difficulty ?? 1) <= maxD);
  return pool.length >= 40 ? pool : bank;   // 단어가 모자라면 전체 사용
}


/* ───────────────── UI 문구 (ko / en) ───────────────── */

export const UI_TEXT = {
   ko: {
    title: '십자말풀이', across: '가로', down: '세로', check: '정답 확인',
    reveal: '한 칸 공개', hint: '힌트 보기', hideHint: '힌트 숨기기', reset: '초기화',
    retry: '다시 풀기', next: '다음 레벨', solved: '완성했어요!', wrong: '틀린 칸이 있어요',
    empty: '빈칸이 남았어요', time: '시간', level: '레벨', loading: '불러오는 중…',
    pickCell: '칸을 눌러 시작하세요',
  },
  en: {
    title: 'Crossword', across: 'Across', down: 'Down', check: 'Check',
    reveal: 'Reveal cell', hint: 'Show hint', hideHint: 'Hide hint', reset: 'Reset',
    retry: 'Retry', next: 'Next level', solved: 'Solved!', wrong: 'Some cells are wrong',
    empty: 'Some cells are empty', time: 'Time', level: 'Level', loading: 'Loading…',
    pickCell: 'Tap a cell to start',
  },
} as const;

/* ───────────────── 단어 은행 ───────────────── */


export function generateCrossword(
  lang: Lang, level: number, bank: WordEntry[], n = 8, salt = 0,
): CrosswordData {
  if (!bank.length) throw new Error(`단어 은행이 비어 있어요 (${lang})`);
  const seed = n * 100003 + level * 7919 + (lang === 'en' ? 104729 : 0) + salt * 15485863;
  const rng = mulberry32(seed);

  const target = Math.min(14, 6 + Math.floor(level / 2));

  let best = buildOnce(n, bank, target, rng);
  for (let i = 0; i < 300 && best.placed.length < target; i++) {
    const t = buildOnce(n, bank, target, rng);
    if (t.score > best.score) best = t;
  }

  const { numbers, words } = numberWords(n, best.placed);
  return { size: n, lang, level, grid: best.g, numbers, words };
}

/* ───────────────── 유틸 ───────────────── */

=======
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
=======
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
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

<<<<<<< HEAD
<<<<<<< HEAD
/** 한글은 음절 1개 = 1칸, 영어는 알파벳 1개 = 1칸 */
export function splitChars(s: string): string[] {
  return Array.from(s.normalize('NFC').trim().toUpperCase());
}

const inB = (r: number, c: number, n: number) => r >= 0 && c >= 0 && r < n && c < n;
=======
=======
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
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
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)

type Grid = (string | null)[][];
type Draft = Omit<PlacedWord, 'id' | 'number'>;

/* ───────────────── 배치 로직 ───────────────── */

/** 배치 가능하면 교차 칸 수, 불가능하면 -1 */
function canPlace(
  g: Grid, used: number[][], chars: string[],
  r: number, c: number, dir: Dir, n: number,
): number {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;
  const bit = dir === 'across' ? 1 : 2;
  const len = chars.length;
  const er = r + dr * (len - 1);
  const ec = c + dc * (len - 1);

  if (!inB(r, c, n) || !inB(er, ec, n)) return -1;
  // 단어 앞뒤 칸은 비어 있어야 함
  if (inB(r - dr, c - dc, n) && g[r - dr][c - dc] !== null) return -1;
  if (inB(er + dr, ec + dc, n) && g[er + dr][ec + dc] !== null) return -1;

  let cross = 0;
  for (let i = 0; i < len; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const cur = g[rr][cc];
    if (cur !== null) {
      if (cur !== chars[i] || used[rr][cc] & bit) return -1;
      cross++;
    } else {
      // 새 칸 옆(수직 방향)에 글자가 있으면 의도치 않은 단어가 생김
      if (inB(rr + dc, cc + dr, n) && g[rr + dc][cc + dr] !== null) return -1;
      if (inB(rr - dc, cc - dr, n) && g[rr - dc][cc - dr] !== null) return -1;
    }
  }
  if (cross === len) return -1;
  return cross;
}

function placeWord(g: Grid, used: number[][], chars: string[], r: number, c: number, dir: Dir) {
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;
  const bit = dir === 'across' ? 1 : 2;
  chars.forEach((ch, i) => {
    g[r + dr * i][c + dc * i] = ch;
    used[r + dr * i][c + dc * i] |= bit;
  });
<<<<<<< HEAD
}

function buildOnce(n: number, bank: WordEntry[], target: number, rng: () => number) {
  const g: Grid = Array.from({ length: n }, () => Array(n).fill(null));
  const used = Array.from({ length: n }, () => Array(n).fill(0));
  const placed: Draft[] = [];
  const usedAnswers = new Set<string>();

  const pool = shuffle(bank.filter(w => splitChars(w.answer).length <= n), rng);

  // 첫 단어: 길이가 절반 이상인 단어를 가운데 근처에 가로로
  const first = pool.find(w => splitChars(w.answer).length >= Math.ceil(n / 2)) ?? pool[0];
  const fc = splitChars(first.answer);
  const fr = Math.floor(n / 2) - 1 + Math.floor(rng() * 2);
  const fcol = Math.floor(rng() * (n - fc.length + 1));
  placeWord(g, used, fc, fr, fcol, 'across');
  placed.push({ dir: 'across', row: fr, col: fcol, answer: fc, clue: first.clue, hint: first.hint });
  usedAnswers.add(first.answer);

  // 두 번 순회: 처음엔 못 들어가던 단어도 나중엔 교차점이 생길 수 있음
  for (let pass = 0; pass < 2 && placed.length < target; pass++) {
    for (const w of pool) {
      if (placed.length >= target) break;
      if (usedAnswers.has(w.answer)) continue;
      const chars = splitChars(w.answer);

      let best: [number, number, Dir][] = [];
      let bestCross = 0;
      for (const dir of ['across', 'down'] as Dir[]) {
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const x = canPlace(g, used, chars, r, c, dir, n);
            if (x <= 0) continue;
            if (x > bestCross) { bestCross = x; best = [[r, c, dir]]; }
            else if (x === bestCross) best.push([r, c, dir]);
=======

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
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
          }
        }
      }
      if (!best.length) continue;

<<<<<<< HEAD
<<<<<<< HEAD
      const [r, c, dir] = best[Math.floor(rng() * best.length)];
      placeWord(g, used, chars, r, c, dir);
      placed.push({ dir, row: r, col: c, answer: chars, clue: w.clue, hint: w.hint });
      usedAnswers.add(w.answer);
    }
  }

  const filled = g.flat().filter(x => x !== null).length;
  return { g, placed, score: placed.length * 100 + filled };
}

function numberWords(n: number, drafts: Draft[]) {
  const numbers: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  const starts = [...new Set(drafts.map(d => d.row * n + d.col))].sort((a, b) => a - b);
  starts.forEach((s, i) => { numbers[Math.floor(s / n)][s % n] = i + 1; });

  const words: PlacedWord[] = drafts
    .map((d, id) => ({ ...d, id, number: numbers[d.row][d.col]! }))
    .sort((a, b) => a.number - b.number || (a.dir === 'across' ? -1 : 1));

  return { numbers, words };
}

/* ───────────────── 메인 API ───────────────── */

export function generateCrossword(lang: Lang, level: number, n = 8): CrosswordData {
  const seed = n * 100003 + level * 7919 + (lang === 'en' ? 104729 : 0);
  const rng = mulberry32(seed);
  const bank = lang === 'ko' ? KO_BANK : EN_BANK;

  // 레벨이 오를수록 단어 수 증가 (6 ~ 14개)
  const target = Math.min(14, 6 + Math.floor(level / 2));

  let best = buildOnce(n, bank, target, rng);
  for (let i = 0; i < 300 && best.placed.length < target; i++) {
    const t = buildOnce(n, bank, target, rng);
    if (t.score > best.score) best = t;
  }

  const { numbers, words } = numberWords(n, best.placed);
  return { size: n, lang, level, grid: best.g, numbers, words };
}

/* ───────────────── 정답 체크 ───────────────── */

export function createEmptyInput(data: CrosswordData): string[][] {
  return data.grid.map(row => row.map(() => ''));
}

export function checkInput(data: CrosswordData, input: string[][]) {
  const wrong: [number, number][] = [];
  let empty = 0;
  data.grid.forEach((row, r) =>
    row.forEach((ans, c) => {
      if (ans === null) return;
      const v = splitChars(input[r]?.[c] ?? '')[0] ?? '';
      if (!v) empty++;
      else if (v !== ans) wrong.push([r, c]);
    }),
  );
  return { solved: wrong.length === 0 && empty === 0, wrong, empty };
}

=======
=======
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
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

<<<<<<< HEAD
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
=======
>>>>>>> parent of 40664f2 (fix: 정답이 50/50% 일 경우 regenerated)
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
