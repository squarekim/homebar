/**
 * addMixerRecipes.mjs — 믹서 조합표(seed mixers)에만 있던 조합을 일반 레시피로 옮긴다 (정제 11단계, 2026-11-12).
 *
 * 이 조합들은 '간단 조합' 칸에만 있어서 칵테일 목록·검색·추천에 나오지 않았다. 그 칸을 없애면서 레시피로 옮긴다.
 *  - 기주 45ml에 조합표의 비율대로 믹서를 붓는다(1:3 → 135ml, 1:4 → 180ml). 잔에 바로 붓기(Build), 하이볼 잔, 비IBA.
 *  - 기주는 조합표의 병 이름 대신 재료 마스터의 표준 재료로 적는다(예: 잭 다니엘스 → 테네시, 바카디 → 화이트 럼).
 *  - 메모는 조합표 메모(rewordRecipeText.mjs 로 다듬은 것)를 그대로 쓴다.
 * 옮기지 않은 것
 *  - 캄파리 토닉: '밀라노 토닉'(캄파리 + 토닉워터)과 재료가 같다. 검색 별칭으로 잇는다(data/searchAliases.ts).
 *  - 가쿠 하이볼·CS 하이볼: 원래 주인의 병에 묶인 조합이라, 위스키 상세의 '마시는 법'에서 하이볼을 고르게 했다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다. 여러 번 돌려도 결과가 같다.
 * 사용: node scripts/addMixerRecipes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');
const L = (name, raw) => [name, raw, 0, 0];

/** [조합표 이름, 베이스 분류, 기주 표준 재료, 믹서 표준 재료, 믹서 배수] */
const ROWS = [
  ['버번 콕', '위스키', '버번', '콜라', 3],
  ['잭콕', '위스키', '테네시', '콜라', 3],
  ['진 토닉', '진', '런던 드라이 진', '토닉워터', 3],
  ['진 소다', '진', '런던 드라이 진', '탄산수', 3],
  ['보드카 토닉', '보드카', '플레인 보드카', '토닉워터', 3],
  ['럼 콕', '럼', '화이트 럼', '콜라', 3],
  ['말리부 오렌지', '럼', '코코넛 럼', '오렌지 주스', 3],
  ['테킬라 오렌지', '데킬라', '데킬라', '오렌지 주스', 3],
  ['미도리 소다', '리큐르', '미도리', '탄산수', 3],
  ['카시스 소다', '리큐르', '크렘 드 카시스', '탄산수', 4],
  ['엘더플라워 소다', '리큐르', '엘더플라워 코디얼', '탄산수', 3],
  ['아마레토 콕', '리큐르', '아마레토', '콜라', 3],
];
const BASE_ML = 45;

export function addMixerRecipes({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const ingNames = new Set(data.ings.map((i) => i.n));
  const added = [];

  for (const [name, base, spirit, mixer, k] of ROWS) {
    for (const n of [spirit, mixer]) if (!ingNames.has(n)) throw new Error(`재료 마스터에 없는 재료: ${n}`);
    const src = data.mixers.find((m) => m.ko === name);
    if (!src) throw new Error(`조합표에 없는 이름: ${name}`);
    const recipe = {
      n: name, b: base, iba: '비IBA', m: 'Build', gl: 'highball', u: '',
      i: [L(spirit, `${spirit} ${BASE_ML}ml`), L(mixer, `${mixer} ${BASE_ML * k}ml`)],
      ...(src.note ? { note: src.note } : {}),
    };
    const at = data.recipes.findIndex((r) => r.n === name);
    if (at >= 0) { if (JSON.stringify(data.recipes[at]) === JSON.stringify(recipe)) continue; data.recipes[at] = recipe; }
    else data.recipes.push(recipe);
    added.push(name);
  }

  const count = new Map();
  for (const r of data.recipes) for (const n of new Set(r.i.map(([x]) => x))) count.set(n, (count.get(n) ?? 0) + 1);
  for (const ing of data.ings) ing.q = count.get(ing.n) ?? 0;

  if (!dry && added.length) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { added };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('추가:', addMixerRecipes({ dry: process.argv.includes('--dry') }).added.join(', ') || '없음');
}
