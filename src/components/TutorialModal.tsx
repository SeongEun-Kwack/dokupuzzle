import React, { useState } from 'react';
import { Language } from '../types';
import { DICTIONARY, translate } from '../utils/i18n';
import { DetectiveSVG } from './DetectiveSVG';
import { PALETTE } from '../utils/puzzle';

interface TutorialModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
}

const MINI_REGIONS = [
  [0, 0, 1, 1],
  [0, 0, 1, 1],
  [2, 2, 3, 3],
  [2, 2, 3, 3]
];

interface MiniSlide {
  agents?: number[];
  bad?: number[];
  hl?: number[];
  zone?: number[];
  x?: number[];
}

const SLIDES_CONFIG: MiniSlide[] = [
  { agents: [1, 7, 8, 14] },
  { agents: [4, 7], bad: [4, 7], hl: [5, 6] },
  { agents: [5, 10], bad: [10], zone: [0, 1, 2, 4, 6, 8, 9] },
  { agents: [1], x: [0, 2, 3, 4, 5, 6, 9, 13] }
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  language,
  onClose
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = DICTIONARY[language]?.tut || DICTIONARY.ko.tut;
  const currentStep = steps[step] || steps[0];
  const slideConfig = SLIDES_CONFIG[step] || SLIDES_CONFIG[0];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1e0f05]/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="relative w-full max-w-[440px] rounded-2xl p-0 text-center bg-gradient-to-b from-[#fbe9c8] to-[#f1d4a2] border-[5px] border-[#7a4a24] shadow-[0_6px_0_#4a2c14,0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header - No Skip button, clean title with top-right Close X */}
        <div className="relative py-3 px-5 bg-gradient-to-r from-[#8f5d34] to-[#6e4323] text-[#fff1d6] shadow-md flex items-center justify-between">
          <h2 className="font-serif font-black text-base sm:text-lg tracking-wider m-0">
            {translate(language, 'howto')}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#fff1d6] hover:text-white text-lg font-bold cursor-pointer transition-transform active:scale-95 rounded-full hover:bg-black/15"
            aria-label={translate(language, 'close')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center">
          {/* Mini 4x4 demonstration board */}
          <div className="grid grid-cols-4 grid-rows-4 w-36 sm:w-40 aspect-square my-1.5 rounded-lg border-4 border-[#6e4323] bg-[#2a170a] overflow-hidden shadow-md">
            {Array.from({ length: 16 }, (_, idx) => {
              const r = Math.floor(idx / 4);
              const c = idx % 4;
              const reg = MINI_REGIONS[r][c];
              const bg = PALETTE[reg];

              const isThickTop = r > 0 && MINI_REGIONS[r - 1][c] !== reg;
              const isThickBottom = r < 3 && MINI_REGIONS[r + 1][c] !== reg;
              const isThickLeft = c > 0 && MINI_REGIONS[r][c - 1] !== reg;
              const isThickRight = c < 3 && MINI_REGIONS[r][c + 1] !== reg;

              const hasAgent = slideConfig.agents?.includes(idx);
              const isBad = slideConfig.bad?.includes(idx);
              const isHl = slideConfig.hl?.includes(idx);
              const isZone = slideConfig.zone?.includes(idx);
              const hasX = slideConfig.x?.includes(idx);

              return (
                <div
                  key={idx}
                  className="relative flex items-center justify-center select-none"
                  style={{
                    backgroundColor: bg,
                    borderTop: isThickTop ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.2)',
                    borderBottom: isThickBottom ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.2)',
                    borderLeft: isThickLeft ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.2)',
                    borderRight: isThickRight ? '2.5px solid #2a170a' : '1px solid rgba(42,23,10,0.2)',
                    boxShadow: isBad
                      ? 'inset 0 0 0 999px rgba(184, 50, 42, 0.65)'
                      : isHl
                      ? 'inset 0 0 0 999px rgba(184, 50, 42, 0.3)'
                      : isZone
                      ? 'inset 0 0 0 999px rgba(40, 20, 5, 0.35)'
                      : undefined
                  }}
                >
                  {hasX && (
                    <span className="font-extrabold text-[#321908]/75 text-base pointer-events-none">
                      ✕
                    </span>
                  )}
                  {hasAgent && (
                    <div className="absolute inset-[6%] rounded-sm bg-gradient-to-b from-[#f8dfb0] to-[#e2b273] shadow-sm flex items-center justify-center">
                      <div className="w-[80%] h-[80%]">
                        <DetectiveSVG fill="#3a1d07" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Heading */}
          <h3 className="font-serif font-black text-sm sm:text-base text-[#5a3418] mt-2 mb-1.5">
            {currentStep.h}
          </h3>

          {/* Stable, non-collapsing text container with break-keep for horizontal readability */}
          <div className="w-full bg-[#f4dfbe]/75 border border-[#8a5a2b]/30 rounded-xl px-4 py-3 min-h-[76px] flex items-center justify-center shadow-inner">
            <p
              className="text-xs sm:text-[13px] text-[#3d200a] leading-relaxed break-keep font-medium text-center m-0"
              dangerouslySetInnerHTML={{ __html: currentStep.p }}
            />
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-2 my-3">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === step ? 'w-6 bg-[#6e4323]' : 'w-2 bg-[#c9a275] hover:bg-[#a98255]'
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons: Previous, Next, and '닫기' on last step */}
          <div className="flex items-center gap-2.5 w-full mt-0.5">
            {step > 0 ? (
              <button
                onClick={handlePrev}
                className="wood-button flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-[#4a2a12] cursor-pointer"
              >
                {translate(language, 'prev')}
              </button>
            ) : null}

            <button
              onClick={handleNext}
              className="wood-button-red flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white cursor-pointer shadow-md"
            >
              {step === steps.length - 1 ? translate(language, 'go') : translate(language, 'next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
