/**
 * regroupSideIngredients.mjs — 재료 분류 '유제품·기타'를 정리한다.
 *  - 물, 우유 → '탄산·음료' (마시는 것)
 *  - 나머지(생크림, 계란흰자, 계란 노른자, 바닐라 익스트랙, 오렌지 플라워 워터, 올리브 브라인) → 분류 이름을 '부재료'로
 * 처음에 한 사람이 쓰려고 '늘 있는 것' 묶음으로 만든 분류라 이름이 맞지 않았다.
 * 향미: 우유·크림·계란은 이름 규칙(flavorLexicon NAME_RULES)이 그대로 맛을 준다. 물은 이제 맛을 더하지 않는다.
 *
 * 사용: node scripts/regroupSideIngredients.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');
const OLD = '유제품·기타', SIDE = '부재료', DRINK = '탄산·음료';
const TO_DRINK = new Set(['물', '우유']);

export function regroup(dry = false) {
  const text = readFileSync(SEED, 'utf8');
  const start = text.indexOf('{', text.indexOf('export const SEED'));
  const tailMatch = text.slice(start).match(/\s+as\s+RawData\s*;?\s*$/);
  const tail = tailMatch ? tailMatch[0] : '';
  const data = JSON.parse(text.slice(start, text.length - tail.length));
  let moved = 0, renamed = 0;
  for (const ing of data.ings) {
    if (ing.c !== OLD) continue;
    if (TO_DRINK.has(ing.n)) { ing.c = DRINK; moved++; } else { ing.c = SIDE; renamed++; }
  }
  data.cats = data.cats.map((c) => (c === OLD ? SIDE : c));
  if (!dry) writeFileSync(SEED, text.slice(0, start) + JSON.stringify(data) + tail);
  return { moved, renamed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = regroup(process.argv.includes('--dry'));
  console.log(`음료로 옮김 ${r.moved} · 부재료로 이름 바꿈 ${r.renamed}`);
}
