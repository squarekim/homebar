import { db } from '../db/schema';
import { DrinkLog } from '../models/types';

function uid(): string {
  return 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const drinkLogRepo = {
  all: (): Promise<DrinkLog[]> => db.drinkLogs.orderBy('date').reverse().toArray(),

  recent: (limit = 20): Promise<DrinkLog[]> =>
    db.drinkLogs.orderBy('date').reverse().limit(limit).toArray(),

  byDrink: (drinkId: string): Promise<DrinkLog[]> =>
    db.drinkLogs.where('drinkId').equals(drinkId).reverse().sortBy('date'),

  async add(log: Omit<DrinkLog, 'id'>): Promise<string> {
    const id = uid();
    await db.drinkLogs.put({ ...log, id });
    return id;
  },

  async update(id: string, patch: Partial<DrinkLog>): Promise<void> {
    await db.drinkLogs.update(id, patch);
  },

  async remove(id: string): Promise<void> {
    await db.drinkLogs.delete(id);
  },
};
