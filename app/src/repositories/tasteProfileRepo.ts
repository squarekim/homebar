import { db } from '../db/schema';
import { type TasteProfile, type FlavorVector, FLAVOR_AXES } from '../models/types';

function uid(): string {
  return 'tp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const tasteProfileRepo = {
  all: (): Promise<TasteProfile[]> => db.tasteProfiles.toArray(),

  get: (id: string): Promise<TasteProfile | undefined> => db.tasteProfiles.get(id),

  async me(): Promise<TasteProfile> {
    const m = await db.tasteProfiles.get('me');
    if (m) return m;
    const neutral = FLAVOR_AXES.reduce((v, a) => { v[a] = 5; return v; }, {} as FlavorVector);
    const created: TasteProfile = { id: 'me', name: '나', vector: neutral, updatedAt: Date.now(), source: 'manual' };
    await db.tasteProfiles.put(created);
    return created;
  },

  async save(profile: TasteProfile): Promise<void> {
    await db.tasteProfiles.put({ ...profile, updatedAt: Date.now() });
  },

  async create(name: string, vector: FlavorVector): Promise<string> {
    const id = uid();
    await db.tasteProfiles.put({ id, name, vector, updatedAt: Date.now(), source: 'manual' });
    return id;
  },

  async remove(id: string): Promise<void> {
    if (id === 'me') return; // 'me' 는 보호
    await db.tasteProfiles.delete(id);
  },
};
