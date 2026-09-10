/**
 * tasteService — DrinkLog/Rating 으로 취향 프로필을 갱신.
 */
import { type FlavorVector, type TasteProfile } from '../models/types';
import { drinkLogRepo } from '../repositories/drinkLogRepo';
import { tasteProfileRepo } from '../repositories/tasteProfileRepo';
import { deriveTasteFromLogs, blendVectors } from './flavorService';

export const tasteService = {
  /** 음용 기록에서 파생한 취향을 'me' 에 반영(기존값과 점진 혼합). */
  async recomputeMe(alpha = 0.6): Promise<TasteProfile> {
    const me = await tasteProfileRepo.me();
    const logs = await drinkLogRepo.all();
    const derived = deriveTasteFromLogs(logs);
    if (!derived) return me;
    const vector = blendVectors(me.vector, derived, alpha);
    const updated: TasteProfile = { ...me, vector, source: 'mixed', updatedAt: Date.now() };
    await tasteProfileRepo.save(updated);
    return updated;
  },

  /** 사용자가 슬라이더로 직접 설정. */
  async setManual(vector: FlavorVector): Promise<TasteProfile> {
    const me = await tasteProfileRepo.me();
    const updated: TasteProfile = { ...me, vector, source: 'manual', updatedAt: Date.now() };
    await tasteProfileRepo.save(updated);
    return updated;
  },
};
