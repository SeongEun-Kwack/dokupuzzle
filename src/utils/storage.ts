import { BoardSize, Language, LevelRecord, SavedGameState, UserSettings } from '../types';

const PREFIX = 'logicpuzzle_';

export const storage = {
  // Settings
  getSettings(): UserSettings {
    try {
      const defaultLang: Language =
        typeof navigator !== 'undefined' && (navigator.language || '').startsWith('ko') ? 'ko' : 'en';

      const lang = (localStorage.getItem(`${PREFIX}lang`) || localStorage.getItem('sherlockdoku_lang') || localStorage.getItem('sd-lang') || defaultLang) as Language;
      const sizeStr = localStorage.getItem(`${PREFIX}size`) || localStorage.getItem('sherlockdoku_size') || localStorage.getItem('sd-size') || '6';
      const size = (Number(sizeStr) || 6) as BoardSize;
      const sound = (localStorage.getItem(`${PREFIX}sound`) ?? localStorage.getItem('sherlockdoku_sound')) !== '0';
      const tutDone = (localStorage.getItem(`${PREFIX}tut_done`) ?? localStorage.getItem('sherlockdoku_tut_done') ?? localStorage.getItem('sd-tut-done')) === '1';

      return {
        language: lang === 'ko' || lang === 'en' ? lang : 'ko',
        boardSize: [5, 6, 7, 8].includes(size) ? size : 6,
        soundEnabled: sound,
        tutorialCompleted: tutDone
      };
    } catch {
      return {
        language: 'ko',
        boardSize: 6,
        soundEnabled: true,
        tutorialCompleted: false
      };
    }
  },

  saveSettings(s: Partial<UserSettings>) {
    try {
      if (s.language !== undefined) {
        localStorage.setItem(`${PREFIX}lang`, s.language);
        localStorage.setItem('sd-lang', s.language);
      }
      if (s.boardSize !== undefined) {
        localStorage.setItem(`${PREFIX}size`, String(s.boardSize));
        localStorage.setItem('sd-size', String(s.boardSize));
      }
      if (s.soundEnabled !== undefined) {
        localStorage.setItem(`${PREFIX}sound`, s.soundEnabled ? '1' : '0');
      }
      if (s.tutorialCompleted !== undefined) {
        localStorage.setItem(`${PREFIX}tut_done`, s.tutorialCompleted ? '1' : '0');
        localStorage.setItem('sd-tut-done', s.tutorialCompleted ? '1' : '0');
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  // Active playing position
  saveActiveCase(size: BoardSize, level: number) {
    try {
      localStorage.setItem(`${PREFIX}active_size`, String(size));
      localStorage.setItem(`${PREFIX}active_level_${size}`, String(level));
    } catch {}
  },

  loadActiveCase(): { size: BoardSize; level: number } {
    try {
      const sizeStr = localStorage.getItem(`${PREFIX}active_size`);
      const size = (sizeStr ? Number(sizeStr) : this.getSettings().boardSize) as BoardSize;
      const validSize = [5, 6, 7, 8].includes(size) ? size : 6;

      const levelStr = localStorage.getItem(`${PREFIX}active_level_${validSize}`);
      const maxUnlocked = this.loadProgress(validSize);
      const level = levelStr ? Math.min(Math.max(1, Number(levelStr)), maxUnlocked) : 1;

      return { size: validSize, level };
    } catch {
      return { size: 6, level: 1 };
    }
  },

  // Level Progression (Maximum level reached)
  loadProgress(size: BoardSize): number {
    try {
      const v = localStorage.getItem(`${PREFIX}prog_${size}`) || localStorage.getItem(`sd-prog-${size}`);
      return Math.min(16, Math.max(1, Number(v) || 1));
    } catch {
      return 1;
    }
  },

  saveProgress(size: BoardSize, level: number) {
    try {
      const current = this.loadProgress(size);
      const cappedLevel = Math.min(16, level);
      if (cappedLevel > current) {
        localStorage.setItem(`${PREFIX}prog_${size}`, String(cappedLevel));
        localStorage.setItem(`sd-prog-${size}`, String(cappedLevel));
      }
    } catch {}
  },

  loadEndingUnlocked(size: BoardSize): boolean {
    try {
      const hasEndingFlag = localStorage.getItem(`${PREFIX}ending_${size}`) === '1';
      return hasEndingFlag && this.loadLevelRecords(size).some(record => record.level === 16);
    } catch { return false; }
  },

  saveEndingUnlocked(size: BoardSize) {
    try { localStorage.setItem(`${PREFIX}ending_${size}`, '1'); } catch {}
  },

  loadHardProgress(size: BoardSize): number {
    try { return Math.min(16, Math.max(1, Number(localStorage.getItem(`${PREFIX}hard_prog_${size}`)) || 1)); } catch { return 1; }
  },

  saveHardProgress(size: BoardSize, level: number) {
    try {
      const key = `${PREFIX}hard_prog_${size}`;
      const cappedLevel = Math.min(16, level);
      if (cappedLevel > this.loadHardProgress(size)) localStorage.setItem(key, String(cappedLevel));
    } catch {}
  },

  loadHardRecords(size: BoardSize): LevelRecord[] {
    try {
      const json = localStorage.getItem(`${PREFIX}hard_records_${size}`);
      return json ? JSON.parse(json) : [];
    } catch { return []; }
  },

  saveHardRecord(size: BoardSize, record: LevelRecord) {
    try {
      const key = `${PREFIX}hard_records_${size}`;
      const records = this.loadHardRecords(size);
      const index = records.findIndex(item => item.level === record.level);
      if (index >= 0) {
        const prev = records[index];
        records[index] = { ...record, timeMs: Math.min(prev.timeMs, record.timeMs), score: Math.max(prev.score ?? 0, record.score ?? 0), stars: Math.max(prev.stars, record.stars) };
      } else records.push(record);
      localStorage.setItem(key, JSON.stringify(records));
    } catch {}
  },

  loadInfiniteUnlocked(size: BoardSize): boolean {
    try { return this.loadEndingUnlocked(size) && localStorage.getItem(`${PREFIX}infinite_unlocked_${size}`) === '1'; } catch { return false; }
  },

  saveInfiniteUnlocked(size: BoardSize) {
    try {
      if (this.loadEndingUnlocked(size)) localStorage.setItem(`${PREFIX}infinite_unlocked_${size}`, '1');
    } catch {}
  },

  loadInfiniteRecord(size: BoardSize): number {
    try { return Math.max(0, Number(localStorage.getItem(`${PREFIX}infinite_record_${size}`)) || 0); } catch { return 0; }
  },

  saveInfiniteRecord(size: BoardSize, score: number): number {
    const best = Math.max(this.loadInfiniteRecord(size), Math.max(0, Math.floor(score)));
    try { localStorage.setItem(`${PREFIX}infinite_record_${size}`, String(best)); } catch {}
    return best;
  },

  // In-progress Game State (Mid-game saves disabled per user request: only clear records remain)
  saveGameState(_state: SavedGameState) {
    // Intentionally no-op: do not persist mid-game board state
  },

  loadGameState(_size: BoardSize, _level: number, _hardMode = false): SavedGameState | null {
    // Always start fresh, never restore in-progress marks
    return null;
  },

  clearGameState(size: BoardSize, level: number, hardMode = false) {
    try {
      const key = `${PREFIX}state_${size}_${hardMode ? 'hard_' : ''}${level}`;
      localStorage.removeItem(key);
    } catch {}
  },

  clearAllGameStates() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(`${PREFIX}state_`)) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  },

  // Solved Level Records
  saveLevelRecord(size: BoardSize, record: LevelRecord) {
    try {
      const key = `${PREFIX}records_${size}`;
      const records = this.loadLevelRecords(size);
      const existingIdx = records.findIndex(r => r.level === record.level);
      if (existingIdx >= 0) {
        // Keep the highest score while retaining compatibility with older time records.
        const prev = records[existingIdx];
        records[existingIdx] = {
          ...record,
          timeMs: Math.min(prev.timeMs, record.timeMs),
          score: Math.max(prev.score ?? 0, record.score ?? 0),
          stars: Math.max(prev.stars, record.stars)
        };
      } else {
        records.push(record);
      }
      localStorage.setItem(key, JSON.stringify(records));
    } catch {}
  },

  loadLevelRecords(size: BoardSize): LevelRecord[] {
    try {
      const key = `${PREFIX}records_${size}`;
      const json = localStorage.getItem(key);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  loadAutoClearInventory(): number {
    try {
      const value = localStorage.getItem(`${PREFIX}auto_clear_inventory`);
      if (value === null) {
        localStorage.setItem(`${PREFIX}auto_clear_inventory`, '1');
        return 1;
      }
      return Math.min(3, Math.max(0, Number(value) || 0));
    } catch { return 1; }
  },

  loadHintInventory(): number {
    try {
      const value = localStorage.getItem(`${PREFIX}hint_inventory`);
      if (value === null) {
        localStorage.setItem(`${PREFIX}hint_inventory`, '3');
        return 3;
      }
      return Math.min(3, Math.max(0, Number(value) || 0));
    } catch { return 3; }
  },

  saveHintInventory(count: number) {
    try { localStorage.setItem(`${PREFIX}hint_inventory`, String(Math.min(3, Math.max(0, count)))); } catch {}
  },

  saveAutoClearInventory(count: number) {
    try { localStorage.setItem(`${PREFIX}auto_clear_inventory`, String(Math.min(3, Math.max(0, count)))); } catch {}
  },

  resetAll() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(PREFIX) || k.startsWith('sd-') || k.startsWith('sherlockdoku_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }
};
