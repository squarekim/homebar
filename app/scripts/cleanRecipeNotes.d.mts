/** cleanRecipeNotes.mjs 의 타입 선언. */
export function splitSentences(line: string): string[];

export interface CleanResult {
  changes: Array<{ name: string; before: string; after: string }>;
  droppedSentences: number;
  strippedSentences: number;
  markerCount: number;
  recipes: number;
}

export function cleanSeed(options?: { dry?: boolean }): CleanResult;
