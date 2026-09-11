/** structureBottleNotes.mjs 의 타입 선언. */
export type BottleBadgeTuple = [kind: string, label: string];

export interface BottleNoteParts {
  /** 뱃지로 올릴 것들 — 마일스톤·입수 경위·상태·용도 */
  badges: BottleBadgeTuple[];
  /** 남긴 제품 사실 (없으면 빈 문자열) */
  note: string;
  /** 메모에 적혀 있던 용량(ml) */
  ml?: number | undefined;
  /** 구매 기록 (가격·구매처) */
  buy?: string | undefined;
  /** 화면에 싣지 않기로 한 조각들 */
  dropped: string[];
}

export interface BottleStructureResult {
  bottles: number;
  badges: number;
  tagged: number;
  volume: number;
  buy: number;
  kept: number;
  emptied: number;
  dropped: number;
  samples: Array<[ko: string, before: string, after: string, badges: BottleBadgeTuple[], ml?: number, buy?: string]>;
}

export function classifyBottleNote(note: string): BottleNoteParts;
export function structureBottleSeed(options?: { dry?: boolean }): BottleStructureResult;
