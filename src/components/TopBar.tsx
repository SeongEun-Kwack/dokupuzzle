import React from 'react';
import { Settings } from 'lucide-react';
import { Language } from '../types';
import { translate } from '../utils/i18n';

interface TopBarProps {
  language: Language;
  level: number;
  caseName: string;
  score: number;
  bestScore?: number | null;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenDossier?: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  level,
  caseName,
  score,
  bestScore,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onOpenDossier,
  onOpenSettings,
}) => {
  const isFirstCase = level <= 1;

  return (
    <header className="app-header tablet-top grid grid-cols-[auto_1fr_auto] gap-2 items-center w-full">
      {/* Settings */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSettings}
          className="top-btn w-12 h-12 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center cursor-pointer text-[#4a2a12] wood-button transition-transform active:scale-95"
          aria-label={translate(language, 'settings')}
          title={translate(language, 'settings')}
        >
          <Settings className="w-6 h-6 stroke-[2.3]" />
        </button>

      </div>

      {/* Center: Case Panel with Prev / Next */}
      <div className="wood-panel rounded-xl text-[#fff1d6] flex items-center h-12 sm:h-13 px-1 sm:px-2 shadow-md">
        <button
          onClick={isFirstCase ? undefined : onPrev}
          disabled={isFirstCase || !canPrev}
          className="text-[#fff1d6] text-2xl sm:text-3xl w-8 sm:w-9 h-full flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:pointer-events-none transition-opacity hover:opacity-90 font-serif"
          aria-label={translate(language, 'prev')}
        >
          ‹
        </button>

        {/* Clickable Case Title -> Opens Case Dossier */}
        <div
          onClick={onOpenDossier}
          className="flex-1 text-center min-w-0 px-1 py-1 rounded-lg cursor-pointer hover:bg-black/15 transition-colors group select-none active:scale-[0.98]"
          title={language === 'ko' ? '수사 일지 보기' : 'View Case Dossier'}
        >
          <div className="font-serif font-black text-base sm:text-xl tracking-wider leading-tight text-[#ffdca8] group-hover:text-white transition-colors">
            {translate(language, 'caseLbl')} {String(level).padStart(3, '0')}
          </div>
          <div className="text-[11px] sm:text-xs opacity-85 truncate font-medium">
            {caseName}
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!canNext}
          className="text-[#fff1d6] text-2xl sm:text-3xl w-8 sm:w-9 h-full flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:pointer-events-none transition-opacity hover:opacity-90 font-serif"
          aria-label={translate(language, 'next')}
        >
          ›
        </button>
      </div>

      {/* Right: Score */}
      <div className="flex flex-col items-center justify-center text-[#6e4323] px-1 sm:px-2 min-w-[56px] sm:min-w-[66px]">
        <div className="flex items-center gap-1 opacity-80 mb-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-tight">
            {translate(language, 'score')}
          </span>
        </div>
        <span className="font-serif font-bold text-sm sm:text-base tracking-tight leading-none text-[#5a3418]">
          {score}
        </span>
        {bestScore !== undefined && bestScore !== null && (
          <span
            className="text-[9px] sm:text-[10px] text-[#8a5a2b] font-medium leading-none mt-0.5 tracking-tight"
            title={translate(language, 'bestScore')}
          >
            {translate(language, 'bestScore')} {bestScore}
          </span>
        )}
      </div>
    </header>
  );
};
