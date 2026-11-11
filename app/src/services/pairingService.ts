/**
 * pairingService — 한 병으로 만들 수 있는 칵테일을 고른다.
 * 사람이 고른 추천이 아니다. 그 병이 재료로 들어가는 레시피를 데이터 순서로 줄 세운다:
 *   지금 만들 수 있는 잔 → 현행 IBA 공식 칵테일 → 재료가 적은 잔 → 가나다.
 */
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail } from './availabilityService';
import { type AvailabilityStatus, type Bottle, type Cocktail } from '../models/types';

export interface Pairing { cocktail: Cocktail; status: AvailabilityStatus; }

const canMake = (s: AvailabilityStatus) => s === 'READY' || s === 'SUBSTITUTE';

export function cocktailsForBottle(
  bottle: Pick<Bottle, 'ingredientIds'>, heldIds: Set<string>, subMap: Map<string, string[]>, n = 2,
): Pairing[] {
  const mine = new Set(bottle.ingredientIds);
  if (mine.size === 0) return [];
  return referenceRepo.cocktails()
    .filter((c) => c.ingredients.some((i) => !i.optional && mine.has(i.ingredientId)))
    .map((c) => ({ cocktail: c, status: evaluateCocktail(c, heldIds, subMap).status }))
    .sort((a, b) =>
      Number(canMake(b.status)) - Number(canMake(a.status))
      || Number(b.cocktail.iba === '현행IBA') - Number(a.cocktail.iba === '현행IBA')
      || a.cocktail.ingredients.length - b.cocktail.ingredients.length
      || a.cocktail.name.localeCompare(b.cocktail.name, 'ko'))
    .slice(0, n);
}
