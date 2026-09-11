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
  return q.trim().toLowerCase();
}

/**
 * 다듬은 검색어가 주어진 조각들 중 하나에라도 들어 있는지.
 * 조각은 이름·분류·재료명처럼 사람이 검색창에 칠 법한 것들을 넘긴다.
 */
export function hits(term: string, ...parts: (string | null | undefined)[]): boolean {
  if (!term) return true;
  return parts.some((p) => !!p && p.toLowerCase().includes(term));
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
