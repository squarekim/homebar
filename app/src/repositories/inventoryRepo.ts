import { db } from '../db/schema';
import { InventoryItem } from '../models/types';

export const inventoryRepo = {
  all: (): Promise<InventoryItem[]> => db.inventory.toArray(),

  get: (ingredientId: string): Promise<InventoryItem | undefined> => db.inventory.get(ingredientId),

  async heldIds(): Promise<Set<string>> {
    const rows = await db.inventory.filter((r) => r.owned).toArray();
    return new Set(rows.map((r) => r.ingredientId));
  },

  async setOwned(ingredientId: string, ingredientName: string, owned: boolean): Promise<void> {
    const existing = await db.inventory.get(ingredientId);
    await db.inventory.put({
      ingredientId,
      ingredientName,
      owned,
      remaining: owned ? (existing?.remaining && existing.remaining > 0 ? existing.remaining : 100) : 0,
      note: existing?.note,
      updatedAt: Date.now(),
    });
  },

  async setRemaining(ingredientId: string, remaining: number): Promise<void> {
    const existing = await db.inventory.get(ingredientId);
    if (!existing) return;
    await db.inventory.put({
      ...existing,
      remaining: Math.max(0, Math.min(100, remaining)),
      owned: remaining > 0 ? true : existing.owned,
      updatedAt: Date.now(),
    });
  },

  async setAll(owned: boolean, ingredientList: { id: string; name: string }[]): Promise<void> {
    const now = Date.now();
    await db.inventory.bulkPut(
      ingredientList.map((i) => ({
        ingredientId: i.id,
        ingredientName: i.name,
        owned,
        remaining: owned ? 100 : 0,
        updatedAt: now,
      })),
    );
  },
};
