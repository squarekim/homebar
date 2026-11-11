import { describe, expect, it } from 'vitest';
import { weightedPick } from '../services/pickService';

describe('weightedPick', () => {
  it('앞쪽 후보일수록 넓은 구간을 차지한다', () => {
    // 후보 3개 → 가중치 3,2,1 (합 6)
    expect(weightedPick(3, null, () => 0)).toBe(0);
    expect(weightedPick(3, null, () => 2.9 / 6)).toBe(0);
    expect(weightedPick(3, null, () => 3.1 / 6)).toBe(1);
    expect(weightedPick(3, null, () => 5.9 / 6)).toBe(2);
  });
  it('바로 전에 나온 잔은 빼고 고른다', () => {
    for (let k = 0; k < 20; k++) expect(weightedPick(3, 0, () => k / 20)).not.toBe(0);
  });
  it('후보가 하나면 같은 잔이라도 그대로 낸다', () => {
    expect(weightedPick(1, 0, () => 0.5)).toBe(0);
  });
  it('후보가 없으면 -1', () => {
    expect(weightedPick(0, null)).toBe(-1);
  });
});
