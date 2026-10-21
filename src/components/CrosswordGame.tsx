import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board, wordAt } from './Board';
import type { BoardHandle, Cursor } from './Board';
import { checkInput, createEmptyInput, formatTime, UI_TEXT } from '../utils/puzzle';
import type { CrosswordData, Dir, Lang, PlacedWord } from '../utils/puzzle';
import { getPuzzle } from '../utils/puzzleLoader';

const LANG_KEY = 'crossword-lang';
const PROGRESS_KEY = 'crossword-progress-v1';
type Progress = Record<Lang, number>;   // 언어별로 깬 최고 레벨

const BTN = 'px-3 py-1.5 rounded-lg border border-[#c7b08a]/40 hover:bg-white/10 disabled:opacity-30 transition';
const BTN_PRIMARY = 'px-4 py-1.5 rounded-lg bg-[#b8924a] text-[#2a170a] font-bold hover:brightness-110 transition';

function loadProgress(): Progress {
  try {
    return { ko: 0, en: 0, ...JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') };
  } catch {
    return { ko: 0, en: 0 };
  }
}

const cellsOf = (w: PlacedWord): [number, number][] =>
  w.answer.map((_, i) => [w.row + (w.dir === 'down' ? i : 0), w.col + (w.dir === 'across' ? i : 0)]);

const firstCursor = (p: CrosswordData): Cursor | null =>
  p.words[0] ? { r: p.words[0].row, c: p.words[0].col, dir: p.words[0].dir } : null;

/* ── 가로/세로 힌트 목록 ── */
const ClueList: React.FC<{
  title: string;
  words: PlacedWord[];
  active: PlacedWord | null;
  showHint: boolean;
  onSelect: (w: PlacedWord) => void;
}> = ({ title, words, active, showHint, onSelect }) => (
  <section>
    <h2 className="mb-1 font-bold text-[#b8924a]">{title}</h2>
    <ul className="space-y-1">
      {words.map(w => (
        <li key={w.id}>
          <button
            onClick={() => onSelect(w)}
            className={`w-full text-left rounded px-2 py-1 transition ${
              active?.id === w.id ? 'bg-[#b8924a] text-[#2a170a]' : 'hover:bg-white/5'
            }`}
          >
            <b className="mr-1">{w.number}.</b>
            {w.clue} <span className="opacity-60">({w.answer.length})</span>
            {showHint && w.hint && <span className="block text-xs opacity-80">{w.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  </section>
);

export const CrosswordGame: React.FC = () => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ko'));
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [level, setLevel] = useState(() => loadProgress()[lang] + 1);

  const [puzzle, setPuzzle] = useState<CrosswordData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState<string[][]>([]);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [combo, setCombo] = useState<{ index: number; id: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const boardRef = useRef<BoardHandle>(null);
  const inputRef = useRef(input);   // 한 이벤트 안에서 여러 번 입력돼도 최신 값을 보도록
  const startRef = useRef(0);
  const t = UI_TEXT[lang];

  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }, [progress]);

  /* 퍼즐 로드 */
  useEffect(() => {
    let alive = true;
    setPuzzle(null);
    setLoadError(null);
    getPuzzle(lang, level)
      .then(p => {
        if (!alive) return;
        const empty = createEmptyInput(p);
        inputRef.current = empty;
        setInput(empty);
        setPuzzle(p);
        setCursor(firstCursor(p));
        setWrong(new Set());
        setHintCell(null);
        setShowHint(false);
        setSolved(false);
        setElapsed(0);
        startRef.current = Date.now();
      })
      .catch(err => { if (alive) setLoadError(String(err)); });
    return () => { alive = false; };
  }, [lang, level]);

  /* 타이머 */
  useEffect(() => {
    if (!puzzle || solved) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startRef.current), 500);
    return () => window.clearInterval(id);
  }, [puzzle, solved]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const finish = useCallback(() => {
    setSolved(true);
    setElapsed(Date.now() - startRef.current);
    setProgress(prev => ({ ...prev, [lang]: Math.max(prev[lang], level) }));
  }, [lang, level]);

  const handleCellInput = useCallback(
    (r: number, c: number, ch: string, committed = true) => {
      if (!puzzle || solved) return;
      const next = inputRef.current.map(row => [...row]);
      next[r][c] = ch;
      inputRef.current = next;
      setInput(next);

      const idx = r * puzzle.size + c;
      setWrong(prev => {
        if (!prev.has(idx)) return prev;
        const s = new Set(prev);
        s.delete(idx);
        return s;
      });

      if (!committed || !ch) return;   // 한글 조합 중 미리보기는 판정 안 함

      // 단어 하나를 완성하면 이펙트
      for (const dir of ['across', 'down'] as Dir[]) {
        const w = wordAt(puzzle.words, r, c, dir);
        if (w && cellsOf(w).every(([rr, cc], i) => next[rr][cc] === w.answer[i])) {
          setCombo({ index: idx, id: Date.now() });
        }
      }
      if (checkInput(puzzle, next).solved) finish();
    },
    [puzzle, solved, finish],
  );

  const activeWord = useMemo(
    () => (puzzle && cursor ? wordAt(puzzle.words, cursor.r, cursor.c, cursor.dir) ?? null : null),
    [puzzle, cursor],
  );

  const handleCheck = () => {
    if (!puzzle) return;
    const res = checkInput(puzzle, inputRef.current);
    setWrong(new Set(res.wrong.map(([r, c]) => r * puzzle.size + c)));
    if (res.solved) finish();
    else if (res.wrong.length) flash(`${t.wrong} (${res.wrong.length})`);
    else flash(`${t.empty} (${res.empty})`);
  };

  /* 한 칸 공개: 현재 칸 → 현재 단어 → 판 전체 순으로 틀리거나 빈 칸을 찾음 */
  const handleReveal = () => {
    if (!puzzle || solved) return;
    const { grid, size } = puzzle;
    const bad = (r: number, c: number) => grid[r][c] !== null && inputRef.current[r][c] !== grid[r][c];

    let target: [number, number] | undefined;
    if (cursor && bad(cursor.r, cursor.c)) target = [cursor.r, cursor.c];
    if (!target && activeWord) target = cellsOf(activeWord).find(([r, c]) => bad(r, c));
    if (!target) {
      const i = grid.flat().findIndex((_, k) => bad(Math.floor(k / size), k % size));
      if (i >= 0) target = [Math.floor(i / size), i % size];
    }
    if (!target) return;

    const [r, c] = target;
    handleCellInput(r, c, grid[r][c]!);
    setHintCell(r * size + c);
    window.setTimeout(() => setHintCell(null), 1200);
  };

  const handleReset = () => {
    if (!puzzle) return;
    const empty = createEmptyInput(puzzle);
    inputRef.current = empty;
    setInput(empty);
    setWrong(new Set());
    setSolved(false);
    setCursor(firstCursor(puzzle));
    setElapsed(0);
    startRef.current = Date.now();
  };

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    setLevel(progress[l] + 1);
  };

  const selectWord = (w: PlacedWord) => {
    setCursor({ r: w.row, c: w.col, dir: w.dir });
    boardRef.current?.focus();   // 클릭 이벤트 안에서 바로 호출해야 모바일 키보드가 뜸
  };

  const maxLevel = progress[lang] + 1;

  if (loadError) return <div className="p-6 text-center text-red-300">{loadError}</div>;
  if (!puzzle) return <div className="p-6 text-center text-[#e8d9b5]">{t.loading}</div>;

  const across = puzzle.words.filter(w => w.dir === 'across');
  const down = puzzle.words.filter(w => w.dir === 'down');

  return (
    <div className="min-h-screen bg-[#1d1008] text-[#e8d9b5] px-3 py-4 md:py-8">
      <div className="mx-auto max-w-5xl">
        {/* 헤더 */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button className={BTN} onClick={() => setLevel(l => Math.max(1, l - 1))} disabled={level <= 1}>‹</button>
            <span>{t.level} {level}</span>
            <button className={BTN} onClick={() => setLevel(l => Math.min(maxLevel, l + 1))} disabled={level >= maxLevel}>›</button>
            <span className="ml-2 tabular-nums">{t.time} {formatTime(elapsed)}</span>
            <div className="ml-2 flex overflow-hidden rounded-lg border border-[#c7b08a]/40">
              {(['ko', 'en'] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-3 py-1 ${lang === l ? 'bg-[#b8924a] font-bold text-[#2a170a]' : ''}`}
                >
                  {l === 'ko' ? '한국어' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {/* 현재 문제 */}
            <div className="mb-2 min-h-[3rem] rounded-lg bg-[#2a170a] px-3 py-2 text-sm">
              {activeWord ? (
                <>
                  <b className="mr-1">
                    {activeWord.number} {activeWord.dir === 'across' ? t.across : t.down}.
                  </b>
                  {activeWord.clue}
                  {showHint && activeWord.hint && (
                    <span className="ml-2 text-[#b8924a]">({activeWord.hint})</span>
                  )}
                </>
              ) : (
                t.pickCell
              )}
            </div>

            <Board
              ref={boardRef}
              data={puzzle}
              input={input}
              cursor={cursor}
              wrongCells={wrong}
              hintCell={hintCell}
              comboCell={combo}
              locked={solved}
              onCursorChange={setCursor}
              onCellInput={handleCellInput}
            />

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button className={BTN} onClick={handleCheck}>{t.check}</button>
              <button className={BTN} onClick={handleReveal}>{t.reveal}</button>
              <button className={BTN} onClick={() => setShowHint(v => !v)}>
                {showHint ? t.hideHint : t.hint}
              </button>
              <button className={BTN} onClick={handleReset}>{t.reset}</button>
            </div>
          </div>

          <aside className="space-y-4 text-sm">
            <ClueList title={t.across} words={across} active={activeWord} showHint={showHint} onSelect={selectWord} />
            <ClueList title={t.down} words={down} active={activeWord} showHint={showHint} onSelect={selectWord} />
          </aside>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-[#2a170a] px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {/* 완료 */}
      {solved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-[#2a170a] p-6 text-center shadow-2xl">
            <p className="mb-2 text-2xl font-bold">{t.solved}</p>
            <p className="mb-4 tabular-nums">{t.time} {formatTime(elapsed)}</p>
            <div className="flex justify-center gap-2">
              <button className={BTN} onClick={handleReset}>{t.retry}</button>
              <button className={BTN_PRIMARY} onClick={() => setLevel(l => l + 1)}>{t.next}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
