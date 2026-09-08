/** Dexie 라이브 쿼리 훅. UI 는 이 훅들로만 상태를 읽는다. */
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db/schema';
import { inventoryRepo } from '../repositories/inventoryRepo';
import { substitutionRepo } from '../repositories/substitutionRepo';
import { InventoryItem, DrinkLog, TasteProfile, FLAVOR_AXES, FlavorVector } from '../models/types';

export function useInventory(): InventoryItem[] | undefined {
  return useLiveQuery(() => db.inventory.toArray(), []);
}

export function useHeldIds(): Set<string> {
  const inv = useInventory();
  return useMemo(() => new Set((inv ?? []).filter((i) => i.owned).map((i) => i.ingredientId)), [inv]);
}

export function useRemainingMap(): Map<string, number> {
  const inv = useInventory();
  return useMemo(() => new Map((inv ?? []).map((i) => [i.ingredientId, i.remaining])), [inv]);
}

export function useSubMap(): Map<string, string[]> {
  const rows = useLiveQuery(() => substitutionRepo.map(), []);
  return rows ?? new Map();
}

export function useLogs(): DrinkLog[] {
  return useLiveQuery(() => db.drinkLogs.orderBy('date').reverse().toArray(), []) ?? [];
}

export function useTasteProfiles(): TasteProfile[] {
  return useLiveQuery(() => db.tasteProfiles.toArray(), []) ?? [];
}

export function useMe(): TasteProfile | undefined {
  return useLiveQuery(() => db.tasteProfiles.get('me'), []);
}

export function useBottleNotes(): Map<string, string> {
  const rows = useLiveQuery(() => db.bottleNotes.toArray(), []);
  return useMemo(() => new Map((rows ?? []).map((r) => [r.bottleId, r.text])), [rows]);
}

export function neutralVector(): FlavorVector {
  return FLAVOR_AXES.reduce((v, a) => { v[a] = 5; return v; }, {} as FlavorVector);
}

export { inventoryRepo };
