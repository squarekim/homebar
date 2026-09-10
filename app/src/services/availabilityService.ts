/**
 * availabilityService — 현재 재고 기준 칵테일 제조 가능 판정.
 * 기존 index.html 의 evaluate() 논리를 이식하고 4단계 상태로 확장.
 *   READY       정규: 필수 재료 전부 보유, 대체 없음
 *   SUBSTITUTE  근사: 대체재로 충당 가능
 *   MISSING     일부 재료(비핵심) 부족
 *   UNAVAILABLE 핵심(기주 등) 부족
 * 대체재 판단은 substitution DB(map)를 재사용한다.
 */
import { type Cocktail, type AvailabilityResult, type AvailabilityStatus } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';

const SPIRIT_CATEGORIES = new Set(['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디']);

export function evaluateCocktail(
  ck: Cocktail,
  heldIds: Set<string>,
  subMap: Map<string, string[]> = new Map(),
): AvailabilityResult {
  const lack: string[] = [];
  const sub: string[] = [];
  const missingCore: string[] = [];

  for (const ing of ck.ingredients) {
    if (ing.optional) continue;
    const have = heldIds.has(ing.ingredientId);
    if (have) {
      if (ing.substitute) sub.push(ing.ingredientName);
      continue;
    }
    // 보유하지 않음 → 대체재 보유 여부 확인
    const subs = subMap.get(ing.ingredientId) ?? [];
    const coveredBySub = subs.some((sid) => heldIds.has(sid));
    if (coveredBySub) {
      sub.push(ing.ingredientName);
      continue;
    }
    lack.push(ing.ingredientName);
    const cat = referenceRepo.ingredientById(ing.ingredientId)?.category ?? '';
    if (SPIRIT_CATEGORIES.has(cat) || ing.ingredientName === ck.base) missingCore.push(ing.ingredientName);
  }

  let status: AvailabilityStatus;
  if (lack.length === 0) status = sub.length === 0 ? 'READY' : 'SUBSTITUTE';
  else status = missingCore.length > 0 ? 'UNAVAILABLE' : 'MISSING';

  return { status, lack, sub, missingCore };
}

const STATUS_RANK: Record<AvailabilityStatus, number> = { READY: 3, SUBSTITUTE: 2, MISSING: 1, UNAVAILABLE: 0 };
export function statusRank(s: AvailabilityStatus): number { return STATUS_RANK[s]; }

export const STATUS_LABEL_KO: Record<AvailabilityStatus, string> = {
  READY: '정규', SUBSTITUTE: '근사', MISSING: '일부부족', UNAVAILABLE: '불가',
};

/** 전체 레시피 판정. 통계/정렬용 */
export function evaluateAll(
  heldIds: Set<string>,
  subMap: Map<string, string[]> = new Map(),
): Map<string, AvailabilityResult> {
  const m = new Map<string, AvailabilityResult>();
  for (const ck of referenceRepo.cocktails()) m.set(ck.id, evaluateCocktail(ck, heldIds, subMap));
  return m;
}

export function tallyStatus(results: Map<string, AvailabilityResult>): Record<AvailabilityStatus, number> {
  const t: Record<AvailabilityStatus, number> = { READY: 0, SUBSTITUTE: 0, MISSING: 0, UNAVAILABLE: 0 };
  for (const r of results.values()) t[r.status]++;
  return t;
}
