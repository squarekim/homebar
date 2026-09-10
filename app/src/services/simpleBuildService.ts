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
import { AvailabilityStatus, Bottle, Cocktail } from '../models/types';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail } from './availabilityService';

/** 믹서 조합표의 그룹 → 재료 마스터 카테고리 */
const GROUP_TO_CATEGORY: Record<string, string> = {
  위스키: '위스키', 진: '진', 보드카: '보드카', 럼: '럼',
  데킬라: '데킬라·아가베', 브랜디: '브랜디', 리큐르: '리큐르',
};

/**
 * 조합표에 남길 믹서 — 집에 상시로 두는 네 가지로만 간다.
 * (진저에일·우유·자몽/크랜베리/사과/파인애플 주스 조합은 레시피 쪽에 이미 있거나 상비품이 아니다)
 */
const MIXER_TO_INGREDIENT: Record<string, string> = {
  클럽소다: '탄산수',      // 플레인 탄산수
  토닉워터: '토닉워터',
  콜라: '콜라',
  '오렌지 주스': '오렌지 주스',
};

export interface SimpleBuild {
  id: string;
  name: string;
  kind: 'pairing' | 'recipe';
  group: string;            // 기주 그룹 (위스키/진/…)
  parts: string[];          // 표기용 구성
  ratio?: string;           // 1:3 등
  glass?: string;
  baseHint?: string;        // 조합표 원문의 기주 표기 — 보유 술을 고를 때 힌트로만 쓴다
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
    .filter((m) => !recipeNames.has(m.name) && MIXER_TO_INGREDIENT[m.mixer])
    .map((m) => {
      const ing = referenceRepo.ingredients().find((i) => i.name === MIXER_TO_INGREDIENT[m.mixer]);
      return {
        id: m.id,
        name: m.name,
        kind: 'pairing' as const,
        group: m.group,
        parts: [m.group, m.mixer],
        ratio: m.ratio,
        glass: m.glass,
        baseHint: m.base,
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


/* ── 내 술로 무엇을 쓸까 ── */

/** 병을 대분류 키로 환원 (시드 병은 node 접두, 사용자 추가 병은 master.<category>) */
function bottleKind(b: Bottle): string {
  if (b.node.startsWith('master.')) return b.node.slice('master.'.length);
  if (b.group === '위스키') return 'whisky';
  if (b.group === '진') return 'gin';
  if (b.group === '보드카') return 'vodka';
  if (b.group === '리큐르') return 'liqueur';
  if (b.node.startsWith('r.')) return 'rum';
  if (b.node.startsWith('t.')) return 'tequila';
  if (b.node.startsWith('b.')) return 'brandy';
  return 'other';
}

const GROUP_TO_KIND: Record<string, string[]> = {
  위스키: ['whisky'], 진: ['gin'], 보드카: ['vodka'], 럼: ['rum'],
  데킬라: ['tequila', 'mezcal'], 브랜디: ['brandy'], 리큐르: ['liqueur'],
};

const norm = (s: string) => s.toLowerCase().replace(/[\s·]/g, '');

/**
 * 이 조합에 쓸 만한 **내가 가진 술**을 고른다.
 * 1) 조합표가 가리키는 제품과 이름이 겹치는 병 (잭콕 → 잭 다니엘스)
 * 2) 없으면 같은 대분류의 보유 병 (잭이 없으면 내 다른 위스키)
 */
export function pickMyBottles(b: SimpleBuild, bottles: Bottle[], limit = 3): Bottle[] {
  const kinds = GROUP_TO_KIND[b.group] ?? [];
  const sameKind = bottles.filter((x) => kinds.includes(bottleKind(x)));
  const tokens = (b.baseHint ?? '').split(/[/·,]/).map((t) => norm(t)).filter((t) => t.length >= 2);
  const named = sameKind.filter((x) => tokens.some((t) => norm(x.name).includes(t) || t.includes(norm(x.name))));
  return (named.length ? named : sameKind).slice(0, limit);
}
