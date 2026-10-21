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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
    >
      <div className="relative w-full max-w-[380px] case-modal p-0 text-center overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        {/* Header */}
        <div className="relative py-3.5 px-6 case-modal-header">
          <h2 id="settings-modal-title" className="font-serif font-black text-lg sm:text-xl tracking-widest m-0">
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
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              aria-label={`${translate(settings.language, 'bgm')}: ${translate(settings.language, settings.soundEnabled ? 'on' : 'off')}`}
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`relative inline-flex h-9 w-[92px] items-center justify-center rounded-full border-2 px-2 shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d59b49]/60 ${
                settings.soundEnabled
                  ? 'border-[#426d2d] bg-[#5f8f3e] text-white'
                  : 'border-[#826d57] bg-[#b8a58f] text-[#382311]'
              }`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-[#fff6e4] shadow transition-all ${settings.soundEnabled ? 'left-1' : 'left-[calc(100%-28px)]'}`}>
                <span className="absolute inset-0 grid place-items-center text-xs font-black">{settings.soundEnabled ? '♪' : '×'}</span>
              </span>
              <span className="text-xs font-black tracking-wide">{translate(settings.language, settings.soundEnabled ? 'on' : 'off')}</span>
            </button>
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
