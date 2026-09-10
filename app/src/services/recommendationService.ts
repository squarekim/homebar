/**
 * recommendationService — 외부 AI 없이 동작하는 추천 엔진.
 * totalScore = tasteScore·inventoryScore·availabilityScore·noveltyScore 의 가중 결합.
 * 각 하위 점수는 0~100, 결과에 점수와 이유(reason)를 함께 반환한다.
 * UI 와 완전히 분리된 순수 로직.
 */
import {
  type Cocktail, type Bottle, type FlavorVector, type RecommendationResult, type DrinkLog,
  type AvailabilityResult, FLAVOR_LABELS_KO, type FlavorAxis, type StockContext,
} from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail, AVAIL_SCORE } from './availabilityService';
import { tasteMatch, topAxes, cosineSimilarity } from './flavorService';

export type RecommendMode =
  | 'available'   // 있는 재료만
  | 'sweet'       // 달달한
  | 'refreshing'  // 상큼한
  | 'strong'      // 강한
  | 'light'       // 가벼운
  | 'whisky'      // 위스키
  | 'clearstock'; // 재고 소진

export interface RecommendContext extends StockContext {
  taste: FlavorVector;
  remainingById: Map<string, number>; // ingredientId → 잔량(0~100)
}

const DAY = 86_400_000;

interface DrinkStat { count: number; last: number; }
function drinkStats(logs: DrinkLog[]): Map<string, DrinkStat> {
  const m = new Map<string, DrinkStat>();
  for (const log of logs) {
    const t = Date.parse(log.date) || 0;
    const s = m.get(log.drinkId);
    if (s) { s.count++; s.last = Math.max(s.last, t); }
    else m.set(log.drinkId, { count: 1, last: t });
  }
  return m;
}

/** 신선도: 최근·반복 음용일수록 낮음. 미음용은 높음. */
function noveltyScore(drinkId: string, stats: Map<string, DrinkStat>, now: number): number {
  const s = stats.get(drinkId);
  if (!s) return 90;
  const daysSince = (now - s.last) / DAY;
  const recency = Math.min(80, daysSince * 4); // 20일 경과면 만점 근처
  const repeatPenalty = Math.min(35, s.count * 7);
  return Math.max(5, Math.round(20 + recency - repeatPenalty));
}

/** 칵테일 재고 충족률 0~100 (필수 재료 중 보유 비율) */
function inventoryCoverage(ck: Cocktail, heldIds: Set<string>, subMap: Map<string, string[]>): number {
  const core = ck.ingredients.filter((i) => !i.optional);
  if (core.length === 0) return 100;
  let have = 0;
  for (const i of core) {
    if (heldIds.has(i.ingredientId)) have++;
    else if ((subMap.get(i.ingredientId) ?? []).some((s) => heldIds.has(s))) have += 0.7;
  }
  return Math.round((have / core.length) * 100);
}

/** 칵테일 강도: 주정 재료 ml 비율 (0~1) */
const SPIRIT_CATS = new Set(['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디']);
function cocktailStrength(ck: Cocktail): number {
  let spirit = 0, total = 0;
  for (const i of ck.ingredients) {
    const ml = i.amountMl ?? 0;
    total += ml;
    const cat = referenceRepo.ingredientById(i.ingredientId)?.category ?? '';
    if (SPIRIT_CATS.has(cat)) spirit += ml;
  }
  if (total === 0) return 0.5;
  return spirit / total;
}

/** 재고 소진 기여: 보유하고 잔량 적은 재료를 쓰면 가점 */
function clearStockBonus(ck: Cocktail, heldIds: Set<string>, remainingById: Map<string, number>): number {
  let bonus = 0;
  for (const i of ck.ingredients) {
    if (i.optional || !heldIds.has(i.ingredientId)) continue;
    const rem = remainingById.get(i.ingredientId);
    if (rem != null && rem <= 40) bonus += (40 - rem);
  }
  return Math.min(100, bonus);
}

const MODE_DESIRED: Partial<Record<RecommendMode, FlavorAxis[]>> = {
  sweet: ['sweet', 'vanilla', 'caramel', 'chocolate'],
  refreshing: ['citrus', 'fruit', 'floral', 'herbal'],
};

function modeFlavorBonus(mode: RecommendMode, flavor: FlavorVector): number {
  const axes = MODE_DESIRED[mode];
  if (!axes) return 0;
  const v = axes.reduce((s, a) => s + flavor[a], 0) / axes.length; // 0~10
  return v * 10; // 0~100
}

function reasonFor(
  ck: Cocktail, taste: FlavorVector, avail: AvailabilityResult, cov: number,
): string {
  const shared = topAxes(ck.flavor, 5).filter((a) => taste[a] >= 6).slice(0, 2);
  const parts: string[] = [];
  if (shared.length) parts.push(`${shared.map((a) => FLAVOR_LABELS_KO[a]).join('·')} 선호와 잘 맞음`);
  else {
    const t = topAxes(ck.flavor, 2);
    if (t.length) parts.push(`${t.map((a) => FLAVOR_LABELS_KO[a]).join('·')} 중심 프로파일`);
  }
  if (avail.status === 'READY') parts.push('현재 재료로 바로 제조 가능');
  else if (avail.status === 'SUBSTITUTE') parts.push('대체재로 제조 가능');
  else if (avail.status === 'MISSING') parts.push(`재고 ${cov}% (${avail.lack.slice(0, 2).join(', ')} 부족)`);
  else parts.push(`핵심 재료 부족(${avail.missingCore.slice(0, 2).join(', ')})`);
  return parts.join(' · ');
}

export function recommendCocktails(
  ctx: RecommendContext,
  mode: RecommendMode = 'available',
  limit = 20,
): RecommendationResult[] {
  const now = Date.now();
  const stats = drinkStats(ctx.logs);
  const out: RecommendationResult[] = [];

  for (const ck of referenceRepo.cocktails()) {
    if (mode === 'whisky' && ck.base !== '위스키') continue;
    const avail = evaluateCocktail(ck, ctx.heldIds, ctx.subMap);
    if ((mode === 'available' || mode === 'clearstock') && (avail.status === 'MISSING' || avail.status === 'UNAVAILABLE')) continue;

    const strength = cocktailStrength(ck);
    if (mode === 'strong' && strength < 0.5) continue;
    if (mode === 'light' && strength > 0.45) continue;

    const tasteScore = tasteMatch(ctx.taste, ck.flavor);
    const availabilityScore = AVAIL_SCORE[avail.status];
    const inventoryScore = inventoryCoverage(ck, ctx.heldIds, ctx.subMap);
    const nov = noveltyScore(ck.id, stats, now);

    // 모드별 가중치
    let wTaste = 0.4, wAvail = 0.35, wInv = 0.15, wNov = 0.1;
    let extra = 0;
    if (mode === 'sweet' || mode === 'refreshing') { wTaste = 0.3; extra = modeFlavorBonus(mode, ck.flavor) * 0.35; }
    if (mode === 'clearstock') { wInv = 0.1; extra = clearStockBonus(ck, ctx.heldIds, ctx.remainingById) * 0.4; }
    if (mode === 'strong' || mode === 'light') { extra = 15; }

    const base = tasteScore * wTaste + availabilityScore * wAvail + inventoryScore * wInv + nov * wNov;
    const score = Math.min(100, Math.round(base + extra));

    out.push({
      kind: 'cocktail', id: ck.id, name: ck.name, score,
      tasteScore, inventoryScore, availabilityScore, noveltyScore: nov,
      status: avail.status, reason: reasonFor(ck, ctx.taste, avail, inventoryScore),
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

function whiskyReason(w: Bottle, taste: FlavorVector): string {
  const shared = topAxes(w.flavor, 5).filter((a) => taste[a] >= 6).slice(0, 2);
  const style: string[] = [];
  if (w.flavor.peat >= 6) style.push('피트');
  if (w.flavor.smoke >= 6) style.push('스모키');
  if (w.flavor.fruit >= 6) style.push('셰리/과일');
  if (w.flavor.vanilla >= 5) style.push('버번풍 바닐라');
  const parts: string[] = [];
  if (shared.length) parts.push(`${shared.map((a) => FLAVOR_LABELS_KO[a]).join('·')} 선호와 부합`);
  if (style.length) parts.push(`${style.join('·')} 캐릭터`);
  parts.push(`도수 ${w.abv}`);
  return parts.join(' · ');
}

export function recommendWhiskies(
  ctx: RecommendContext,
  limit = 12,
): RecommendationResult[] {
  const now = Date.now();
  const stats = drinkStats(ctx.logs);
  const out: RecommendationResult[] = [];

  for (const w of referenceRepo.whiskies()) {
    const tasteScore = tasteMatch(ctx.taste, w.flavor);
    const nov = noveltyScore(w.id, stats, now);
    const inventoryScore = 100; // 보유 병
    const availabilityScore = 100;
    const score = Math.min(100, Math.round(tasteScore * 0.6 + nov * 0.25 + 15));
    out.push({
      kind: 'whisky', id: w.id, name: w.name, score,
      tasteScore, inventoryScore, availabilityScore, noveltyScore: nov,
      reason: whiskyReason(w, ctx.taste),
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** "오늘 뭐 마실까" — 칵테일+위스키 통합 상위 추천 */
export function whatToDrink(ctx: RecommendContext, mode: RecommendMode = 'available', limit = 8): RecommendationResult[] {
  const ck = recommendCocktails(ctx, mode, limit);
  if (mode === 'whisky') return recommendWhiskies(ctx, limit);
  const wk = recommendWhiskies(ctx, 4);
  return [...ck, ...wk].sort((a, b) => b.score - a.score).slice(0, limit);
}

export { cosineSimilarity };
