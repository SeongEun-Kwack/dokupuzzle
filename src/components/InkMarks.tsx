import React, { useMemo } from 'react';

const INK = '#2b1a10';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 잉크 필터 정의 — 화면에 한 번만 렌더링 */
export const InkDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    aria-hidden="true"
    focusable="false"
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
  >
    <defs>
      {/* X 표시용 (viewBox 24 기준) */}
      <filter id="ink-x" filterUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="1" seed="11" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="grainMask" />
        <feComposite in="rough" in2="grainMask" operator="in" />
      </filter>
      {/* 배치 라인용 (viewBox 1000 기준) */}
      <filter id="ink-line" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="1040">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="7" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="1" seed="19" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.1" result="grainMask" />
        <feComposite in="rough" in2="grainMask" operator="in" />
      </filter>
    </defs>
  </svg>
);

interface InkXProps {
  seed?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** 손으로 그은 잉크 X */
export const InkX: React.FC<InkXProps> = ({ seed = 0, color = INK, className = '', style }) => {
  const v = useMemo(() => {
    const r = mulberry32(seed * 9973 + 17);
    return {
      rot: (r() - 0.5) * 14,
      sx: 0.92 + r() * 0.14,
      sy: 0.92 + r() * 0.14,
      dx: (r() - 0.5) * 1.6,
      dy: (r() - 0.5) * 1.6
    };
  }, [seed]);

  return (
    <svg viewBox="0 0 24 24" className={`ink-x ${className}`} style={style} aria-hidden="true">
        <g
          fill={color}
          transform={`translate(${12 + v.dx} ${12 + v.dy}) rotate(${v.rot}) scale(${v.sx} ${v.sy}) translate(-12 -12)`}
        >
          {/* 첫 획: 좌상 → 우하, 시작에 잉크 고임 / 끝은 펜 떼는 꼬리 */}
          <path
            opacity="0.86"
            d="M4.4 5.3 C4.6 4.2 6 4 7 4.9 L18.9 17.2 C19.5 17.8 19.9 18.6 19.6 19.3 C19.2 19.2 18.7 18.8 18.3 18.4 L5.6 7.1 C4.8 6.5 4.3 5.9 4.4 5.3 Z"
          />
          {/* 둘째 획: 우상 → 좌하, 살짝 휜 손떨림 */}
          <path
            opacity="0.8"
            d="M18.4 4.7 C19.3 4.4 19.9 5.3 19.3 6.1 C15.6 9.6 11.2 14.1 7 18.4 C6.3 19.1 5.4 19.6 4.9 19.3 C4.8 18.8 5.3 18.1 5.9 17.4 C10 13.1 14.1 8.8 17.6 5.3 C17.8 5 18.1 4.8 18.4 4.7 Z"
          />
        </g>
    </svg>
  );
};

/** 굵기가 흔들리는 손그림 선 (viewBox 1000 기준) */
export function roughStrokePath(seed: number, at: number, width: number, vertical = false, len = 1000): string {
  const r = mulberry32(seed);
  const N = 36;
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  let drift = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    drift = drift * 0.8 + (r() - 0.5) * 2.2;
    const taper = Math.min(1, t * 10, (1 - t) * 10);
    const half = (width / 2) * (0.7 + r() * 0.5) * (0.3 + 0.7 * taper);
    const s = t * len;
    top.push([s, at + drift - half]);
    bot.push([s, at + drift + half]);
  }
  const pts = [...top, ...bot.reverse()].map(([s, c]) =>
    vertical ? `${c.toFixed(1)},${s.toFixed(1)}` : `${s.toFixed(1)},${c.toFixed(1)}`
  );
  return `M${pts.join(' L')} Z`;
}
