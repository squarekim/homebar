/**
 * backupService — 사용자 상태 JSON 백업/복원.
 * 순수 로직만 담당(문자열 <-> DB). 파일 다운로드/업로드는 UI 계층이 처리(Capacitor 호환).
 */
import { db } from '../db/schema';
import { type BackupSnapshot, type FlavorVector, FLAVOR_AXES } from '../models/types';
import { isExampleOn, setExample } from '../db/migrate';

/** 숫자가 아니거나 범위를 벗어난 값은 범위 안으로. 숫자가 아니면 fallback */
const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
const cleanVector = (v: unknown): FlavorVector => {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return Object.fromEntries(FLAVOR_AXES.map((a) => [a, clamp(o[a], 0, 10, 5)])) as FlavorVector;
};
/** 백업 파일의 각 행을 앱이 쓰는 모양으로 고친다. 고칠 수 없는 행(아이디 없음)은 버린다 */
export function sanitizeSnapshot(s: BackupSnapshot): BackupSnapshot {
  const str = (v: unknown) => typeof v === 'string' && v.length > 0;
  return {
    ...s,
    inventory: s.inventory.filter((r) => str(r?.ingredientId)).map((r) => {
      const owned = r.owned === true;
      return { ...r, owned, remaining: clamp(r.remaining, 0, 100, owned ? 100 : 0), updatedAt: clamp(r.updatedAt, 0, Infinity, 0) };
    }),
    drinkLogs: s.drinkLogs.filter((l) => str(l?.id) && str(l?.drinkId) && !Number.isNaN(Date.parse(l.date))).map((l) => ({
      ...l,
      rating: clamp(l.rating, 0, 5, 0),
      retryIntent: l.retryIntent === true,
      flavorRatings: Object.fromEntries(Object.entries(l.flavorRatings && typeof l.flavorRatings === 'object' ? l.flavorRatings : {})
        .filter(([a, v]) => (FLAVOR_AXES as readonly string[]).includes(a) && typeof v === 'number' && Number.isFinite(v))
        .map(([a, v]) => [a, clamp(v, 0, 10, 5)])),
    })),
    tasteProfiles: s.tasteProfiles.filter((p) => str(p?.id)).map((p) => ({
      ...p, vector: cleanVector(p.vector), ...(p.testVector ? { testVector: cleanVector(p.testVector) } : {}),
    })),
  };
}
import { readAll as readRatios, writeAll as writeRatios } from './scaleAmount';

const SCHEMA = 'homebar-platform';
const VERSION = 1;

const LAST_KEY = 'homebar.lastBackup';

/** 마지막 백업 시각(ms). 브라우저 저장소가 막혀 있으면 0. */
export function lastBackupAt(): number {
  try { return Number(localStorage.getItem(LAST_KEY)) || 0; } catch { return 0; }
}
export function markBackedUp(): void {
  try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch { /* 저장 못 해도 백업 파일은 만들어졌다 */ }
}

export const backupService = {
  async exportSnapshot(): Promise<BackupSnapshot> {
    const [inventory, drinkLogs, tasteProfiles, substitutions, bottleNotes, userBottles] = await Promise.all([
      db.inventory.toArray(),
      db.drinkLogs.toArray(),
      db.tasteProfiles.toArray(),
      db.substitutions.toArray(),
      db.bottleNotes.toArray(),
      db.userBottles.toArray(),
    ]);
    return { schema: SCHEMA, version: VERSION, exportedAt: new Date().toISOString(), inventory, drinkLogs, tasteProfiles, substitutions, bottleNotes, userBottles, myRatios: readRatios(), exampleOn: isExampleOn() };
  },

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.exportSnapshot(), null, 2);
  },

  validate(obj: unknown): obj is BackupSnapshot {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Partial<BackupSnapshot>;
    return o.schema === SCHEMA && Array.isArray(o.inventory) && Array.isArray(o.drinkLogs)
      && Array.isArray(o.tasteProfiles) && Array.isArray(o.substitutions);
  },

  /** mode: replace(전체 교체) | merge(병합) */
  async importSnapshot(raw: BackupSnapshot, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    const snapshot = sanitizeSnapshot(raw);
    await db.transaction('rw', [db.inventory, db.drinkLogs, db.tasteProfiles, db.substitutions, db.bottleNotes, db.userBottles], async () => {
      if (mode === 'replace') {
        await Promise.all([db.inventory.clear(), db.drinkLogs.clear(), db.tasteProfiles.clear(), db.substitutions.clear(), db.bottleNotes.clear(), db.userBottles.clear()]);
      }
      await db.inventory.bulkPut(snapshot.inventory);
      await db.drinkLogs.bulkPut(snapshot.drinkLogs);
      await db.tasteProfiles.bulkPut(snapshot.tasteProfiles);
      await db.substitutions.bulkPut(snapshot.substitutions);
      if (snapshot.bottleNotes?.length) await db.bottleNotes.bulkPut(snapshot.bottleNotes);
      if (snapshot.userBottles?.length) await db.userBottles.bulkPut(snapshot.userBottles);
    });
    if (mode === 'replace') { setExample(snapshot.exampleOn === true); await db.meta.delete('preExample'); }
    if (snapshot.myRatios) writeRatios(mode === 'replace' ? snapshot.myRatios : { ...readRatios(), ...snapshot.myRatios });
  },

  async importJson(json: string, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    const obj = JSON.parse(json);
    if (!this.validate(obj)) throw new Error('백업 파일 형식이 맞지 않아요.');
    await this.importSnapshot(obj, mode);
  },
};
