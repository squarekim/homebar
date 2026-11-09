/**
 * caskVisual — 위스키를 오크통으로 그릴 때 쓰는 값을 병 데이터에서 파생한다.
 *
 * 병 그림(bottleVisual)과 같은 규칙이다. 사진·무작위 없이 이미 있는 데이터로만 그린다.
 *   나무색 = 캐스크 종류. 몸통은 첫 캐스크, 마구리 판자는 캐스크 수만큼 나눠 칠한다(최대 4)
 *   연기    = 피티드. 피트 여부를 모르면 그리지 않는다
 *   마구리  = 라벨 표시 연수, 캐스크 스트렝스면 'CS'
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
  /** 나무색. 첫째가 몸통, 전부가 마구리 판자(왼쪽부터 1~4칸) */
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

/**
 * 통 앞에 놓을 맛 물건 — 제조사·공식 테이스팅 노트에 적힌 단어로만 고른다(추정한 맛 수치는 쓰지 않는다).
 * 노트가 없으면 아무것도 놓지 않는다. 노트에 먼저 나온 맛부터 최대 3개.
 * 오크·셰리는 통 자체(나무색)가 이미 보여 주므로 물건으로 만들지 않는다.
 */
export type FlavorKey = 'vanilla' | 'honey' | 'apple' | 'dried' | 'citrus' | 'chocolate' | 'nut' | 'flower'
  | 'spice' | 'sea' | 'caramel' | 'tropical' | 'berry' | 'coffee' | 'grain' | 'herb' | 'peat';
const FLAVOR_WORDS: Array<[RegExp, FlavorKey]> = [
  [/바닐라|vanilla/i, 'vanilla'], [/꿀|honey/i, 'honey'], [/사과|서양배|(^|[^가-힣])배([^가-힣]|$)|apple|pear/i, 'apple'],
  [/건포도|말린 과일|건과일|무화과|대추|raisin|fig|date/i, 'dried'], [/시트러스|오렌지|레몬|자몽|귤|citrus|orange|lemon|grapefruit/i, 'citrus'],
  [/초콜릿|코코아|카카오|chocolate|cocoa/i, 'chocolate'], [/견과|아몬드|호두|헤이즐넛|nut|almond|walnut|hazelnut/i, 'nut'],
  [/꽃|플로럴|헤더|floral|heather/i, 'flower'], [/스파이스|후추|계피|시나몬|정향|생강|육두구|spice|pepper|cinnamon|clove|ginger/i, 'spice'],
  [/바다|소금|짠|해초|요오드|brine|salt|sea|iodine/i, 'sea'], [/토피|캐러멜|카라멜|버터스카치|toffee|caramel|butterscotch/i, 'caramel'],
  [/복숭아|살구|열대|파인애플|바나나|망고|peach|apricot|tropical|pineapple|banana|mango/i, 'tropical'],
  [/베리|체리|딸기|블랙커런트|berry|cherry|strawberr/i, 'berry'], [/커피|에스프레소|coffee/i, 'coffee'],
  [/곡물|몰트|맥아|비스킷|빵|시리얼|grain|malt|biscuit|cereal/i, 'grain'], [/허브|풀|민트|herb|grass|mint/i, 'herb'],
  [/피트|스모크|훈연|연기|이탄|peat|smoke/i, 'peat'],
];

export function flavorsOf(b: Bottle): FlavorKey[] {
  const n = b.makerNote;
  if (!n) return [];
  const text = [n.nose, n.palate, n.finish, n.text].filter(Boolean).join(' ');
  return FLAVOR_WORDS
    .map(([re, key]) => ({ key, at: text.search(re) }))
    .filter((x) => x.at >= 0)
    .sort((a, b2) => a.at - b2.at)
    .slice(0, 3)
    .map((x) => x.key);
}
