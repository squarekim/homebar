/**
 * backupService — 사용자 상태 JSON 백업/복원.
 * 순수 로직만 담당(문자열 <-> DB). 파일 다운로드/업로드는 UI 계층이 처리(Capacitor 호환).
 */
import { db } from '../db/schema';
import { type BackupSnapshot } from '../models/types';

const SCHEMA = 'homebar-platform';
const VERSION = 1;

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
    return { schema: SCHEMA, version: VERSION, exportedAt: new Date().toISOString(), inventory, drinkLogs, tasteProfiles, substitutions, bottleNotes, userBottles };
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
  async importSnapshot(snapshot: BackupSnapshot, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
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
  },

  async importJson(json: string, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    const obj = JSON.parse(json);
    if (!this.validate(obj)) throw new Error('백업 스키마가 올바르지 않습니다.');
    await this.importSnapshot(obj, mode);
  },
};
