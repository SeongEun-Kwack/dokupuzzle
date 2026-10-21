import { bankForLevel, generateCrossword } from './puzzle';
import type { CrosswordData, Lang, WordEntry } from './puzzle';

type JsonModule = { default: unknown };

// 경로를 리터럴로 고정해야 번들러가 파일을 찾고 별도 청크로 나눠 줌
const levelFiles: Record<Lang, () => Promise<JsonModule>> = {
  ko: () => import('../data/levels.ko.json'),
  en: () => import('../data/levels.en.json'),
};
const wordFiles: Record<Lang, () => Promise<JsonModule>> = {
  ko: () => import('../data/words.ko.json'),
  en: () => import('../data/words.en.json'),
};

const levelCache = new Map<Lang, Promise<CrosswordData[]>>();
const wordCache = new Map<Lang, Promise<WordEntry[]>>();

function cached<T>(cache: Map<Lang, Promise<T>>, lang: Lang, load: () => Promise<JsonModule>) {
  let p = cache.get(lang);
  if (!p) {
    p = load()
      .then(m => m.default as T)
      .catch(err => { cache.delete(lang); throw err; });   // 실패하면 다음에 다시 시도
    cache.set(lang, p);
  }
  return p;
}

export const loadLevels = (lang: Lang) => cached(levelCache, lang, levelFiles[lang]);
export const loadWords = (lang: Lang) => cached(wordCache, lang, wordFiles[lang]);

export async function getPuzzle(lang: Lang, level: number): Promise<CrosswordData> {
  const levels = await loadLevels(lang);
  const pre = levels[level - 1];
  if (pre) return pre;

  // 미리 만든 레벨을 다 깼을 때만 단어 은행을 불러와서 즉석 생성
  const bank = await loadWords(lang);
  return generateCrossword(lang, level, bankForLevel(bank, level));
}
