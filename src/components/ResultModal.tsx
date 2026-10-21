import React from 'react';
import { Language } from '../types';
import { DICTIONARY, translate } from '../utils/i18n';

interface ResultModalProps {
  isOpen: boolean;
  type: 'win' | 'fail' | null;
  language: Language;
  level: number;
  caseName: string;
  score: number;
  cover: number;
  maxCover: number;
  hintsUsed: number;
  onNextCase: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  type,
  language,
  level,
  caseName,
  score,
  cover,
  maxCover,
  hintsUsed,
  onNextCase,
  onRetry,
  onClose
}) => {
  if (!isOpen || !type) return null;

  const briefs = DICTIONARY[language]?.briefs || DICTIONARY.ko.briefs;
  const briefText = briefs[(level - 1) % briefs.length];

  if (type === 'win') {
    return (
      <div
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      >
        <div className="relative w-full max-w-[390px] case-modal p-0 text-center overflow-hidden">
          {/* Header */}
          <div className="py-3.5 px-6 case-modal-header">
            <h2 className="font-serif font-black text-xl tracking-widest m-0">
              {translate(language, 'solved')}
            </h2>
          </div>

          <div className="p-5 flex flex-col items-center">
            {/* Stars */}
            <div className="text-3xl text-[#e3a530] tracking-widest drop-shadow-[0_2px_0_#7a4a22] my-1">
              {'★'.repeat(cover)}
              {'☆'.repeat(maxCover - cover)}
            </div>

            {/* Case Name */}
            <div className="font-serif font-extrabold text-base sm:text-lg text-[#4a2a12] mt-1 mb-2">
              「{caseName}」
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-around w-full py-2 px-3 rounded-xl bg-[#6e4323]/10 border border-[#8a5a2b]/20 my-2 text-xs sm:text-sm text-[#4a2a12]">
              <div className="flex flex-col items-center">
                <span className="opacity-75">{translate(language, 'score')}</span>
                <b className="font-serif text-base sm:text-lg font-black text-[#6e4323]">
                  {score}
                </b>
              </div>
              <div className="w-[1px] h-8 bg-[#8a5a2b]/30" />
              <div className="flex flex-col items-center">
                <span className="opacity-75">{translate(language, 'fame')}</span>
                <b className="font-serif text-base sm:text-lg font-black text-[#6e4323]">
                  {cover} / {maxCover}
                </b>
              </div>
              <div className="w-[1px] h-8 bg-[#8a5a2b]/30" />
              <div className="flex flex-col items-center">
                <span className="opacity-75">{translate(language, 'hints')}</span>
                <b className="font-serif text-base sm:text-lg font-black text-[#6e4323]">
                  {hintsUsed}
                </b>
              </div>
            </div>

            {/* Watson's Notebook Excerpt */}
            <div className="w-full text-left text-xs sm:text-[13px] leading-relaxed p-3 paper-note my-2 text-[#3d210b]">
              <p className="m-0 italic">"{briefText}"</p>
              <div className="text-right text-[11px] opacity-70 mt-1 font-medium">
                {translate(language, 'sig')}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 w-full mt-3">
              <button
                onClick={onClose}
                className="wood-button flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-[#4a2a12] cursor-pointer"
              >
                {translate(language, 'close')}
              </button>
              <button
                onClick={onNextCase}
                className="wood-button-red flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white cursor-pointer shadow-md"
              >
                {translate(language, 'nextCase')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed modal
  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
    >
      <div className="relative w-full max-w-[390px] case-modal p-0 text-center overflow-hidden">
        {/* Header */}
        <div className="py-3.5 px-6 case-modal-header is-fail">
          <h2 className="font-serif font-black text-xl tracking-widest m-0">
            {translate(language, 'failTitle')}
          </h2>
        </div>

        <div className="p-5 flex flex-col items-center">
          <p className="text-sm text-[#4a2a12] font-bold mt-1 mb-3">
            {translate(language, 'failSub')}
          </p>

          {/* Sherlock's investigative hint */}
          <div className="w-full text-left text-xs sm:text-[13px] leading-relaxed p-3.5 paper-note my-2 text-[#4a1a14]">
            <p className="m-0 italic font-serif">"{translate(language, 'failNote')}"</p>
            <div className="text-right text-xs font-serif font-bold text-[#8f2d26] mt-2">
              {translate(language, 'failSig')}
            </div>
          </div>

          {/* Action button */}
          <div className="w-full mt-3">
            <button
              onClick={onRetry}
              className="wood-button-red w-full py-3 px-4 rounded-xl font-bold text-sm text-white cursor-pointer shadow-md"
            >
              {translate(language, 'retry')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
