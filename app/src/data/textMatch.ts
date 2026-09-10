/**
 * textMatch.ts — 한/영 혼용 제품명 검색용 문자열 유틸 (외부 의존성 없음).
 * 정규화 · 한글 초성 · 부분열 · 편집거리만 제공하고, 랭킹은 서비스 계층이 한다.
 */

/** 소문자화 + 공백/구두점 제거 + 연차 표기(년/yo/year) 제거 */
export function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s·・.,'"’`()[\]{}\-_/&+]/g, '')
    .replace(/년|년산|yearold|years|year|yrs|yr|yo\b/g, '')
    .trim();
}

/** 토큰 분리(공백 기준). 각 토큰도 정규화한다. */
export function tokenize(s: string): string[] {
  return s.split(/\s+/).map(normalizeQuery).filter(Boolean);
}

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** 한글 초성 문자열 (한글이 아닌 문자는 그대로 유지). '발베니' → 'ㅂㅂㄴ' */
export function initials(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += CHO[Math.floor((code - 0xac00) / 588)];
    else out += ch;
  }
  return out;
}

/** query 의 문자들이 target 안에 순서대로 등장하는가 (조니블랙 ⊂ 조니워커블랙라벨) */
export function isSubsequence(query: string, target: string): boolean {
  let i = 0;
  for (const ch of target) {
    if (ch === query[i]) i++;
    if (i === query.length) return true;
  }
  return query.length === 0;
}

/** 부분열이 target 안에서 얼마나 촘촘히 붙어 있는지 0~1 (붙어 있을수록 1) */
export function subsequenceDensity(query: string, target: string): number {
  if (!query) return 0;
  let i = 0, first = -1, last = -1, pos = 0;
  for (const ch of target) {
    if (ch === query[i]) { if (first < 0) first = pos; last = pos; i++; if (i === query.length) break; }
    pos++;
  }
  if (i < query.length) return 0;
  const span = last - first + 1;
  return query.length / span;
}

/** 레벤슈타인 거리 (짧은 문자열 전용, O(n·m)) */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const del = (prev[j] ?? 0) + 1;                 // 위
      const ins = (cur[j - 1] ?? 0) + 1;              // 왼쪽
      const sub = (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1); // 대각
      cur[j] = Math.min(del, ins, sub);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

/** 0~1 유사도 */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - editDistance(a, b) / max;
}
