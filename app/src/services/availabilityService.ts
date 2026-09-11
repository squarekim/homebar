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

/** 가용성 상태 → 추천 점수(0~100). 추천·그룹 엔진이 같은 값을 쓴다. */
export const AVAIL_SCORE: Record<AvailabilityStatus, number> = {
  READY: 100, SUBSTITUTE: 78, MISSING: 40, UNAVAILABLE: 5,
};

export const STATUS_LABEL_KO: Record<AvailabilityStatus, string> = {
  READY: '정규', SUBSTITUTE: '근사', MISSING: '일부부족', UNAVAILABLE: '불가',
};

/**
 * 같은 판정을 사람 말로. '정규·근사'는 데이터를 만드는 쪽의 용어라
 * 처음 보는 사람에게는 결과를 설명하지 못한다 (통계·필터 칩에는 짧은 쪽을 계속 쓴다).
 * 목록에서는 줄끼리 비교해야 하므로 네 상태를 모두 적는다.
 */
export const STATUS_SENTENCE_KO: Record<AvailabilityStatus, string> = {
  READY: '그대로 만들 수 있어요',
  SUBSTITUTE: '대체 재료로 가능',
  MISSING: '재료 부족',
  UNAVAILABLE: '재료 부족',
};

/**
 * 대표 추천 한 잔은 비교 대상이 없어 자기 조건을 그대로 말한다.
 * (목록의 '그대로 만들 수 있어요'와 같은 판정, 다른 문장)
 */
export const STATUS_LEAD_KO: Record<AvailabilityStatus, string> = {
  READY: '재료가 모두 있어요',
  SUBSTITUTE: '대체 재료로 만들 수 있어요',
  MISSING: '재료가 부족해요',
  UNAVAILABLE: '재료가 부족해요',
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
