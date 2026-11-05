/** markIbaFloats.mjs 의 타입 선언. */
export interface MarkFloatsResult {
  /** 바꾼 레시피와 조주법("이름: 이전 → 이후") */
  changed: string[];
}
export function markFloats(options?: { dry?: boolean }): MarkFloatsResult;
