/**
 * userBottles.ts — 사용자가 추가한 병(UserBottle)을 도메인 Bottle 로 변환.
 * 시드 병과 동일한 형태가 되어 컬렉션·분류 배지·축별 커버리지·매트릭스·시뮬레이터에 그대로 참여한다.
 */
import { Bottle, UserBottle } from '../models/types';
import { flavorForBottle } from './flavorLexicon';

const SPIRIT_GROUPS = ['위스키', '진', '보드카', '럼·데킬라·브랜디'];

function parseAbv(abv?: string): number | null {
  if (!abv) return null;
  const m = abv.match(/([\d]+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

export function userBottleToDomain(ub: UserBottle): Bottle {
  const isWhisky = ub.group === '위스키';
  const abv = ub.abv ?? '';
  return {
    id: ub.id,
    group: ub.group,
    name: ub.name,
    node: 'user.added',
    abv,
    abvNum: parseAbv(abv),
    qty: ub.qty,
    use: ub.use,
    note: ub.note,
    isSpirit: SPIRIT_GROUPS.includes(ub.group),
    isWhisky,
    flavor: flavorForBottle(ub.name, ub.group, 'user.added', isWhisky),
    whiskyClass: isWhisky ? ub.whiskyClass : undefined,
  };
}

/** 사용자 추가 병인지 (삭제 버튼 노출 등) */
export function isUserBottle(id: string): boolean {
  return id.startsWith('ub_');
}
