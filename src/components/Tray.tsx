import React from 'react';
import { RotateCcw, Lightbulb, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translate } from '../utils/i18n';

interface TrayProps {
  language: Language;
  hintsLeft: number;
  autoClearCount: number;
  autoClearUsed: boolean;
  onRestart: () => void;
  onHint: () => void;
  onAutoClear: () => void;
}

export const Tray: React.FC<TrayProps> = ({
  language, hintsLeft, autoClearCount, autoClearUsed,
  onRestart, onHint, onAutoClear
}) => {
  const itemClass = 'tool-btn flex min-w-0 flex-1 flex-col items-center gap-1 sm:gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-[#4a2a12] group';
  const iconClass = 'tool-icon relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl grid place-items-center wood-button transition-all group-enabled:hover:brightness-105';
  const labelClass = 'tool-label text-[10px] sm:text-[13px] font-bold text-[#4a2a12] whitespace-nowrap';

  return (
    <nav className="tray tablet-nav flex justify-around items-center gap-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-2xl bg-[#6e4323]/25 shadow-[inset_0_2px_5px_rgba(60,30,10,0.3)] w-full max-w-[min(100%,460px)] mx-auto">
      <button onClick={onHint} disabled={hintsLeft <= 0} className={`${itemClass} disabled:opacity-40 disabled:cursor-default`}>
        <span className={iconClass}><Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4] text-[#4a2a12]" /><span className="absolute -right-1.5 -bottom-1.5 min-w-5 h-5 px-1 rounded-md bg-[#d2552f] text-white text-xs font-black grid place-items-center border-2 border-[#fff3dc] shadow-sm">{hintsLeft}</span></span>
        <span className={labelClass}>{translate(language, 'tHint')}</span>
      </button>

      <button onClick={onAutoClear} disabled={autoClearCount <= 0 || autoClearUsed} className={`${itemClass} disabled:opacity-40 disabled:cursor-default`} title={translate(language, 'autoClearDesc')}>
        <span className={iconClass}><Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4] text-[#4a2a12]" /><span className="absolute -right-1.5 -bottom-1.5 min-w-5 h-5 px-1 rounded-md bg-[#5f8f3e] text-white text-xs font-black grid place-items-center border-2 border-[#fff3dc] shadow-sm">{autoClearCount}</span></span>
        <span className={labelClass}>{translate(language, 'autoClear')}</span>
      </button>

      <button onClick={onRestart} className={itemClass} title={translate(language, 'tRetry')}>
        <span className={iconClass}><RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6] text-[#4a2a12]" /></span>
        <span className={labelClass}>{translate(language, 'tRetry')}</span>
      </button>
    </nav>
  );
};
