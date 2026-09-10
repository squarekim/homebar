/**
 * cleanRecipeNotes.mjs — 레시피 note 에서 "특정 사용자의 재고 상태" 문장을 제거한다.
 *
 * 배경: 제조 가능 판정은 이미 구조화 데이터로만 계산된다.
 *   recipe.i[] → ingredientId(재료 마스터 128종) → inventory(보유) → 대체재 map → READY/SUBSTITUTE/MISSING/UNAVAILABLE
 * 따라서 note 안의 "보유 …충족", "…가 없어 불가", "…구매 시 가능" 류 문장은 중복이자,
 * 특정인의 재고를 전제한 서술이라 다른 사용자에겐 거짓이 된다. 판정 로직은 note 를 읽지 않는다.
 *
 * 보존 대상: 맛·기법·역사·가니시·IBA 규격·일반적인 대체 안내.
 * 부수 정리: 재료 표기의 '[없음]' 재고 마커도 제거한다(화면에 그대로 노출되던 값).
 *
 * 사용: node scripts/cleanRecipeNotes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** 문장 단위 분해 — 한국어 종결(.!?) 기준. 구분자는 문장에 붙여 되돌린다. */
export function splitSentences(line) {
  const out = [];
  let buf = '';
  for (let i = 0; i < line.length; i++) {
    buf += line[i];
    if (/[.!?]/.test(line[i]) && !/\d/.test(line[i + 1] ?? '') && (line[i + 1] === undefined || line[i + 1] === ' ')) {
      out.push(buf); buf = '';
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** 재고 상태를 단정하는 문장(판정의 중복) */
const VERDICT = [
  /충족/,                                   // 충족되나 / 전부 충족 / 불충족
  /미보유/,
  /보유\s*(재료|재고|품)/,
  /(전부|모두|나머지는)\s*보유/,
  /보유\s*중입니다/,
  /막히는\s*건/,            // "막히는 건 파인애플 주스뿐입니다"
  /걸립니다|걸린다/,          // "두 재료가 걸립니다"
  /부족한\s*재료/,
  /없어\s*(조주\s*|제조\s*)?(불가|안\s*됨)/,
  /없으면\s*(조주\s*)?불가/,
  /불가로\s*둡니다/,
  /불가입니다/,
  /(조주|제조|제작)\s*(가능|불가)/,
  /구매\s*시/,
  /구매하면/,
  /한\s*병이면\s*(열림|완성|가능)/,
  /열림[.!?]?$/,
];

/**
 * 한 문장 안에서 앞 절만 재고 서술이고 뒤 절은 레시피 설명인 경우, 앞 절만 떼어낸다.
 * 예) "막히는 건 크렘 드 비올렛 1바스푼뿐이며, 이 한 가지가 …색을 냅니다" → 뒤 절만 남긴다
 */
const CLAUSE_STRIP = [
  /막히는\s*건[^,.]*?이며,\s*/,
];

/**
 * 일반 지식인데 '보유'라는 소유 표현만 붙은 경우 → 소유 표현만 떼고 문장은 살린다.
 * 예) "카샤사는 … 보유 럼으로 대체되지 않습니다" → "카샤사는 … 럼으로 대체되지 않습니다"
 */
function depersonalize(s) {
  return s
    .replace(/보유\s+(?=[가-힣A-Za-z0-9])/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanNote(note) {
  const lines = note.split('\n');
  const keptLines = [];
  let dropped = 0, stripped = 0;
  for (const line of lines) {
    // '출처 — 설명' 처럼 한 줄에 다른 성격의 조각이 이어붙은 경우가 있어 ' — ' 도 경계로 본다
    const segments = line.split(' — ').map((seg) => {
      const kept = [];
      for (const raw of splitSentences(seg)) {
        let s = raw;
        for (const re of CLAUSE_STRIP) {
          if (re.test(s)) { s = s.replace(re, '').trim(); dropped++; }
        }
        if (!s) continue;
        if (VERDICT.some((re) => re.test(s))) { dropped++; continue; }
        if (/보유/.test(s)) { kept.push(depersonalize(s)); stripped++; continue; }
        kept.push(s.trim());
      }
      return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
    }).filter(Boolean);
    // 앞 조각의 뒷문장이 통째로 삭제되면 대시만 남는다 → 마침표로 끝나면 대시 없이 잇는다
    const merged = segments
      .reduce((acc, seg) => (acc ? `${acc}${/[.!?]$/.test(acc) ? ' ' : ' — '}${seg}` : seg), '')
      .replace(/^\s*—\s*/, '')
      .replace(/\s*—\s*$/, '')
      .trim();
    if (merged) keptLines.push(merged);
  }
  return { note: keptLines.join('\n').trim(), dropped, stripped };
}

export function cleanSeed({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const start = text.indexOf('{', text.indexOf('export const SEED'));
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s+as\s+RawData\s*;?\s*)$/)?.[1] ?? ';\n';
  const json = text.slice(start).replace(/\s+as\s+RawData\s*;?\s*$/, '').replace(/;\s*$/, '').trim();
  const data = JSON.parse(json);

  const changes = [];
  let droppedSentences = 0, strippedSentences = 0, markerCount = 0;

  for (const r of data.recipes) {
    // 재료 표기의 '[없음]' 재고 마커 제거
    for (const ing of r.i) {
      const before = ing[1];
      const after = before.replace(/\s*\[없음\]/g, '').replace(/\s{2,}/g, ' ').trim();
      if (after !== before) { ing[1] = after; markerCount++; }
    }
    if (!r.note) continue;
    const { note, dropped, stripped } = cleanNote(r.note);
    if (note !== r.note) {
      changes.push({ name: r.n, before: r.note, after: note });
      droppedSentences += dropped;
      strippedSentences += stripped;
      r.note = note;
    }
  }

  if (!dry) {
    writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  }
  return { changes, droppedSentences, strippedSentences, markerCount, recipes: data.recipes.length };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const dry = process.argv.includes('--dry');
  const r = cleanSeed({ dry });
  console.log(`레시피 ${r.recipes}건 중 ${r.changes.length}건 note 수정 · 문장 삭제 ${r.droppedSentences} · 소유표현 제거 ${r.strippedSentences} · [없음] 마커 ${r.markerCount}`);
  if (dry) {
    for (const c of r.changes) console.log(`\n### ${c.name}\n- ${c.before.replace(/\n/g, '\n- ')}\n+ ${c.after.replace(/\n/g, '\n+ ') || '(전체 삭제)'}`);
  }
}
