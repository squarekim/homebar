import { describe, it, expect } from 'vitest';
import { whiskies, bottles } from '../data/adapters';
import { LIQUOR_MASTER } from '../data/liquorMaster';
import { CANDIDATE_WHISKIES } from '../data/candidateWhiskies';
import { caskVisualOf, drawsAsCask, PLAIN_OAK } from '../data/caskVisual';
import { type Bottle, type WhiskyClass } from '../models/types';

const base = whiskies[0]!;
const withClass = (c: WhiskyClass | undefined, name = '테스트 위스키'): Bottle => ({ ...base, name, whiskyClass: c });
const cls = (cask: string[], character: string[] = []): WhiskyClass => ({ origin: '스카치', type: '싱글몰트', cask, character });

describe('오크통 그림', () => {
  it('위스키만 통으로 그리고 그 밖의 술은 병으로 둔다', () => {
    expect(whiskies.every(drawsAsCask)).toBe(true);
    expect(bottles.filter((b) => b.group === '진').some(drawsAsCask)).toBe(false);
  });

  it('원본의 모든 캐스크 값에 판자 색이 정해져 있다', () => {
    const casks = new Set([
      ...LIQUOR_MASTER.flatMap((i) => i.whiskyClass?.cask ?? []),
      ...CANDIDATE_WHISKIES.flatMap((w) => w.cls.cask),
      ...whiskies.flatMap((w) => w.whiskyClass?.cask ?? []),
    ]);
    for (const k of casks) expect(caskVisualOf(withClass(cls([k]))).woods[0], k).not.toBe(PLAIN_OAK);
  });

  it('캐스크 수만큼 판자를 나누고, 셰리와 버번은 다른 색이다', () => {
    const v = caskVisualOf(withClass(cls(['셰리', '버번'])));
    expect(v.woods).toHaveLength(2);
    expect(v.woods[0]).not.toBe(v.woods[1]);
    expect(caskVisualOf(withClass(cls(['PX', '올로로소', '와인', '버번', '버진오크']))).woods).toHaveLength(4);
  });

  it('피티드만 연기를 그리고, 피트를 모르면 그리지 않는다', () => {
    expect(caskVisualOf(withClass(cls(['버번'], ['피티드']))).smoke).toBe(true);
    expect(caskVisualOf(withClass(cls(['버번'], ['논피트']))).smoke).toBe(false);
    expect(caskVisualOf(withClass(cls(['버번']))).smoke).toBe(false);
  });

  it('앞면에는 라벨 연수와 캐스크 스트렝스만 쓴다', () => {
    const v = caskVisualOf(withClass(cls(['셰리'], ['캐스크 스트렝스']), '어떤 싱글몰트 12년'));
    expect(v.age).toBe(12);
    expect(v.caskStrength).toBe(true);
    expect(caskVisualOf(withClass(cls(['셰리']), '어떤 싱글몰트')).age).toBeNull();
  });

  it('분류가 빈 공개 빌드에서도 오크색 통 하나로 성립한다', () => {
    const v = caskVisualOf(withClass(undefined, '어떤 위스키 18년'));
    expect(v).toEqual({ woods: [PLAIN_OAK], smoke: false, age: 18, caskStrength: false });
  });
});
