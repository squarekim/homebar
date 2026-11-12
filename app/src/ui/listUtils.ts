/**
 * listUtils — 목록 화면들이 똑같이 반복하던 잔손질.
 * 검색어 대조 · 상태순 정렬 · 그룹 칩 만들기 · 서브탭 상태를 한곳에 모았다.
 * 순수 함수와 훅만 두고 DB·UI 는 모른다.
 */
import { useMemo, useState } from 'react';
import { statusRank } from '../services/availabilityService';
import { allChips, type ChipOption } from './components/common';
import { type AvailabilityStatus, type Cocktail } from '../models/types';
import { SPELLING, QUERY_TERMS, COCKTAIL_ALIASES, INGREDIENT_ALIASES, ibaEnglishName } from '../data/searchAliases';

/** 검색어를 한 번만 다듬는다 (빈 문자열이면 "전부 통과") */
export function normalize(q: string): string {
  const t = fold(q);
  // 커뮤니티 줄임말은 검색어 전체가 그 말일 때만 펼친다. '|'로 이은 말 가운데 하나만 맞아도 된다
  const more = QUERY_TERMS[t];
  return more ? [t, ...more.map(fold)].join('|') : t;
}

/** 영문으로 친 흔한 이름 → 앱의 한글 표기 */
const EN_KO: Array<[RegExp, string]> = [
  [/oldfashioned/g, '올드패션드'], [/margarita/g, '마가리타'], [/mojito/g, '모히토'], [/negroni/g, '네그로니'], [/martini/g, '마티니'],
  [/daiquiri/g, '다이키리'], [/manhattan/g, '맨해튼'], [/highball/g, '하이볼'], [/cosmopolitan/g, '코스모폴리탄'], [/pinacolada/g, '피나콜라다'],
  [/moscowmule/g, '모스코뮬'], [/sidecar/g, '사이드카'], [/gimlet/g, '김렛'], [/sour/g, '사워'], [/collins/g, '콜린스'], [/tonic/g, '토닉'],
  [/whisk(e)?y/g, '위스키'], [/bourbon/g, '버번'], [/scotch/g, '스카치'], [/vodka/g, '보드카'], [/tequila/g, '데킬라'], [/brandy/g, '브랜디'],
  [/cognac/g, '코냑'], [/rum/g, '럼'], [/gin/g, '진'], [/lime/g, '라임'], [/lemon/g, '레몬'], [/mint/g, '민트'],
];
/** 검색 대조용으로 접는다: 소문자, 띄어쓰기와 구두점 제거, 영문 이름과 표기 차이를 한쪽으로 */
export function fold(s: string): string {
  let t = s.toLowerCase().replace(/[\s·・.,'"’`()[\]{}\-_/&+]/g, '');
  if (/[a-z]/.test(t)) for (const [re, ko] of EN_KO) t = t.replace(re, ko);
  for (const [re, ko] of SPELLING) t = t.replace(re, ko);
  return t;
}

/**
 * 다듬은 검색어가 주어진 조각들 중 하나에라도 들어 있는지.
 * 조각은 이름·분류·재료명처럼 사람이 검색창에 칠 법한 것들을 넘긴다.
 */
export function hits(term: string, ...parts: (string | null | undefined)[]): boolean {
  if (!term) return true;
  const terms = term.split('|');
  return parts.some((p) => { if (!p) return false; const f = fold(p); return terms.some((t) => f.includes(t)); });
}

/**
 * 미리 접어 둔 검색 문자열. 목록이 클 때 글자를 칠 때마다 이름과 별명을 다시 접지 않도록 한 번만 만든다.
 * 조각 사이에 '|'를 넣어, 앞 조각의 끝과 뒤 조각의 앞이 이어져 엉뚱하게 맞는 일을 막는다.
 */
export function searchKey(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).map((p) => fold(p!)).join('|');
}
export function hitsKey(term: string, key: string): boolean {
  return !term || term.split('|').some((t) => key.includes(t));
}

const ckKeys = new Map<string, string>();
/** 칵테일 검색 문자열 — 이름, 다른 이름, IBA 영어 이름, 재료와 재료의 다른 이름 */
export function cocktailKey(c: Cocktail): string {
  let k = ckKeys.get(c.id);
  if (k === undefined) {
    k = searchKey(c.name, ...(COCKTAIL_ALIASES[c.name] ?? []), ibaEnglishName(c.url),
      ...c.ingredients.flatMap((i) => [i.ingredientName, ...ingredientAliases(i.ingredientName)]));
    ckKeys.set(c.id, k);
  }
  return k;
}
export const ingredientAliases = (name: string): string[] => INGREDIENT_ALIASES[name] ?? [];

/** 만들 수 있는 것부터, 같은 상태면 가나다순 */
export function byReadyThenName<T>(
  status: (x: T) => AvailabilityStatus,
  name: (x: T) => string,
): (a: T, b: T) => number {
  return (a, b) => statusRank(status(b)) - statusRank(status(a)) || name(a).localeCompare(name(b), 'ko');
}

/** 목록에서 그룹 값을 뽑아 '전체 + 각 그룹' 칩 옵션으로 (중복 제거·원래 순서 유지) */
export function useGroupChips<T>(items: readonly T[], key: (x: T) => string, allLabel?: string): ChipOption<string>[] {
  return useMemo(() => allChips([...new Set(items.map(key))], allLabel), [items, key, allLabel]);
}

/** 배열에서 값을 켜고 끈다 (다중 선택 칩) */
export function toggleValue<T>(list: readonly T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/**
 * 서브탭 상태 — 부모가 값을 주면 그것을 따르고(탭 전환으로 특정 서브탭 열기),
 * 주지 않으면 자기가 들고 있는다. 홈바·술장이 같은 코드를 각자 갖고 있었다.
 */
export function useSubTab<T extends string>(
  initial: T,
  value?: T,
  onChange?: (v: T) => void,
): [T, (v: T) => void] {
  const [local, setLocal] = useState<T>(initial);
  const set = (v: T) => { setLocal(v); onChange?.(v); };
  return [value ?? local, set];
}
