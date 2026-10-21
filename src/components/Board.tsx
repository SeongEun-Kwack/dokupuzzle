import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BoardSize, CellState, ThreadEffect } from '../types';
import { PALETTE } from '../utils/puzzle';
import { DetectiveSVG } from './DetectiveSVG';

const DOUBLE_TAP_MS = 360;
const LONG_PRESS_MS = 480;

interface BoardProps {
  n: BoardSize;
  regions: number[][];
  marks: CellState[];
  badCell: number | null;
  hintCell: number | null;
  zoneCells: number[];
  threadEffect: ThreadEffect | null;
  comboCell: { index: number; id: number } | null;
  onCellDragMark: (index: number, val: 0 | 1) => void;
  onCellPlace: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  n,
  regions,
  marks,
  badCell,
  hintCell,
  zoneCells,
  threadEffect,
  comboCell,
  onCellDragMark,
  onCellPlace
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const lastTapRef = useRef<{ i: number; t: number }>({ i: -1, t: 0 });
  const pressRef = useRef<{
    i: number;
    val: 0 | 1;
    dragging: boolean;
    longPressed: boolean;
    lastCell: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);
  const suppressPointerUpRef = useRef(false);
  const pendingClickRef = useRef<{ index: number; place: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
  const actionRef = useRef({ onCellPlace, onCellDragMark });
  actionRef.current = { onCellPlace, onCellDragMark };

  const getRowCol = useCallback(
    (index: number): [number, number] => {
      return [Math.floor(index / n), index % n];
    },
    [n]
  );

  const executeTapAction = useCallback((index: number, place: boolean) => {
    if (place) {
      actionRef.current.onCellPlace(index);
      return;
    }
    const current = marksRef.current[index];
    if (current === 2) return;
    const next: 0 | 1 = current === 1 ? 0 : 1;
    const updated = [...marksRef.current];
    updated[index] = next;
    marksRef.current = updated;
    actionRef.current.onCellDragMark(index, next);
  }, []);

  const applyMark = useCallback((index: number, val: 0 | 1) => {
    if (marksRef.current[index] === 2 || marksRef.current[index] === val) return;
    const updated = [...marksRef.current];
    updated[index] = val;
    marksRef.current = updated;
    actionRef.current.onCellDragMark(index, val);
  }, []);

  const paintPath = useCallback((from: number, to: number, val: 0 | 1) => {
    let x0 = from % n, y0 = Math.floor(from / n);
    const x1 = to % n, y1 = Math.floor(to / n);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      applyMark(y0 * n + x0, val);
      if (x0 === x1 && y0 === y1) break;
      const twiceError = 2 * error;
      if (twiceError >= dy) { error += dy; x0 += sx; }
      if (twiceError <= dx) { error += dx; y0 += sy; }
    }
  }, [applyMark, n]);

  const moveStrokeTo = useCallback((index: number) => {
    const press = pressRef.current;
    if (!press || press.longPressed || press.i === index) return;
    if (!press.dragging) {
      if (press.timer) clearTimeout(press.timer);
      press.dragging = true;
      lastTapRef.current = { i: -1, t: 0 };
      paintPath(press.i, index, press.val);
    } else if (press.lastCell !== index) {
      paintPath(press.lastCell, index, press.val);
    }
    press.lastCell = index;
  }, [paintPath]);

  // Global pointer-up listener keeps touch and mouse strokes alive across cell boundaries.
  useEffect(() => {
    const handlePointerUp = () => {
      if (suppressPointerUpRef.current) {
        suppressPointerUpRef.current = false;
        return;
      }
      const press = pressRef.current;
      if (press) {
        if (press.timer) clearTimeout(press.timer);
        if (!press.dragging && !press.longPressed) {
          if (pendingClickRef.current) {
            clearTimeout(pendingClickRef.current.timer);
            executeTapAction(pendingClickRef.current.index, pendingClickRef.current.place);
          }
          const index = press.i;
          const timer = setTimeout(() => {
            executeTapAction(index, false);
            pendingClickRef.current = null;
          }, DOUBLE_TAP_MS);
          pendingClickRef.current = { index, place: false, timer };
        }
        pressRef.current = null;
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      if (pressRef.current?.timer) clearTimeout(pressRef.current.timer);
      if (pendingClickRef.current) clearTimeout(pendingClickRef.current.timer);
    };
  }, [executeTapAction]);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button === 2) return; // Right click handled by contextMenu

    e.preventDefault();
    const now = Date.now();
    if (lastTapRef.current.i === index && now - lastTapRef.current.t < DOUBLE_TAP_MS) {
      if (pendingClickRef.current) {
        clearTimeout(pendingClickRef.current.timer);
        pendingClickRef.current = null;
      }
      lastTapRef.current = { i: -1, t: 0 };
      suppressPointerUpRef.current = true;
      executeTapAction(index, true);
      return;
    }
    if (pendingClickRef.current) {
      clearTimeout(pendingClickRef.current.timer);
      executeTapAction(pendingClickRef.current.index, pendingClickRef.current.place);
      pendingClickRef.current = null;
    }
    if (marksRef.current[index] === 2) return;

    lastTapRef.current = { i: index, t: now };
    const targetVal: 0 | 1 = marksRef.current[index] === 1 ? 0 : 1;
    const press = { i: index, val: targetVal, dragging: false, longPressed: false, lastCell: index, timer: null as ReturnType<typeof setTimeout> | null };
    press.timer = setTimeout(() => {
      if (pressRef.current !== press || press.dragging) return;
      press.longPressed = true;
      lastTapRef.current = { i: -1, t: 0 };
      executeTapAction(index, true);
    }, LONG_PRESS_MS);
    pressRef.current = press;
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerEnter = (index: number) => {
    moveStrokeTo(index);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pressRef.current || pressRef.current.longPressed || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    if (e.clientX < bounds.left || e.clientX >= bounds.right || e.clientY < bounds.top || e.clientY >= bounds.bottom) return;
    const col = Math.min(n - 1, Math.floor(((e.clientX - bounds.left) / bounds.width) * n));
    const row = Math.min(n - 1, Math.floor(((e.clientY - bounds.top) / bounds.height) * n));
    moveStrokeTo(row * n + col);
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    executeTapAction(index, true);
  };

  return (
    <div className="board-frame p-2 sm:p-2.5 md:p-3.5 rounded-2xl w-full max-w-[min(100%,460px)] md:max-w-[560px] lg:max-w-[620px] mx-auto shadow-2xl relative select-none">
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#2a170a] shadow-inner touch-none"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: n * n }, (_, idx) => {
          const [r, c] = getRowCol(idx);
          const regionIdx = regions[r] ? regions[r][c] : 0;
          const cellMark = marks[idx] ?? 0;
          const bgCol = PALETTE[regionIdx % PALETTE.length];

          const isThickTop = r > 0 && regions[r - 1]?.[c] !== regionIdx;
          const isThickBottom = r < n - 1 && regions[r + 1]?.[c] !== regionIdx;
          const isThickLeft = c > 0 && regions[r]?.[c - 1] !== regionIdx;
          const isThickRight = c < n - 1 && regions[r]?.[c + 1] !== regionIdx;

          const isBad = badCell === idx;
          const isHint = hintCell === idx;
          const isZone = zoneCells.includes(idx);

          return (
            <div
              key={idx}
              data-index={idx}
              onPointerDown={e => handlePointerDown(e, idx)}
              onPointerEnter={() => handlePointerEnter(idx)}
              onContextMenu={e => handleContextMenu(e, idx)}
              className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${isBad ? 'animate-shake' : ''} ${comboCell?.index === idx ? 'combo-burst-cell' : ''}`}
              style={{
                backgroundColor: bgCol,
                backgroundImage:
                  'repeating-linear-gradient(100deg, rgba(0,0,0,0.035) 0 2px, transparent 2px 7px), linear-gradient(160deg, rgba(255,255,255,0.22), rgba(0,0,0,0.12))',
                borderTop: isThickTop ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.22)',
                borderBottom: isThickBottom ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.22)',
                borderLeft: isThickLeft ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.22)',
                borderRight: isThickRight ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.22)',
                boxShadow: isBad
                  ? 'inset 0 0 0 999px rgba(184, 50, 42, 0.75)'
                  : isHint
                  ? 'inset 0 0 0 4px #ffd34d, inset 0 0 16px rgba(255, 211, 77, 0.95)'
                  : isZone
                  ? 'inset 0 0 0 999px rgba(40, 20, 5, 0.32)'
                  : undefined
              }}
            >
              {/* Mark ✕ */}
              {cellMark === 1 && (
                <span
                  className="font-black text-[#321908]/75 pointer-events-none select-none transition-transform"
                  style={{
                    fontSize: n <= 6 ? 'clamp(16px, 5vw, 36px)' : 'clamp(13px, 4vw, 28px)'
                  }}
                >
                  ✕
                </span>
              )}

              {/* Detective Placed Chip */}
              {cellMark === 2 && (
                <div className="absolute inset-[6%] rounded-md flex items-center justify-center cell-chip pointer-events-none">
                  <div className="w-[82%] h-[82%]">
                    <DetectiveSVG fill="#3a1d07" />
                  </div>
                </div>
              )}
              {comboCell?.index === idx && (
                <div key={comboCell.id} className="combo-particles" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, particle) => <i key={particle} />)}
                </div>
              )}
            </div>
          );
        })}

        {/* Thread Deduction Visual Effects */}
        {threadEffect && (
          <>
            {/* Horizontal thread */}
            <div
              className="absolute left-0 right-0 h-[2px] -mt-[1px] bg-[#b8322a] pointer-events-none shadow-[0_1px_3px_rgba(0,0,0,0.6)] z-20 thread-h"
              style={{
                top: `${((threadEffect.r + 0.5) / n) * 100}%`,
                transformOrigin: `${((threadEffect.c + 0.5) / n) * 100}% 50%`
              }}
            />
            {/* Vertical thread */}
            <div
              className="absolute top-0 bottom-0 w-[2px] -ml-[1px] bg-[#b8322a] pointer-events-none shadow-[0_1px_3px_rgba(0,0,0,0.6)] z-20 thread-v"
              style={{
                left: `${((threadEffect.c + 0.5) / n) * 100}%`,
                transformOrigin: `50% ${((threadEffect.r + 0.5) / n) * 100}%`
              }}
            />
            {/* Gold map pin */}
            <div
              className="absolute w-3.5 h-3.5 -mt-[7px] -ml-[7px] rounded-full pointer-events-none shadow-[0_2px_4px_rgba(0,0,0,0.6)] z-30 pin-drop"
              style={{
                top: `${((threadEffect.r + 0.5) / n) * 100}%`,
                left: `${((threadEffect.c + 0.5) / n) * 100}%`,
                background:
                  'radial-gradient(circle at 35% 35%, #fff0c0, #c9a24a 50%, #6b4a12)'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
