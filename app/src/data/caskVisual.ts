/**
 * caskVisual — 위스키를 오크통으로 그릴 때 쓰는 값을 병 데이터에서 파생한다.
 *
 * 병 그림(bottleVisual)과 같은 규칙이다. 사진·무작위 없이 이미 있는 데이터로만 그린다.
 *   판자 색 = 캐스크 종류. 캐스크가 여럿이면 판자를 그 수만큼 나눠 칠한다(최대 4)
 *   연기    = 피티드. 피트 여부를 모르면 그리지 않는다
 *   앞면    = 라벨 표시 연수, 캐스크 스트렝스면 'CS'
 * 공개 빌드에서는 whiskyClass 가 비어 있다. 그때는 오크색 통 하나에, 제품명에 적힌 연수만 남는다.
 * 사실이 아니라 표현이므로 판정에는 쓰지 않는다.
 */
import { type Bottle } from '../models/types';
import { bottleKind } from './bottleIngredients';
import { ageFromName, specOf } from './whiskySpec';

/** 통으로 그리는 술. 위스키만 통에서 숙성된 술로 다룬다 */
export const drawsAsCask = (b: Bottle): boolean => bottleKind(b) === 'whisky';

/** 캐스크 → 판자 색. 앞쪽 규칙이 먼저 맞는다 */
const CASK_WOOD: Array<[RegExp, string]> = [
  [/PX/, '#4A2418'],          // 흑갈색
  [/올로로소|셰리/, '#8A3B22'], // 적갈색
  [/와인/, '#6E2A40'],          // 자주
  [/미즈나라/, '#D8B98A'],      // 연한 나무색
  [/뉴 차드 오크/, '#93542A'],  // 새 통 내부 태움: 짙은 호박
  [/버진오크/, '#A0602C'],
  [/프렌치오크/, '#A86C3C'],
  [/럼/, '#7A4A2A'],
  [/버번/, '#C9924F'],          // 밝은 호박
];
/** 캐스크를 모를 때의 오크색 */
export const PLAIN_OAK = '#B98450';

export interface CaskVisual {
  /** 판자 칸 색. 왼쪽부터, 1~4칸 */
  woods: string[];
  smoke: boolean;
  /** 앞면 숫자. null 이면 쓰지 않는다 */
  age: number | null;
  caskStrength: boolean;
}

export function caskVisualOf(b: Bottle): CaskVisual {
  const c = b.whiskyClass;
  if (!c) return { woods: [PLAIN_OAK], smoke: false, age: ageFromName(b.name), caskStrength: false };
  const s = specOf(c, b.name);
  const woods = c.cask.slice(0, 4).map((k) => CASK_WOOD.find(([re]) => re.test(k))?.[1] ?? PLAIN_OAK);
  return {
    woods: woods.length ? woods : [PLAIN_OAK],
    smoke: s.peat === '피티드',
    age: s.age,
    caskStrength: s.strength === '캐스크 스트렝스',
  };
}
