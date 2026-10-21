import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  cover: number;
  maxCover: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  cover,
  maxCover
}) => {
  const percentage = Math.min(100, Math.max(0, (current / (total || 1)) * 100));

  return (
    <div className="tablet-prog flex items-center gap-2.5 w-full">
      {/* Progress Bar Container */}
      <div className="relative flex-1 h-5 sm:h-5.5 rounded-full bg-[#5a3418] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] overflow-hidden border border-[#4a2a12]/40">
        <div
          className="h-full bg-gradient-to-r from-[#ffd773] to-[#e3a530] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-wider">
          {current} / {total}
        </span>
      </div>

      {/* Lives / Fame Magnifying Glass Icons */}
      <div className="flex items-center gap-1 shrink-0">
        {Array.from({ length: maxCover }, (_, idx) => {
          const isAlive = idx < cover;
          return (
            <div
              key={idx}
              className={`transition-all duration-300 ${
                isAlive
                  ? 'scale-100 opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]'
                  : 'scale-90 opacity-25 grayscale'
              }`}
              title={isAlive ? 'Fame intact' : 'Fame lost'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                <circle
                  cx="10"
                  cy="10"
                  r="6.5"
                  fill="rgba(255, 255, 255, 0.6)"
                  stroke="#4a2a12"
                  strokeWidth="2.4"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="4"
                  fill="none"
                  stroke={isAlive ? '#e3a530' : '#888'}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <path
                  d="M15 15 L21 21"
                  stroke="#b8322a"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};
