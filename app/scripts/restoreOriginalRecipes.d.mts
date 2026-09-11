/** restoreOriginalRecipes.mjs 의 타입 선언. */
export interface RestoreResult {
  /** [대체] 표시를 지운 재료 줄 수 */
  cleared: number;
  /** 그 줄이 속한 레시피 수 */
  recipes: number;
  /** 원본 스펙과 달라 재료를 바꾼 줄 수 */
  swapped: number;
}
export function restoreSeed(options?: { dry?: boolean }): RestoreResult;
