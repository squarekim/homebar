/**
 * adapters.ts — 원본 시드(RawData)를 도메인 객체로 변환.
 * 원본 이름/ID 는 보존하고, 파생 필드(ID, ml 환산, 향미 벡터)만 추가한다.
 */
import { SEED } from './seed';
import { slugId } from './ids';
import { flavorForIngredient, flavorForBottle, combineCocktailFlavor } from './flavorLexicon';
import {
  Ingredient, Cocktail, CocktailIngredient, Bottle, Mixer, MixerPairing,
  PurchaseSeed, IngredientSubstitution, FlavorVector,
} from '../models/types';

/* ── 재료 ── */
export const ingredients: Ingredient[] = SEED.ings.map((x) => ({
  id: slugId('ing', x.n),
  name: x.n,
  category: x.c,
  usageCount: x.q,
  seedOwned: x.own === 1,
}));

const ingIdByName = new Map<string, string>(ingredients.map((i) => [i.name, i.id]));
export const ingredientById = new Map<string, Ingredient>(ingredients.map((i) => [i.id, i]));
export function ingredientIdOf(name: string): string {
  return ingIdByName.get(name) ?? slugId('ing', name);
}

const ingFlavorCache = new Map<string, FlavorVector>();
export function ingredientFlavor(name: string, category: string): FlavorVector {
  const key = name + '|' + category;
  let v = ingFlavorCache.get(key);
  if (!v) { v = flavorForIngredient(name, category); ingFlavorCache.set(key, v); }
  return v;
}

/* ── 용량 파싱 ── */
const UNIT_ML: Record<string, number> = {
  ml: 1, cl: 10, oz: 30, dash: 0.9, dashes: 0.9, tsp: 5, 티스푼: 5, 바스푼: 5, tbsp: 15,
  방울: 0.05, drop: 0.05, drops: 0.05,
};

function parseAmount(raw: string, name: string): { amount: number | null; unit: string | null; amountMl: number | null } {
  let rest = raw;
  if (rest.startsWith(name)) rest = rest.slice(name.length);
  rest = rest.replace(/\(.*?\)/g, '').trim(); // (선택) 등 제거
  const m = rest.match(/([\d]+(?:\.\d+)?)(?:\s*[~\-]\s*([\d]+(?:\.\d+)?))?\s*([a-zA-Z가-힣]+)?/);
  if (!m) return { amount: null, unit: null, amountMl: null };
  const lo = parseFloat(m[1]);
  const hi = m[2] ? parseFloat(m[2]) : null;
  const amount = hi != null ? (lo + hi) / 2 : lo;
  if (isNaN(amount)) return { amount: null, unit: null, amountMl: null };
  const unit = (m[3] || '').toLowerCase().trim() || null;
  const factor = unit ? UNIT_ML[unit] : undefined;
  const amountMl = factor != null ? amount * factor : (unit == null ? amount : null);
  return { amount, unit, amountMl };
}

/* ── 칵테일 ── */
export const cocktails: Cocktail[] = SEED.recipes.map((r) => {
  const ings: CocktailIngredient[] = r.i.map(([name, raw, optional, substitute]) => {
    const p = parseAmount(raw, name);
    return {
      ingredientId: ingredientIdOf(name),
      ingredientName: name,
      raw,
      amount: p.amount,
      unit: p.unit,
      amountMl: p.amountMl,
      optional: optional === 1,
      substitute: substitute === 1,
    };
  });
  const flavor = combineCocktailFlavor(
    ings
      .filter((i) => !i.optional)
      .map((i) => {
        const ing = ingredientById.get(i.ingredientId);
        return {
          flavor: ingredientFlavor(i.ingredientName, ing?.category ?? ''),
          weight: i.amountMl ?? 20,
        };
      }),
  );
  return {
    id: slugId('ck', r.n),
    name: r.n,
    base: r.b,
    iba: r.iba,
    method: r.m,
    ingredients: ings,
    url: r.u,
    note: r.note,
    flavor,
  };
});
export const cocktailById = new Map<string, Cocktail>(cocktails.map((c) => [c.id, c]));

/* ── 보유병 (id 원본 유지) ── */
function isWhiskyBottle(b: { g: string; node: string; ko: string }): boolean {
  return b.g === '위스키' || /whisk|위스키|scotch|스카치|버번|bourbon/i.test(b.node + b.ko);
}
function isSpiritBottle(b: { g: string }): boolean {
  return ['위스키', '진', '보드카', '럼·데킬라·브랜디'].includes(b.g);
}
function parseAbv(abv: string): number | null {
  const m = abv.match(/([\d]+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}
export const bottles: Bottle[] = SEED.bottles.map((b) => {
  const whisky = isWhiskyBottle(b);
  return {
    id: b.id,
    group: b.g,
    name: b.ko,
    node: b.node,
    abv: b.abv,
    abvNum: parseAbv(b.abv),
    qty: b.qty,
    use: b.use,
    note: b.note,
    isSpirit: isSpiritBottle(b),
    isWhisky: whisky,
    flavor: flavorForBottle(b.ko, b.g, b.node, whisky),
  };
});
export const whiskies: Bottle[] = bottles.filter((b) => b.isWhisky);
export const spirits: Bottle[] = bottles.filter((b) => b.isSpirit);

/* ── 믹서 ── */
export const mixers: Mixer[] = ingredients
  .filter((i) => i.category === '탄산·음료')
  .map((i) => ({ id: i.id, name: i.name, category: i.category }));

export const mixerPairings: MixerPairing[] = SEED.mixers.map((m) => ({
  id: slugId('mx', m.ko + m.base + m.mixer),
  group: m.g,
  base: m.base,
  mixer: m.mixer,
  ratio: m.ratio,
  name: m.ko,
  glass: m.glass,
  note: m.note,
}));

/* ── 구매 우선순위 시드 (archive) ── */
export const purchaseSeeds: PurchaseSeed[] = SEED.archive.map((a) => ({
  id: slugId('ps', a.ko),
  name: a.ko,
  why: a.why,
  again: a.again,
  unlockLabel: a.unlock,
  note: a.note,
}));

/* ── 대체재 시드 ──
 * 원본에 별도 매핑 테이블이 없으므로, 레시피의 '대체' 마커가 붙은 재료와
 * "A 또는 B" 형태의 이름에서 파생 가능한 최소 대체 관계만 시드로 만든다.
 * 확정적 도메인 지식 기반의 소수 매핑을 추가한다(원본 미변경). */
const SUBSTITUTION_PAIRS: Array<[from: string, to: string, note?: string]> = [
  ['커피 리큐르', '깔루아(커피 리큐르)', '깔루아는 커피 리큐르의 대표 제품'],
  ['트리플 섹', '코앵트로', '코앵트로는 프리미엄 트리플 섹'],
  ['코앵트로', '트리플 섹', '트리플 섹으로 대체 가능(당도 차이)'],
  ['설탕시럽', '심플시럽', '동일'],
  ['라임즙', '레몬즙', '시트러스 대체(산미 유사)'],
];
export const substitutions: IngredientSubstitution[] = SUBSTITUTION_PAIRS
  .filter(([f, t]) => ingIdByName.has(f) || ingIdByName.has(t))
  .map(([f, t, note]) => ({
    id: slugId('sub', f + '>' + t),
    ingredientId: ingredientIdOf(f),
    substituteId: ingredientIdOf(t),
    note,
  }));

export const categories: string[] = SEED.cats.slice();
