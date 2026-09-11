/**
 * adapters.ts — 원본 시드(RawData)를 도메인 객체로 변환.
 * 원본 이름/ID 는 보존하고, 파생 필드(ID, ml 환산, 향미 벡터)만 추가한다.
 */
import { SEED, type RawBottleBadge } from './seed';
import { slugId } from './ids';
import { MAKER_NOTES, SEED_BOTTLE_MASTER } from './makerNotes';
import { WHISKY_CLASS } from './whiskyClass';
import { flavorForIngredient, flavorForBottle, combineCocktailFlavor } from './flavorLexicon';
import { ingredientNamesForNode } from './bottleIngredients';
import {
  type Ingredient, type Cocktail, type CocktailIngredient, type Bottle, type Mixer, type MixerPairing,
  type PurchaseSeed, type IngredientSubstitution, type FlavorVector, type MethodKey,
  type BottleBadge, type BottleBadgeKind, BOTTLE_BADGE_KINDS,
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
  const lo = parseFloat(m[1] ?? '');
  const hi = m[2] ? parseFloat(m[2]) : null;
  const amount = hi != null ? (lo + hi) / 2 : lo;
  if (isNaN(amount)) return { amount: null, unit: null, amountMl: null };
  const unit = (m[3] || '').toLowerCase().trim() || null;
  const factor = unit ? UNIT_ML[unit] : undefined;
  const amountMl = factor != null ? amount * factor : (unit == null ? amount : null);
  return { amount, unit, amountMl };
}

/* ── 조주법 파싱 ── */
const METHOD_ALIASES: Array<[RegExp, MethodKey]> = [
  [/build/i, 'build'], [/shake/i, 'shake'], [/stir/i, 'stir'], [/muddle/i, 'muddle'],
  [/blend/i, 'blend'], [/layer/i, 'layer'], [/swizzle/i, 'swizzle'], [/float/i, 'float'],
];

/** "Shake + Build", "Build (Muddle)" 처럼 섞여 적힌 원문에서 등장 순서대로 키를 뽑는다 */
export function parseMethod(raw: string): MethodKey[] {
  const found: Array<[number, MethodKey]> = [];
  for (const [re, key] of METHOD_ALIASES) {
    const at = raw.search(re);
    if (at >= 0) found.push([at, key]);
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, k]) => k);
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
    methodKeys: parseMethod(r.m),
    ingredients: ings,
    url: r.u,
    note: r.note,
    sourceName: r.s,
    garnish: r.g,
    variantOf: r.v ? slugId('ck', r.v[0]) : undefined,
    variantNote: r.v?.[1],
    variants: [],
    flavor,
  };
});
export const cocktailById = new Map<string, Cocktail>(cocktails.map((c) => [c.id, c]));

/**
 * 변형 역인덱스 — "이 레시피에는 이런 변형이 있다"를 원형 쪽에서도 보여주기 위해 채운다.
 * 원형이 실제로 존재할 때만 연결한다(이름이 어긋나면 조용히 끊는다).
 */
for (const c of cocktails) {
  const parent = c.variantOf ? cocktailById.get(c.variantOf) : undefined;
  if (parent) parent.variants.push(c.id);
  else if (c.variantOf) { c.variantOf = undefined; c.variantNote = undefined; }
}

/* ── 보유병 (id 원본 유지) ── */
function isWhiskyBottle(b: { g: string }): boolean {
  // 그룹 기준으로만 판정한다. (이름에 '위스키'가 들어가도 리큐르로 분류된 가향주는 제외)
  return b.g === '위스키';
}
function isSpiritBottle(b: { g: string }): boolean {
  return ['위스키', '진', '보드카', '럼·데킬라·브랜디'].includes(b.g);
}
function parseAbv(abv: string): number | null {
  const m = abv.match(/([\d]+(?:\.\d+)?)\s*%/);
  return m?.[1] ? parseFloat(m[1]) : null;
}
/** 시드의 뱃지 튜플 → 도메인 뱃지. 모르는 종류는 버린다(화면이 스타일을 갖고 있는 것만 단다). */
function badgesOf(raw: RawBottleBadge[] | undefined): BottleBadge[] {
  return (raw ?? [])
    .filter((t): t is [BottleBadgeKind, string] => (BOTTLE_BADGE_KINDS as string[]).includes(t[0]) && !!t[1])
    .map(([kind, label]) => ({ kind, label }));
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
    volumeMl: b.ml,
    buy: b.buy,
    badges: badgesOf(b.t),
    productId: SEED_BOTTLE_MASTER[b.id],
    isSpirit: isSpiritBottle(b),
    isWhisky: whisky,
    ingredientIds: ingredientNamesForNode(b.node).filter((n) => ingIdByName.has(n)).map((n) => ingredientIdOf(n)),
    flavor: flavorForBottle(b.ko, b.g, b.node, whisky),
    makerNote: MAKER_NOTES[b.id],
    whiskyClass: WHISKY_CLASS[b.id],
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
  ['포도 브랜디', '코냑', '코냑은 포도 브랜디의 한 종류(원산지 한정)'],
  ['포도 브랜디', 'XO 브랜디(코냑 외)', '같은 포도 브랜디 계열'],
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
