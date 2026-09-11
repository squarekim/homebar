/**
 * drinkVisual — 잔 · 음료 색 · 가니시를 레시피 데이터에서 파생한다.
 *
 * 저장소에 칵테일 사진 자산이 없다. 남의 사진을 가져다 쓰는 대신, 이미 있는 데이터로 그린다:
 *   색   = 재료별 색소 × 양의 가중 평균 (그레나딘·블루 큐라소처럼 센 색소는 소량으로도 지배)
 *   잔   = 조주법 + 탄산/크림 여부 + 총 용량
 *   가니시 = g 필드에서 알아볼 수 있는 것만 (없으면 안 그린다)
 * 사실이 아니라 표현이므로 판정에는 쓰지 않는다. 데이터가 없으면 기본값으로 둔다.
 */
import { type Cocktail } from '../models/types';

export type GlassKind = 'coupe' | 'martini' | 'highball' | 'rocks' | 'flute' | 'hurricane' | 'shot' | 'mug';

const COLOR: Record<string, [string, number]> = {
  // 위스키·브랜디 계열 (호박)
  '버번': ['#B5651D', .55], '스카치': ['#C07A2B', .5], '라이 위스키': ['#B5651D', .5],
  '싱글몰트 스카치': ['#C07A2B', .5], '한국 싱글몰트': ['#C07A2B', .5], '버번 또는 라이': ['#B5651D', .5],
  '테네시': ['#B5651D', .5], '블렌디드 스카치': ['#C68B3C', .45], '아이리시 위스키': ['#CE9A4E', .4],
  '플레이버드 위스키': ['#C9863C', .45], '코냑': ['#A85A22', .55], 'XO 브랜디(코냑 외)': ['#A85A22', .55],
  '칼바도스': ['#C9954A', .4], '포도 브랜디': ['#C9954A', .35], '그라파': ['#FFFFFF', .02], '피스코': ['#FFFFFF', .02],
  '체리 브랜디 (상궤 모를라코)': ['#8E1B2E', .8], '애프리콧 브랜디': ['#E08A2B', .6], '피치 브랜디': ['#E8A64B', .5],
  // 무색 기주
  '런던 드라이 진': ['#FFFFFF', .02], '올드 톰 진': ['#FFFDF2', .05], '플레인 보드카': ['#FFFFFF', .02],
  '보드카 시트론': ['#FBF3C8', .1], '화이트 럼': ['#FFFFFF', .02], '쿠바산 화이트 럼': ['#FFFFFF', .02],
  '카샤사': ['#FFFFFF', .03], '데킬라': ['#FDF6D8', .08], '100% 아가베 데킬라': ['#FDF6D8', .08],
  '레포사도 데킬라(100% 아가베)': ['#E7BF72', .35], '메즈칼': ['#FDF6D8', .08],
  '골드 럼': ['#D08A3A', .45], '자메이카 럼(앰버/블랙스트랩)': ['#7A4318', .7],
  '데메라라 럼': ['#8A4E1E', .6], '마르티니크 럼 아그리콜': ['#FFF6DC', .1], '코코넛 럼': ['#FFF8EC', .15],
  // 리큐르
  '트리플 섹': ['#FFFFFF', .03], '코앵트로': ['#FFFFFF', .03], '그랑 마르니에': ['#C97B2A', .5],
  '블루 큐라소': ['#1B79C8', 1], '미도리': ['#5BA630', 1], '그린 크렘 드 멘트': ['#3E9B54', 1],
  '크렘 드 멘트': ['#3E9B54', .9], '화이트 크렘 드 멘트': ['#FFFFFF', .03],
  '아마레토': ['#A8571F', .6], '깔루아(커피 리큐르)': ['#3B2012', .95], '아이리시 크림(베일리스)': ['#D9C1A0', .85],
  '피치 슈납스': ['#F2C46B', .45], '마라스키노': ['#FFFFFF', .05], '크렘 드 카시스': ['#4A1030', 1],
  '크렘 드 뮈르': ['#4A1030', 1], '크렘 드 비올렛': ['#6A4A9E', .95], '샹보르(블랙라즈베리)': ['#6E1533', 1],
  '크렘 드 카카오': ['#FFFFFF', .06], '베네딕틴': ['#C08A2E', .5], '드람부이': ['#C08A2E', .5],
  '갈리아노': ['#E8C133', .8], '바나나 리큐르': ['#E8CE4A', .7], '그린 샤르트뢰즈': ['#8CA83A', .85],
  '엘더플라워 코디얼': ['#F5EBC0', .15], '카모마일 코디얼': ['#F0E2AE', .2], '팔레르넘': ['#FFF9E4', .08],
  '시나몬 리큐르(시에가)': ['#C98B3E', .4], '기타 리큐르': ['#E2C98C', .25],
  // 비터·아페리티프
  '캄파리': ['#C81E38', 1], '아페롤': ['#E8551A', 1], '앙고스투라 비터': ['#5A2A16', .9],
  '오렌지 비터': ['#B36A22', .6], '페르넷': ['#3A2415', .95], '아마로(노니노)': ['#6B3A1E', .8],
  '치나르': ['#5A2E1C', .85], '압생트': ['#9BBE4A', .8],
  // 베르무트·와인
  '스위트 베르무트': ['#8E3A21', .7], '드라이 베르무트': ['#EBDFA8', .2], '리에 블랑': ['#EBDFA8', .2],
  '샴페인': ['#F3E3AE', .2], '프로세코': ['#F3E3AE', .2], '드라이 화이트 와인': ['#EFE3AC', .2],
  '레드 와인(드라이)': ['#6B1220', .9], '루비 포트': ['#5E0F20', .95],
  // 주스·과즙
  '레몬즙': ['#F2E27A', .3], '라임즙': ['#D7E27A', .3], '오렌지 주스': ['#F09422', .75],
  '파인애플 주스': ['#F2C63C', .6], '크랜베리 주스': ['#B3172F', .85], '사과 주스': ['#E8D98A', .35],
  '자몽 주스': ['#F0A38C', .6], '토마토 주스': ['#B8341C', .9], '코코넛 크림': ['#FFFDF7', .7],
  '패션프루트 퓨레': ['#E8A32B', .7], '복숭아 퓨레': ['#F0B678', .6], '사탕수수 주스 또는 시럽': ['#E8D9A8', .2],
  // 탄산·음료
  '탄산수': ['#FFFFFF', 0], '무향 탄산': ['#FFFFFF', 0], '토닉워터': ['#FFFFFF', .02],
  '진저에일': ['#E3C489', .3], '진저비어': ['#E0BE7C', .35], '콜라': ['#3A1C0E', .95],
  '레몬라임 소다(스프라이트/세븐업)': ['#FFFFFF', .02], '에스프레소': ['#2E1608', 1],
  '뜨거운 커피': ['#3A1C0C', .95], '홍차(냉침)': ['#8A4A1E', .6], '자몽 소다(스쿼트/프레스카)': ['#F2B49E', .4],
  // 시럽·감미
  '설탕시럽': ['#FFFFFF', .02], '그레나딘': ['#B3122A', 1], '허니 시럽': ['#E0A93C', .4],
  '각설탕': ['#FFFFFF', .02], '정제 설탕': ['#FFFFFF', .02], '오르쟈 시럽(아몬드)': ['#FFF6E2', .4],
  '데메라라 시럽': ['#C99A52', .4], '돈스 믹스(자몽+시나몬시럽)': ['#EDB48E', .45],
  '라즈베리 시럽': ['#B81E4A', .95], '아가베 시럽': ['#E2C07A', .3], '허니 믹스': ['#E0A93C', .4],
  // 신선·유제품
  '민트 잎': ['#4E9148', .25], '생강': ['#E8D9A0', .15], '홍고추': ['#C8301C', .5], '바질 잎': ['#4E9148', .25],
  '계란흰자': ['#FFFDF6', .35], '생크림': ['#FFFCF2', .8], '우유': ['#FFFDF7', .8],
  '계란 노른자': ['#F0C040', .7], '물': ['#FFFFFF', 0], '바닐라 익스트랙': ['#8A6A3A', .3],
  '오렌지 플라워 워터': ['#FFFFFF', .02], '올리브 브라인': ['#F0EBC8', .2], '우스터·타바스코 등 향신': ['#6B2A12', .5],
};

/** 재료 한 줄의 양(ml). adapters 가 파싱해 둔 값을 먼저 쓰고, 없으면 표기에서 짐작한다. */
function volumeOf(raw: string, amountMl: number | null): number {
  if (amountMl && amountMl > 0) return amountMl;
  if (/dash|방울|바스푼|tsp/i.test(raw)) return 2;
  return 20;
}

/** 음료 색 — 양×물들이는 힘으로 섞고, 나머지는 맑은 쪽으로 희석한다 */
export function drinkColor(ck: Cocktail): { fill: string; alpha: number } {
  let r = 0, g = 0, b = 0, den = 0, vol = 0;
  for (const i of ck.ingredients) {
    if (i.optional) continue;
    const v = volumeOf(i.raw, i.amountMl);
    vol += v;
    const e = COLOR[i.ingredientName];
    if (!e) continue;
    const w = v * e[1] * (e[1] >= 0.85 ? 1.9 : 1);
    const c = hex2rgb(e[0]);
    r += c[0] * w; g += c[1] * w; b += c[2] * w;
    den += w;
  }
  if (den === 0 || vol === 0) return { fill: '#EFE6D2', alpha: 0.5 };
  const density = Math.min(1, den / vol);
  const k = Math.pow(density, 0.34);
  const mix: [number, number, number] = [
    252 + (r / den - 252) * k,
    247 + (g / den - 247) * k,
    235 + (b / den - 235) * k,
  ];
  return { fill: rgb2hex(mix), alpha: 0.45 + density * 0.5 };
}

const FIZZ = ['탄산수', '무향 탄산', '토닉워터', '진저에일', '진저비어', '콜라', '레몬라임 소다(스프라이트/세븐업)', '자몽 소다(스쿼트/프레스카)'];
const BUBBLY = ['샴페인', '프로세코'];
const CREAMY = ['생크림', '우유', '코코넛 크림', '아이리시 크림(베일리스)'];
const HOT = ['뜨거운 커피'];

/** 잔 — 조주법과 구성에서 고른다 */
export function glassOf(ck: Cocktail): GlassKind {
  const names = ck.ingredients.map((i) => i.ingredientName);
  const total = ck.ingredients.reduce((s, i) => s + (i.optional ? 0 : volumeOf(i.raw, i.amountMl)), 0);
  const m = ck.method.toLowerCase();
  if (names.some((n) => HOT.includes(n))) return 'mug';
  if (names.some((n) => BUBBLY.includes(n))) return 'flute';
  if (m.includes('blend') || (names.some((n) => CREAMY.includes(n)) && total > 140)) return 'hurricane';
  if (names.some((n) => FIZZ.includes(n)) || total >= 150) return 'highball';
  // 잔에 직접 쌓는 것은 얼음 위에 낸다 (올드 패션드류) — 샷보다 먼저 본다
  if (m.includes('build') || m.includes('muddle') || m.includes('swizzle')) return 'rocks';
  if (m.includes('layer') || total <= 55) return 'shot';
  if (m.includes('stir') && (ck.base === '진' || ck.base === '보드카') && names.some((n) => n.includes('베르무트'))) return 'martini';
  return 'coupe';
}

export type GarnishKind = 'lemon' | 'lime' | 'orange' | 'cherry' | 'olive' | 'mint'
  | 'pineapple' | 'berry' | 'celery' | 'onion' | 'ginger' | 'dust' | 'rim';

const GARNISH: Array<[RegExp, GarnishKind]> = [
  [/레몬/, 'lemon'], [/라임/, 'lime'], [/오렌지|자몽/, 'orange'],
  [/체리/, 'cherry'], [/올리브/, 'olive'], [/민트|바질/, 'mint'], [/파인애플/, 'pineapple'],
  [/넛맥|시나몬|계피/, 'dust'], [/소금|설탕|림|리밍|크러스타/, 'rim'], [/셀러리/, 'celery'],
  [/어니언/, 'onion'], [/베리|라즈베리|포도/, 'berry'], [/진저/, 'ginger'],
];

/** 가니시 — 데이터에 적힌 것만. 못 알아보면 아무것도 그리지 않는다. */
export function garnishOf(ck: Cocktail): GarnishKind[] {
  if (!ck.garnish) return [];
  const out: GarnishKind[] = [];
  for (const [re, key] of GARNISH) if (re.test(ck.garnish) && !out.includes(key)) out.push(key);
  return out.slice(0, 2);
}

/** 잔에 넣는 얼음 개수 */
export const ICE: Record<GlassKind, number> = {
  highball: 3, rocks: 2, hurricane: 2, mug: 0, flute: 0, shot: 0, coupe: 0, martini: 0,
};

function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgb2hex(c: [number, number, number]): string {
  return '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
