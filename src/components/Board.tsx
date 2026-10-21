import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback } from 'react';
import { InkDefs } from './InkMarks';
import { PALETTE } from '../utils/puzzle';
import type { CrosswordData, Dir, PlacedWord } from '../utils/puzzle';

export interface Cursor { r: number; c: number; dir: Dir }

/** 부모가 board.focus()를 호출할 수 있게 열어 주는 기능 */
export interface BoardHandle { focus: () => void }

interface BoardProps {
  data: CrosswordData;
  input: string[][];
  cursor: Cursor | null;
  wrongCells: Set<number>;
  hintCell: number | null;
  comboCell: { index: number; id: number } | null;
  locked?: boolean;
  onCursorChange: (c: Cursor) => void;
  /** committed=false 이면 한글 조합 중 미리보기 (정답 판정 X) */
  onCellInput: (r: number, c: number, ch: string, committed?: boolean) => void;
}

export function wordAt(words: PlacedWord[], r: number, c: number, dir: Dir) {
  return words.find(w =>
    w.dir === dir &&
    (dir === 'across'
      ? w.row === r && c >= w.col && c < w.col + w.answer.length
      : w.col === c && r >= w.row && r < w.row + w.answer.length),
  );
}

const flip = (d: Dir): Dir => (d === 'across' ? 'down' : 'across');
const lastChar = (s: string | null | undefined) => Array.from(s ?? '').pop() ?? '';

export const Board = forwardRef<BoardHandle, BoardProps>(({
  data, input, cursor, wrongCells, hintCell, comboCell, locked,
  onCursorChange, onCellInput,
}, ref) => {
  const n = data.size;
  const hiddenRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const justComposedRef = useRef(false);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const inputDataRef = useRef(input);
  inputDataRef.current = input;

  const isOpen = useCallback(
    (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && data.grid[r][c] !== null,
    [data.grid, n],
  );

  const setCursor = useCallback((next: Cursor) => {
    cursorRef.current = next;
    onCursorChange(next);
  }, [onCursorChange]);

  const activeWord = useMemo(
    () => (cursor ? wordAt(data.words, cursor.r, cursor.c, cursor.dir) ?? null : null),
    [cursor, data.words],
  );

  const activeSet = useMemo(() => {
    const s = new Set<number>();
    activeWord?.answer.forEach((_, i) => {
      const r = activeWord.row + (activeWord.dir === 'down' ? i : 0);
      const c = activeWord.col + (activeWord.dir === 'across' ? i : 0);
      s.add(r * n + c);
    });
    return s;
  }, [activeWord, n]);

  /** 현재 방향으로 한 칸 이동 (단어 끝이면 멈춤) */
  const step = useCallback((delta: 1 | -1) => {
    const cur = cursorRef.current;
    if (!cur) return false;
    const r = cur.r + (cur.dir === 'down' ? delta : 0);
    const c = cur.c + (cur.dir === 'across' ? delta : 0);
    if (!isOpen(r, c)) return false;
    setCursor({ ...cur, r, c });
    return true;
  }, [isOpen, setCursor]);

  /** 방향키: 검은 칸은 건너뛰고 다음 열린 칸으로 */
  const jump = useCallback((dr: number, dc: number) => {
    const cur = cursorRef.current;
    if (!cur) return;
    let r = cur.r + dr, c = cur.c + dc;
    while (r >= 0 && c >= 0 && r < n && c < n) {
      if (isOpen(r, c)) {
        const want: Dir = dr !== 0 ? 'down' : 'across';
        const dir = wordAt(data.words, r, c, want) ? want : flip(want);
        setCursor({ r, c, dir });
        return;
      }
      r += dr; c += dc;
    }
  }, [data.words, isOpen, n, setCursor]);

  const focusHidden = useCallback(() => {
    const el = hiddenRef.current;
    if (!el) return;
    el.value = '';
    el.focus({ preventScroll: true });
  }, []);

  // 부모에서 boardRef.current.focus() 로 키보드를 띄울 수 있게 함
  useImperativeHandle(ref, () => ({ focus: focusHidden }), [focusHidden]);

  const handleCellPointerDown = (e: React.PointerEvent, r: number, c: number) => {
    e.preventDefault();
    if (!isOpen(r, c)) return;
    let dir: Dir = cursor?.dir ?? 'across';
    if (cursor && cursor.r === r && cursor.c === c) dir = flip(dir);   // 같은 칸 다시 탭 → 방향 전환
    if (!wordAt(data.words, r, c, dir)) dir = flip(dir);
    setCursor({ r, c, dir });
    focusHidden();
  };

  /* ── 한글 IME ── */
  const onCompositionStart = () => { composingRef.current = true; };

  const onCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    const cur = cursorRef.current;
    if (!cur || locked) return;
    onCellInput(cur.r, cur.c, lastChar(e.data), false);   // 미리보기
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    justComposedRef.current = true;
    setTimeout(() => { justComposedRef.current = false; }, 0);
    const cur = cursorRef.current;
    if (!cur || locked) return;
    const ch = lastChar(e.data);
    onCellInput(cur.r, cur.c, ch, true);
    if (ch) step(1);
  };

  /* ── 영어 등 조합 없는 입력 ── */
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const native = e.nativeEvent as InputEvent;
    if (composingRef.current || native.isComposing) return;
    const el = e.currentTarget;
    if (justComposedRef.current) { el.value = ''; return; }
    const ch = lastChar(el.value);
    el.value = '';
    const cur = cursorRef.current;
    if (!cur || locked || !ch.trim()) return;
    if (data.lang === 'en' && !/^[a-z]$/i.test(ch)) return;
    onCellInput(cur.r, cur.c, ch.toUpperCase(), true);
    step(1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current || e.nativeEvent.isComposing) return;
    const cur = cursorRef.current;
    if (!cur || locked) return;
    switch (e.key) {
      case 'Backspace': {
        e.preventDefault();
        if (inputDataRef.current[cur.r][cur.c]) {
          onCellInput(cur.r, cur.c, '', true);
        } else if (step(-1)) {
          const prev = cursorRef.current!;
          onCellInput(prev.r, prev.c, '', true);
        }
        break;
      }
      case 'ArrowUp': e.preventDefault(); jump(-1, 0); break;
      case 'ArrowDown': e.preventDefault(); jump(1, 0); break;
      case 'ArrowLeft': e.preventDefault(); jump(0, -1); break;
      case 'ArrowRight': e.preventDefault(); jump(0, 1); break;
      case ' ':
        e.preventDefault();
        if (wordAt(data.words, cur.r, cur.c, flip(cur.dir))) setCursor({ ...cur, dir: flip(cur.dir) });
        break;
    }
  };

  return (
    <div className="board-frame p-2 sm:p-2.5 md:p-3.5 rounded-2xl w-full max-w-[min(100%,460px)] md:max-w-[560px] lg:max-w-[620px] mx-auto shadow-2xl relative select-none">
      <InkDefs />
      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#2a170a] shadow-inner touch-none"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: n * n }, (_, idx) => {
          const r = Math.floor(idx / n);
          const c = idx % n;
          const open = data.grid[r][c] !== null;

          if (!open) {
            return (
              <div key={idx} style={{
                backgroundColor: '#2a170a',
                backgroundImage: 'repeating-linear-gradient(100deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 7px)',
              }} />
            );
          }

          const num = data.numbers[r][c];
          const val = input[r]?.[c] ?? '';
          const isSel = cursor?.r === r && cursor?.c === c;
          const isActive = activeSet.has(idx);
          const isWrong = wrongCells.has(idx);
          const isHint = hintCell === idx;

          return (
            <div
              key={idx}
              onPointerDown={e => handleCellPointerDown(e, r, c)}
              className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${isWrong ? 'animate-shake' : ''} ${comboCell?.index === idx ? 'combo-burst-cell' : ''}`}
              style={{
                backgroundColor: isSel ? PALETTE[5] : isActive ? '#dcc79a' : PALETTE[6],
                backgroundImage: 'repeating-linear-gradient(100deg, rgba(0,0,0,0.035) 0 2px, transparent 2px 7px), linear-gradient(160deg, rgba(255,255,255,0.22), rgba(0,0,0,0.12))',
                border: '1px solid rgba(42,23,10,0.35)',
                boxShadow: isWrong
                  ? 'inset 0 0 0 999px rgba(184, 50, 42, 0.55)'
                  : isHint
                  ? 'inset 0 0 0 4px #ffd34d, inset 0 0 16px rgba(255, 211, 77, 0.95)'
                  : isSel
                  ? 'inset 0 0 0 2px #2a170a'
                  : undefined,
              }}
            >
              {num !== null && (
                <span className="absolute top-[2px] left-[3px] leading-none font-bold text-[#2a170a]/80 pointer-events-none"
                  style={{ fontSize: 'clamp(7px, 1.6vw, 11px)' }}>
                  {num}
                </span>
              )}
              <span className="font-bold text-[#2a170a] pointer-events-none"
                style={{ fontSize: data.lang === 'ko' ? 'clamp(14px, 4.2vw, 28px)' : 'clamp(14px, 4.6vw, 30px)' }}>
                {val}
              </span>
              {comboCell?.index === idx && (
                <div key={comboCell.id} className="combo-particles" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, p) => <i key={p} />)}
                </div>
              )}
            </div>
          );
        })}

        {/* 모바일 키보드 + IME용 숨김 input */}
        <input
          ref={hiddenRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize={data.lang === 'en' ? 'characters' : 'off'}
          spellCheck={false}
          lang={data.lang}
          aria-label="crossword input"
          onCompositionStart={onCompositionStart}
          onCompositionUpdate={onCompositionUpdate}
          onCompositionEnd={onCompositionEnd}
          onInput={onInput}
          onKeyDown={onKeyDown}
          className="absolute opacity-0 pointer-events-none"
          style={{
            width: 1, height: 1, fontSize: 16,
            top: cursor ? `${(cursor.r / n) * 100}%` : 0,
            left: cursor ? `${(cursor.c / n) * 100}%` : 0,
          }}
        />
      </div>
    </div>
  );
});

Board.displayName = 'Board';
