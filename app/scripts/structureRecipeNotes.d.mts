/** structureRecipeNotes.mjs 의 타입 선언. */
export interface NoteParts {
  /** 남긴 코멘터리 한 문장 (없으면 빈 문자열) */
  note: string;
  /** 출처 표기 (없으면 빈 문자열) */
  source: string;
  /** 변형 관계 — 원형 레시피 이름과 무엇을 바꿨는지 */
  variant: { parent: string; text: string } | null;
  /** 화면에 싣지 않기로 한 문장들 */
  dropped: string[];
}

export interface StructureResult {
  recipes: number;
  variant: number;
  source: number;
  oneLine: number;
  emptied: number;
  dropped: number;
  samples: Array<[name: string, before: string, after: string, source?: string, variant?: [string, string]]>;
}

export function classifyNote(note: string, selfName: string, recipeNames: string[]): NoteParts;
export function structureSeed(options?: { dry?: boolean }): StructureResult;
