import { describe, it, expect } from 'vitest';
import { ingredients, whiskies } from '../data/adapters';
import { summarizeLogs, TASTE_MIN_LOGS } from '../services/flavorService';
import { cocktailsForBottle } from '../services/pairingService';
import { type DrinkLog } from '../models/types';

const log = (name: string, rating: number, type: DrinkLog['drinkType'] = 'cocktail', retry = false): DrinkLog => ({
  id: `${name}-${rating}-${Math.round(rating * 7)}`, drinkId: name, drinkType: type, drinkName: name,
  date: '2026-11-01', servingStyle: type === 'cocktail' ? 'cocktail' : 'neat', rating, retryIntent: retry, flavorRatings: {},
});

describe('취향 화면의 기록 요약', () => {
  it('3잔 미만이면 취향을 말하지 않는다', () => {
    expect(TASTE_MIN_LOGS).toBe(3);
    expect(summarizeLogs([]).enough).toBe(false);
    expect(summarizeLogs([log('네그로니', 4), log('김렛', 3)]).enough).toBe(false);
  });
  it('잔 수·평균·종류·자주 마신 잔·높게 평가한 잔을 센다', () => {
    const s = summarizeLogs([log('네그로니', 5, 'cocktail', true), log('네그로니', 3), log('김렛', 4), log('탈리스커 10년', 2, 'whisky')]);
    expect(s.enough).toBe(true);
    expect(s.count).toBe(4);
    expect(s.avg).toBeCloseTo(3.5);
    expect(s.retry).toBe(1);
    expect(s.kinds).toEqual({ cocktail: 3, whisky: 1, other: 0 });
    expect(s.often).toEqual([{ name: '네그로니', n: 2 }]);
    expect(s.loved).toEqual([{ name: '네그로니', rating: 5 }, { name: '김렛', rating: 4 }]);
  });
});

describe('이 위스키로 만들면 좋아요', () => {
  const held = new Set(ingredients.filter((i) => i.seedOwned).map((i) => i.id));
  it('그 병이 재료로 들어가는 칵테일만 최대 2개 고른다', () => {
    const w = whiskies.find((b) => b.ingredientIds.length > 0)!;
    const pairs = cocktailsForBottle(w, held, new Map());
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.length).toBeLessThanOrEqual(2);
    for (const p of pairs) expect(p.cocktail.ingredients.some((i) => w.ingredientIds.includes(i.ingredientId))).toBe(true);
  });
  it('만들 수 있는 잔이 부족한 잔보다 먼저 온다', () => {
    const w = whiskies.find((b) => b.ingredientIds.length > 0)!;
    const all = cocktailsForBottle(w, held, new Map(), 500).map((p) => p.status === 'READY' || p.status === 'SUBSTITUTE');
    expect(all.indexOf(false) === -1 || all.lastIndexOf(true) < all.indexOf(false)).toBe(true);
  });
  it('재료와 이어지지 않은 병은 아무것도 고르지 않는다', () => {
    expect(cocktailsForBottle({ ingredientIds: [] }, held, new Map())).toEqual([]);
  });
});

import { fold, hits } from '../ui/listUtils';
import { substitutions, ingredientIdOf } from '../data/adapters';
import { computeCoverage } from '../services/whiskyDiversityService';

describe('검색어 접기', () => {
  it('표기가 달라도 같은 잔을 찾는다', () => {
    for (const q of ['마가리타', 'margarita', '모히또', 'Old Fashioned', '올드패션드', '올드 패션'])
      expect(['마르가리타', '모히토', '올드 패션드'].some((n) => hits(fold(q), n))).toBe(true);
  });
});

describe('좁게 적힌 재료의 대체', () => {
  it('쿠바산 화이트 럼은 화이트 럼으로 채운다', () => {
    expect(substitutions.some((s) => s.ingredientId === ingredientIdOf('쿠바산 화이트 럼') && s.substituteId === ingredientIdOf('화이트 럼'))).toBe(true);
    expect(substitutions.some((s) => s.ingredientId === ingredientIdOf('화이트 럼') && s.substituteId === ingredientIdOf('쿠바산 화이트 럼'))).toBe(false);
  });
});

describe('분류 표의 타입 칸', () => {
  it('블렌디드와 블렌디드 몰트를 따로 센다', () => {
    const type = computeCoverage(whiskies).find((f) => f.key === 'type')!;
    const n = (v: string) => type.cells.find((c) => c.value === v)!.count;
    expect(n('블렌디드')).toBe(7);
    expect(n('블렌디드 몰트')).toBe(1);
  });
});

import { GUIDE_CHAPTERS, GUIDE_FOR_TAB } from '../data/beginnerGuide';
describe('입문 안내 카드', () => {
  it('모든 카드에 본문과 출처 주소가 있다', () => {
    for (const ch of GUIDE_CHAPTERS) {
      expect(ch.cards.length).toBeGreaterThan(0);
      for (const c of ch.cards) {
        expect(c.body.join('').length).toBeGreaterThan(10);
        expect(c.sources.length).toBeGreaterThan(0);
        for (const s of c.sources) expect(s.url).toMatch(/^https:\/\//);
      }
    }
  });
  it('오해는 모두 12개이고 탭 안내는 있는 장을 가리킨다', () => {
    expect(GUIDE_CHAPTERS.flatMap((c) => c.cards).filter((c) => c.myth).length).toBe(12);
    for (const id of Object.values(GUIDE_FOR_TAB)) expect(GUIDE_CHAPTERS.some((c) => c.id === id)).toBe(true);
  });
});
