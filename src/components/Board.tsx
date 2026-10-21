import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BoardSize, CellState, ThreadEffect, ToolType } from '../types';
import { PALETTE } from '../utils/puzzle';
import { DetectiveSVG } from './DetectiveSVG';

interface BoardProps {
  n: BoardSize;
  regions: number[][];
  marks: CellState[];
  tool: ToolType;
  badCell: number | null;
  hintCell: number | null;
  zoneCells: number[];
  threadEffect: ThreadEffect | null;
  onCellClick: (index: number) => void;
  onCellDragMark: (index: number, val: 0 | 1) => void;
  onCellPlace: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  n,
  regions,
  marks,
  tool,
  badCell,
  hintCell,
  zoneCells,
  threadEffect,
  onCellClick,
  onCellDragMark,
  onCellPlace
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragVal, setDragVal] = useState<0 | 1 | null>(null);
  const lastTapRef = useRef<{ i: number; t: number }>({ i: -1, t: 0 });

  const getRowCol = useCallback(
    (index: number): [number, number] => {
      return [Math.floor(index / n), index % n];
    },
    [n]
  );

  // Global pointer up listener to cancel dragging
  useEffect(() => {
    const handlePointerUp = () => {
      setDragVal(null);
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button === 2) return; // Right click handled by contextMenu

    if (tool === 'agent') {
      onCellPlace(index);
      return;
    }

    const now = Date.now();
    if (lastTapRef.current.i === index && now - lastTapRef.current.t < 330) {
      // Double-tap detected!
      lastTapRef.current = { i: -1, t: 0 };
      setDragVal(null);
      onCellPlace(index);
      return;
    }
    lastTapRef.current = { i: index, t: now };

    // Tool is 'x'
    if (marks[index] === 2) return; // Can't mark over placed detective

    const targetVal: 0 | 1 = marks[index] === 1 ? 0 : 1;
    setDragVal(targetVal);
    onCellDragMark(index, targetVal);
  };

  const handlePointerEnter = (index: number) => {
    if (dragVal === null) return;
    if (marks[index] === 2) return;
    if (marks[index] !== dragVal) {
      onCellDragMark(index, dragVal);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    onCellPlace(index);
  };

  return (
    <div className="board-frame p-2 sm:p-2.5 md:p-3.5 rounded-2xl w-full max-w-[min(100%,460px)] md:max-w-[560px] lg:max-w-[620px] mx-auto shadow-2xl relative select-none">
      <div
        ref={containerRef}
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
              className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                isBad ? 'animate-shake' : ''
              }`}
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
