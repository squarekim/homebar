import { describe, it, expect } from 'vitest';
import { referenceRepo } from '../repositories/referenceRepo';
import { evaluateCocktail } from '../services/availabilityService';

describe('둘 중 하나로 적힌 재료', () => {
  it('버번만 있어도 올드 패션드는 정석으로 만들 수 있다', () => {
    const ck = referenceRepo.cocktails().find((c) => c.name === '올드 패션드')!;
    const byName = (n: string) => referenceRepo.ingredients().find((i) => i.name === n)!.id;
    const held = new Set(['버번', '각설탕', '앙고스투라 비터', '물'].map(byName));
    expect(evaluateCocktail(ck, held).status).toBe('READY');
  });
});
