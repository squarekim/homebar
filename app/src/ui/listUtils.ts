/**
 * listUtils — 목록 화면들이 똑같이 반복하던 잔손질.
 * 검색어 대조 · 상태순 정렬 · 그룹 칩 만들기 · 서브탭 상태를 한곳에 모았다.
 * 순수 함수와 훅만 두고 DB·UI 는 모른다.
 */
import { useMemo, useState } from 'react';
import { statusRank } from '../services/availabilityService';
import { allChips, type ChipOption } from './components/common';
import { type AvailabilityStatus } from '../models/types';

/** 검색어를 한 번만 다듬는다 (빈 문자열이면 "전부 통과") */
export function normalize(q: string): string {
  return fold(q);
}

/** 영문으로 친 흔한 이름 → 앱의 한글 표기 */
const EN_KO: Array<[RegExp, string]> = [
  [/oldfashioned/g, '올드패션드'], [/margarita/g, '마가리타'], [/mojito/g, '모히토'], [/negroni/g, '네그로니'], [/martini/g, '마티니'],
  [/daiquiri/g, '다이키리'], [/manhattan/g, '맨해튼'], [/highball/g, '하이볼'], [/cosmopolitan/g, '코스모폴리탄'], [/pinacolada/g, '피나콜라다'],
  [/moscowmule/g, '모스코뮬'], [/sidecar/g, '사이드카'], [/gimlet/g, '김렛'], [/sour/g, '사워'], [/collins/g, '콜린스'], [/tonic/g, '토닉'],
  [/whisk(e)?y/g, '위스키'], [/bourbon/g, '버번'], [/scotch/g, '스카치'], [/vodka/g, '보드카'], [/tequila/g, '데킬라'], [/brandy/g, '브랜디'],
  [/cognac/g, '코냑'], [/rum/g, '럼'], [/gin/g, '진'], [/lime/g, '라임'], [/lemon/g, '레몬'], [/mint/g, '민트'],
];
/** 같은 말의 다른 한글 표기를 한쪽으로 모은다 */
const KO_VARIANTS: Array<[RegExp, string]> = [
  [/마르가리타/g, '마가리타'], [/히또/g, '히토'], [/테킬라/g, '데킬라'], [/칼루아/g, '깔루아'], [/맨하탄|맨해턴/g, '맨해튼'],
  [/다이커리|다이퀴리/g, '다이키리'], [/피냐/g, '피나'], [/올드패션(?!드)/g, '올드패션드'], [/꼬냑/g, '코냑'], [/위스키사우어/g, '위스키사워'],
  [/사우어/g, '사워'], [/아마레또/g, '아마레토'], [/진앤토닉/g, '진토닉'], [/버몬트|베르뭇/g, '베르무트'],
];
/** 검색 대조용으로 접는다: 소문자, 띄어쓰기와 구두점 제거, 영문 이름과 표기 차이를 한쪽으로 */
export function fold(s: string): string {
  let t = s.toLowerCase().replace(/[\s·・.,'"’`()[\]{}\-_/&+]/g, '');
  if (/[a-z]/.test(t)) for (const [re, ko] of EN_KO) t = t.replace(re, ko);
  for (const [re, ko] of KO_VARIANTS) t = t.replace(re, ko);
  return t;
}

/**
 * 다듬은 검색어가 주어진 조각들 중 하나에라도 들어 있는지.
 * 조각은 이름·분류·재료명처럼 사람이 검색창에 칠 법한 것들을 넘긴다.
 */
export function hits(term: string, ...parts: (string | null | undefined)[]): boolean {
  if (!term) return true;
  return parts.some((p) => !!p && fold(p).includes(term));
}

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
