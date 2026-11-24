import { describe, it, expect } from 'vitest';
import { interleaveByBase } from '../services/recommendationService';
import { type RecommendationResult } from '../models/types';

const r = (id: string, base: string) => ({ id, base, kind: 'cocktail' } as RecommendationResult);

describe('interleaveByBase', () => {
  it('몰린 베이스가 맨 앞에 서지 않고 번갈아 선다', () => {
    const out = interleaveByBase([r('w1', '위스키'), r('w2', '위스키'), r('w3', '위스키'), r('g1', '진'), r('v1', '보드카')]);
    expect(out.map((x) => x.id)).toEqual(['g1', 'v1', 'w1', 'w2', 'w3']);
  });
});
