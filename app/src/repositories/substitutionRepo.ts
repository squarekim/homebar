import { db } from '../db/schema';
import { type IngredientSubstitution } from '../models/types';

export const substitutionRepo = {
  all: (): Promise<IngredientSubstitution[]> => db.substitutions.toArray(),

  /** ingredientId → 대체 가능한 substituteId 목록 */
  async map(): Promise<Map<string, string[]>> {
    const rows = await db.substitutions.toArray();
    const m = new Map<string, string[]>();
    for (const r of rows) {
      const arr = m.get(r.ingredientId) ?? [];
      arr.push(r.substituteId);
      m.set(r.ingredientId, arr);
    }
    return m;
  },

  async add(sub: IngredientSubstitution): Promise<void> {
    await db.substitutions.put(sub);
  },

  async remove(id: string): Promise<void> {
    await db.substitutions.delete(id);
  },
};
