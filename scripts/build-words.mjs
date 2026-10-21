// scripts/build-words.mjs
import fs from 'node:fs';

const [, , src, out, lang] = process.argv;
const rows = fs.readFileSync(src, 'utf8').trim().split('\n').slice(1)
  .map(l => l.split(','));            // answer,clue,hint,category,difficulty

const seen = new Set();
const words = rows
  .map(([answer, clue, hint, category, difficulty], i) => ({
    id: `${lang}-${String(i + 1).padStart(4, '0')}`,
    answer: answer.trim().normalize('NFC').toUpperCase(),
    clue: clue?.trim(), hint: hint?.trim(), category, difficulty: Number(difficulty) || 1,
  }))
  .filter(w => {
    const len = Array.from(w.answer).length;
    const ok = lang === 'ko'
      ? /^[가-힣]+$/.test(w.answer) && len >= 2 && len <= 5   // 띄어쓰기·숫자 제외
      : /^[A-Z]+$/.test(w.answer) && len >= 3 && len <= 8;
    if (!ok || !w.clue || seen.has(w.answer)) return false;
    if (w.clue.includes(w.answer)) return false;               // 정답이 문제에 노출되면 제외
    seen.add(w.answer);
    return true;
  });

fs.writeFileSync(out, JSON.stringify(words));
console.log(`${words.length} words → ${out}`);
