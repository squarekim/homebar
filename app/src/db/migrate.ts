/**
 * migrate.ts — 최초 실행 시 시드 및 레거시 데이터 이관.
 * - 재고: 레거시 localStorage['homebar.v54.held'](재료명 배열)이 있으면 이관, 없으면 원본 own 플래그.
 * - 대체재: adapters.substitutions 시드.
 * - 취향: 중립 프로필 'me' 1개 생성.
 */
import { db } from './schema';
import { ingredients, ingredientIdOf, substitutions as seedSubs } from '../data/adapters';
import { InventoryItem, TasteProfile, FLAVOR_AXES, FlavorVector } from '../models/types';
import { IS_PUBLIC, STARTER_INVENTORY } from '../config';

/** 기본 재고 = 공개 배포면 '기본 홈바 세트', 개인 빌드면 원본 own 플래그 */
const STARTER = new Set(STARTER_INVENTORY);
function defaultOwned(ing: { name: string; seedOwned: boolean }): boolean {
  return IS_PUBLIC ? STARTER.has(ing.name) : ing.seedOwned;
}

const SEED_VERSION = 1;
const LEGACY_KEY = 'homebar.v54.held';

function neutralVector(): FlavorVector {
  return FLAVOR_AXES.reduce((v, a) => { v[a] = 5; return v; }, {} as FlavorVector);
}

function readLegacyHeld(): Set<string> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const names: string[] = JSON.parse(raw);
    if (!Array.isArray(names)) return null;
    return new Set(names);
  } catch {
    return null;
  }
}

export async function ensureSeeded(): Promise<void> {
  const seeded = await db.meta.get('seedVersion');
  if (seeded && seeded.value === SEED_VERSION) return;

  const legacy = readLegacyHeld();
  const now = Date.now();

  await db.transaction('rw', db.inventory, db.tasteProfiles, db.substitutions, db.meta, async () => {
    // 재고 시드 (기존 레코드가 없을 때만)
    const invCount = await db.inventory.count();
    if (invCount === 0) {
      const rows: InventoryItem[] = ingredients.map((ing) => {
        const owned = legacy ? legacy.has(ing.name) : defaultOwned(ing);
        return {
          ingredientId: ing.id,
          ingredientName: ing.name,
          owned,
          remaining: owned ? 100 : 0,
          updatedAt: now,
        };
      });
      await db.inventory.bulkPut(rows);
    }

    // 대체재 시드
    const subCount = await db.substitutions.count();
    if (subCount === 0 && seedSubs.length) {
      await db.substitutions.bulkPut(seedSubs);
    }

    // 취향 프로필 시드
    const tpCount = await db.tasteProfiles.count();
    if (tpCount === 0) {
      const me: TasteProfile = { id: 'me', name: '나', vector: neutralVector(), updatedAt: now, source: 'manual' };
      await db.tasteProfiles.put(me);
    }

    await db.meta.put({ key: 'seedVersion', value: SEED_VERSION });
    if (legacy) await db.meta.put({ key: 'legacyImported', value: now });
  });
}

/** 재고를 기본 구성으로 리셋(레거시의 '기본 컬렉션' 버튼 대응) */
export async function resetInventoryToSeed(): Promise<void> {
  const now = Date.now();
  const rows: InventoryItem[] = ingredients.map((ing) => {
    const owned = defaultOwned(ing);
    return { ingredientId: ing.id, ingredientName: ing.name, owned, remaining: owned ? 100 : 0, updatedAt: now };
  });
  await db.inventory.bulkPut(rows);
}

/** ingredientId 매핑 재노출(마이그레이션 유틸) */
export { ingredientIdOf };
