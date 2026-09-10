/**
 * simpleBuildService — "간단 조합" 모음.
 * 셰이커 없이 잔에 바로 붓는 술(하이볼·리키·사워류 빌드)을 한곳에 모은다.
 *  A. 믹서 조합표 35종  — 기주 1종 + 믹서 1종의 비율 가이드
 *  B. Build 계열 레시피 — 필수 재료 3개 이하
 * 이름이 겹치면 분량이 명시된 레시피 쪽을 남긴다.
 *
 * 판정은 다른 화면과 동일하게 재고(ingredientId)로만 한다.
 * 믹서 조합표의 기주는 특정 제품명("산토리 가쿠빈")이라 제품이 아니라 **기주 카테고리 보유 여부**로 본다.
 */
import { AvailabilityStatus, Cocktail } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail } from './availabilityService';

/** 믹서 조합표의 그룹 → 재료 마스터 카테고리 */
const GROUP_TO_CATEGORY: Record<string, string> = {
  위스키: '위스키', 진: '진', 보드카: '보드카', 럼: '럼',
  데킬라: '데킬라·아가베', 브랜디: '브랜디', 리큐르: '리큐르',
};

/** 조합표 믹서 표기 → 재료 마스터 이름 */
const MIXER_TO_INGREDIENT: Record<string, string> = {
  클럽소다: '탄산수', 진저에일: '진저에일', 콜라: '콜라', 토닉워터: '토닉워터', 우유: '우유',
  '자몽 주스': '자몽 주스', '오렌지 주스': '오렌지 주스', '크랜베리 주스': '크랜베리 주스',
  '사과 주스': '사과 주스', '파인애플 주스': '파인애플 주스',
};

export interface SimpleBuild {
  id: string;
  name: string;
  kind: 'pairing' | 'recipe';
  group: string;            // 기주 그룹 (위스키/진/…)
  parts: string[];          // 표기용 구성
  ratio?: string;           // 1:3 등
  glass?: string;
  recommended?: string;     // 조합표가 권장하는 제품
  recipeId?: string;        // 레시피면 상세 모달 연결
  note?: string;
  /** 판정용 */
  baseCategory?: string;    // 이 카테고리 재료를 하나라도 보유하면 기주 충족
  mixerIngredientId?: string;
  cocktail?: Cocktail;
}

let cache: SimpleBuild[] | null = null;

export function simpleBuilds(): SimpleBuild[] {
  if (cache) return cache;
  const recipes = referenceRepo.cocktails().filter(
    (c) => c.methodKeys[0] === 'build' && c.ingredients.filter((i) => !i.optional).length <= 3,
  );
  const recipeNames = new Set(recipes.map((c) => c.name));

  const fromRecipes: SimpleBuild[] = recipes.map((c) => ({
    id: c.id,
    name: c.name,
    kind: 'recipe',
    group: c.base,
    parts: c.ingredients.filter((i) => !i.optional).map((i) => i.raw),
    recipeId: c.id,
    note: c.note,
    cocktail: c,
  }));

  const fromPairings: SimpleBuild[] = referenceRepo.mixerPairings()
    .filter((m) => !recipeNames.has(m.name))
    .map((m) => {
      const ingName = MIXER_TO_INGREDIENT[m.mixer] ?? m.mixer;
      const ing = referenceRepo.ingredients().find((i) => i.name === ingName);
      return {
        id: m.id,
        name: m.name,
        kind: 'pairing' as const,
        group: m.group,
        parts: [m.group, m.mixer],
        ratio: m.ratio,
        glass: m.glass,
        recommended: m.base,
        note: m.note,
        baseCategory: GROUP_TO_CATEGORY[m.group],
        mixerIngredientId: ing?.id,
      };
    });

  cache = [...fromRecipes, ...fromPairings].sort((a, b) => a.group.localeCompare(b.group, 'ko') || a.name.localeCompare(b.name, 'ko'));
  return cache;
}

/** 간단 조합 판정 — 레시피는 기존 판정을, 조합표는 기주 카테고리 + 믹서 보유로 본다 */
export function evaluateSimpleBuild(
  b: SimpleBuild,
  heldIds: Set<string>,
  subMap: Map<string, string[]> = new Map(),
): { status: AvailabilityStatus; lack: string[] } {
  if (b.cocktail) {
    const e = evaluateCocktail(b.cocktail, heldIds, subMap);
    return { status: e.status, lack: e.lack };
  }
  const lack: string[] = [];
  const hasBase = referenceRepo.ingredients().some((i) => i.category === b.baseCategory && heldIds.has(i.id));
  if (!hasBase) lack.push(b.group);
  const hasMixer = !!b.mixerIngredientId && heldIds.has(b.mixerIngredientId);
  if (!hasMixer) lack.push(b.parts[1]);
  const status: AvailabilityStatus = lack.length === 0 ? 'READY' : !hasBase ? 'UNAVAILABLE' : 'MISSING';
  return { status, lack };
}
