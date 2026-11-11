/**
 * alignIbaRecipes.mjs — IBA 원문과 어긋난 레시피를 원문에 맞춘다 (정제 7단계).
 *
 * 2026-11-05 IBA 공식 목록(https://iba-world.com/cocktails/all-cocktails/, 102종)의 각 페이지와
 * 우리 레시피를 대조해 재료·용량·조주법이 다른 15종을 고친다. 원칙:
 *   - 재료 마스터에 없는 재료는 새로 만들지 않고 가장 가까운 기존 재료로 맞춘다.
 *     그때 재료 줄에 원문 이름을 괄호로 남긴다(예: '골드 럼 45ml (원문: 푸에르토리코 골드 럼)').
 *   - 근거는 각 레시피의 u 필드(IBA 페이지)다.
 * 끝으로 재료별 사용 레시피 수(q)를 레시피에서 다시 센다(이전 단계에서 어긋난 코냑·포도 브랜디도 바로잡힌다).
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다.
 * 사용: node scripts/alignIbaRecipes.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** [재료, 표기, 선택 여부] — 레시피 재료 줄 전체를 원문 순서대로 바꾼다 */
const L = (name, raw, optional = 0) => [name, raw, optional, 0];

/** 레시피 이름 → { i: 새 재료 줄, m: 새 조주법, u: 새 출처 } (없는 키는 그대로) */
export const FIXES = {
  // IBA: Jamaican dark rum 45 · Gold Puerto Rican rum 45 · Demerara Rum 30 …
  '좀비': { i: [
    L('자메이카 럼(앰버/블랙스트랩)', '자메이카 럼(앰버/블랙스트랩) 45ml'),
    L('골드 럼', '골드 럼 45ml (원문: 푸에르토리코 골드 럼)'),
    L('데메라라 럼', '데메라라 럼 30ml'),
    L('라임즙', '라임즙 20ml'), L('팔레르넘', '팔레르넘 15ml'),
    L('돈스 믹스(자몽+시나몬시럽)', '돈스 믹스(자몽+시나몬시럽) 15ml'),
    L('그레나딘', '그레나딘 1tsp'), L('앙고스투라 비터', '앙고스투라 비터 1dash'), L('압생트', '압생트 6drops'),
  ] },
  // IBA: Tequila 100% agave 45 · Grand Marnier 30 · Lime 15
  '그랜드 마르가리타': { amounts: { '100% 아가베 데킬라': '45ml', '그랑 마르니에': '30ml' } },
  // IBA: Gin 30 · Apricot Brandy 30 · Calvados 30
  '앤젤 페이스': { amounts: { '애프리콧 브랜디': '30ml' } },
  // IBA: White rum 30 · Peach Brandy 15 · lime 15 · Honey Mix 30 · Mint 10 · Pineapple Chunks 3~4
  '미셔너리스 다운폴': { i: [
    L('화이트 럼', '화이트 럼 30ml'), L('피치 브랜디', '피치 브랜디 15ml'),
    L('파인애플 주스', '파인애플 주스 30ml (원문: 파인애플 조각 3~4개)'),
    L('라임즙', '라임즙 15ml'), L('허니 믹스', '허니 믹스 30ml'), L('민트 잎', '민트 잎 10장'),
  ] },
  // IBA: Gold Jamaican Rum 30 · Cuban Rum 15 · Passion Fruit Syrup 15 · lime 15 · Honey Syrup 15
  '돈스 스페셜 다이키리': { i: [
    L('골드 럼', '골드 럼 30ml'), L('쿠바산 화이트 럼', '쿠바산 화이트 럼 15ml'),
    L('패션프루트 퓨레', '패션프루트 퓨레 15ml (원문: 패션프루트 시럽)'),
    L('라임즙', '라임즙 15ml'), L('허니 시럽', '허니 시럽 15ml'),
  ] },
  // IBA: Mezcal 30 · Jamaica Overproof White Rum 15 · Falernum 15 · Maraschino 1 bar spoon · Lime 22.5 · Simple Syrup 15
  '일리걸': { amounts: { '화이트 럼': '15ml (원문: 자메이카 오버프루프 화이트 럼)', '마라스키노': '1바스푼', '설탕시럽': '15ml' } },
  // IBA: Brandy 52.5 · Maraschino 7.5 · Curacao 1 bar spoon · Lemon 15 · Simple Syrup 1 bar spoon · Aromatic Bitters 2 dashes
  //      "Mix together all ingredients with ice cubes in a mixing glass"
  '브랜디 크러스타': { m: 'Stir', i: [
    L('포도 브랜디', '포도 브랜디 52.5ml'), L('마라스키노', '마라스키노 7.5ml'),
    L('오렌지 큐라소', '오렌지 큐라소 1바스푼'), L('레몬즙', '레몬즙 15ml'),
    L('설탕시럽', '설탕시럽 1바스푼'), L('앙고스투라 비터', '앙고스투라 비터 2dash'),
  ] },
  // IBA: Cachaca 60 · Sweet Vermouth 20 · Cynar 15 · Angostura 2 drops (Optional)
  '라보 데 갈로': { i: [
    L('카샤사', '카샤사 60ml'), L('스위트 베르무트', '스위트 베르무트 20ml'), L('치나르', '치나르 15ml'),
    L('앙고스투라 비터', '앙고스투라 비터 2방울 (선택)', 1),
  ] },
  // IBA: Cuban Aguardiente 60 · Lime 15 · Raw Honey 15 · Water 50
  '칸찬차라': { i: [
    L('쿠바산 화이트 럼', '쿠바산 화이트 럼 60ml (원문: 쿠바 아과르디엔테)'),
    L('허니 시럽', '허니 시럽 15ml (원문: 생꿀)'), L('라임즙', '라임즙 15ml'), L('물', '물 50ml'),
  ] },
  // IBA: Vodka Vanilla 50 · Elderflower 15 · Lime 15 · Honey Syrup 10 · Red Chili 2 slices
  '스파이시 피프티': { amounts: { '플레인 보드카': '50ml (원문: 바닐라 보드카)', '라임즙': '15ml' } },
  // IBA: Brandy 15 · Red Tawny Port 45 · Egg Yolk 10
  '포르토 플립': { amounts: { '루비 포트': '45ml (원문: 토니 포트)' } },
  // IBA: Martinique Molasses Rhum — "not an Agricole Rhum but a type of “rummy” from molasses"
  '마이 타이': { swap: { '마르티니크 럼 아그리콜': ['골드 럼', '골드 럼 30ml (원문: 마르티니크 몰라세스 럼)'] } },
  // IBA: … Amaretto 15 · Frangelico 5 · Maraschino 5 drops …
  'IBA 티키': { i: [
    L('화이트 럼', '화이트 럼 30ml'), L('골드 럼', '골드 럼 30ml'), L('아마레토', '아마레토 15ml'),
    L('기타 리큐르', '기타 리큐르 5ml (원문: 프란젤리코)'), L('마라스키노', '마라스키노 5방울'),
    L('패션프루트 퓨레', '패션프루트 퓨레 30ml'), L('파인애플 주스', '파인애플 주스 90ml'),
    L('라임즙', '라임즙 30ml'), L('생강', '생강 1조각'),
  ] },
  // IBA: Rye Whiskey or Bourbon 60 · … · Few Drops of Egg White (필수)
  '뉴욕 사워': { swap: { '버번': ['버번 또는 라이', '버번 또는 라이 60ml'] }, required: ['계란흰자'] },
  // IBA: Tequila 100% agave 60
  '토미스 마르가리타': { swap: { '레포사도 데킬라(100% 아가베)': ['100% 아가베 데킬라', '100% 아가베 데킬라 60ml'] } },
  // IBA: Crème de Cacao (Brown) / Grasshopper 은 (White) — 재료는 하나, 색만 표기로 가른다(drinkVisual.colorOf)
  '알렉산더': { amounts: { '크렘 드 카카오': '30ml (브라운)' } },
  '그래스호퍼': { amounts: { '크렘 드 카카오': '20ml (화이트)' } },
  // IBA: "Float the single malt whisky on top."
  '페니실린': { m: 'Shake (Float)' },
};

export function alignRecipes({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));

  const changed = [];
  for (const [name, fix] of Object.entries(FIXES)) {
    const r = data.recipes.find((x) => x.n === name);
    if (!r) throw new Error(`레시피 없음: ${name}`);
    const before = JSON.stringify([r.m, r.i]);
    if (fix.m) r.m = fix.m;
    if (fix.i) r.i = fix.i.map((l) => [...l]);
    for (const [ing, amt] of Object.entries(fix.amounts ?? {})) {
      const line = r.i.find(([n]) => n === ing);
      if (!line) throw new Error(`${name}: 재료 없음 ${ing}`);
      line[1] = `${ing} ${amt}`;
    }
    for (const [from, [to, raw]] of Object.entries(fix.swap ?? {})) {
      const line = r.i.find(([n]) => n === from);
      if (line) { line[0] = to; line[1] = raw; }
    }
    for (const ing of fix.required ?? []) {
      const line = r.i.find(([n]) => n === ing);
      if (line) { line[2] = 0; line[1] = line[1].replace(/\s*\(선택\)/g, ''); }
    }
    if (JSON.stringify([r.m, r.i]) !== before) changed.push(name);
  }

  // 재료별 사용 레시피 수를 다시 센다
  const count = new Map();
  for (const r of data.recipes) for (const n of new Set(r.i.map(([x]) => x))) count.set(n, (count.get(n) ?? 0) + 1);
  const recount = [];
  for (const ing of data.ings) {
    const q = count.get(ing.n) ?? 0;
    if (ing.q !== q) { recount.push(`${ing.n} ${ing.q}→${q}`); ing.q = q; }
  }
  const unknown = [...count.keys()].filter((n) => !data.ings.some((i) => i.n === n));
  if (unknown.length) throw new Error(`재료 마스터에 없는 재료: ${unknown.join(', ')}`);

  if (!dry && (changed.length || recount.length)) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { changed, recount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = alignRecipes({ dry: process.argv.includes('--dry') });
  console.log(`레시피 ${r.changed.length}종: ${r.changed.join(', ')}`);
  console.log(`사용 수 재계산 ${r.recount.length}건: ${r.recount.join(', ')}`);
}
