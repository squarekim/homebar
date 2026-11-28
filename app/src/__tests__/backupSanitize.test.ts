import { describe, it, expect } from 'vitest';
import { sanitizeSnapshot } from '../services/backupService';
import type { BackupSnapshot } from '../models/types';

describe('sanitizeSnapshot', () => {
  it('이상한 값은 고치고 아이디 없는 행은 버린다', () => {
    const s = sanitizeSnapshot({
      schema: 'homebar-platform', version: 1, exportedAt: '',
      inventory: [{ ingredientId: 'a', owned: 'false', remaining: 1e400 } as any, { owned: true } as any],
      drinkLogs: [{ id: 'l', drinkId: 'd', date: '2026-01-01', rating: 9, flavorRatings: { smoke: NaN, sweet: 12, foo: 3 } } as any],
      tasteProfiles: [{ id: 'me', vector: null } as any],
      substitutions: [],
    } as BackupSnapshot);
    expect(s.inventory).toHaveLength(1);
    expect(s.inventory[0]).toMatchObject({ owned: false, remaining: 0 });
    expect(s.drinkLogs[0]).toMatchObject({ rating: 5, flavorRatings: { sweet: 10 } });
    expect(Object.values(s.tasteProfiles[0]!.vector).every((v) => v === 5)).toBe(true);
  });
});
