import React from 'react';
import { BoardSize, Language, LevelRecord } from '../types';
import { DICTIONARY, translate } from '../utils/i18n';
import { BookOpen, Award, CheckCircle } from 'lucide-react';

interface CaseDossierModalProps {
  isOpen: boolean;
  language: Language;
  boardSize: BoardSize;
  currentLevel: number;
  maxUnlocked: number;
  records: LevelRecord[];
  caseName: string;
  onSelectLevel: (lvl: number) => void;
  onClose: () => void;
  hardUnlocked: boolean;
  hardMode: boolean;
  onSelectMode: (hardMode: boolean) => void;
}

export const CaseDossierModal: React.FC<CaseDossierModalProps> = ({
  isOpen,
  language,
  currentLevel,
  maxUnlocked,
  records,
  caseName,
  onSelectLevel,
  onClose,
  hardUnlocked,
  hardMode,
  onSelectMode
}) => {
  if (!isOpen) return null;

  const briefs = DICTIONARY[language]?.briefs || DICTIONARY.ko.briefs;
  const currentBrief = briefs[(currentLevel - 1) % briefs.length];

  const recordMap = new Map<number, LevelRecord>();
  records.forEach(r => recordMap.set(r.level, r));

  const totalStagesToShow = Math.max(hardMode ? 88 : 16, maxUnlocked);

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1e0f05]/75 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="relative w-full max-w-[440px] case-modal p-0 text-center overflow-hidden">
        {/* Header */}
        <div className="relative py-3.5 px-5 case-modal-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ffdca8]" />
            <h2 className="font-serif font-black text-base sm:text-lg tracking-wider m-0">
              {translate(language, 'dossier')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#fff1d6] hover:text-white text-lg font-bold cursor-pointer transition-transform active:scale-95 rounded-full hover:bg-black/15"
            aria-label={translate(language, 'close')}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 text-left">
          {hardUnlocked && <div className="flex gap-2">
            <button onClick={() => onSelectMode(false)} className={`flex-1 rounded-lg py-2 text-xs font-black ${!hardMode ? 'bg-[#6e4323] text-[#fff1d6]' : 'bg-[#ebd4ad] text-[#4a2a12]'}`}>{language === 'ko' ? '일반 모드' : 'Normal'}</button>
            <button onClick={() => onSelectMode(true)} className={`flex-1 rounded-lg py-2 text-xs font-black ${hardMode ? 'bg-[#6e4323] text-[#fff1d6]' : 'bg-[#ebd4ad] text-[#4a2a12]'}`}>{language === 'ko' ? `${boardSize}×${boardSize} 하드` : `${boardSize}×${boardSize} Hard`}</button>
          </div>}
          {/* Current Stage Card */}
          <div className="paper-note p-3.5">
            <div className="font-serif font-black text-base sm:text-lg text-[#6e4323] mb-1.5 flex items-center justify-between">
              <span>
                {translate(language, 'caseLbl')} {String(currentLevel).padStart(3, '0')} · {caseName}
              </span>
              {recordMap.has(currentLevel) && (
                <span className="flex items-center gap-1 text-xs text-[#5f8f3e] font-sans font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> 해결
                </span>
              )}
            </div>

            <p className="text-xs sm:text-[13px] leading-relaxed italic text-[#3e230f] m-0 break-keep">
              "{currentBrief}"
            </p>
            <div className="text-right text-[11px] text-[#4a2a12]/70 mt-1.5 font-serif">
              {translate(language, 'sig')}
            </div>
          </div>

          {/* Solved Cases / Stage Selector */}
          <div className="pt-2 border-t border-dashed border-[#8a5a2b]/35">
            <div className="flex items-center justify-between text-xs font-bold text-[#6e4323] mb-2">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {hardMode ? (language === 'ko' ? `하드 사건 이동 (${records.length}개 해결)` : `Hard Cases (${records.length} solved)`) : `사건 이동 (${records.length}개 해결 완료)`}
              </span>
              <span className="text-[11px] text-[#4a2a12]/65">
                {language === 'ko' ? '최대 해금' : 'Unlocked through'}: Case {String(maxUnlocked).padStart(3, '0')}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: totalStagesToShow }, (_, i) => {
                const lvl = i + 1;
                const isCurrent = lvl === currentLevel;
                const isUnlocked = lvl <= maxUnlocked;
                const rec = recordMap.get(lvl);

                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      if (isUnlocked) {
                        onSelectLevel(lvl);
                        onClose();
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#6e4323] text-[#fff1d6] ring-2 ring-[#ffdca8] shadow-md'
                        : isUnlocked
                        ? 'bg-[#ebd4ad] hover:bg-[#e2c699] text-[#4a2a12] cursor-pointer active:scale-95'
                        : 'bg-black/5 text-[#4a2a12]/30 cursor-not-allowed'
                    }`}
                    title={
                      rec
                        ? `${translate(language, 'bestScore')} ${rec.score ?? 0} · ${'★'.repeat(rec.stars)}`
                        : isUnlocked
                        ? '수사 가능'
                        : '미해금 사건'
                    }
                  >
                    <span>#{String(lvl).padStart(2, '0')}</span>
                    {rec ? (
                      <span className="text-[10px] text-[#c98e20] leading-none mt-0.5">
                        {'★'.repeat(rec.stars)}
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[9px] opacity-40 leading-none mt-0.5">•</span>
                    ) : (
                      <span className="text-[9px] opacity-25 leading-none mt-0.5">🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Close button */}
          <div className="w-full mt-1">
            <button
              onClick={onClose}
              className="wood-button w-full py-2.5 px-4 rounded-xl font-bold text-sm text-[#4a2a12] cursor-pointer"
            >
              {translate(language, 'close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
