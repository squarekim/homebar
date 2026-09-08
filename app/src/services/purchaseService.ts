/**
 * purchaseService — 특정 재료 구매 시 추가 제조 가능 레시피 수를 계산해 순위화.
 * 고려: 추가 레시피 수 · 사용자 취향 · 활용도 · 중복 보유 · 현재 재고.
 * 기존 index.html 의 구매 엔진을 이식하고 취향/우선순위 시드를 결합한다.
 *
 * 최적화: 기준 상태를 1회 계산하고, 재료를 추가했을 때 상태가 바뀔 수 있는
 * "영향 레시피"(그 재료를 직접 쓰거나, 대체 대상이 그 재료인 레시피)만 재평가한다.
 */
import { FlavorVector, PurchaseSuggestion, DrinkLog, Cocktail } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail, statusRank } from './availabilityService';
import { tasteMatch } from './flavorService';

export interface PurchaseContext {
  taste: FlavorVector;
  heldIds: Set<string>;
  subMap: Map<string, string[]>;
  logs: DrinkLog[];
}

const MAKEABLE_MIN = 2; // SUBSTITUTE=2, READY=3

export function calculatePurchases(ctx: PurchaseContext, limit = 30): PurchaseSuggestion[] {
  const cocktails = referenceRepo.cocktails();

  // 기준 상태
  const baseMakeable = new Map<string, boolean>();
  let before = 0;
  for (const ck of cocktails) {
    const ok = statusRank(evaluateCocktail(ck, ctx.heldIds, ctx.subMap).status) >= MAKEABLE_MIN;
    baseMakeable.set(ck.id, ok);
    if (ok) before++;
  }

  // 재료 → 영향 레시피 인덱스
  const affected = new Map<string, Cocktail[]>();
  const push = (ingId: string, ck: Cocktail) => {
    const arr = affected.get(ingId) ?? []; arr.push(ck); affected.set(ingId, arr);
  };
  // 역방향 대체: substituteId → 그것이 커버할 수 있는 원재료 id 들
  const coversBySubstitute = new Map<string, Set<string>>();
  for (const [ingId, subs] of ctx.subMap) {
    for (const sid of subs) {
      const s = coversBySubstitute.get(sid) ?? new Set<string>(); s.add(ingId); coversBySubstitute.set(sid, s);
    }
  }
  for (const ck of cocktails) {
    const seen = new Set<string>();
    for (const i of ck.ingredients) {
      if (!seen.has(i.ingredientId)) { push(i.ingredientId, ck); seen.add(i.ingredientId); }
      // 이 재료를 대체할 수 있는 재료들도 이 레시피에 영향
      // (candidate 가 대체재로 들어와 needed 재료를 커버하는 경우)
    }
    // candidate 가 대체재로 needed 를 커버하는 경우: needed 의 sub 목록에 candidate 가 있으면 영향
    for (const i of ck.ingredients) {
      const subs = ctx.subMap.get(i.ingredientId) ?? [];
      for (const sid of subs) if (!seen.has(sid)) { push(sid, ck); seen.add(sid); }
    }
  }

  const seedBoost = new Set(referenceRepo.purchaseSeeds().map((s) => s.name));
  const suggestions: PurchaseSuggestion[] = [];

  for (const ing of referenceRepo.ingredients()) {
    if (ctx.heldIds.has(ing.id)) continue; // 중복 보유 제외

    const affectedCks = affected.get(ing.id) ?? [];
    if (affectedCks.length === 0) continue;

    const newHeld = new Set(ctx.heldIds); newHeld.add(ing.id);

    let added = 0;
    let blocked = 0;
    const unlocked: string[] = [];
    let tasteAcc = 0, tasteN = 0;

    for (const ck of affectedCks) {
      const was = baseMakeable.get(ck.id)!;
      const now = statusRank(evaluateCocktail(ck, newHeld, ctx.subMap).status) >= MAKEABLE_MIN;
      if (!was && now) {
        added++;
        unlocked.push(ck.name);
        tasteAcc += tasteMatch(ctx.taste, ck.flavor); tasteN++;
      }
      if (ck.ingredients.some((i) => i.ingredientId === ing.id && !i.optional)) blocked++;
    }

    if (blocked === 0 && added === 0) continue;

    const after = before + added;
    const tasteScore = tasteN > 0
      ? Math.round(tasteAcc / tasteN)
      : tasteMatch(ctx.taste, referenceRepo.ingredientFlavor(ing.name, ing.category));
    const utilization = ing.usageCount;

    let total = added * 8 + tasteScore * 0.25 + Math.min(utilization, 30) * 1.2 + blocked * 0.6;
    if (seedBoost.has(ing.name)) total += 25;

    suggestions.push({
      ingredientId: ing.id,
      name: ing.name,
      category: ing.category,
      addedRecipes: added,
      beforeCount: before,
      afterCount: after,
      blockedCount: blocked,
      unlockedRecipeNames: unlocked,
      tasteScore,
      totalScore: Math.round(total),
      reason: buildReason(added, blocked, tasteScore, utilization, seedBoost.has(ing.name), unlocked),
    });
  }

  return suggestions
    .sort((a, b) => b.addedRecipes - a.addedRecipes || b.totalScore - a.totalScore || b.blockedCount - a.blockedCount)
    .slice(0, limit);
}

function buildReason(added: number, blocked: number, tasteScore: number, util: number, seed: boolean, unlocked: string[]): string {
  const parts: string[] = [];
  parts.push(added > 0 ? `구매 시 +${added}종 제조 가능` : `막힘 ${blocked}건 해소 후보`);
  if (tasteScore >= 70) parts.push('취향 적합도 높음');
  if (util >= 8) parts.push(`활용도 ${util}회`);
  if (seed) parts.push('기존 구매우선순위 상위');
  if (unlocked.length) parts.push(unlocked.slice(0, 3).join(', '));
  return parts.join(' · ');
}
