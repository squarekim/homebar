import { describe, it, expect } from 'vitest';
import { tasteGaps } from '../services/flavorService';
import { zeroVector } from '../models/types';

describe('tasteGaps', () => {
  it('2점 이상 다른 축만 차이 큰 순으로', () => {
    const t = zeroVector(), a = zeroVector();
    a.sweet = 5; a.oak = 1; t.smoke = 3;
    expect(tasteGaps(t, a).map((g) => g.axis)).toEqual(['sweet', 'smoke']);
  });
});
