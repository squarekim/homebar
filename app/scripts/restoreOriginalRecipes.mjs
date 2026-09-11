/**
 * restoreOriginalRecipes.mjs — 레시피를 원본 스펙으로 되돌린다 (정제 4단계).
 *
 * 재료 줄 32개에 `[대체]` 표시가 붙어 있었다. 원본(IBA 공식 스펙, 각 레시피의 u 필드)과 대조해 보니
 * 30줄은 이미 원본과 같은 재료였다 — 오너의 술장 사정("내 XO 브랜디로 코냑 자리를 대신한다")을
 * 레시피 데이터에 적어 둔 것이었다. 그 표시가 판정에 그대로 먹혀서, 진짜 코냑을 가진 사람에게도
 * 사이드카가 '대체 재료로 가능'으로 나왔다. 다른 사람에게는 거짓인 서술이라 지운다.
 * (같은 이유로 scripts/cleanRecipeNotes.mjs 가 note 의 재고 문장을 이미 지웠다.)
 *
 * 원본과 실제로 달랐던 2줄은 원본 재료로 고친다:
 *   브랜디 크러스타 · 포르토 플립 — IBA 원문은 Cognac 이 아니라 Brandy.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/restoreOriginalRecipes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** 원본 스펙이 코냑이 아니라 브랜디인 레시피 (IBA 공식) */
const TO_BRANDY = new Set(['브랜디 크러스타', '포르토 플립']);
const BRANDY = '포도 브랜디';

export function restoreSeed({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

  const stat = { cleared: 0, recipes: new Set(), swapped: 0 };

  for (const r of data.recipes) {
    for (const line of r.i) {
      const [name, raw, , substitute] = line;
      if (!substitute && !raw.includes('[대체]')) continue;
      // 원본이 브랜디인 두 레시피의 코냑 줄만 재료를 바꾼다
      if (TO_BRANDY.has(r.n) && name === '코냑') {
        line[0] = BRANDY;
        line[1] = raw.replace(name, BRANDY);
        stat.swapped++;
      }
      line[1] = line[1].replace(/\s*\[대체\]/g, '').trim();
      line[3] = 0;
      stat.cleared++;
      stat.recipes.add(r.n);
    }
  }

  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { cleared: stat.cleared, recipes: stat.recipes.size, swapped: stat.swapped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = restoreSeed({ dry: process.argv.includes('--dry') });
  console.log(`대체 표시 제거 ${r.cleared}줄 (레시피 ${r.recipes}종) · 원본 재료로 교체 ${r.swapped}줄`);
}
