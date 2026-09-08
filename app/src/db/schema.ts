/**
 * schema.ts — Dexie(IndexedDB) 정의.
 * 사용자 가변 상태만 저장한다: inventory / drinkLogs / tasteProfiles / substitutions / meta.
 * 참조 데이터(재료·칵테일·병)는 seed 에서 파생되며 여기 저장하지 않는다.
 * 저장소 교체(Supabase 등) 시 이 파일과 repository 만 갈아끼우면 되도록 격리.
 */
import Dexie, { Table } from 'dexie';
import { InventoryItem, DrinkLog, TasteProfile, IngredientSubstitution } from '../models/types';

interface MetaRow { key: string; value: unknown; }

export class HomeBarDB extends Dexie {
  inventory!: Table<InventoryItem, string>;
  drinkLogs!: Table<DrinkLog, string>;
  tasteProfiles!: Table<TasteProfile, string>;
  substitutions!: Table<IngredientSubstitution, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('homebar-platform');
    this.version(1).stores({
      inventory: 'ingredientId',
      drinkLogs: 'id, drinkId, drinkType, date',
      tasteProfiles: 'id',
      substitutions: 'id, ingredientId, substituteId',
      meta: 'key',
    });
  }
}

export const db = new HomeBarDB();
