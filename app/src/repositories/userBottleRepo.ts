import { db } from '../db/schema';
import { type UserBottle } from '../models/types';

function uid(): string {
  return 'ub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const userBottleRepo = {
  all: (): Promise<UserBottle[]> => db.userBottles.orderBy('createdAt').reverse().toArray(),

  async add(b: Omit<UserBottle, 'id' | 'createdAt'>): Promise<string> {
    const id = uid();
    await db.userBottles.put({ ...b, id, createdAt: Date.now() });
    return id;
  },

  async update(id: string, patch: Partial<UserBottle>): Promise<void> {
    await db.userBottles.update(id, patch);
  },

  async remove(id: string): Promise<void> {
    await db.userBottles.delete(id);
  },
};
