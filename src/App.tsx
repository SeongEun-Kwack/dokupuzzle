import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BoardSize,
  CellState,
  LevelRecord,
  PuzzleData,
  ThreadEffect,
  ToolType,
  UserSettings
} from './types';
import { generatePuzzle } from './utils/puzzle';
import { sound } from './utils/audio';
import { storage } from './utils/storage';
import { DICTIONARY, translate } from './utils/i18n';
import { TopBar } from './components/TopBar';
import { ProgressBar } from './components/ProgressBar';
import { Board } from './components/Board';
import { Tray } from './components/Tray';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { ResultModal } from './components/ResultModal';
import { CaseDossierModal } from './components/CaseDossierModal';
import { OrientationLock } from './components/OrientationLock';

const MAX_COVER = 3;
const HINT_MAX = 3;

export default function App() {
  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());

  // Active level & size
  const [size, setSize] = useState<BoardSize>(() => storage.loadActiveCase().size);
  const [level, setLevel] = useState<number>(() => storage.loadActiveCase().level);

  // Unlocked progression & records
  const [maxUnlocked, setMaxUnlocked] = useState<number>(() => storage.loadProgress(size));
  const [records, setRecords] = useState<LevelRecord[]>(() => storage.loadLevelRecords(size));

  // Puzzle data
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState<boolean>(true);

  // Board play state
  const [marks, setMarks] = useState<CellState[]>(() => Array(size * size).fill(0));
  const [cover, setCover] = useState<number>(MAX_COVER);
  const [hintsLeft, setHintsLeft] = useState<number>(HINT_MAX);
  const [elapsed, setElapsed] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<CellState[][]>([]);
  const [isOver, setIsOver] = useState<boolean>(false);
  const [tool, setTool] = useState<ToolType>('x');

  // Status message
  const [statusText, setStatusText] = useState<string>('');

  // Visual effects
  const [badCell, setBadCell] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [zoneCells, setZoneCells] = useState<number[]>([]);
  const [threadEffect, setThreadEffect] = useState<ThreadEffect | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [resultModalType, setResultModalType] = useState<'win' | 'fail' | null>(null);

  // Sync sound setting to sound singleton
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Sync language attribute to html document
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.title =
      settings.language === 'ko'
        ? '추리 퍼즐'
        : 'Deductive Logic Puzzle';
  }, [settings.language]);

  // Check if first-time tutorial is needed
  useEffect(() => {
    if (!settings.tutorialCompleted) {
      setIsTutorialOpen(true);
    }
  }, [settings.tutorialCompleted]);

  // Calculate current case name and index
  const caseList = DICTIONARY[settings.language]?.cases || DICTIONARY.ko.cases;
  const caseIdx = (level * 7 + size) % caseList.length;
  const caseName = caseList[caseIdx] || `Case #${level}`;

  // Helper to push marks to undo stack
  const pushUndo = useCallback((currentMarks: CellState[]) => {
    setUndoStack(prev => {
      const next = [...prev, [...currentMarks]];
      if (next.length > 150) next.shift();
      return next;
    });
  }, []);

  // Load level: checks for saved game state in localStorage or generates fresh
  const initLevel = useCallback(
    (targetSize: BoardSize, targetLevel: number) => {
      setIsLoadingPuzzle(true);
      storage.saveActiveCase(targetSize, targetLevel);

      // Async generation to avoid blocking UI frame
      setTimeout(() => {
        const p = generatePuzzle(targetSize, targetLevel);
        setPuzzle(p);

        // Check if there is an in-progress saved game state in localStorage
        const saved = storage.loadGameState(targetSize, targetLevel);
        if (saved && !saved.isSolved && saved.marks.length === targetSize * targetSize) {
          setMarks(saved.marks as CellState[]);
          setCover(saved.cover ?? MAX_COVER);
          setHintsLeft(saved.hintsLeft ?? HINT_MAX);
          setElapsed(saved.elapsed ?? 0);
          setUndoStack((saved.undoStack as CellState[][]) ?? []);
          setIsOver(saved.over ?? false);
          setStatusText(translate(settings.language, 'resumed'));
        } else {
          // Fresh board initialization
          setMarks(Array(targetSize * targetSize).fill(0));
          setCover(MAX_COVER);
          setHintsLeft(HINT_MAX);
          setElapsed(0);
          setUndoStack([]);
          setIsOver(false);
          const tagNames = DICTIONARY[settings.language]?.tags || DICTIONARY.ko.tags;
          const tagName = tagNames[p.level] || '';
          setStatusText(translate(settings.language, 'start', { n: targetSize, tagName }));
        }

        setBadCell(null);
        setHintCell(null);
        setZoneCells([]);
        setThreadEffect(null);
        setIsLoadingPuzzle(false);
      }, 35);
    },
    [settings.language]
  );

  // Trigger init on size or level change
  useEffect(() => {
    initLevel(size, level);
  }, [size, level, initLevel]);

  // Auto-save in-progress game to localStorage on marks / elapsed / cover change
  useEffect(() => {
    if (isLoadingPuzzle || !puzzle || isOver || resultModalType) return;

    storage.saveGameState({
      n: size,
      level,
      marks,
      cover,
      hintsLeft,
      elapsed,
      undoStack,
      over: isOver,
      isSolved: false,
      statusKey: '',
      savedAt: Date.now()
    });
  }, [
    size,
    level,
    marks,
    cover,
    hintsLeft,
    elapsed,
    undoStack,
    isOver,
    isLoadingPuzzle,
    puzzle,
    resultModalType
  ]);

  // Live Timer: increment elapsed while active and not paused by modal/tab
  useEffect(() => {
    const isPaused =
      isOver ||
      isLoadingPuzzle ||
      isSettingsOpen ||
      isTutorialOpen ||
      isDossierOpen ||
      resultModalType !== null;

    if (isPaused) return;

    let lastTick = Date.now();
    const interval = setInterval(() => {
      if (document.hidden) {
        lastTick = Date.now();
        return;
      }
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      setElapsed(prev => prev + delta);
    }, 250);

    return () => clearInterval(interval);
  }, [isOver, isLoadingPuzzle, isSettingsOpen, isTutorialOpen, isDossierOpen, resultModalType]);

  // Action: Cell drag / click mark (✕)
  const handleCellDragMark = useCallback(
    (index: number, val: 0 | 1) => {
      if (isOver || isLoadingPuzzle) return;
      if (marks[index] === 2) return; // Placed detective cannot be marked with ✕

      pushUndo(marks);
      const newMarks = [...marks];
      newMarks[index] = val;
      setMarks(newMarks);
      sound.playMark();
    },
    [isOver, isLoadingPuzzle, marks, pushUndo]
  );

  // Action: Place Detective
  const handleCellPlace = useCallback(
    (index: number, fromHint = false) => {
      if (isOver || isLoadingPuzzle || !puzzle) return;
      if (marks[index] === 2) return; // Already placed

      const r = Math.floor(index / size);
      const c = index % size;
      const isCorrect = puzzle.solution[r] === c;

      if (isCorrect) {
        pushUndo(marks);
        const newMarks = [...marks];
        newMarks[index] = 2;

        // Auto-X feature: Mark all impossible cells in same row, column, region, and 8 neighbors
        if (settings.autoX) {
          const regionIdx = puzzle.regions[r][c];
          for (let j = 0; j < size * size; j++) {
            if (newMarks[j] !== 0) continue;
            const r2 = Math.floor(j / size);
            const c2 = j % size;
            const isSameRow = r2 === r;
            const isSameCol = c2 === c;
            const isSameRegion = puzzle.regions[r2][c2] === regionIdx;
            const isNeighbor = Math.abs(r2 - r) <= 1 && Math.abs(c2 - c) <= 1;

            if (isSameRow || isSameCol || isSameRegion || isNeighbor) {
              newMarks[j] = 1;
            }
          }
        }

        setMarks(newMarks);
        sound.playPlace();
        sound.playThread();

        // Trigger visual thread & gold pin drop animation
        setThreadEffect({ id: Date.now(), r, c });
        setTimeout(() => setThreadEffect(null), 1150);

        // Highlight neighbor exclusion zone
        const neighbors: number[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              neighbors.push(nr * size + nc);
            }
          }
        }
        setZoneCells(neighbors);
        setTimeout(() => setZoneCells([]), 650);

        // Feedback message
        if (!fromHint) {
          const goodMessages = DICTIONARY[settings.language]?.good || DICTIONARY.ko.good;
          const randomGood = goodMessages[Math.floor(Math.random() * goodMessages.length)];
          setStatusText(randomGood);
        }

        // Check if all detectives are placed (Win condition)
        const placedCount = newMarks.filter(m => m === 2).length;
        if (placedCount === size) {
          setIsOver(true);
          sound.playVictory();

          // Save progression & records in localStorage
          const nextLevel = level + 1;
          storage.saveProgress(size, nextLevel);
          setMaxUnlocked(storage.loadProgress(size));

          const record: LevelRecord = {
            level,
            timeMs: elapsed,
            stars: cover,
            hintsUsed: HINT_MAX - hintsLeft,
            solvedAt: Date.now()
          };
          storage.saveLevelRecord(size, record);
          setRecords(storage.loadLevelRecords(size));
          storage.clearGameState(size, level);

          setTimeout(() => {
            setResultModalType('win');
          }, 600);
        }
      } else {
        // Incorrect placement!
        sound.playWrong();
        const nextCover = cover - 1;
        setCover(nextCover);

        // Shake animation
        setBadCell(index);
        setTimeout(() => setBadCell(null), 450);

        pushUndo(marks);
        const newMarks = [...marks];
        newMarks[index] = 1; // mark as X
        setMarks(newMarks);

        if (nextCover <= 0) {
          setIsOver(true);
          storage.clearGameState(size, level);
          setTimeout(() => {
            setResultModalType('fail');
          }, 500);
        } else {
          setStatusText(
            translate(settings.language, 'wrong', { c: nextCover, m: MAX_COVER })
          );
        }
      }
    },
    [
      isOver,
      isLoadingPuzzle,
      puzzle,
      marks,
      size,
      settings.autoX,
      settings.language,
      pushUndo,
      cover,
      elapsed,
      hintsLeft,
      level
    ]
  );

  // Action: Undo
  const handleUndo = useCallback(() => {
    if (isOver || !undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setMarks(prev);
    sound.playMark();
  }, [isOver, undoStack]);

  // Action: Hint
  const handleHint = useCallback(() => {
    if (isOver || !puzzle || hintsLeft <= 0) {
      if (hintsLeft <= 0) {
        setStatusText(translate(settings.language, 'noHint'));
      }
      return;
    }

    // Find best unplaced detective (prioritize region with fewest unplaced empty cells)
    let bestCell = -1;
    let minCandidates = 9999;

    for (let r = 0; r < size; r++) {
      const correctCol: number = puzzle.solution[r];
      const cellIdx: number = r * size + correctCol;
      if (marks[cellIdx] === 2) continue; // Already placed

      const regionIdx = puzzle.regions[r][correctCol];
      let candidateCount = 0;
      for (let j = 0; j < size * size; j++) {
        const r2 = Math.floor(j / size);
        const c2 = j % size;
        if (puzzle.regions[r2][c2] === regionIdx && marks[j] === 0) {
          candidateCount++;
        }
      }

      if (candidateCount < minCandidates) {
        minCandidates = candidateCount;
        bestCell = cellIdx;
      }
    }

    if (bestCell < 0) return;

    sound.playHint();
    setHintsLeft(h => h - 1);
    setHintCell(bestCell);
    setTimeout(() => setHintCell(null), 1200);

    handleCellPlace(bestCell, true);
    setStatusText(translate(settings.language, 'hintUsed', { h: hintsLeft - 1 }));
  }, [isOver, puzzle, hintsLeft, size, marks, settings.language, handleCellPlace]);

  // Action: Restart Case
  const handleRestartCase = useCallback(() => {
    storage.clearGameState(size, level);
    setMarks(Array(size * size).fill(0));
    setCover(MAX_COVER);
    setHintsLeft(HINT_MAX);
    setElapsed(0);
    setUndoStack([]);
    setIsOver(false);
    setBadCell(null);
    setHintCell(null);
    setZoneCells([]);
    setThreadEffect(null);
    setStatusText(translate(settings.language, 'restarted'));
  }, [size, level, settings.language]);

  // Action: Reset All Data
  const handleResetAllData = useCallback(() => {
    storage.resetAll();
    const defaultSettings = storage.getSettings();
    setSettings(defaultSettings);
    setSize(6);
    setLevel(1);
    setMaxUnlocked(1);
    setRecords([]);
    initLevel(6, 1);
  }, [initLevel]);

  // Calculate current placed count
  const placedCount = marks.filter(m => m === 2).length;

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center py-2 sm:py-4 px-2 sm:px-4">
      {/* Centered Main Game Container */}
      <div className="flex items-center justify-center w-full">
        <main className="app-container tablet-layout w-full max-w-[460px] md:max-w-[680px] lg:max-w-[740px] flex flex-col gap-2.5 sm:gap-3 items-center">
          {/* Top Bar with Case navigation and timer */}
          <TopBar
            language={settings.language}
            level={level}
            caseName={caseName}
            elapsed={elapsed}
            bestTime={records.find(r => r.level === level)?.timeMs ?? null}
            canPrev={level > 1}
            canNext={level < maxUnlocked}
            soundEnabled={settings.soundEnabled}
            onPrev={() => setLevel(l => Math.max(1, l - 1))}
            onNext={() => setLevel(l => Math.min(maxUnlocked, l + 1))}
            onOpenDossier={() => setIsDossierOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleSound={() => {
              const nextVal = !settings.soundEnabled;
              setSettings(s => ({ ...s, soundEnabled: nextVal }));
              storage.saveSettings({ soundEnabled: nextVal });
            }}
          />

          {/* Progress bar and fame / lives */}
          <ProgressBar
            current={placedCount}
            total={size}
            cover={cover}
            maxCover={MAX_COVER}
          />

          {/* Board Frame */}
          <div className="w-full relative tablet-board">
            {isLoadingPuzzle ? (
              <div className="board-frame p-2.5 rounded-2xl w-full aspect-square flex flex-col items-center justify-center bg-[#2a170a] text-[#fff1d6] shadow-xl">
                <div className="w-8 h-8 border-3 border-[#e3a530] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="font-serif text-sm tracking-wider">
                  {translate(settings.language, 'loading')}
                </span>
              </div>
            ) : puzzle ? (
              <Board
                n={size}
                regions={puzzle.regions}
                marks={marks}
                tool={tool}
                badCell={badCell}
                hintCell={hintCell}
                zoneCells={zoneCells}
                threadEffect={threadEffect}
                onCellClick={idx => handleCellDragMark(idx, marks[idx] === 1 ? 0 : 1)}
                onCellDragMark={handleCellDragMark}
                onCellPlace={handleCellPlace}
              />
            ) : null}
          </div>

          {/* Status Message Banner */}
          <div className="status-banner tablet-status min-h-[40px] py-1.5 sm:py-2 px-3 rounded-xl text-center text-xs sm:text-sm leading-snug font-medium text-[#4a2a12] bg-[#fff1d6]/65 border border-[#8a5a2b]/25 shadow-inner w-full flex items-center justify-center">
            {statusText}
          </div>

          {/* Bottom Tool Tray */}
          <Tray
            language={settings.language}
            tool={tool}
            hintsLeft={hintsLeft}
            onSelectTool={setTool}
            onRestart={handleRestartCase}
            onHint={handleHint}
          />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={newS => {
          setSettings(prev => {
            const updated = { ...prev, ...newS };
            storage.saveSettings(updated);
            if (newS.boardSize && newS.boardSize !== size) {
              setSize(newS.boardSize);
              const maxL = storage.loadProgress(newS.boardSize);
              setMaxUnlocked(maxL);
              setLevel(maxL);
            }
            return updated;
          });
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onRestartCase={handleRestartCase}
        onResetAllData={handleResetAllData}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        language={settings.language}
        onClose={() => {
          setIsTutorialOpen(false);
          setSettings(s => ({ ...s, tutorialCompleted: true }));
          storage.saveSettings({ tutorialCompleted: true });
        }}
      />

      {/* Result Modal (Win / Fail) */}
      <ResultModal
        isOpen={resultModalType !== null}
        type={resultModalType}
        language={settings.language}
        level={level}
        caseName={caseName}
        elapsed={elapsed}
        cover={cover}
        maxCover={MAX_COVER}
        hintsUsed={HINT_MAX - hintsLeft}
        onNextCase={() => {
          setResultModalType(null);
          setLevel(l => l + 1);
        }}
        onRetry={() => {
          setResultModalType(null);
          handleRestartCase();
          setStatusText(translate(settings.language, 'retryMsg'));
        }}
        onClose={() => setResultModalType(null)}
      />

      {/* Case Dossier Modal (opened by tapping CASE title) */}
      <CaseDossierModal
        isOpen={isDossierOpen}
        language={settings.language}
        boardSize={size}
        currentLevel={level}
        maxUnlocked={maxUnlocked}
        records={records}
        caseName={caseName}
        onSelectLevel={lvl => setLevel(lvl)}
        onClose={() => setIsDossierOpen(false)}
      />

      {/* Mobile Portrait Orientation Lock Screen */}
      <OrientationLock language={settings.language} />
    </div>
  );
}
