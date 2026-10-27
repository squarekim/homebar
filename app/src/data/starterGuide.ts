/**
 * starterGuide.ts — 입문 취향 찾기 데이터.
 * 평소 마시는 음료·술을 고르면 위스키와 칵테일을 골라 주는 화면이 쓴다.
 *
 * 출처: 2026-10-26 GPT·제미나이 조사를 병합해 검토한 결과(드라이브 '1차 검토 결정 반영 결과',
 * '홈바 입문 추천 (검토 반영)', '주류 270종 평균 가격대 (병합본)').
 *  - 음료 카드: 앱 재료와 같은 음료는 flavorLexicon 값과 맞췄다. 그래야 '콜라를 좋아한다'가
 *    콜라가 든 칵테일과 같은 기준으로 이어진다. 볶은 향은 초콜릿, 고소함은 견과, 감귤류는 과일+시트러스로 본다.
 *  - 술 카드: GPT 조사 강도(1~3)를 ×3 해 0~10 으로 옮겼다. 벨지안 에일은 BJCP 2021 기준으로 둘로 나눴다.
 *    쓴맛·산미·탄산은 14축에 없어 담지 못한다.
 *  - 추천 이유·난이도는 '입문 추천 (검토 반영)' 그대로다. 가격대는 병합본의 확정값만 넣었다.
 */
import { type FlavorVector } from '../models/types';

export interface TasteCard {
  id: string;
  name: string;
  flavor: Partial<FlavorVector>;
  /** 술 카드: 기준 DB 에서 예시 제품을 찾을 세부분류 */
  subcategories?: readonly string[];
  /** 술 카드: 대표 도수 범위(%) */
  abv?: readonly [number, number];
}

/** 음료 16종 */
export const DRINK_CARDS: readonly TasteCard[] = [
  { id: 'd_cola', name: '콜라', flavor: { sweet: 5, caramel: 3, spice: 2 } },
  { id: 'd_cider', name: '사이다', flavor: { sweet: 5, citrus: 10, fruit: 3 } },
  { id: 'd_orange', name: '오렌지주스', flavor: { sweet: 4, fruit: 10, citrus: 10 } },
  { id: 'd_grapefruit', name: '자몽주스', flavor: { sweet: 2, fruit: 8, citrus: 10 } },
  { id: 'd_apple', name: '사과주스', flavor: { sweet: 5, fruit: 10, citrus: 4 } },
  { id: 'd_pineapple', name: '파인애플주스', flavor: { sweet: 8, fruit: 10, citrus: 5 } },
  { id: 'd_cranberry', name: '크랜베리주스', flavor: { sweet: 6, fruit: 10, citrus: 7 } },
  { id: 'd_gingerale', name: '진저에일', flavor: { sweet: 4, spice: 10 } },
  { id: 'd_tonic', name: '토닉워터', flavor: { herbal: 2, citrus: 1, sweet: 3 } },
  { id: 'd_americano', name: '아메리카노', flavor: { chocolate: 5, nutty: 3, body: 2 } },
  { id: 'd_latte', name: '라떼', flavor: { body: 6, nutty: 3, chocolate: 3, sweet: 2 } },
  { id: 'd_darkchoco', name: '다크초콜릿', flavor: { chocolate: 9, sweet: 3 } },
  { id: 'd_lemonade', name: '레몬에이드', flavor: { citrus: 9, fruit: 9, sweet: 5 } },
  { id: 'd_gingertea', name: '생강차', flavor: { spice: 9, sweet: 5 } },
  { id: 'd_greentea', name: '녹차', flavor: { herbal: 6, floral: 3 } },
  { id: 'd_vanillaice', name: '바닐라 아이스크림', flavor: { vanilla: 9, sweet: 9, body: 9 } },
];

/** 술 17종 — 벨지안 에일을 골든 스트롱과 다크로 나눠 조사표의 16종에서 하나 늘었다 */
export const LIQUOR_CARDS: readonly TasteCard[] = [
  { id: 'l_lager', name: '라거', flavor: { sweet: 3, body: 3 }, subcategories: ['라거', '필스너'], abv: [4.0, 5.0] },
  { id: 'l_wheat', name: '밀맥주', flavor: { fruit: 6, spice: 6, body: 6 }, subcategories: ['밀맥주', '바이젠', '벨지안 화이트 에일'], abv: [4.3, 5.6] },
  { id: 'l_paleale', name: '페일에일', flavor: { citrus: 6, floral: 3 }, subcategories: ['페일에일', '에일'], abv: [4.5, 6.2] },
  { id: 'l_ipa', name: 'IPA', flavor: { citrus: 9, fruit: 6 }, subcategories: ['IPA'], abv: [5.5, 7.5] },
  { id: 'l_stout', name: '스타우트', flavor: { chocolate: 6, body: 6 }, subcategories: ['스타우트'], abv: [3.8, 5.0] },
  { id: 'l_belgian_golden', name: '벨지안 골든 스트롱', flavor: { fruit: 6, spice: 3, body: 3 }, subcategories: ['벨지안 스트롱 에일'], abv: [7.5, 10.5] },
  { id: 'l_belgian_dark', name: '벨지안 다크', flavor: { fruit: 6, caramel: 6, body: 6, spice: 3, chocolate: 2 }, subcategories: ['벨지안 다크 에일', '트라피스트 에일'], abv: [6.0, 12.0] },
  { id: 'l_soju', name: '희석식 소주', flavor: { sweet: 3, body: 3 }, subcategories: ['희석식 소주'], abv: [14.9, 20.1] },
  { id: 'l_soju_distilled', name: '증류식 소주', flavor: { body: 6 }, subcategories: ['증류식 소주', '보리 소주'], abv: [16.9, 53] },
  { id: 'l_soju_fruit', name: '과일소주', flavor: { fruit: 9, sweet: 9 }, subcategories: ['과일 소주'], abv: [12.0, 14.0] },
  { id: 'l_makgeolli', name: '막걸리', flavor: { sweet: 6, body: 6 }, subcategories: ['생막걸리'], abv: [5, 8] },
  { id: 'l_yakju', name: '약주', flavor: { sweet: 6 }, subcategories: ['약주'], abv: [12, 18] },
  { id: 'l_red', name: '레드와인', flavor: { fruit: 9, body: 9 }, subcategories: ['레드 와인'], abv: [12.5, 15.5] },
  { id: 'l_white', name: '화이트와인', flavor: { citrus: 6, herbal: 6 }, subcategories: ['화이트 와인'], abv: [7, 14.5] },
  { id: 'l_sparkling', name: '스파클링와인', flavor: { citrus: 6, floral: 3 }, subcategories: ['샴페인', '프로세코', '카바'], abv: [5, 12.5] },
  { id: 'l_highball', name: '하이볼', flavor: { citrus: 3, body: 3 }, subcategories: ['하이볼 캔'], abv: [5, 9] },
  { id: 'l_chuhai', name: '츄하이', flavor: { citrus: 9 }, subcategories: ['츄하이'], abv: [3, 9] },
];

export type PickKind = 'whisky' | 'cocktail';

export interface StarterPick {
  /** 위스키는 기준 DB(liquorMaster) id, 칵테일은 레시피 id */
  id: string;
  kind: PickKind;
  reason: string;
  /** 1 바로 마시거나 붓기만 · 2 도구 하나 · 3 손이 더 감 */
  difficulty: 1 | 2 | 3;
}

/** 입문 추천 38개 (위스키 18 · 칵테일 20) */
export const STARTER_PICKS: readonly StarterPick[] = [
  { kind: 'whisky', id: 'm_macallan12dc', difficulty: 1, reason: '도수 40%예요. 꿀, 바닐라, 말린 과일의 단맛이 나요. 셰리 캐스크 위스키를 처음 마셔 볼 때 고르기 좋아요.' },
  { kind: 'whisky', id: 'm_glenfiddich12', difficulty: 1, reason: '도수 40%예요. 서양배 같은 과일 향과 은은한 오크 향이 나고 끝맛이 깔끔해요.' },
  { kind: 'whisky', id: 'm_balvenie12dw', difficulty: 1, reason: '버번 캐스크의 바닐라 단맛과 셰리 캐스크의 견과·향신료 풍미가 함께 나요. 두 캐스크를 거치면 맛이 어떻게 겹치는지 알기 좋아요.' },
  { kind: 'whisky', id: 'm_glenmorangie12', difficulty: 1, reason: '도수 40%예요. 오렌지, 복숭아, 꿀, 바닐라 향이 나고 질감이 부드러워요.' },
  { kind: 'whisky', id: 'm_talisker10', difficulty: 1, reason: '도수 45.8%예요. 피트 연기, 바다 내음, 말린 과일의 단맛, 후추 같은 여운이 나요. 피트 위스키를 처음 마셔 볼 때 고르기 좋아요.' },
  { kind: 'whisky', id: 'm_jw_black', difficulty: 1, reason: '도수 40%예요. 과일과 바닐라 향에 스모키한 기운이 약하게 섞여 있어요. 니트와 하이볼 모두 잘 맞아요.' },
  { kind: 'whisky', id: 'm_ballantine_f', difficulty: 1, reason: '도수 40%예요. 밀크초콜릿, 붉은 사과, 바닐라의 가벼운 단맛이 나요. 하이볼 기주로 쓰기 좋아요.' },
  { kind: 'whisky', id: 'm_monkeyshoulder', difficulty: 1, reason: '도수 40%예요. 여러 증류소의 몰트 위스키를 섞은 블렌디드 몰트예요. 바닐라, 오렌지, 향신료 맛이 나고 니트와 칵테일에 모두 써요.' },
  { kind: 'whisky', id: 'm_makers', difficulty: 1, reason: '원료에 호밀 대신 겨울 밀을 써요. 도수 45%인데도 바닐라와 캐러멜 단맛이 앞에 나와요. 버번 입문과 칵테일 기주로 두루 써요.' },
  { kind: 'whisky', id: 'm_buffalotrace', difficulty: 1, reason: '도수 45%예요. 캐러멜, 바닐라, 꿀, 오렌지 껍질 향이 나요. 니트와 올드 패션드에 많이 써요.' },
  { kind: 'whisky', id: 'm_wildturkey101', difficulty: 1, reason: '도수 50.5%로 높아요. 진한 캐러멜, 바닐라, 오크 향신료 맛이 나요. 얼음이나 탄산수를 섞어도 맛이 흐려지지 않아요.' },
  { kind: 'whisky', id: 'm_woodford', difficulty: 1, reason: '도수 43.2%예요. 구운 곡물, 나무, 달콤한 향신료, 과일과 꽃 향이 나요.' },
  { kind: 'whisky', id: 'm_kakubin', difficulty: 1, reason: '도수 40%예요. 단 향과 드라이한 마무리가 있어서 탄산수와 섞으면 청량해요. 일본식 하이볼에 많이 써요.' },
  { kind: 'whisky', id: 'm_toki', difficulty: 1, reason: '도수 43%예요. 청사과와 바질 같은 산뜻한 향에 바닐라와 향신료 여운이 나는 일본 블렌디드 위스키예요.' },
  { kind: 'whisky', id: 'm_hibiki_harmony', difficulty: 1, reason: '도수 43%예요. 장미, 리치, 오렌지 껍질, 화이트초콜릿 향이 나요. 자극이 적어 스트레이트로 마시기 좋아요.' },
  { kind: 'whisky', id: 'm_jameson', difficulty: 1, reason: '3번 증류한 아이리시 위스키예요. 도수 40%이고 견과, 바닐라, 은은한 셰리 단맛이 나요. 니트나 진저에일 하이볼로 마시기 좋아요.' },
  { kind: 'whisky', id: 'm_bushmills', difficulty: 1, reason: '3번 증류한 몰트와 그레인 위스키를 섞었어요. 도수 40%이고 가벼운 과일 향과 바닐라, 꿀 단맛이 나요.' },
  { kind: 'whisky', id: 'm_redbreast12', difficulty: 1, reason: '맥아보리와 맥아하지 않은 보리를 함께 증류한 싱글 팟 스틸 위스키예요. 도수 40%이고 구운 과일, 향신료, 셰리 오크의 크리미한 맛이 나요.' },
  { kind: 'cocktail', id: 'ck_6rmax5', difficulty: 2, reason: '버번이나 라이 위스키에 설탕, 앙고스투라 비터, 물을 더해 잔에서 바로 만들어요. 위스키 맛이 가장 잘 드러나는 클래식 칵테일이에요.' },
  { kind: 'cocktail', id: 'ck_11ky9p5', difficulty: 1, reason: '위스키와 탄산수를 1:3으로 잔에 붓기만 하면 돼요. 도수가 낮고 청량해서 처음 만들기 좋아요.' },
  { kind: 'cocktail', id: 'ck_xf7twp', difficulty: 2, reason: '버번에 레몬즙과 설탕 시럽을 넣어 셰이커로 흔들어요. 새콤달콤해서 마시기 편하고, 셰이커를 처음 써 보기 좋아요.' },
  { kind: 'cocktail', id: 'ck_iyoh6t', difficulty: 1, reason: '스카치와 드람부이(꿀·허브 리큐르) 두 가지만 얼음 잔에 붓고 저어요. 도수는 높은 편이지만 꿀 단맛이 알코올 자극을 덜어 줘요.' },
  { kind: 'cocktail', id: 'ck_f8vpm1', difficulty: 1, reason: '진에 레몬즙, 설탕 시럽, 탄산수를 잔에서 바로 섞어요. 레모네이드처럼 가볍게 마실 수 있어요.' },
  { kind: 'cocktail', id: 'ck_1t8i0x9', difficulty: 2, reason: '진, 레몬즙, 시럽을 셰이커로 흔든 뒤 탄산수를 채워요. 시트러스 향이 산뜻하고 셰이크 연습에 좋아요.' },
  { kind: 'cocktail', id: 'ck_17vq7bp', difficulty: 2, reason: '진, 트리플 섹, 레몬즙 세 가지를 셰이커로 흔들어요. 오렌지 리큐르의 단맛과 레몬의 신맛이 균형을 이뤄요.' },
  { kind: 'cocktail', id: 'ck_1qabr9h', difficulty: 1, reason: '진, 캄파리, 스위트 베르무트를 1:1:1로 붓고 저어요. 계량이 단순하고 쌉싸름한 허브 맛과 단 여운이 뚜렷해요.' },
  { kind: 'cocktail', id: 'ck_bc7kaq', difficulty: 2, reason: '진과 드라이 베르무트를 믹싱 글라스에서 저어 만들어요. 재료는 둘뿐이지만 도수가 높고, 젓는 정도에 따라 맛이 달라져서 스터 연습에 좋아요.' },
  { kind: 'cocktail', id: 'ck_sx6kgy', difficulty: 1, reason: '보드카와 커피 리큐르를 얼음 잔에 붓고 저어요. 도구 없이 만들 수 있고 커피의 단맛이 진해요.' },
  { kind: 'cocktail', id: 'ck_1aknqq9', difficulty: 1, reason: '보드카에 라임즙과 진저비어를 잔에서 바로 섞어요. 생강의 알싸함과 라임의 상큼함이 나요.' },
  { kind: 'cocktail', id: 'ck_d3n1iy', difficulty: 1, reason: '보드카, 피치 슈냅스, 오렌지 주스, 크랜베리 주스를 잔에 부어요. 주스 비중이 높아 음료처럼 마실 수 있어요.' },
  { kind: 'cocktail', id: 'ck_gwapeh', difficulty: 1, reason: '화이트 럼에 콜라와 라임즙을 잔에서 바로 섞어요. 콜라 단맛에 라임 산미가 더해져 가볍게 마시기 좋아요.' },
  { kind: 'cocktail', id: 'ck_1qo9jjh', difficulty: 2, reason: '화이트 럼, 라임즙, 설탕 세 가지를 셰이커로 흔들어요. 럼 사워의 기본형이라 새콤달콤한 균형을 익히기 좋아요.' },
  { kind: 'cocktail', id: 'ck_4388tx', difficulty: 2, reason: '화이트 럼에 민트, 라임즙, 설탕, 탄산수를 더해요. 민트를 머들러로 눌러 향을 내는 단계가 있어요.' },
  { kind: 'cocktail', id: 'ck_1nyxxv5', difficulty: 1, reason: '데킬라와 오렌지 주스를 붓고 그레나딘을 가라앉혀 해 뜨는 색을 만들어요. 과일 맛이 달고 만들기 쉬워요.' },
  { kind: 'cocktail', id: 'ck_14n8zwt', difficulty: 2, reason: '데킬라, 트리플 섹, 라임즙을 셰이커로 흔들어요. 잔 테두리에 소금을 묻히는 리밍도 함께 연습할 수 있어요.' },
  { kind: 'cocktail', id: 'ck_o4eir2', difficulty: 1, reason: '코냑과 아마레토를 1:1로 얼음 잔에 부어요. 도구가 필요 없고 포도 브랜디 향과 아몬드 같은 단맛이 어울려요.' },
  { kind: 'cocktail', id: 'ck_1srm31x', difficulty: 2, reason: '코냑, 트리플 섹, 레몬즙을 셰이커로 흔들어요. 브랜디의 과일 향, 오렌지 리큐르의 단맛, 레몬 신맛이 균형을 이뤄요.' },
  { kind: 'cocktail', id: 'ck_1pk4q1t', difficulty: 1, reason: '캄파리와 오렌지 주스 두 가지를 잔에 부어요. 캄파리의 쌉싸름함을 주스가 덜어 줘서 도수 낮게 마실 수 있어요.' },
];

/**
 * 입문 위스키의 평균 가격(원, 2026-10-26 국내 판매처 기준).
 * 두 조사의 하한·상한 평균이고, 상한이 하한의 2.5배를 넘는 값과 DB 와 다른 용량의 가격은 뺐다.
 * 산토리 토키와 와일드 터키 101 은 재조사 중이라 없다.
 */
export const STARTER_PRICES: Readonly<Record<string, number>> = {
  m_macallan12dc: 115200, m_glenfiddich12: 89300, m_balvenie12dw: 103500, m_glenmorangie12: 79800,
  m_talisker10: 84500, m_jw_black: 52200, m_ballantine_f: 31400, m_monkeyshoulder: 58800,
  m_makers: 45900, m_buffalotrace: 47000, m_woodford: 84000, m_kakubin: 39400,
  m_hibiki_harmony: 197200, m_jameson: 37100, m_bushmills: 40700, m_redbreast12: 95500,
};

/** "4~5만 원". 10만 원 미만은 1만 원, 50만 원 미만은 5만 원, 그 위는 10만 원 단위로 묶는다. */
export function priceBandLabel(price: number): string {
  const step = price < 100000 ? 10000 : price < 500000 ? 50000 : 100000;
  const lo = Math.floor(price / step) * step;
  return `${lo / 10000}~${(lo + step) / 10000}만 원`;
}

export type DrinkHabit = 'often' | 'sometimes' | 'rarely';
export type StrengthPref = 'light' | 'medium' | 'strong' | 'unknown';
export type BudgetKey = 'u3' | 'u7' | 'u15' | 'over15' | 'unknown';

export const HABITS: readonly { v: DrinkHabit; label: string }[] = [
  { v: 'often', label: '좋아해요' },
  { v: 'sometimes', label: '가끔 마셔요' },
  { v: 'rarely', label: '잘 안 마셔요' },
];

export const STRENGTHS: readonly { v: StrengthPref; label: string }[] = [
  { v: 'light', label: '가볍게' },
  { v: 'medium', label: '보통' },
  { v: 'strong', label: '진하게' },
  { v: 'unknown', label: '모르겠어요' },
];

/** 한 병에 이 정도까지는 쓸 수 있어요 */
export const BUDGETS: readonly { v: BudgetKey; label: string; max: number | null }[] = [
  { v: 'u3', label: '3만 원 이하', max: 30000 },
  { v: 'u7', label: '3~7만 원', max: 70000 },
  { v: 'u15', label: '7~15만 원', max: 150000 },
  { v: 'over15', label: '15만 원 이상', max: null },
  { v: 'unknown', label: '모르겠어요', max: null },
];
