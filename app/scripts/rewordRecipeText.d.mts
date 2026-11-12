/** rewordRecipeText.mjs 의 타입 선언. */
export interface RewordResult { notes: number; variants: number; sources: number; removed: number; mixers: number; }
export function reword(options?: { dry?: boolean }): RewordResult;
