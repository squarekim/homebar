/**
 * addTasteLines.mjs — 레시피마다 맛 한 줄평(tl)을 음슴체로 붙인다.
 * 원문: scripts/data/tasteLines.json (Gemini 조사, 2026-11-14 '맛 한줄평_gemini' 시트).
 * 재료·만드는 법은 빼고 맛·향·질감·여운만 적었다. 출처(src)는 Difford's Guide·IBA 등 URL,
 * 근거를 못 찾은 잔(국내 창작 레시피 등)은 '추정'.
 * 원본 seed.ts 는 손으로 고치지 않는다. 사용: node scripts/addTasteLines.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

const LINES = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'data/tasteLines.json'), 'utf8'));
export const TL = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.tl]));

export function addTasteLines({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const missing = [];
  let changed = 0;
  for (const r of data.recipes) {
    const tl = TL[r.n];
    if (!tl) { missing.push(r.n); continue; }
    if (r.tl !== tl) { r.tl = tl; changed++; }
  }
  if (!dry && changed) writeFileSync(SEED, `${text.slice(0, start)}${JSON.stringify(data)}${tail}`);
  return { changed, missing };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(addTasteLines({ dry: process.argv.includes('--dry') }));
}
