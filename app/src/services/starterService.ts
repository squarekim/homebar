/**
 * starterService — 입문 취향 찾기.
 * 고른 음료·술 카드로 취향 벡터를 만들고, 입문 추천 38개 안에서 위스키와 칵테일을 고른다.
 * 저장하지 않는 순수 계산이다. 결과를 취향 프로필에 반영할지는 화면이 정한다.
 */
import { type FlavorVector, FLAVOR_AXES, zeroVector } from '../models/types';
import {
  DRINK_CARDS, LIQUOR_CARDS, STARTER_PICKS, STARTER_PRICES, BUDGETS, priceBandLabel,
  type TasteCard, type DrinkHabit, type StrengthPref, type BudgetKey, type StarterPick,
} from '../data/starterGuide';
import { LIQUOR_MASTER, liquorMasterById } from '../data/liquorMaster';
import { MASTER_MAKER_NOTES } from '../data/makerNotesMaster';
import { flavorForBottle } from '../data/flavorLexicon';
import { referenceRepo } from '../repositories/referenceRepo';
import { tasteMatch, flavorWords } from './flavorService';
import { cocktailStrength } from './recommendationService';

export interface StarterAnswers {
  habit: DrinkHabit;
  likes: readonly string[];
  dislikes: readonly string[];
  strength: StrengthPref;
  budget: BudgetKey;
}

export interface StarterResult {
  pick: StarterPick;
  name: string;
  score: number;
  flavorWords: string[];
  abv?: number | undefined;
  /** 위스키만. 가격 조사 전이면 undefined */
  priceLabel?: string | undefined;
}

const ALL_CARDS = new Map<string, TasteCard>([...DRINK_CARDS, ...LIQUOR_CARDS].map((c) => [c.id, c]));

/**
 * 술을 자주 마실수록 술 카드를 많이 보여 준다.
 * 잘 안 마시는 사람에게 IPA·스타우트를 물으면 고를 수 있는 게 없다.
 */
export function cardsFor(habit: DrinkHabit): TasteCard[] {
  if (habit === 'rarely') return [...DRINK_CARDS];
  if (habit === 'sometimes') return [...DRINK_CARDS.slice(0, 10), ...LIQUOR_CARDS.filter((c) => !c.id.startsWith('l_belgian'))];
  return [...LIQUOR_CARDS, ...DRINK_CARDS.slice(0, 6)];
}

/** 술 카드에 붙일 기준 DB 예시 제품 (예: 라거 → 카스 후레쉬, 테라 …) */
export function examplesFor(card: TasteCard, limit = 4): string[] {
  if (!card.subcategories) return [];
  return LIQUOR_MASTER.filter((m) => card.subcategories!.includes(m.subcategory)).slice(0, limit).map((m) => m.nameKo);
}

/**
 * 좋아요는 더하고 별로는 절반만 뺀다. '별로'는 한 축만 싫어도 누르기 때문에 같은 무게로 빼면 과하다.
 * 가장 큰 축을 10 으로 맞춰 형태만 남긴다. 좋아요가 없으면 null.
 */
export function tasteFromCards(likes: readonly string[], dislikes: readonly string[]): FlavorVector | null {
  const liked = likes.map((id) => ALL_CARDS.get(id)).filter((c): c is TasteCard => !!c);
  if (liked.length === 0) return null;
  const v = zeroVector();
  for (const c of liked) for (const a of FLAVOR_AXES) v[a] += c.flavor[a] ?? 0;
  for (const id of dislikes) {
    const c = ALL_CARDS.get(id);
    if (c) for (const a of FLAVOR_AXES) v[a] -= (c.flavor[a] ?? 0) / 2;
  }
  let max = 0;
  for (const a of FLAVOR_AXES) { v[a] = Math.max(0, v[a]); max = Math.max(max, v[a]); }
  if (max === 0) return null;
  for (const a of FLAVOR_AXES) v[a] = Math.round((v[a] / max) * 100) / 10;
  return v;
}

/** 기준 DB 위스키는 향미 벡터가 없어서 이름·세부분류·캐스크·제조사 노트 단어로 만든다 */
function whiskyFlavor(id: string): FlavorVector | null {
  const m = liquorMasterById.get(id);
  if (!m) return null;
  const note = MASTER_MAKER_NOTES[id];
  const words = [
    m.subcategory, ...(m.whiskyClass?.cask ?? []), ...(m.whiskyClass?.character ?? []),
    note?.nose, note?.palate, note?.finish, note?.text,
  ].filter(Boolean).join(' ');
  return flavorForBottle(m.nameKo, '위스키', words, true);
}

/** 가볍게: 43% 이하 위스키 · 주정 비율 45% 이하 칵테일. 보통·모르겠어요: 46% 이하 위스키. 진하게: 제한 없음 */
function fitsStrength(pick: StarterPick, strength: StrengthPref, abv: number | undefined): boolean {
  if (pick.kind === 'whisky') {
    if (abv == null || abv === 0) return true;
    if (strength === 'light') return abv <= 43;
    if (strength === 'strong') return true;
    return abv <= 46;
  }
  if (strength !== 'light') return true;
  const ck = referenceRepo.cocktailById(pick.id);
  return !ck || cocktailStrength(ck) <= 0.45;
}

/** 가격을 모르는 병은 예산으로 거르지 않고 남긴다(가격 표시 없이) */
function fitsBudget(pick: StarterPick, budget: BudgetKey): boolean {
  if (pick.kind !== 'whisky') return true;
  const max = BUDGETS.find((b) => b.v === budget)?.max ?? null;
  const price = STARTER_PRICES[pick.id];
  return max == null || price == null || price <= max;
}

export function starterRecommend(a: StarterAnswers, perKind = 3): {
  taste: FlavorVector | null; whiskies: StarterResult[]; cocktails: StarterResult[];
} {
  const taste = tasteFromCards(a.likes, a.dislikes);
  const results: StarterResult[] = [];

  STARTER_PICKS.forEach((pick, order) => {
    const isWhisky = pick.kind === 'whisky';
    const master = isWhisky ? liquorMasterById.get(pick.id) : undefined;
    const ck = isWhisky ? undefined : referenceRepo.cocktailById(pick.id);
    const flavor = isWhisky ? whiskyFlavor(pick.id) : ck?.flavor ?? null;
    if (!flavor || (!master && !ck)) return;
    if (!fitsStrength(pick, a.strength, master?.abv)) return;
    if (!fitsBudget(pick, a.budget)) return;

    // 취향이 없으면 쉬운 것부터, 목록 순서대로
    const base = taste ? tasteMatch(taste, flavor) : 50 - order / 100;
    const score = base + (pick.difficulty === 1 ? 4 : pick.difficulty === 2 ? 2 : 0);
    const price = isWhisky ? STARTER_PRICES[pick.id] : undefined;
    results.push({
      pick, score, name: master?.nameKo ?? ck?.name ?? pick.id, flavorWords: flavorWords(flavor),
      abv: master?.abv, priceLabel: price != null ? priceBandLabel(price) : undefined,
    });
  });

  const top = (kind: StarterPick['kind']) =>
    results.filter((r) => r.pick.kind === kind).sort((x, y) => y.score - x.score).slice(0, perKind);
  return { taste, whiskies: top('whisky'), cocktails: top('cocktail') };
}
