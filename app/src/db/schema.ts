/**
 * schema.ts — Dexie(IndexedDB) 정의.
 * 사용자 가변 상태만 저장한다: inventory / drinkLogs / tasteProfiles / substitutions / meta.
 * 참조 데이터(재료·칵테일·병)는 seed 에서 파생되며 여기 저장하지 않는다.
 * 저장소 교체(Supabase 등) 시 이 파일과 repository 만 갈아끼우면 되도록 격리.
 */
import Dexie, { Table } from 'dexie';
import { InventoryItem, DrinkLog, TasteProfile, IngredientSubstitution, UserBottle } from '../models/types';
import { categoryFromGroup } from '../data/liquorCategory';

interface MetaRow { key: string; value: unknown; }
/** 사용자가 직접 적는 병별 개인 노트 (공식 makerNote 와 별개) */
export interface BottleNote { bottleId: string; text: string; updatedAt: number; }

export class HomeBarDB extends Dexie {
  inventory!: Table<InventoryItem, string>;
  drinkLogs!: Table<DrinkLog, string>;
  tasteProfiles!: Table<TasteProfile, string>;
  substitutions!: Table<IngredientSubstitution, string>;
  bottleNotes!: Table<BottleNote, string>;
  userBottles!: Table<UserBottle, string>;
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
    // v2: 사용자 병별 개인 노트 추가 (기존 스토어는 그대로 보존)
    this.version(2).stores({
      bottleNotes: 'bottleId',
    });
    // v3: 사용자가 직접 추가한 보유 술
    this.version(3).stores({
      userBottles: 'id, group, createdAt',
    });
    // v4: 주류 마스터 DB 연동 필드(category/masterId/ingredientId/source) 인덱스 + 기존 행 보정
    this.version(4).stores({
      userBottles: 'id, group, category, masterId, ingredientId, createdAt',
    }).upgrade(async (tx) => {
      await tx.table('userBottles').toCollection().modify((b: UserBottle) => {
        if (!b.source) b.source = 'user';              // v3 이전에 직접 입력한 병
        if (!b.category) b.category = categoryFromGroup(b.group);
      });
    });
  }
}

export const db = new HomeBarDB();
