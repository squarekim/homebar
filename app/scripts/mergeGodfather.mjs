/**
 * mergeGodfather.mjs — '갓파더 (아마레토)'를 '갓파더'에 합친다.
 * 둘 다 스카치 + 아마레토이고 비율만 달라(1:1 IBA 구 레시피 / 3:1 나무위키) 따로 둘 이유가 없었다.
 * 3:1 변형은 원형 갓파더의 코멘터리 한 문장으로 남긴다.
 * 원본 seed.ts 는 손으로 고치지 않는다. 사용: node scripts/mergeGodfather.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');
const NOTE = 'IBA 목록에서 빠지기 직전 레시피는 3.5cl : 3.5cl로 같은 양이었고, 위스키를 2~3배로 늘려 덜 달게 마셔도 돼요.';

const text = readFileSync(SEED, 'utf8');
const marker = 'export const SEED: RawData = ';
const start = text.indexOf(marker) + marker.length;
const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

const before = data.recipes.length;
data.recipes = data.recipes.filter((r) => r.n !== '갓파더 (아마레토)');
const gf = data.recipes.find((r) => r.n === '갓파더');
if (gf) gf.note = NOTE;
// 지운 레시피의 재료 사용 수(q)를 실제 레시피 수에 맞춘다
for (const ing of data.ings) {
  if (ing.n !== '스카치' && ing.n !== '아마레토') continue;
  ing.q = data.recipes.filter((r) => r.i.some((x) => x[0] === ing.n)).length;
}
writeFileSync(SEED, `${text.slice(0, start)}${JSON.stringify(data)}${tail}`);
console.log(`recipes ${before} → ${data.recipes.length}`);
