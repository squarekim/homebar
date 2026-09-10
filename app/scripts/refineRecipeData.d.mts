/** refineRecipeData.mjs 의 타입 선언. */
export interface RefineResult {
  garnishCount: number;
  revisionCount: number;
  noteChanged: number;
  samples: Array<[name: string, before: string, after: string, garnish: string | null]>;
  recipes: number;
}

export function refineSeed(options?: { dry?: boolean }): RefineResult;
