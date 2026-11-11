/**
 * tasteWords — 목록과 추천에 적는 "맛 한두 마디".
 *
 * 향미 값이 큰 축을 그대로 고르면 같은 술을 쓰는 잔이 전부 같은 말이 된다
 * (위스키 칵테일은 모두 '바닐라 · 카라멜', 싱글몰트는 모두 '오크 · 바닐라').
 *  - 칵테일: 같은 베이스 술을 쓰는 잔들의 평균보다 얼마나 더 강한지로 고른다. 그 잔을 다른 잔과 구별해 주는 맛이 나온다.
 *  - 위스키: 제조사 공식 노트가 있으면 노트에 먼저 적힌 맛을 쓴다(오크통 그림 옆 물건과 같은 규칙).
 * 값이 모자라면 원래 방식(값이 큰 축)으로 채운다. 추천 점수 계산에는 쓰지 않는다. 표시용이다.
 */
import { type Bottle, type Cocktail, type FlavorAxis, type FlavorVector, FLAVOR_AXES, FLAVOR_LABELS_KO } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { flavorsOf, type FlavorKey } from '../data/caskVisual';
import { flavorWords } from './flavorService';
import { ingredientFlavor } from '../data/adapters';

/** 베이스가 되는 술의 분류 — 이 재료들은 "그 잔만의 맛"을 고를 때 뺀다 */
const SPIRIT_CATEGORIES = new Set(['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디']);

const SWEETENER = '시럽·감미';

/**
 * 칵테일 — 첫 마디는 술을 뺀 나머지 재료(주스·리큐르·시럽·비터)가 내는 맛, 둘째 마디는 잔 전체에서 가장 강한 맛.
 * 위스키 사워라면 레몬즙이 내는 '시트러스'가 앞에 오고, 위스키의 '바닐라'가 뒤에 온다.
 */
export function cocktailWords(ck: Cocktail, n = 2): string[] {
  const plain = flavorWords(ck.flavor, n + 1);
  const mix = FLAVOR_AXES.reduce((o, a) => { o[a] = 0; return o; }, {} as FlavorVector);
  let total = 0;
  const catOf = (id: string) => referenceRepo.ingredientById(id)?.category ?? '';
  // 설탕·시럽은 어느 잔에나 들어가 구별이 안 된다. 다른 재료가 있으면 뺀다
  const others = ck.ingredients.some((i) => !i.optional && !SPIRIT_CATEGORIES.has(catOf(i.ingredientId)) && catOf(i.ingredientId) !== SWEETENER);
  for (const i of ck.ingredients) {
    if (i.optional) continue;
    const cat = catOf(i.ingredientId);
    if (SPIRIT_CATEGORIES.has(cat) || (others && cat === SWEETENER)) continue;
    const w = i.amountMl ?? 20;
    const f = ingredientFlavor(i.ingredientName, cat);
    for (const a of FLAVOR_AXES) mix[a] += f[a] * w;
    total += w;
  }
  const words: string[] = [];
  if (total > 0) {
    const top = [...FLAVOR_AXES].sort((a, b) => mix[b] - mix[a])[0] as FlavorAxis;
    if (mix[top] > 0) words.push(FLAVOR_LABELS_KO[top]);
  }
  for (const w of plain) if (words.length < n && !words.includes(w)) words.push(w);
  return words.slice(0, n);
}

const NOTE_WORD: Record<FlavorKey, string> = {
  vanilla: '바닐라', honey: '꿀', apple: '사과', dried: '말린 과일', citrus: '시트러스', chocolate: '초콜릿', nut: '견과', flower: '꽃',
  spice: '스파이스', sea: '바다', caramel: '카라멜', tropical: '열대 과일', berry: '베리', coffee: '커피', grain: '곡물', herb: '허브', peat: '피트',
};

/** 위스키 — 공식 노트에 먼저 적힌 맛. 노트가 없으면 향미 값이 큰 축 */
export function whiskyWords(b: Bottle, n = 2): string[] {
  const fromNote = flavorsOf(b).map((k) => NOTE_WORD[k]);
  if (fromNote.length >= n) return fromNote.slice(0, n);
  const words = [...fromNote];
  for (const w of flavorWords(b.flavor, n)) if (words.length < n && !words.includes(w)) words.push(w);
  return words;
}
