/**
 * makePublicSeed.mjs — 공개 배포용 시드 생성기.
 * 원본 seed.ts(개인 홈바 데이터 포함)를 읽어, 개인 소유 정보만 제거한 seed.public.ts 를 만든다.
 *  - bottles(실제 보유 주류 컬렉션) → 제거
 *  - ings[].own(개인 재고 플래그)   → 0
 * 레시피·재료·믹서·구매우선순위는 공용 자산이라 그대로 남는다.
 * 원본 seed.ts 는 절대 수정하지 않는다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../src/data/seed.ts');
const OUT = resolve(here, '../src/data/seed.public.ts');

export function makePublicSeed() {
  const text = readFileSync(SRC, 'utf8');
  const start = text.indexOf('{', text.indexOf('export const SEED'));
  const json = text.slice(start).replace(/\s+as\s+RawData\s*;?\s*$/, '').replace(/;\s*$/, '').trim();
  const data = JSON.parse(json);

  const removedBottles = data.bottles.length;
  const ownedCount = data.ings.filter((i) => i.own === 1).length;
  const removedMatrix = data.matrix.length + data.cask.length;
  data.bottles = [];
  data.ings = data.ings.map((i) => ({ ...i, own: 0 }));
  // 레거시 개인 컬렉션 매트릭스/캐스크 축(보유 병 이름이 그대로 적혀 있음). 앱은 이미 실시간 계산으로 대체했다.
  data.matrix = [];
  data.cask = [];

  const body = `/**
 * seed.public.ts — 자동 생성물. 직접 수정하지 말 것 (scripts/makePublicSeed.mjs).
 * 공개 배포(VITE_PUBLIC=1) 빌드에서 seed.ts 대신 사용된다.
 * 개인 보유 주류 ${removedBottles}종 · 개인 재고 ${ownedCount}건 · 레거시 컬렉션 매트릭스 ${removedMatrix}행이 제거된 상태다.
 */
import type { RawData } from './seed';

export const SEED: RawData = ${JSON.stringify(data)} as RawData;
`;
  writeFileSync(OUT, body);
  return { out: OUT, removedBottles, removedOwned: ownedCount, removedMatrix };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = makePublicSeed();
  console.log(`seed.public.ts 생성 — 보유 주류 ${r.removedBottles}종 · 개인 재고 ${r.removedOwned}건 · 매트릭스 ${r.removedMatrix}행 제거`);
}
