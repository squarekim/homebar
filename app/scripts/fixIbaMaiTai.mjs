/**
 * fixIbaMaiTai.mjs — 마이 타이의 큐라소를 IBA 원문대로 오렌지 큐라소로 고친다 (정제 6단계).
 *
 * 재료 줄에는 '블루 큐라소 15ml'가 적혀 있었지만, IBA 원문(https://iba-world.com/mai-tai/)은
 * "15 ml Orange Curacao"이고 같은 레시피의 note 도 '오렌지 큐라소 15ml'라고 적고 있다.
 * 잔 그림이 파란 색소를 섞어 마이 타이가 녹색으로 나온 것도 이 줄 때문이었다.
 *
 * 재료 마스터에 '오렌지 큐라소'가 없어 새로 넣는다(개인 재고 플래그 own 은 0 — 보유 여부를 모른다).
 * 블루 큐라소의 사용 레시피 수(q)는 하나 줄고, 오렌지 큐라소는 1이 된다.
 * 대체 관계(트리플 섹·그랑 마르니에)는 data/adapters.ts 의 SUBSTITUTION_PAIRS 에 둔다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/fixIbaMaiTai.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');
const FROM = '블루 큐라소';
const TO = '오렌지 큐라소';

export function fixMaiTai({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

  const r = data.recipes.find((x) => x.n === '마이 타이');
  const line = r?.i.find(([name]) => name === FROM);
  if (!line) return { changed: false };
  line[0] = TO;
  line[1] = line[1].replace(FROM, TO);

  const blue = data.ings.find((x) => x.n === FROM);
  if (blue) blue.q -= 1;
  if (!data.ings.some((x) => x.n === TO)) {
    const at = data.ings.findIndex((x) => x.n === FROM);
    data.ings.splice(at + 1, 0, { n: TO, c: '리큐르', q: 1, own: 0 });
  }
  if (!dry) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { changed: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(fixMaiTai({ dry: process.argv.includes('--dry') }).changed ? '마이 타이: 블루 큐라소 → 오렌지 큐라소' : '바꿀 줄 없음');
}
