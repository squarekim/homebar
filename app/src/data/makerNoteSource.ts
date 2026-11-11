/**
 * makerNoteSource.ts — 노트 출처가 제조사(또는 국내 공식 수입사)인지, 매체·판매처가 정리한 것인지 가른다.
 * 출처 이름(sourceName)에 '공식'이나 '수입사'가 있으면 제조사 쪽으로 본다. '참고:'로 시작하면 아니다.
 * 화면은 여기에 따라 제목을 '제조사 공식 노트' / '테이스팅 노트'로 나누고, 맛 그림은 공식 노트에서만 고른다.
 */
import { type MakerNote } from '../models/types';

export function isOfficialNote(n: MakerNote | undefined): boolean {
  const s = n?.sourceName ?? '';
  return !!n && !/^참고:/.test(s) && /공식|수입사/.test(s);
}

/** 화면에 적는 출처 이름 — ' — ' 뒤에 붙인 작업 메모는 빼고, 이름만 */
export function noteSourceLabel(n: MakerNote): string {
  const s = (n.sourceName ?? '').split(' — ')[0]!.replace(/^참고:\s*/, '').trim();
  if (s) return s;
  try { return new URL(n.source).hostname.replace(/^www\./, ''); } catch { return n.source; }
}
