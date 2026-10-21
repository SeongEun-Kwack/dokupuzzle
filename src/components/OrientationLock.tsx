import React, { useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { Language } from '../types';

interface OrientationLockProps {
  language: Language;
}

export const OrientationLock: React.FC<OrientationLockProps> = ({ language }) => {
  // Attempt programmatic screen orientation lock if supported by browser/PWA
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'screen' in window && (window.screen as any).orientation?.lock) {
        (window.screen as any).orientation.lock('portrait').catch(() => {});
      }
    } catch {
      // Ignored if not permitted by user agent
    }
  }, []);

  return (
    <div className="mobile-portrait-lock fixed inset-0 z-[100] hidden flex-col items-center justify-center p-6 bg-[#2a170a] text-[#fff1d6] text-center select-none backdrop-blur-md">
      <div className="w-16 h-16 rounded-2xl bg-[#6e4323] border-2 border-[#8a5a2b] shadow-xl flex items-center justify-center mb-4 text-[#ffd773]">
        <Smartphone className="w-9 h-9 stroke-[2.2] animate-pulse" />
      </div>

      <h2 className="font-serif font-black text-lg sm:text-xl tracking-wider text-[#ffdca8] mb-2 m-0">
        {language === 'ko' ? '기기를 세로로 회전해 주세요' : 'Please Rotate Your Device'}
      </h2>

      <p className="text-xs sm:text-sm text-[#fff1d6]/80 max-w-xs leading-relaxed m-0 break-keep">
        {language === 'ko'
          ? '모바일 환경에서는 세로 전용 해상도로 수사가 진행됩니다.'
          : 'This game is strictly locked to portrait mode on mobile devices.'}
      </p>

      <div className="mt-4 px-3 py-1 rounded-full bg-black/30 border border-[#8a5a2b]/40 text-[11px] text-[#e3a530] font-mono">
        Portrait Only · 세로 모드 고정
      </div>
    </div>
  );
};
