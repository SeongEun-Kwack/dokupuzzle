import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BoardSize,
  CellState,
  LevelRecord,
  PuzzleData,
  ThreadEffect,
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
const MAX_AUTO_CLEAR = 5;

export default function App() {
  const [scene, setScene] = useState<'title' | 'loading' | 'main' | 'ending'>('title');
  const [loadProgress, setLoadProgress] = useState(0);
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
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const [cover, setCover] = useState<number>(MAX_COVER);
  const [hintsLeft, setHintsLeft] = useState<number>(HINT_MAX);
  const [elapsed, setElapsed] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState(false);
  const [comboCell, setComboCell] = useState<{ index: number; id: number } | null>(null);
  const comboEffectCounter = useRef(0);
  const [autoClearCount, setAutoClearCount] = useState(() => storage.loadAutoClearInventory());
  const [autoClearUsed, setAutoClearUsed] = useState(false);
  const [undoStack, setUndoStack] = useState<CellState[][]>([]);
  const [isOver, setIsOver] = useState<boolean>(false);

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
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

  // Sync BGM and sound effects to the settings toggle.
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    if (settings.soundEnabled && scene !== 'title') sound.startBgm();
    else sound.stopBgm();
  }, [settings.soundEnabled, scene]);

  useEffect(() => () => sound.stopBgm(), []);

  const beginCase = () => {
    setScene('loading');
    setLoadProgress(0);
    if (settings.soundEnabled) sound.startBgm();
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 10);
      setLoadProgress(progress);
      if (progress === 100) {
        window.clearInterval(timer);
        // Read the persisted case data as part of the loading integrity pass.
        storage.loadActiveCase();
        storage.loadLevelRecords(size);
        storage.loadAutoClearInventory();
        setScene('main');
      }
    }, 90);
  };

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
          marksRef.current = saved.marks as CellState[];
          setCover(saved.cover ?? MAX_COVER);
          setHintsLeft(saved.hintsLeft ?? HINT_MAX);
          setElapsed(saved.elapsed ?? 0);
          setScore(saved.score ?? 0);
          setCombo(saved.combo ?? false);
          setComboCell(null);
          setAutoClearUsed(saved.autoClearUsed ?? false);
          setUndoStack((saved.undoStack as CellState[][]) ?? []);
          setIsOver(saved.over ?? false);
          setStatusText(translate(settings.language, 'resumed'));
        } else {
          // Fresh board initialization
          const emptyMarks = Array<CellState>(targetSize * targetSize).fill(0);
          setMarks(emptyMarks);
          marksRef.current = emptyMarks;
          setCover(MAX_COVER);
          setHintsLeft(HINT_MAX);
          setElapsed(0);
          setScore(0);
          setCombo(false);
          setComboCell(null);
          setAutoClearUsed(false);
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
      score,
      combo,
      autoClearUsed,
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
    score,
    combo,
    autoClearUsed,
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
      isRestartConfirmOpen ||
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
  }, [isOver, isLoadingPuzzle, isSettingsOpen, isTutorialOpen, isDossierOpen, isRestartConfirmOpen, resultModalType]);

  // Action: Cell drag / click mark (✕)
  const handleCellDragMark = useCallback(
    (index: number, val: 0 | 1) => {
      if (isOver || isLoadingPuzzle) return;
      if (marksRef.current[index] === 2) return; // Placed detective cannot be marked with ✕

      const currentMarks = marksRef.current;
      if (currentMarks[index] === val) return;
      pushUndo(currentMarks);
      const newMarks = [...currentMarks];
      newMarks[index] = val;
      marksRef.current = newMarks;
      setMarks(newMarks);
      if (val === 1) {
        setScore(prev => prev + 5);
      }
      sound.playMark();
    },
    [isOver, isLoadingPuzzle, pushUndo]
  );

  // Action: Place Detective
  const handleCellPlace = useCallback(
    (index: number, fromHint = false) => {
      if (isOver || isLoadingPuzzle || !puzzle) return;
      if (marksRef.current[index] === 2) return; // Already placed

      const r = Math.floor(index / size);
      const c = index % size;
      const isCorrect = puzzle.solution[r] === c;

      if (isCorrect) {
        const currentMarks = marksRef.current;
        pushUndo(currentMarks);
        const newMarks = [...currentMarks];
        newMarks[index] = 2;
        marksRef.current = newMarks;

        const gained = combo ? 150 : 100;
        const nextScore = score + gained;
        setScore(nextScore);
        setCombo(true);
        if (combo) {
          sound.playComboVoice();
          const effect = { index, id: ++comboEffectCounter.current };
          setComboCell(effect);
          setTimeout(() => setComboCell(current => current?.id === effect.id ? null : current), 1300);
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

          // Save progression and the highest score for this case.
          const nextLevel = level + 1;
          storage.saveProgress(size, nextLevel);
          setMaxUnlocked(storage.loadProgress(size));

          const record: LevelRecord = {
            level,
            timeMs: elapsed,
            score: nextScore - Math.max(0, Math.floor(elapsed / 1000) - 180),
            stars: cover,
            hintsUsed: HINT_MAX - hintsLeft,
            solvedAt: Date.now()
          };
          const alreadySolved = records.some(item => item.level === level);
          storage.saveLevelRecord(size, record);
          if (!alreadySolved && level % 3 === 0) {
            const nextInventory = Math.min(MAX_AUTO_CLEAR, storage.loadAutoClearInventory() + 1);
            storage.saveAutoClearInventory(nextInventory);
            setAutoClearCount(nextInventory);
          }
          setRecords(storage.loadLevelRecords(size));
          storage.clearGameState(size, level);

          setTimeout(() => {
            setResultModalType('win');
          }, 600);
        }
      } else {
        // Incorrect placement!
        sound.playWrong();
        setScore(prev => prev - 5);
        setCombo(false);
        setComboCell(null);
        const nextCover = cover - 1;
        setCover(nextCover);

        // Shake animation
        setBadCell(index);
        setTimeout(() => setBadCell(null), 450);

        const currentMarks = marksRef.current;
        pushUndo(currentMarks);
        const newMarks = [...currentMarks];
        newMarks[index] = 1; // mark as X
        marksRef.current = newMarks;
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
      settings.language,
      pushUndo,
      cover,
      combo,
      score,
      elapsed,
      hintsLeft,
      level,
      records
    ]
  );

  // Action: Undo
  const handleUndo = useCallback(() => {
    if (isOver || !undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setMarks(prev);
    marksRef.current = prev;
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
    const emptyMarks = Array<CellState>(size * size).fill(0);
    setMarks(emptyMarks);
    marksRef.current = emptyMarks;
    setCover(MAX_COVER);
    setHintsLeft(HINT_MAX);
    setElapsed(0);
    setScore(0);
    setCombo(false);
    setComboCell(null);
    setUndoStack([]);
    setIsOver(false);
    setBadCell(null);
    setHintCell(null);
    setZoneCells([]);
    setThreadEffect(null);
    setStatusText(translate(settings.language, 'restarted'));
  }, [size, level, settings.language]);

  const handleAutoClear = useCallback(() => {
    if (autoClearUsed) {
      setStatusText(translate(settings.language, 'autoClearUsed'));
      return;
    }
    if (autoClearCount <= 0 || !puzzle) {
      setStatusText(translate(settings.language, 'autoClearEmpty'));
      return;
    }
    const currentMarks = marksRef.current;
    const nextMarks = [...currentMarks];
    for (let i = 0; i < nextMarks.length; i++) {
      if (nextMarks[i] !== 0) continue;
      const r = Math.floor(i / size), c = i % size;
      const impossible = currentMarks.some((mark, placedIdx) => {
        if (mark !== 2) return false;
        const pr = Math.floor(placedIdx / size), pc = placedIdx % size;
        return r === pr || c === pc || puzzle.regions[r][c] === puzzle.regions[pr][pc] || (Math.abs(r - pr) <= 1 && Math.abs(c - pc) <= 1);
      });
      if (impossible) nextMarks[i] = 1;
    }
    pushUndo(currentMarks);
    marksRef.current = nextMarks;
    setMarks(nextMarks);
    const clearedCount = nextMarks.filter((mark, index) => mark === 1 && currentMarks[index] !== 1).length;
    setScore(prev => prev + clearedCount * 5);
    setAutoClearUsed(true);
    const remaining = autoClearCount - 1;
    setAutoClearCount(remaining);
    storage.saveAutoClearInventory(remaining);
    setStatusText(translate(settings.language, 'autoClearDone'));
  }, [autoClearUsed, autoClearCount, puzzle, marks, size, settings.language, pushUndo]);

  // Action: Reset All Data
  const handleResetAllData = useCallback(() => {
    storage.resetAll();
    window.location.reload();
  }, []);

  // Calculate current placed count
  const placedCount = marks.filter(m => m === 2).length;

  if (scene === 'title') return <div className="scene-shell scene-title" onClick={beginCase} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') beginCase(); }}>
    <div className="scene-card"><p className="scene-kicker">221B BAKER STREET</p><h1>{translate(settings.language, 'title')}</h1><p>{translate(settings.language, 'subTitle')}</p><p className="scene-prompt">{translate(settings.language, 'startAdventure')}</p><span className="scene-actor">{translate(settings.language, 'watson')}</span></div>
  </div>;
  if (scene === 'loading') return <div className="scene-shell scene-loading"><div className="scene-card"><p className="scene-kicker">SHERLOCK & WATSON</p><h1>{translate(settings.language, 'loadingTitle')}</h1><p>{loadProgress < 100 ? translate(settings.language, 'integrity') : translate(settings.language, 'loadingDone')}</p><div className="loading-track"><span style={{ width: `${loadProgress}%` }} /></div><strong>{loadProgress}%</strong></div></div>;
  if (scene === 'ending') return <div className="scene-shell scene-ending"><div className="scene-card"><p className="scene-kicker">DR. JOHN H. WATSON</p><h1>{translate(settings.language, 'endingTitle')}</h1><p className="ending-quote">“{translate(settings.language, 'endingText')}”</p><button className="wood-button scene-return" onClick={() => { setLevel(1); setScene('title'); }}>{translate(settings.language, 'returnTitle')}</button></div></div>;

  const effectiveScore = score - Math.max(0, Math.floor(elapsed / 1000) - 180);

  return (
    <div className="scene-main min-h-screen min-h-[100dvh] flex items-center justify-center py-2 sm:py-4 px-2 sm:px-4">
      {/* Centered Main Game Container */}
      <div className="flex items-center justify-center w-full">
        <main className="app-container tablet-layout w-full max-w-[460px] md:max-w-[680px] lg:max-w-[740px] flex flex-col gap-2.5 sm:gap-3 items-center">
          {/* Top Bar with Case navigation and timer */}
          <TopBar
            language={settings.language}
            level={level}
            caseName={caseName}
            score={effectiveScore}
            bestScore={records.find(r => r.level === level)?.score ?? null}
            canPrev={level > 1}
            canNext={level < maxUnlocked}
            onPrev={() => setLevel(l => Math.max(1, l - 1))}
            onNext={() => setLevel(l => Math.min(maxUnlocked, l + 1))}
            onOpenDossier={() => setIsDossierOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
                comboCell={comboCell}
                badCell={badCell}
                hintCell={hintCell}
                zoneCells={zoneCells}
                threadEffect={threadEffect}
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
            hintsLeft={hintsLeft}
            autoClearCount={autoClearCount}
            autoClearUsed={autoClearUsed}
            onRestart={() => setIsRestartConfirmOpen(true)}
            onHint={handleHint}
            onAutoClear={handleAutoClear}
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

      {isRestartConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop animate-fade-in"
          role="presentation"
          onClick={event => { if (event.target === event.currentTarget) setIsRestartConfirmOpen(false); }}
        >
          <section className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border-[5px] border-[#7a4a24] bg-gradient-to-b from-[#fbe9c8] to-[#f1d4a2] text-center text-[#4a2a12] shadow-[0_6px_0_#4a2c14,0_20px_50px_rgba(0,0,0,0.6)]" role="dialog" aria-modal="true" aria-labelledby="restart-confirm-title">
            <header className="relative bg-gradient-to-r from-[#8f5d34] to-[#6e4323] px-6 py-3.5 text-[#fff1d6] shadow-md">
              <h2 id="restart-confirm-title" className="m-0 font-serif text-lg font-black tracking-widest sm:text-xl">{translate(settings.language, 'tRetry')}</h2>
              <button className="absolute right-4 top-3 cursor-pointer text-xl font-bold text-[#fff1d6] transition-transform hover:text-white active:scale-95" onClick={() => setIsRestartConfirmOpen(false)} aria-label={translate(settings.language, 'close')}>✕</button>
            </header>
            <div className="p-4 sm:p-5">
              <p className="my-2 text-sm font-semibold">{translate(settings.language, 'restartConfirm')}</p>
              <div className="mt-4 flex gap-3">
                <button className="wood-button flex-1 rounded-xl py-2.5 font-black" onClick={() => { setIsRestartConfirmOpen(false); handleRestartCase(); }}>{translate(settings.language, 'yes')}</button>
                <button className="wood-button flex-1 rounded-xl py-2.5 font-black" onClick={() => setIsRestartConfirmOpen(false)}>{translate(settings.language, 'no')}</button>
              </div>
            </div>
          </section>
        </div>
      )}

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
        score={effectiveScore}
        cover={cover}
        maxCover={MAX_COVER}
        hintsUsed={HINT_MAX - hintsLeft}
        onNextCase={() => {
          setResultModalType(null);
          if (level >= 16) setScene('ending');
          else setLevel(l => l + 1);
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
