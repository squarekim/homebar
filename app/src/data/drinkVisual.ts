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

export type GlassKind = 'coupe' | 'martini' | 'highball' | 'rocks' | 'flute' | 'hurricane' | 'shot' | 'mug'
  /** 와인잔 — 얼음 없음(키르) / 얼음 있음(스프리츠). 얼음이 그림에 들어 있어 두 종류로 나눈다 */
  | 'wine' | 'wineice';

/** Independent effects: a recipe may have both carbonation and foam. */
export interface VisualEffect { bubbles: boolean; foam: boolean }

export function visualEffectOf(cocktail: Cocktail): VisualEffect {
  const names = cocktail.ingredients.filter((i) => !i.optional)
    .map((i) => i.ingredientName.replace(/\s+/g, '').toLowerCase());
  return {
    bubbles: names.some((n) => /탄산|토닉워터|진저에일|진저비어|콜라|샴페인|프로세코|소다|sodawater|sparklingwater|tonicwater|gingerale|gingerbeer|cola|champagne|prosecco/.test(n)),
    foam: names.some((n) => /계란흰자|계란흰자위|달걀흰자|생크림|eggwhite|heavycream|freshcream|whippingcream/.test(n))
      || /dry[\s-]*shake|드라이\s*셰이크|드라이\s*쉐이크/i.test(cocktail.method),
  };
}

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
  '블루 큐라소': ['#0B55B0', 1], '오렌지 큐라소': ['#D9822B', .5], '미도리': ['#5BA630', 1], '그린 크렘 드 멘트': ['#3E9B54', 1],
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
  '레드 와인(드라이)': ['#6B1220', .9], '셰리(아몬티야도)': ['#C08A3E', .5], '루비 포트': ['#5E0F20', .95],
  // 주스·과즙
  '레몬즙': ['#F2E27A', .3], '라임즙': ['#D7E27A', .3], '오렌지 주스': ['#F09422', .75],
  '파인애플 주스': ['#F5DC7A', .35], '크랜베리 주스': ['#B3172F', .85], '사과 주스': ['#E8D98A', .35],
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

/**
 * 재료 몇 가지를 섞은 색.
 * 술 속 색소는 빛을 흡수하는 양이 더해지는 방식으로 섞인다(Beer–Lambert). 그래서 RGB 를 평균하지 않고
 * 채널별 흡광도(-ln 투과율)를 양×물들이는 힘으로 더한 뒤 다시 색으로 돌린다. 파랑(블루 큐라소)과
 * 노랑(파인애플)을 섞으면 평균처럼 회색이 되지 않고 청록이 된다.
 * 크림·우유처럼 빛을 흩뜨리는 재료는 색소가 아니라 탁하게 만드는 쪽이라, 흡광도에 넣지 않고 마지막에 희게 덮는다.
 */
const CLEAR: [number, number, number] = [252, 247, 235]; // 색소가 없을 때의 바탕(옅은 크림빛)
const MILKY: [number, number, number] = [250, 244, 228];
const OPAQUE = new Set(['생크림', '우유', '코코넛 크림', '계란흰자']);
const GAIN = 1.15;

/**
 * 재료 색 — 같은 재료라도 표기에 색이 적혀 있으면 그 색을 쓴다.
 * 크렘 드 카카오는 화이트(무색)와 브라운(갈색)이 있다. 재고는 하나로 보되, 레시피 표기의 '(브라운)'으로 색을 가른다.
 */
const BROWN_CACAO: [string, number] = ['#5A2E14', .9];
function colorOf(i: Cocktail['ingredients'][number]): [string, number] | undefined {
  if (i.ingredientName === '크렘 드 카카오' && /브라운|다크|brown|dark/i.test(i.raw)) return BROWN_CACAO;
  return COLOR[i.ingredientName];
}

function mixColor(ings: Cocktail['ingredients']): { fill: string; alpha: number } {
  const absorb = [0, 0, 0];
  let den = 0, vol = 0, milk = 0, dyed = false;
  for (const i of ings) vol += volumeOf(i.raw, i.amountMl);
  if (vol === 0) return { fill: '#EFE6D2', alpha: 0.5 };
  for (const i of ings) {
    const v = volumeOf(i.raw, i.amountMl);
    const e = colorOf(i);
    if (!e) continue;
    const w = e[1] * (e[1] >= 0.85 ? 1.9 : 1);
    den += v * w;
    if (OPAQUE.has(i.ingredientName)) { milk += v * e[1]; continue; }
    if (e[1] <= 0) continue;
    dyed = true;
    hex2rgb(e[0]).forEach((c, k) => { absorb[k]! += (v / vol) * w * GAIN * -Math.log(Math.max(10, c) / 255); });
  }
  if (!dyed && milk === 0) return { fill: '#EFE6D2', alpha: 0.5 };
  const cover = 1 - Math.exp(-2.5 * milk / vol);
  const mix = CLEAR.map((base, k) => {
    const t = base * Math.exp(-absorb[k]!);
    return t * (1 - cover) + MILKY[k]! * cover;
  }) as [number, number, number];
  const density = Math.min(1, den / vol);
  return { fill: rgb2hex(mix), alpha: 0.45 + density * 0.5 };
}

/** 음료 색 — 선택 재료는 빼고 전부 섞은 색 */
export function drinkColor(ck: Cocktail): { fill: string; alpha: number } {
  return mixColor(ck.ingredients.filter((i) => !i.optional));
}

/**
 * 층 — 섞지 않고 붓는 잔은 위아래 색이 다르다.
 * at 은 액체 표면(0)에서 바닥(1)까지의 위치. 같은 at 에 두 색이 오면 경계가 또렷한 층이다
 * (GlassArt 가 그 경계를 잔 원근에 맞는 곡선으로 그린다).
 *   Layer          재료 순서대로 바닥부터 쌓는다(B-52)
 *   가라앉는 시럽   바닥이 진하고 위로 번진다(테킬라 선라이즈의 그레나딘)
 *   위에서 번지는 리큐르 위가 진하고 아래로 옅어진다(브램블의 크렘 드 뮈르)
 *   띄우는 재료     맨 위가 그 색이고 아래로 번진다(하비 월뱅어의 갈리아노, 뉴욕 사워의 레드 와인).
 *                   생크림만은 또렷한 층으로 얹힌다(아이리시 커피)
 * 조주법에 Float 표시가 있을 때만 띄우는 재료를 찾는다. 표시가 없으면 젓지 않고 만드는 잔의 생크림만 띄운다.
 */
export interface LiquidStop { at: number; color: string }
const SINKS = new Set(['그레나딘']);
const BLEEDS = new Set(['크렘 드 뮈르', '크렘 드 카시스']);
/** 띄워도 섞이지 않고 경계가 또렷한 재료 */
const CRISP_FLOATS = new Set(['생크림']);
const FLOATERS = ['그레나딘', '크렘 드 뮈르', '크렘 드 카시스', '생크림', '갈리아노', '레드 와인(드라이)',
  '자메이카 럼(앰버/블랙스트랩)', '스카치', '싱글몰트 스카치'];
/** 44px 목록에서도 층이 보이도록 한 층은 액체 높이의 이만큼은 차지한다 */
const LAYER_MIN = 0.15;
/** 띄운 층은 얕은 잔(쿠페)에서 더 얇아 보인다 — 조금 더 두껍게 */
const FLOAT_MIN = 0.2;

/** 층 하나는 그 재료 자체다 — 섞이지 않았으니 표의 색을 그대로 쓴다 */
function soloColor(i: Cocktail['ingredients'][number]): string {
  const e = colorOf(i);
  return e ? rgb2hex(hex2rgb(e[0])) : mixColor([i]).fill;
}

export function liquidLayers(ck: Cocktail): LiquidStop[] | null {
  const ings = ck.ingredients.filter((i) => !i.optional);
  const vol = (list: typeof ings) => list.reduce((s, i) => s + volumeOf(i.raw, i.amountMl), 0);
  const m = ck.method;
  if (/layer/i.test(m)) {
    if (ings.length < 2) return null;
    // 바닥부터 붓는 순서 → 위에서부터 그리도록 뒤집는다
    const raw = [...ings].reverse().map((i) => Math.max(LAYER_MIN, volumeOf(i.raw, i.amountMl) / vol(ings)));
    const sum = raw.reduce((a, b) => a + b, 0);
    const stops: LiquidStop[] = [];
    let at = 0;
    [...ings].reverse().forEach((i, k) => {
      const color = soloColor(i);
      stops.push({ at, color });
      at += raw[k]! / sum;
      stops.push({ at: Math.min(1, at), color });
    });
    return stops;
  }
  const floated = /float/i.test(m)
    ? FLOATERS.map((n) => ings.find((i) => i.ingredientName === n)).find(Boolean)
    : /shake|blend/i.test(m) ? undefined : ings.find((i) => i.ingredientName === '생크림');
  if (!floated) return null;
  const rest = ings.filter((i) => i !== floated);
  if (!rest.length) return null;
  const base = mixColor(rest).fill;
  const layer = soloColor(floated);
  const share = volumeOf(floated.raw, floated.amountMl) / vol(ings);
  const sinksOrBleeds = SINKS.has(floated.ingredientName) || BLEEDS.has(floated.ingredientName);
  const f = Math.min(0.45, Math.max(sinksOrBleeds ? LAYER_MIN : FLOAT_MIN, share));
  if (SINKS.has(floated.ingredientName)) {
    return [{ at: 0, color: base }, { at: Math.max(0, 1 - f - 0.45), color: base }, { at: 1 - f, color: layer }, { at: 1, color: layer }];
  }
  if (BLEEDS.has(floated.ingredientName)) {
    return [{ at: 0, color: layer }, { at: f, color: layer }, { at: Math.min(1, f + 0.45), color: base }, { at: 1, color: base }];
  }
  // 생크림은 섞이지 않고 또렷하게 얹힌다(아이리시 커피·화이트 러시안)
  if (CRISP_FLOATS.has(floated.ingredientName)) {
    return [{ at: 0, color: layer }, { at: f, color: layer }, { at: f, color: base }, { at: 1, color: base }];
  }
  // 술·리큐르·와인은 아래로 번진다(위쪽 일부는 그 색 그대로 남긴다)
  return [{ at: 0, color: layer }, { at: f * 0.6, color: layer }, { at: Math.min(1, f + 0.3), color: base }, { at: 1, color: base }];
}

const FIZZ = ['탄산수', '무향 탄산', '토닉워터', '진저에일', '진저비어', '콜라', '레몬라임 소다(스프라이트/세븐업)', '자몽 소다(스쿼트/프레스카)'];
const BUBBLY = ['샴페인', '프로세코'];
const CREAMY = ['생크림', '우유', '코코넛 크림', '아이리시 크림(베일리스)'];
const HOT = ['뜨거운 커피'];

/** 잔 이름 — 스펙 시트의 메타 줄에 쓴다 */
export const GLASS_LABEL_KO: Record<GlassKind, string> = {
  coupe: '쿠프', martini: '마티니 글라스', highball: '하이볼', rocks: '록스', flute: '플루트',
  hurricane: '허리케인', shot: '샷', mug: '머그', wine: '와인 글라스', wineice: '와인 글라스',
};
/** 그림에 얼음이 들어 있는 잔 — 서빙 방식(얼음 위 / 얼음 없이)을 그림과 같게 적는다 */
export const GLASS_ICE = new Set<GlassKind>(['rocks', 'highball', 'hurricane', 'wineice']);

/** 잔 — 조주법과 구성에서 고른다 */
const GLASS_KINDS = new Set<GlassKind>(['coupe', 'martini', 'highball', 'rocks', 'flute', 'hurricane', 'shot', 'mug', 'wine', 'wineice']);
export function glassOf(ck: Cocktail): GlassKind {
  // IBA 원문이 잔을 정해 둔 레시피는 그 잔을 쓴다
  if (ck.glass && GLASS_KINDS.has(ck.glass as GlassKind)) return ck.glass as GlassKind;
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

/** 한 조각에서 먼저 맞는 것을 쓴다 — '캔디드 진저'가 진저, '라즈베리'가 베리로 읽히도록 순서가 중요하다. */
const GARNISH: Array<[RegExp, GarnishKind]> = [
  [/베리|포도/, 'berry'], [/체리/, 'cherry'], [/올리브/, 'olive'], [/어니언/, 'onion'], [/진저/, 'ginger'],
  [/셀러리/, 'celery'], [/넛맥|시나몬|계피/, 'dust'], [/소금|설탕|리밍|크러스타|(^|\s)림/, 'rim'],
  [/민트|바질/, 'mint'], [/파인애플/, 'pineapple'],
  [/라임/, 'lime'], [/레몬/, 'lemon'], [/오렌지|자몽/, 'orange'],
];

/** 과일 조각의 모양 — 껍질, 반달(웨지), 둥근 단면(휠·슬라이스) */
export type GarnishForm = 'peel' | 'wedge' | 'wheel';
/**
 * 가니시가 놓이는 자리.
 *   edge   잔 가장자리에 끼우거나 껍질을 걸친다
 *   pick   칵테일 픽에 꽂는다(체리·올리브·양파·베리·캔디드 진저)
 *   top    잔 위로 솟는다(민트·셀러리)
 *   inside 술 속 — 하이볼의 레몬·라임·오렌지 슬라이스만
 *   rim    잔 입구의 소금·설탕
 *   dust   술 표면에 뿌린 가루
 */
export type GarnishPlace = 'edge' | 'pick' | 'top' | 'inside' | 'rim' | 'dust';
export interface GarnishItem { kind: GarnishKind; form: GarnishForm | null; place: GarnishPlace }

const PICKED = new Set<GarnishKind>(['cherry', 'olive', 'onion', 'berry', 'ginger']);
const CITRUS = new Set<GarnishKind>(['lemon', 'lime', 'orange']);
/** 한 잔에 그리는 가니시 수 — 뉴욕 사워(제스트+체리), 마이 타이(라임+민트+파인애플)까지 담는다 */
export const GARNISH_MAX = 3;

/** 가니시 글의 한 조각 — 무엇(kind)과 모양(form), 그리고 '(선택)'이 붙었는지. 못 알아본 조각은 kind 가 null 이다. */
export interface GarnishPart { text: string; kind: GarnishKind | null; form: GarnishForm | null; optional: boolean }

/**
 * 가니시 글을 조각으로 읽는다(개수 제한 없음). 그림(garnishItems)과 재고 판정(garnishStock)이 같은 읽기를 쓴다.
 * '(선택)'은 그 말이 붙은 조각에만 걸린다.
 */
export function garnishParts(garnish: string | undefined): GarnishPart[] {
  if (!garnish) return [];
  // '레몬/오렌지 제스트'는 둘 다 제스트다
  return garnish.split(/[+·,]|와 |과 /).map((p) => p.trim()).filter(Boolean)
    .flatMap((p) => {
      const optional = /\(선택\)/.test(p);
      const t = p.replace(/\s*\(선택\)/g, '').trim();
      const pieces = t.includes('/') && /제스트|필/.test(t)
        ? t.split('/').map((s) => (/제스트|필/.test(s) ? s : `${s} 제스트`))
        : [t];
      return pieces.map((x) => {
        const kind = GARNISH.find(([re]) => re.test(x))?.[1] ?? null;
        const fruit = kind !== null && (CITRUS.has(kind) || kind === 'pineapple');
        const form: GarnishForm | null = !fruit ? null
          : /제스트|필|트위스트|껍질/.test(x) ? 'peel'
          : /슬라이스|휠|둥근/.test(x) ? 'wheel'
          : 'wedge';
        return { text: x, kind, form, optional };
      });
    });
}

/** 가니시 — 데이터에 적힌 것만, 적힌 순서대로. 못 알아보면 아무것도 그리지 않는다. */
export function garnishItems(ck: Cocktail): GarnishItem[] {
  if (!ck.garnish) return [];
  const glass = glassOf(ck);
  const out: GarnishItem[] = [];
  for (const { text: t, kind, form } of garnishParts(ck.garnish)) {
    if (!kind) continue;
    const place: GarnishPlace = kind === 'rim' ? 'rim'
      : kind === 'dust' ? 'dust'
      : PICKED.has(kind) ? 'pick'
      : kind === 'mint' || kind === 'celery' ? 'top'
      : CITRUS.has(kind) && glass === 'highball' && /슬라이스/.test(t) ? 'inside'
      : 'edge';
    if (out.some((g) => g.kind === kind && g.form === form)) continue;
    out.push({ kind, form, place });
  }
  return out.slice(0, GARNISH_MAX);
}

function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgb2hex(c: [number, number, number]): string {
  return '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
