/**
 * markIbaFloats.mjs — IBA 원문이 '띄운다'고 적은 레시피의 조주법에 (Float)를 붙인다 (정제 5단계).
 *
 * 잔 그림은 조주법의 Float 표시를 보고 맨 위에 다른 색 층을 그린다. 두 레시피는 IBA 원문이
 * 띄우라고 적었는데 우리 데이터에는 표시가 빠져 있었다.
 *   뉴욕 사워     https://iba-world.com/new-york-sour/  "Float the wine on top."
 *   다크 앤 스토미 https://iba-world.com/dark-n-stormy/ "pour the ginger beer and top floating with the Rum."
 * 재료·비율·가니시는 건드리지 않는다. 이미 표시가 있으면 그대로 둔다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/markIbaFloats.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** 레시피 이름 → IBA 원문 기준 조주법 */
const FLOATS = new Map([
  ['뉴욕 사워', 'Shake (Float)'],
  ['다크 앤 스토미', 'Build (Float)'],
]);

export function markFloats({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

  const changed = [];
  for (const r of data.recipes) {
    const to = FLOATS.get(r.n);
    if (!to || /float/i.test(r.m)) continue;
    changed.push(`${r.n}: ${r.m} → ${to}`);
    r.m = to;
  }
  if (!dry && changed.length) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { changed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = markFloats({ dry: process.argv.includes('--dry') });
  console.log(r.changed.length ? r.changed.join('\n') : '바꿀 레시피 없음');
}
