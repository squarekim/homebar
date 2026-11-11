/**
 * cocktailStrength — 칵테일 도수(재료 기준 추정).
 *
 * 계산: 재료마다 (양 ml × 그 재료의 도수)를 더해 전체 양으로 나눈다. 얼음이 녹아 늘어나는 물은 넣지 않는다.
 * 제품마다 도수가 다르고 얼음이 녹는 정도도 달라, 화면에는 계산값 ±2%의 폭으로 적는다(cocktailAbvLabel).
 *
 * 재료 도수: 술 추가 목록(liquorMaster)에서 그 재료로 이어진 제품들의 라벨 도수 가운데 값.
 * 주스·탄산·시럽·허브·부재료 분류의 재료는 0%로 본다.
 *
 * 보여 주지 않는 경우(추정하지 않는다):
 *  - 'Top', 'Full'처럼 양이 정해지지 않은 재료가 있을 때
 *  - 라벨 도수를 아는 제품이 없는 술 재료가 있을 때
 * dash·방울·바스푼·tsp 는 양이 매우 적어 1ml로 본다. 각설탕·민트 잎처럼 알코올 없이 붓지 않는 재료는 0ml로 본다.
 */
import { type Cocktail } from '../models/types';
import { ingredients } from '../data/adapters';
import { LIQUOR_MASTER } from '../data/liquorMaster';

const NON_ALCOHOLIC = new Set(['주스·과즙', '탄산·음료', '시럽·감미', '신선·허브', '부재료']);
const categoryOf = new Map(ingredients.map((i) => [i.name, i.category]));

const ABV: Map<string, number> = (() => {
  const by = new Map<string, number[]>();
  for (const m of LIQUOR_MASTER) {
    if (!m.ingredientName || !m.abv) continue;
    by.set(m.ingredientName, [...(by.get(m.ingredientName) ?? []), m.abv]);
  }
  const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]!; };
  return new Map([...by].map(([k, v]) => [k, median(v)]));
})();

const TINY = /dash|방울|바스푼|tsp|bsp/i;
const TOP = /top|full|fill|채우|가득|splash|적당량/i;

/** 재료 기준 도수(%, 반올림). 계산할 수 없으면 null */
export function cocktailAbv(ck: Cocktail): number | null {
  let vol = 0, alc = 0;
  for (const i of ck.ingredients) {
    if (i.optional) continue;
    const cat = categoryOf.get(i.ingredientName) ?? '';
    const ml = i.amountMl && i.amountMl > 0 ? i.amountMl
      : TINY.test(i.raw) ? 1
      // 각설탕·민트 잎처럼 알코올이 없고 양을 붓지 않는 재료는 부피에 넣지 않는다. 'Top'처럼 붓는 양이 정해지지 않은 것은 계산하지 않는다
      : NON_ALCOHOLIC.has(cat) && !TOP.test(i.raw) ? 0
      : null;
    if (ml === null) return null;
    const abv = NON_ALCOHOLIC.has(cat) ? 0 : ABV.get(i.ingredientName);
    if (abv === undefined) return null;
    vol += ml; alc += ml * abv;
  }
  return vol > 0 ? Math.round(alc / vol) : null;
}

/** 화면에 적는 폭 — 계산값 ±2%. 제품마다 도수가 다르고 얼음이 녹는 정도도 달라 한 숫자로 적지 않는다 */
export const ABV_SPREAD = 2;
export function cocktailAbvLabel(ck: Cocktail): string | null {
  const v = cocktailAbv(ck);
  if (v === null) return null;
  const lo = v - ABV_SPREAD, hi = v + ABV_SPREAD;
  return lo <= 0 ? `약 ${hi}% 이하` : `약 ${lo}~${hi}%`;
}

/** 재료 도수표(테스트·점검용) */
export const ingredientAbv = (name: string): number | undefined => ABV.get(name);
