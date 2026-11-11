/**
 * migrate.ts — 최초 실행 시 시드 및 레거시 데이터 이관.
 * - 재고: 레거시 localStorage['homebar.v54.held'](재료명 배열)이 있으면 이관, 없으면 원본 own 플래그.
 * - 대체재: adapters.substitutions 시드.
 * - 취향: 중립 프로필 'me' 1개 생성.
 */
import { db } from './schema';
import { ingredients, ingredientIdOf, substitutions as seedSubs } from '../data/adapters';
import { type InventoryItem, type TasteProfile, FLAVOR_AXES, type FlavorVector } from '../models/types';
import { IS_PUBLIC, STARTER_INVENTORY, LEGACY_STARTER_INVENTORY } from '../config';

const STARTER = new Set(STARTER_INVENTORY);
const LEGACY_STARTER = new Set(LEGACY_STARTER_INVENTORY);
/**
 * 처음 설치했을 때의 재고. 공개 배포는 아무것도 가진 것으로 두지 않는다 —
 * 넣지도 않은 술로 "지금 만들 수 있어요"라고 말하면 거짓이 된다. 개인 빌드는 원본 own 플래그를 따른다.
 */
function defaultOwned(ing: { name: string; seedOwned: boolean }): boolean {
  return IS_PUBLIC ? false : ing.seedOwned;
}
/** 사용자가 "예시로 둘러보기"를 직접 골랐을 때만 쓰는 기본 홈바 세트 */
function exampleOwned(ing: { name: string; seedOwned: boolean }): boolean {
  return IS_PUBLIC ? STARTER.has(ing.name) : ing.seedOwned;
}

/** 예시 세트를 켜 둔 상태인지 — 화면이 "예시로 보는 중"이라고 알려 주는 데 쓴다 */
const EXAMPLE_KEY = 'homebar.exampleInventory';
export function isExampleOn(): boolean { try { return localStorage.getItem(EXAMPLE_KEY) === '1'; } catch { return false; } }
function setExample(on: boolean): void { try { if (on) localStorage.setItem(EXAMPLE_KEY, '1'); else localStorage.removeItem(EXAMPLE_KEY); } catch { /* 저장이 막혀도 계속 */ } }

const SEED_VERSION = 6;
/**
 * 버전마다 새로 생긴 재료 — 이미 시드된 기기에도 재고 줄(미보유)과 그 재료의 대체 관계만 더한다.
 * 사용자가 지운 대체 관계를 되살리지 않도록, 그 버전에 처음 생긴 재료의 것만 넣는다.
 *   3: 한 레시피에만 쓰이던 병의 대체 관계
 *   2: 마이 타이를 IBA 원문대로 고치며 생긴 '오렌지 큐라소'(scripts/fixIbaMaiTai.mjs)
 */
const ADDED_IN: Record<number, string[]> = {
  2: ['오렌지 큐라소'],
  // 3: 한 레시피에만 쓰이던 병에 대체 관계를 더했다(이미 있는 재료라 재고 줄은 그대로, 대체 관계만 들어간다)
  // 5: 좁게 적힌 재료를 같은 술의 넓은 이름으로 잇는 대체 관계만 더한다
  5: ['쿠바산 화이트 럼', '100% 아가베 데킬라', '버번 또는 라이'],
  4: ['셰리(아몬티야도)'],
  3: ['그린 크렘 드 멘트', '화이트 크렘 드 멘트', '크렘 드 멘트', '크렘 드 뮈르', '보드카 시트론', '블렌디드 스카치', 'XO 브랜디(코냑 외)'],
};
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
  const untouchedElsewhere = (await db.userBottles.count()) === 0 && (await db.drinkLogs.count()) === 0;

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

    // 이전 버전에서 올라온 기기: 그 뒤로 생긴 재료만 더한다
    const from = typeof seeded?.value === 'number' ? seeded.value : SEED_VERSION;
    for (let v = from + 1; v <= SEED_VERSION; v++) {
      for (const name of ADDED_IN[v] ?? []) {
        const id = ingredientIdOf(name);
        if (!(await db.inventory.get(id))) {
          await db.inventory.put({ ingredientId: id, ingredientName: name, owned: false, remaining: 0, updatedAt: now });
        }
        const subs = seedSubs.filter((x) => x.ingredientId === id);
        for (const sub of subs) if (!(await db.substitutions.get(sub.id))) await db.substitutions.put(sub);
      }
    }

    // 6: 공개 배포가 예전에 미리 켜 두던 기본 홈바 세트를 끈다 — 손대지 않은 기기에서만
    //    (재고가 세트와 똑같고, 넣은 술도 기록도 없을 때). 하나라도 바꿨다면 사용자의 것으로 보고 그대로 둔다.
    if (IS_PUBLIC && typeof seeded?.value === 'number' && seeded.value < 6) {
      const inv = await db.inventory.toArray();
      const owned = inv.filter((r) => r.owned).map((r) => r.ingredientName);
      const untouched = owned.length === LEGACY_STARTER.size && owned.every((n) => LEGACY_STARTER.has(n));
      if (untouched && untouchedElsewhere) {
        await db.inventory.bulkPut(inv.map((r) => ({ ...r, owned: false, remaining: 0, updatedAt: now })));
      }
    }

    await db.meta.put({ key: 'seedVersion', value: SEED_VERSION });
    if (legacy) await db.meta.put({ key: 'legacyImported', value: now });
  });
}

/** 예시 재고 켜기 — 공개 배포는 기본 홈바 세트, 개인 빌드는 원본 컬렉션 */
export async function resetInventoryToSeed(): Promise<void> {
  const now = Date.now();
  const rows: InventoryItem[] = ingredients.map((ing) => {
    const owned = exampleOwned(ing);
    return { ingredientId: ing.id, ingredientName: ing.name, owned, remaining: owned ? 100 : 0, updatedAt: now };
  });
  await db.inventory.bulkPut(rows);
  if (IS_PUBLIC) setExample(true);
}

/** 예시 재고 끄기 — 예시 세트에 든 재료만 끈다. 그 사이 사용자가 따로 켠 재료는 남긴다 */
export async function turnOffExample(): Promise<void> {
  const now = Date.now();
  // 예전 41가지 세트를 켜 둔 기기도 함께 끈다
  const rows = (await db.inventory.toArray()).filter((r) => r.owned && (STARTER.has(r.ingredientName) || LEGACY_STARTER.has(r.ingredientName)));
  await db.inventory.bulkPut(rows.map((r) => ({ ...r, owned: false, remaining: 0, updatedAt: now })));
  setExample(false);
}
/** 예시 표시만 내린다 — 재고는 그대로 두고 사용자가 직접 고쳐 쓰기로 했을 때 */
export function keepExampleAsMine(): void { setExample(false); }

/** ingredientId 매핑 재노출(마이그레이션 유틸) */
export { ingredientIdOf };
