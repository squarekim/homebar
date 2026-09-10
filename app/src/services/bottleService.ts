/**
 * bottleService — 보유 술 등록/삭제 오케스트레이션.
 * "제품 → 표준 재료 → 칵테일 레시피" 연결을 여기서 맺는다.
 * (제품명으로 레시피를 매칭하지 않는다. 재고 DB와 레시피 DB는 같은 canonical ingredient ID 를 참조한다.)
 */
import { UserBottle } from '../models/types';
import { userBottleRepo } from '../repositories/userBottleRepo';
import { inventoryRepo } from '../repositories/inventoryRepo';
import { referenceRepo } from '../repositories/referenceRepo';

export interface AddBottleOptions {
  /** true 면 매핑된 표준 재료를 재고 보유로 켠다 (칵테일 판정에 즉시 반영) */
  linkIngredient?: boolean;
}

/** 표준 재료명 → 재료 마스터의 canonical ID (없으면 undefined) */
export function resolveIngredient(name?: string): { id: string; name: string } | undefined {
  if (!name) return undefined;
  const found = referenceRepo.ingredients().find((i) => i.name === name);
  return found ? { id: found.id, name: found.name } : undefined;
}

export const bottleService = {
  /** 병 저장 + (옵션) 표준 재료 재고 ON. 저장된 id 반환 */
  async add(draft: Omit<UserBottle, 'id' | 'createdAt'>, opts: AddBottleOptions = {}): Promise<string> {
    const ing = resolveIngredient(draft.ingredientName);
    const id = await userBottleRepo.add({ ...draft, ingredientId: ing?.id, ingredientName: ing?.name });
    if (opts.linkIngredient && ing) await inventoryRepo.setOwned(ing.id, ing.name, true);
    return id;
  },

  /**
   * 병 삭제. 재고는 건드리지 않는다 — 같은 표준 재료를 쓰는 다른 병이나
   * 사용자가 직접 켠 재고를 임의로 끄지 않기 위해서다(재고 탭에서 직접 해제 가능).
   */
  async remove(id: string): Promise<void> {
    await userBottleRepo.remove(id);
  },
};
