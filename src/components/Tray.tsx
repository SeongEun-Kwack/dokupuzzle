import React from 'react';
import { RotateCcw, Lightbulb, X as XIcon } from 'lucide-react';
import { Language, ToolType } from '../types';
import { translate } from '../utils/i18n';
import { DetectiveSVG } from './DetectiveSVG';

interface TrayProps {
  language: Language;
  tool: ToolType;
  hintsLeft: number;
  onSelectTool: (t: ToolType) => void;
  onRestart: () => void;
  onHint: () => void;
}

export const Tray: React.FC<TrayProps> = ({
  language,
  tool,
  hintsLeft,
  onSelectTool,
  onRestart,
  onHint
}) => {
  return (
    <nav className="tray tablet-nav flex justify-around items-center py-2.5 sm:py-3 px-2 sm:px-3 rounded-2xl bg-[#6e4323]/25 shadow-[inset_0_2px_5px_rgba(60,30,10,0.3)] w-full max-w-[min(100%,460px)] mx-auto">
      {/* Tool 1: Mark (✕) */}
      <button
        onClick={() => onSelectTool('x')}
        className="tool-btn flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-[#4a2a12] group"
      >
        <span
          className={`tool-icon relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl grid place-items-center transition-all ${
            tool === 'x'
              ? 'bg-gradient-to-b from-[#fff0cf] to-[#f0c27c] ring-3 ring-[#b8322a] shadow-[0_2px_0_#7a4a22] translate-y-0.5'
              : 'wood-button group-hover:brightness-105'
          }`}
        >
          <XIcon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.2] text-[#4a2a12]" />
        </span>
        <span className="tool-label text-xs sm:text-[13px] font-bold text-[#4a2a12]">
          {translate(language, 'tMark')}
        </span>
      </button>

      {/* Tool 2: Place Detective */}
      <button
        onClick={() => onSelectTool('agent')}
        className="tool-btn flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-[#4a2a12] group"
      >
        <span
          className={`tool-icon relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl grid place-items-center transition-all ${
            tool === 'agent'
              ? 'bg-gradient-to-b from-[#fff0cf] to-[#f0c27c] ring-3 ring-[#b8322a] shadow-[0_2px_0_#7a4a22] translate-y-0.5'
              : 'wood-button group-hover:brightness-105'
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8">
            <DetectiveSVG fill="#4a2a12" />
          </div>
        </span>
        <span className="tool-label text-xs sm:text-[13px] font-bold text-[#4a2a12]">
          {translate(language, 'tPlace')}
        </span>
      </button>

      {/* Tool 3: Retry (다시하기) */}
      <button
        onClick={onRestart}
        className="tool-btn flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-[#4a2a12] group"
        title={translate(language, 'tRetry')}
      >
        <span className="tool-icon relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl grid place-items-center wood-button transition-all group-hover:brightness-105 active:scale-95">
          <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.6] text-[#4a2a12]" />
        </span>
        <span className="tool-label text-xs sm:text-[13px] font-bold text-[#4a2a12]">
          {translate(language, 'tRetry')}
        </span>
      </button>

      {/* Tool 4: Hint */}
      <button
        onClick={onHint}
        disabled={hintsLeft <= 0}
        className="tool-btn flex flex-col items-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-default bg-transparent border-0 p-0 text-[#4a2a12] group"
      >
        <span className="tool-icon relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl grid place-items-center wood-button transition-all group-enabled:hover:brightness-105">
          <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4] text-[#4a2a12]" />
          <span className="absolute -right-2 -bottom-2 min-w-5 h-5 px-1 rounded-md bg-[#d2552f] text-white text-xs font-black grid place-items-center border-2 border-[#fff3dc] shadow-sm">
            {hintsLeft}
          </span>
        </span>
        <span className="tool-label text-xs sm:text-[13px] font-bold text-[#4a2a12]">
          {translate(language, 'tHint')}
        </span>
      </button>
    </nav>
  );
};
