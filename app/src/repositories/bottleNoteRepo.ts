import { db, type BottleNote } from '../db/schema';

export const bottleNoteRepo = {
  all: (): Promise<BottleNote[]> => db.bottleNotes.toArray(),
  get: (bottleId: string): Promise<BottleNote | undefined> => db.bottleNotes.get(bottleId),
  async set(bottleId: string, text: string): Promise<void> {
    const t = text.trim();
    if (!t) { await db.bottleNotes.delete(bottleId); return; }
    await db.bottleNotes.put({ bottleId, text: t, updatedAt: Date.now() });
  },
};
