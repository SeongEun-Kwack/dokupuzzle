import React from 'react';
import { BoardSize, Language, UserSettings } from '../types';
import { translate } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenTutorial: () => void;
  onRestartCase?: () => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onOpenTutorial,
  onResetAllData
}) => {
  if (!isOpen) return null;

  const sizeLabels = translate(settings.language, 'sizes' as any) as any;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e0f05]/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="relative w-full max-w-[380px] rounded-2xl p-0 text-center bg-gradient-to-b from-[#fbe9c8] to-[#f1d4a2] border-[5px] border-[#7a4a24] shadow-[0_6px_0_#4a2c14,0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="relative py-3.5 px-6 bg-gradient-to-r from-[#8f5d34] to-[#6e4323] text-[#fff1d6] shadow-md">
          <h2 className="font-serif font-black text-lg sm:text-xl tracking-widest m-0">
            {translate(settings.language, 'settings')}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-[#fff1d6] hover:text-white text-xl font-bold cursor-pointer transition-transform active:scale-95"
            aria-label={translate(settings.language, 'close')}
          >
            ✕
          </button>
        </div>

        {/* Content rows */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 text-left">
          {/* Language Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#6e4323]/35">
            <span className="font-bold text-sm sm:text-base text-[#4a2a12]">
              {translate(settings.language, 'language')}
            </span>
            <div className="flex rounded-lg overflow-hidden border-2 border-[#8a5a2b]">
              <button
                onClick={() => onUpdateSettings({ language: 'ko' })}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                  settings.language === 'ko'
                    ? 'bg-[#6e4323] text-[#fff1d6]'
                    : 'bg-[#f6dcae] text-[#4a2a12] hover:bg-[#edd09d]'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                  settings.language === 'en'
                    ? 'bg-[#6e4323] text-[#fff1d6]'
                    : 'bg-[#f6dcae] text-[#4a2a12] hover:bg-[#edd09d]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Board Size Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#6e4323]/35">
            <span className="font-bold text-sm sm:text-base text-[#4a2a12]">
              {translate(settings.language, 'size')}
            </span>
            <select
              value={settings.boardSize}
              onChange={e => onUpdateSettings({ boardSize: Number(e.target.value) as BoardSize })}
              className="py-1.5 px-3 rounded-lg border-2 border-[#8a5a2b] bg-[#f6dcae] text-[#4a2a12] font-bold text-xs sm:text-sm cursor-pointer outline-none min-w-[90px]"
            >
              {[5, 6, 7, 8].map(s => (
                <option key={s} value={s}>
                  {s}*{s}
                </option>
              ))}
            </select>
          </div>

          {/* Background music Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#6e4323]/35">
            <div>
              <span className="font-bold text-sm sm:text-base text-[#4a2a12] block">
                {translate(settings.language, 'bgm')}
              </span>
              <small className="text-[11px] sm:text-xs text-[#4a2a12]/75 block leading-tight">
                {translate(settings.language, 'bgmDesc')}
              </small>
            </div>
            <label className="relative inline-block w-13 h-7.5 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="opacity-0 w-0 h-0 peer"
              />
              <span className="absolute inset-0 rounded-full bg-[#b89a74] transition-colors peer-checked:bg-[#5f8f3e] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                <span className="absolute left-1 top-1 w-5.5 h-5.5 rounded-full bg-[#fff6e4] shadow-md transition-transform peer-checked:translate-x-5.5" />
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => {
                onClose();
                onOpenTutorial();
              }}
              className="wood-button py-2.5 px-4 rounded-xl font-bold text-sm text-[#4a2a12] cursor-pointer"
            >
              {translate(settings.language, 'howto')}
            </button>
            <button
              onClick={() => {
                if (window.confirm(translate(settings.language, 'confirmResetAll'))) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-[#8f2d26] hover:bg-[#8f2d26]/10 cursor-pointer transition-colors mt-1"
            >
              {translate(settings.language, 'resetAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
