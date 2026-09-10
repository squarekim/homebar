/**
 * groupService — 여러 사람의 TasteProfile 을 합친 그룹 추천.
 * 평균만 쓰지 않고, 한 명이라도 매우 싫어하는 향미가 강한 술에는 패널티를 준다.
 */
import { type FlavorVector, type RecommendationResult, FLAVOR_LABELS_KO, type StockContext } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail, AVAIL_SCORE } from './availabilityService';
import { groupTasteMatch, topAxes } from './flavorService';

export interface GroupContext extends StockContext {
  profiles: { name: string; vector: FlavorVector }[];
}

function groupReason(flavor: FlavorVector, penalty: number): string {
  const parts: string[] = [];
  const t = topAxes(flavor, 2);
  if (t.length) parts.push(`${t.map((a) => FLAVOR_LABELS_KO[a]).join('·')} 프로파일`);
  if (penalty > 0) {
    // 어떤 축에서 누가 기피하는지 요약
    parts.push(`일부 취향 상충으로 감점 -${penalty}`);
  } else {
    parts.push('전원 무난');
  }
  return parts.join(' · ');
}

export function recommendGroupCocktails(ctx: GroupContext, onlyAvailable = false, limit = 20): RecommendationResult[] {
  const vectors = ctx.profiles.map((p) => p.vector);
  const out: RecommendationResult[] = [];

  for (const ck of referenceRepo.cocktails()) {
    const avail = evaluateCocktail(ck, ctx.heldIds, ctx.subMap);
    if (onlyAvailable && (avail.status === 'MISSING' || avail.status === 'UNAVAILABLE')) continue;

    const { score: groupScore, penalty } = groupTasteMatch(vectors, ck.flavor);
    const availabilityScore = AVAIL_SCORE[avail.status];
    const score = Math.min(100, Math.round(groupScore * 0.6 + availabilityScore * 0.4));

    out.push({
      kind: 'cocktail', id: ck.id, name: ck.name, score,
      tasteScore: groupScore, inventoryScore: 0, availabilityScore, noveltyScore: 0,
      status: avail.status, reason: groupReason(ck.flavor, penalty),
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function recommendGroupWhiskies(ctx: GroupContext, limit = 12): RecommendationResult[] {
  const vectors = ctx.profiles.map((p) => p.vector);
  const out: RecommendationResult[] = [];
  for (const w of referenceRepo.whiskies()) {
    const { score: groupScore, penalty } = groupTasteMatch(vectors, w.flavor);
    out.push({
      kind: 'whisky', id: w.id, name: w.name, score: groupScore,
      tasteScore: groupScore, inventoryScore: 100, availabilityScore: 100, noveltyScore: 0,
      reason: groupReason(w.flavor, penalty),
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
