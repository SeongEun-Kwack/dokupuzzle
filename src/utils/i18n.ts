import { Language } from '../types';

export const DICTIONARY = {
  ko: {
    title: '추리 퍼즐',
    subTitle: '연역 추리 로직 퍼즐',
    startAdventure: '사건을 시작하려면 화면을 누르세요',
    loadingTitle: '수사 기록 확인 중',
    integrity: '사건 파일 무결성 확인 중...',
    loadingDone: '기록 복원 완료',
    endingTitle: '왓슨의 마지막 코멘트',
    endingText: '그렇게 한동안 사건은 마무리 되는 듯 했다....',
    returnTitle: '타이틀로 돌아가기',
    score: '점수',
    bestScore: '최고 점수',
    combo: '콤보 ×1.5',
    autoClear: '자동소거',
    autoClearDesc: '현재 단서로 불가능한 칸을 표시합니다. 스테이지당 1회 사용',
    autoClearUsed: '이 스테이지에서 자동소거 아이템을 이미 사용했습니다.',
    autoClearEmpty: '자동소거 아이템이 없습니다.',
    autoClearDone: '셜록: 불가능한 선택지를 지웠네, 왓슨.',
    sherlockWrong: '셜록: 행과 구역의 단서를 다시 살펴보게, 왓슨.',
    watson: '존 왓슨',
    bgm: '배경 음악',
    bgmDesc: '경쾌한 추리 테마 음악',
    restartConfirm: '정말 다시할까요? 점수와 콤보는 리셋됩니다.',
    yes: 'Y',
    no: 'N',
    on: '켜짐',
    off: '꺼짐',
    caseLbl: 'CASE',
    tMark: '소거',
    tPlace: '배치',
    tUndo: '되돌리기',
    tRetry: '다시하기',
    tHint: '힌트',
    loading: '사건 현장의 단서를 모으는 중...',
    start: '{n}개 구역에 탐정을 한 명씩 배치하세요. (추리 난도: {tagName})',
    tags: ['', '기초 관찰', '연역 추리', '소거법'],
    good: [
      '기초적인 일이지, 왓슨.',
      '정확한 추리야.',
      '단서가 맞아떨어진다.',
      '관찰의 승리.',
      '파이프 세 대짜리 문제도 아니군.'
    ],
    wrong: '셜록: 잘못 짚었네, 왓슨. 행과 구역의 단서를 다시 살펴보게. (명성 {c}/{m})',
    hintUsed: '힌트로 탐정 1명 배치. (남은 힌트 {h})',
    noHint: '이 사건의 힌트를 모두 썼어요.',
    restarted: '수사를 처음부터 다시 시작합니다.',
    retryMsg: '재수사 시작. 이번엔 증거만 믿는다.',
    resumed: '진행 중이던 이전 수사를 불러왔습니다.',
    settings: '설정',
    language: '언어',
    size: '보드 크기',
    sound: '효과음',
    soundDesc: '타자기 소리와 목재 타격음',
    howto: '게임 방법 보기',
    restart: '이 사건 다시 시작',
    confirmRestart: '현재 사건의 진행 상황을 초기화하고 처음부터 다시 수사할까요?',
    confirmResetAll: '모든 사건 기록 및 저장 데이터를 초기화할까요?',
    resetAll: '전체 데이터 초기화',
    sizes: {
      5: '5*5',
      6: '6*6',
      7: '7*7',
      8: '8*8'
    },
    prev: '이전',
    next: '다음',
    go: '닫기',
    tut: [
      {
        h: '1. 구역별 탐정 배치',
        p: '색깔로 나뉜 모든 구역마다 탐정을 <b>정확히 한 명씩</b> 배치해야 합니다.'
      },
      {
        h: '2. 가로 · 세로 중복 금지',
        p: '같은 <b>가로줄</b>이나 <b>세로줄</b>에는 탐정이 둘 이상 서 있을 수 없습니다.'
      },
      {
        h: '3. 8방향 접촉 금지',
        p: '탐정끼리는 <b>대각선을 포함한 8방향</b> 어디로도 서로 맞닿아서는 안 됩니다.'
      },
      {
        h: '4. 조작 및 수사 규칙',
        p: '<b>터치/클릭</b>으로 ✕ 표시(드래그 가능), <b>더블터치</b>나 <b>[배치]</b> 도구로 탐정을 배치합니다. 실수할 때마다 명성이 감소하며 3번 실수 시 사건이 미궁에 빠집니다.'
      }
    ],
    solved: '사건 해결!',
    time: '소요 시간',
    fame: '남은 명성',
    hints: '사용 힌트',
    nextCase: '다음 사건',
    close: '닫기',
    failTitle: '사건이 미궁에 빠졌다',
    failSub: '명성을 모두 잃고 수사가 중단되었습니다.',
    failNote: '자네는 단서를 놓쳤네, 왓슨. 행과 구역을 다시 살펴보게.',
    failSig: '— 셜록 홈즈',
    retry: '다시 수사',
    sig: '— J. H. 왓슨의 수첩에서',
    dossier: '수사 일지',
    shortcuts: '키보드 단축키',
    shortcutsList: [
      { key: 'X', desc: '소거 도구' },
      { key: 'D / Space', desc: '탐정 배치 도구' },
      { key: 'Z / Ctrl+Z', desc: '되돌리기' },
      { key: 'H', desc: '힌트' }
    ],
    cases: [
      '주홍색 연구',
      '네 사람의 서명',
      '바스커빌가의 개',
      '공포의 계곡',
      '얼룩 끈',
      '보헤미아 왕국의 스캔들',
      '빨간 머리 연맹',
      '춤추는 사람 인형',
      '푸른 카벙클',
      '실버 블레이즈',
      '마지막 사건',
      '빈 집의 모험',
      '여섯 개의 나폴레옹',
      '노우드의 건축업자',
      '해군 조약문',
      '너도밤나무 집'
    ],
    briefs: [
      '1891년 가을, 베이커가 221B. 홈즈가 런던 지도 위에 핀을 꽂기 시작했다.',
      '한 거리에 탐정이 둘 이상 서면 놈들의 눈에 띈다. 홈즈의 첫 번째 원칙이다.',
      '템스강에서 건져 올린 쪽지: "모든 구역에는 단 하나의 문이 있다."',
      '"그림자처럼 붙어 다니는 두 사람은 결국 정체를 들키지." 홈즈가 말했다.',
      '화이트채플의 성냥팔이 소년이 낯선 교수를 보았다고 한다.',
      '스코틀랜드 야드의 레스트레이드 경감이 처음으로 먼저 도움을 청해 왔다.',
      '쪽지 해독 완료: "문은 시계탑의 그림자 아래에 있다."',
      '시계탑 지하에서 수학 공식이 빼곡한 노트가 발견됐다.',
      '공식의 필체는 『소행성의 역학』의 저자와 정확히 일치한다.',
      '그 이름은 모리아티. 홈즈는 말없이 파이프에 불을 붙였다.',
      '모리아티의 편지: "체스판은 처음부터 내 것이었소, 홈즈 씨."',
      '"불가능한 것을 제거하고 남은 것이 진실이네, 왓슨." 우리는 라이헨바흐로 향한다.'
    ]
  },
  en: {
    title: 'LOGIC PUZZLE',
    subTitle: 'Deductive Logic Puzzle',
    startAdventure: 'Tap anywhere to begin the case',
    loadingTitle: 'Reviewing the case files',
    integrity: 'Checking case file integrity...',
    loadingDone: 'Records restored',
    endingTitle: "Watson's Last Comment",
    endingText: 'For a time, it seemed the case was closed....',
    returnTitle: 'Return to Title',
    score: 'Score',
    bestScore: 'Best score',
    combo: 'Combo ×1.5',
    autoClear: 'Auto-clear',
    autoClearDesc: 'Mark impossible cells from current clues. Once per stage.',
    autoClearUsed: 'The auto-clear item has already been used in this stage.',
    autoClearEmpty: 'No auto-clear items in inventory.',
    autoClearDone: 'Sherlock: I have eliminated the impossible, Watson.',
    sherlockWrong: 'Sherlock: Re-examine the row and district clues, Watson.',
    watson: 'John Watson',
    bgm: 'Background music',
    bgmDesc: 'A brisk detective theme',
    restartConfirm: 'Restart now? Your score and combo will reset.',
    yes: 'Y',
    no: 'N',
    on: 'ON',
    off: 'OFF',
    caseLbl: 'CASE',
    tMark: 'Eliminate',
    tPlace: 'Place',
    tUndo: 'Undo',
    tRetry: 'Retry',
    tHint: 'Hint',
    loading: 'Gathering clues from the crime scene...',
    start: 'Place one detective in each of the {n} districts. (Difficulty: {tagName})',
    tags: ['', 'Observation', 'Deduction', 'Elimination'],
    good: [
      'Elementary, my dear Watson.',
      'A precise deduction.',
      'The clues fit together.',
      'A triumph of observation.',
      'Hardly a three-pipe problem.'
    ],
    wrong: 'Sherlock: A wrong turn, Watson. Re-examine the row and district clues. (Fame {c}/{m})',
    hintUsed: 'Hint used: 1 detective placed. ({h} left)',
    noHint: 'No hints left for this case.',
    restarted: 'Investigation restarted from scratch.',
    retryMsg: 'Reopening the case. Trust only the evidence.',
    resumed: 'Resumed your ongoing investigation.',
    settings: 'Settings',
    language: 'Language',
    size: 'Board size',
    sound: 'Sound Effects',
    soundDesc: 'Typewriter and wooden click sounds',
    howto: 'How to Play',
    restart: 'Restart Case',
    confirmRestart: 'Reset current case progress and investigate anew?',
    confirmResetAll: 'Reset all unlocked cases, records, and saved puzzles?',
    resetAll: 'Reset All Data',
    sizes: {
      5: '5*5',
      6: '6*6',
      7: '7*7',
      8: '8*8'
    },
    prev: 'Back',
    next: 'Next',
    go: 'Close',
    tut: [
      {
        h: '1. District Placement',
        p: 'Place <b>exactly one detective</b> in each colored district.'
      },
      {
        h: '2. One Per Row & Column',
        p: 'No two detectives may share the same <b>row or column</b>.'
      },
      {
        h: '3. No Touching in 8 Directions',
        p: 'Detectives cannot touch each other in <b>any of 8 directions</b>, diagonals included.'
      },
      {
        h: '4. Controls & Rules',
        p: '<b>Tap/Click</b> to mark ✕ (drag supported). <b>Double-tap</b> or the <b>Place</b> tool to place a detective. 3 mistakes will freeze the case.'
      }
    ],
    solved: 'Case Solved!',
    time: 'Time',
    fame: 'Fame Left',
    hints: 'Hints Used',
    nextCase: 'Next Case',
    close: 'Close',
    failTitle: 'The Case Went Cold',
    failSub: 'You ran out of fame and the lead was lost.',
    failNote: 'You missed a clue, Watson. Re-examine the rows and districts.',
    failSig: '— Sherlock Holmes',
    retry: 'Reopen Case',
    sig: '— from the notebook of Dr. J. H. Watson',
    dossier: 'Case Dossier',
    shortcuts: 'Keyboard Shortcuts',
    shortcutsList: [
      { key: 'X', desc: 'Eliminate Tool' },
      { key: 'D / Space', desc: 'Place Tool' },
      { key: 'Z / Ctrl+Z', desc: 'Undo' },
      { key: 'H', desc: 'Hint' }
    ],
    cases: [
      'A Study in Scarlet',
      'The Sign of Four',
      'The Hound of the Baskervilles',
      'The Valley of Fear',
      'The Speckled Band',
      'A Scandal in Bohemia',
      'The Red-Headed League',
      'The Dancing Men',
      'The Blue Carbuncle',
      'Silver Blaze',
      'The Final Problem',
      'The Empty House',
      'The Six Napoleons',
      'The Norwood Builder',
      'The Naval Treaty',
      'The Copper Beeches'
    ],
    briefs: [
      'Autumn 1891, 221B Baker Street. Holmes began pinning a map of London.',
      '"Two detectives on one street will be spotted." Holmes\'s first rule.',
      'A note pulled from the Thames: "Every district has but one door."',
      '"Two who shadow each other too closely are soon unmasked," said Holmes.',
      'A match-boy in Whitechapel claims he saw a strange professor.',
      'For the first time, Inspector Lestrade came to us for help.',
      'The note decoded: "The door lies beneath the shadow of the clock tower."',
      'Beneath the clock tower: a notebook crammed with equations.',
      'The handwriting matches the author of "The Dynamics of an Asteroid."',
      'The name is Moriarty. Holmes lit his pipe in silence.',
      'A letter from Moriarty: "The board was mine from the start, Mr. Holmes."',
      '"Eliminate the impossible, Watson, and what remains is the truth." To Reichenbach.'
    ]
  }
};

export function translate(lang: Language, key: keyof typeof DICTIONARY['ko'], vars: Record<string, any> = {}): string {
  const dict = DICTIONARY[lang] || DICTIONARY.ko;
  const val = (dict as any)[key] ?? (DICTIONARY.ko as any)[key] ?? key;
  if (typeof val === 'string') {
    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? String(vars[k]) : '');
  }
  return String(val);
}
