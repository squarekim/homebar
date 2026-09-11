/**
 * liquorCategory.ts — 주류 대분류 체계.
 * 기존 컬렉션의 그룹(위스키/진/보드카/…)을 버리지 않고, 확장 카테고리를 그 위에 얹는다.
 * 사용자는 세부분류(subcategory)를 고르지 않는다 — 마스터 DB가 들고 있다.
 */
import { type LiquorCategory } from '../models/types';

export const CATEGORY_ORDER: LiquorCategory[] = [
  'whisky', 'gin', 'vodka', 'rum', 'tequila', 'mezcal', 'brandy',
  'liqueur', 'vermouth', 'wine', 'beer', 'sake', 'rtd', 'spirit', 'mixer',
];

export const CATEGORY_LABELS: Record<LiquorCategory, string> = {
  whisky: '위스키', gin: '진', vodka: '보드카', rum: '럼', tequila: '데킬라',
  mezcal: '메즈칼', brandy: '브랜디·코냑', liqueur: '리큐르', vermouth: '베르무트',
  wine: '와인·주정강화', beer: '맥주', sake: '사케·소주', rtd: 'RTD·캔칵테일',
  spirit: '기타 증류주', mixer: '칵테일 부재료',
};

/** 확장 카테고리 → 레거시 컬렉션 그룹(seed bottles 의 g). 기존 화면/집계를 그대로 태우기 위한 다리. */
export const CATEGORY_GROUP: Record<LiquorCategory, string> = {
  whisky: '위스키', gin: '진', vodka: '보드카',
  rum: '럼·데킬라·브랜디', tequila: '럼·데킬라·브랜디', mezcal: '럼·데킬라·브랜디', brandy: '럼·데킬라·브랜디',
  liqueur: '리큐르', vermouth: '기타 (칵테일 미활용)', wine: '기타 (칵테일 미활용)',
  beer: '기타 (칵테일 미활용)', sake: '기타 (칵테일 미활용)', rtd: '기타 (칵테일 미활용)',
  spirit: '기타 (칵테일 미활용)',
  mixer: '음료·믹서·시럽·비터·상비품',
};

/** 레거시 그룹 → 카테고리 (기존 사용자 데이터 마이그레이션용) */
export function categoryFromGroup(group: string): LiquorCategory {
  switch (group) {
    case '위스키': return 'whisky';
    case '진': return 'gin';
    case '보드카': return 'vodka';
    case '럼·데킬라·브랜디': return 'rum';
    case '리큐르': return 'liqueur';
    case '음료·믹서·시럽·비터·상비품': return 'mixer';
    default: return 'spirit';
  }
}

/** 마스터에 재료 매핑이 없을 때 쓰는 카테고리 기본 표준 재료명(기존 재료 마스터 128종의 이름) */
export const CATEGORY_DEFAULT_INGREDIENT: Partial<Record<LiquorCategory, string>> = {
  gin: '런던 드라이 진',
  vodka: '플레인 보드카',
  rum: '화이트 럼',
  tequila: '데킬라',
  mezcal: '메즈칼',
  brandy: '코냑',
  liqueur: '기타 리큐르',
  vermouth: '스위트 베르무트',
};

/** 위스키 세부분류 → 표준 재료명 (마스터 미등록 위스키를 직접 추가할 때 자동 매핑) */
export const SUBCATEGORY_INGREDIENT: Record<string, string> = {
  '싱글몰트 스카치': '싱글몰트 스카치',
  '블렌디드 스카치': '블렌디드 스카치',
  '스트레이트 버번': '버번',
  '스트레이트 라이': '라이 위스키',
  '블렌디드 아이리시': '아이리시 위스키',
};
