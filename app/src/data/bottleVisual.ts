/**
 * bottleVisual — 병 모양 · 술 색을 보유 병 데이터에서 파생한다.
 *
 * 칵테일 그림과 같은 규칙이다. 사진 자산이 없고, 남의 제품 사진을 가져다 쓰지 않는다.
 * 이미 있는 데이터로 그린다:
 *   모양 = 원산지·타입 (버번은 어깨가 넓고 목이 짧다)
 *   색   = 주종 + 캐스크 (셰리·PX 는 붉게, 버진오크는 더 진한 호박으로)
 * 공개 배포 빌드에서는 whiskyClass 가 비어 있다 — 어떤 병을 갖고 있는지가 개인 정보라서다.
 * 그러니 분류 레코드가 없어도 주종만으로 성립해야 한다.
 * 사실이 아니라 표현이므로 판정에는 쓰지 않는다.
 */
import { type Bottle } from '../models/types';
import { bottleKind } from './bottleIngredients';

export type BottleShapeKind = 'bourbon' | 'scotch' | 'slim' | 'generic';

/** 병 모양 — 분류가 있으면 원산지에서, 없으면 주종에서 고른다 */
export function bottleShapeOf(b: Bottle): BottleShapeKind {
  const c = b.whiskyClass;
  if (c) {
    if (/버번|테네시/.test(c.origin) || /버번|테네시/.test(c.type)) return 'bourbon';
    if (/스카치|아이리시/.test(c.origin)) return 'scotch';
    if (/재패니즈|코리안/.test(c.origin)) return 'slim';
  }
  switch (bottleKind(b)) {
    case 'whisky': return 'scotch';
    case 'gin': case 'vodka': case 'wine': case 'vermouth': case 'sake': return 'slim';
    default: return 'generic';
  }
}

/** 주종 기본색 — 분류 레코드가 없는 공개 빌드도 여기까지는 성립한다 */
const KIND_COLOR: Record<string, [string, number]> = {
  whisky: ['#C0862F', .82], gin: ['#E8F0EA', .3], vodka: ['#EEF5FA', .26],
  rum: ['#A8622A', .84], tequila: ['#E7D296', .55], mezcal: ['#E0CE9A', .55],
  brandy: ['#A85A22', .86], liqueur: ['#C2703F', .8], vermouth: ['#8E3A21', .8],
  wine: ['#6B1220', .9], beer: ['#C98A2E', .72], sake: ['#EFE8D2', .32],
  rtd: ['#E0A66A', .62], spirit: ['#E4DECE', .32], mixer: ['#EAE2CE', .3], other: ['#D2BE94', .55],
};

/** 원산지가 정해 주는 바탕 호박색 */
const ORIGIN_COLOR: Record<string, string> = {
  '버번': '#B5651D', '테네시': '#B5651D', '스카치': '#C0862F',
  '아이리시': '#D0A057', '재패니즈': '#D2A34E', '코리안': '#C89246',
};

/** 캐스크는 색을 끌고 간다 — 통이 여럿이면 그만큼 더 끌린다 */
const CASK_PULL: Array<[RegExp, string, number]> = [
  [/PX|올로로소|셰리/, '#8E3F1C', .5],
  [/와인/, '#93302C', .42],
  [/버진오크|뉴 차드 오크/, '#A6551A', .32],
  [/프렌치오크/, '#A85630', .28],
];

/** 술 색 — 잔에 따랐을 때도 병에 담겼을 때도 같은 색을 쓴다 */
export function bottleColor(b: Bottle): { fill: string; alpha: number } {
  const base = KIND_COLOR[bottleKind(b)] ?? KIND_COLOR['other']!;
  const cls = b.whiskyClass;
  let rgb = hex2rgb((cls && ORIGIN_COLOR[cls.origin]) ?? base[0]);
  for (const cask of cls?.cask ?? []) {
    for (const [re, hex, w] of CASK_PULL) if (re.test(cask)) rgb = mix(rgb, hex2rgb(hex), w);
  }
  // 캐스크 스트렝스는 물을 타지 않은 원액이다 — 같은 색이라도 더 짙게 앉는다.
  const strong = (cls?.character ?? []).some((c) => /캐스크 스트렝스/.test(c));
  return { fill: rgb2hex(rgb), alpha: Math.min(.95, base[1] + (strong ? .08 : 0)) };
}

function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], w: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
}
function rgb2hex(c: [number, number, number]): string {
  return '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
