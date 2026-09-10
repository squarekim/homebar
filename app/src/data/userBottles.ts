/**
 * userBottles.ts — 사용자가 추가한 병(UserBottle)을 도메인 Bottle 로 변환.
 * 시드 병과 동일한 형태가 되어 컬렉션·분류 배지·축별 커버리지·매트릭스·시뮬레이터에 그대로 참여한다.
 * 마스터 DB에서 고른 제품은 분류·도수·원산지·표준 재료가 이미 채워져 들어온다.
 */
import { type Bottle, type LiquorCategory, type LiquorMasterItem, type UserBottle } from '../models/types';
import { flavorForBottle } from './flavorLexicon';
import { CATEGORY_GROUP, CATEGORY_DEFAULT_INGREDIENT, categoryFromGroup } from './liquorCategory';

const SPIRIT_GROUPS = ['위스키', '진', '보드카', '럼·데킬라·브랜디'];

function parseAbv(abv?: string): number | null {
  if (!abv) return null;
  const m = abv.match(/([\d]+(?:\.\d+)?)/);
  return m?.[1] ? parseFloat(m[1]) : null;
}

export function userBottleToDomain(ub: UserBottle): Bottle {
  const isWhisky = ub.category ? ub.category === 'whisky' : ub.group === '위스키';
  const abv = ub.abv ?? '';
  const noteParts = [ub.subcategory, ub.volumeMl ? `${ub.volumeMl}ml` : '', ub.note ?? ''].filter(Boolean);
  return {
    id: ub.id,
    group: ub.group,
    name: ub.name,
    node: ub.masterId ? `master.${ub.category ?? 'spirit'}` : 'user.added',
    abv,
    abvNum: parseAbv(abv),
    qty: ub.qty,
    use: ub.use,
    note: noteParts.join(' · ') || undefined,
    isSpirit: SPIRIT_GROUPS.includes(ub.group),
    isWhisky,
    ingredientIds: ub.ingredientId ? [ub.ingredientId] : [],
    flavor: flavorForBottle(ub.name, ub.group, ub.subcategory ?? 'user.added', isWhisky),
    whiskyClass: isWhisky ? ub.whiskyClass : undefined,
  };
}

/** 사용자 추가 병인지 (삭제 버튼 노출 등) */
export function isUserBottle(id: string): boolean {
  return id.startsWith('ub_');
}

/** 마스터 제품 → 저장할 UserBottle 초안. 사용자는 수량·용도·메모만 손대면 된다. */
export function draftFromMaster(item: LiquorMasterItem, over: Partial<UserBottle> = {}): Omit<UserBottle, 'id' | 'createdAt'> {
  return {
    name: item.nameKo,
    nameEn: item.nameEn,
    brand: item.brand,
    group: CATEGORY_GROUP[item.category],
    category: item.category,
    subcategory: item.subcategory,
    abv: item.abv ? `${item.abv}%` : undefined,
    volumeMl: item.volumeMl,
    country: item.country,
    qty: 1,
    use: item.category === 'whisky' ? '시음-축' : '조주',
    whiskyClass: item.whiskyClass,
    ingredientName: item.ingredientName ?? CATEGORY_DEFAULT_INGREDIENT[item.category],
    masterId: item.id,
    source: 'master',
    ...over,
  };
}

/** 마스터에 없는 술을 직접 추가할 때의 초안 (카테고리만 주면 나머지는 최소값) */
export function draftManual(name: string, category: LiquorCategory, over: Partial<UserBottle> = {}): Omit<UserBottle, 'id' | 'createdAt'> {
  return {
    name,
    group: CATEGORY_GROUP[category],
    category,
    qty: 1,
    use: category === 'whisky' ? '시음-축' : '조주',
    ingredientName: CATEGORY_DEFAULT_INGREDIENT[category],
    source: 'user',
    ...over,
  };
}

/** 레거시 group 만 있는 데이터를 카테고리로 올려 읽는다 */
export function categoryOf(ub: UserBottle): LiquorCategory {
  return ub.category ?? categoryFromGroup(ub.group);
}
