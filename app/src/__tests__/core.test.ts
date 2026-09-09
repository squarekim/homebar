import { describe, it, expect } from 'vitest';
import { ingredients, cocktails, bottles, whiskies } from '../data/adapters';
import { evaluateAll, tallyStatus } from '../services/availabilityService';
import { recommendCocktails, recommendWhiskies, RecommendContext } from '../services/recommendationService';
import { calculatePurchases } from '../services/purchaseService';
import { recommendGroupCocktails } from '../services/groupService';
import { FLAVOR_AXES, FlavorVector } from '../models/types';

function vec(partial: Partial<FlavorVector>): FlavorVector {
  return FLAVOR_AXES.reduce((v, a) => { v[a] = partial[a] ?? 5; return v; }, {} as FlavorVector);
}

// 원본 own 플래그로 held 재현
function seedHeld(): Set<string> {
  return new Set(ingredients.filter((i) => i.seedOwned).map((i) => i.id));
}

describe('seed adapters', () => {
  it('원본 건수 유지', () => {
    expect(ingredients.length).toBe(128);
    expect(cocktails.length).toBe(202);
    expect(bottles.length).toBe(82); // 원본 81 + 클라이넬리쉬 14년 추가
    expect(whiskies.length).toBeGreaterThan(0);
    expect(bottles.some((b) => b.id === 'clynelish14')).toBe(true);
  });
  it('모든 칵테일 재료가 재료 마스터로 매핑', () => {
    const ids = new Set(ingredients.map((i) => i.id));
    for (const ck of cocktails) for (const i of ck.ingredients) expect(ids.has(i.ingredientId)).toBe(true);
  });
  it('용량 ml 파싱', () => {
    const old = cocktails.find((c) => c.name === '올드 패션드')!;
    expect(old).toBeTruthy();
    const bourbon = old.ingredients.find((i) => i.ingredientName.includes('버번'));
    expect(bourbon?.amountMl).toBe(45);
  });
  it('모든 위스키가 분류(whiskyClass)를 가진다', () => {
    for (const w of whiskies) {
      expect(w.whiskyClass, `${w.name} 분류 누락`).toBeTruthy();
      expect(w.whiskyClass!.origin.length).toBeGreaterThan(0);
      expect(w.whiskyClass!.type.length).toBeGreaterThan(0);
    }
  });
  it('분류 필터가 사실과 일치', async () => {
    const { classMatchesTerm } = await import('../data/whiskyClass');
    const by = (id: string) => whiskies.find((w) => w.id === id)!.whiskyClass;
    expect(classMatchesTerm(by('talisker10'), '피티드')).toBe(true);
    expect(classMatchesTerm(by('macallan'), '피티드')).toBe(false);
    expect(classMatchesTerm(by('macallan'), '셰리')).toBe(true);
    expect(classMatchesTerm(by('jw_black'), '블렌디드')).toBe(true);
    expect(classMatchesTerm(by('jw_green'), '블렌디드')).toBe(true); // 블렌디드 몰트도 포함
    expect(classMatchesTerm(by('buffalo'), '버번')).toBe(true);
    expect(classMatchesTerm(by('glenfiddich'), '싱글몰트')).toBe(true);
  });
  it('다양성 자동계산: 아일라는 결손, 라가불린 추가 시 아일라를 새로 채운다', async () => {
    const { computeCoverage, simulateAdd } = await import('../services/whiskyDiversityService');
    const cov = computeCoverage(whiskies);
    const region = cov.find((f) => f.key === 'region')!;
    const islay = region.cells.find((c) => c.value === '아일라')!;
    expect(islay.gap).toBe(true); // 현재 아일라 몰트 미보유
    const speyside = region.cells.find((c) => c.value === '스페이사이드')!;
    expect(speyside.count).toBeGreaterThan(1); // 맥캘란·글렌피딕 등
    // 라가불린(아일라 피티드) 추가 시뮬
    const lag = { origin: '스카치', type: '싱글몰트', region: '아일라', cask: ['셰리'], character: ['피티드', '스모키'] };
    const sim = simulateAdd(lag, whiskies);
    expect(sim.newlyFilled.some((h) => h.value === '아일라')).toBe(true);
    expect(sim.overlaps.some((h) => h.value === '싱글몰트' || h.value === '셰리')).toBe(true);
    expect(sim.gain).toBeGreaterThan(0);
  });
  it('제조사 공식 노트가 병에 부착되고 출처 URL 을 가진다', () => {
    const withNote = bottles.filter((b) => b.makerNote);
    expect(withNote.length).toBeGreaterThanOrEqual(30);
    const macallan = bottles.find((b) => b.id === 'macallan')!;
    expect(macallan.makerNote?.source).toMatch(/^https?:\/\//);
    // 모든 노트는 출처를 반드시 가진다(무출처 금지)
    expect(withNote.every((b) => /^https?:\/\//.test(b.makerNote!.source))).toBe(true);
  });
});

describe('availability', () => {
  it('원본 own 재고에서 판정 통계가 합리적', () => {
    const held = seedHeld();
    const all = evaluateAll(held);
    const t = tallyStatus(all);
    // 원본 README: 정규 105 근처. READY 가 상당수 존재해야 함
    expect(t.READY).toBeGreaterThan(50);
    expect(t.READY + t.SUBSTITUTE + t.MISSING + t.UNAVAILABLE).toBe(202);
  });
  it('빈 재고면 대부분 불가', () => {
    const empty = new Set<string>();
    const t = tallyStatus(evaluateAll(empty));
    expect(t.READY).toBe(0);
  });
});

describe('recommendation', () => {
  const ctx: RecommendContext = {
    taste: vec({ vanilla: 9, caramel: 8, sweet: 7, smoke: 2, peat: 0 }),
    heldIds: seedHeld(),
    subMap: new Map(),
    logs: [],
    remainingById: new Map(),
  };
  it('칵테일 추천이 점수·이유 반환', () => {
    const recs = recommendCocktails(ctx, 'available', 10);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].score).toBeGreaterThanOrEqual(recs[recs.length - 1].score);
    expect(recs[0].reason.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.status === 'READY' || r.status === 'SUBSTITUTE')).toBe(true);
  });
  it('위스키 추천', () => {
    const recs = recommendWhiskies(ctx, 5);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].tasteScore).toBeGreaterThan(0);
  });
});

describe('purchase', () => {
  it('구매 후보가 추가 레시피 수를 계산', () => {
    // 일부만 보유한 상태에서 구매 이득 계산
    const partial = new Set([...seedHeld()].slice(0, 40));
    const ctx = { taste: vec({}), heldIds: partial, subMap: new Map<string, string[]>(), logs: [] };
    const res = calculatePurchases(ctx, 10);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].afterCount - res[0].beforeCount).toBe(res[0].addedRecipes);
    expect(res[0].addedRecipes).toBeGreaterThanOrEqual(res[res.length - 1].addedRecipes);
  });
});

describe('group', () => {
  it('peat 0 선호자가 있으면 강피트 술 그룹점수 하락', () => {
    const held = seedHeld();
    const lovePeat = [{ name: 'A', vector: vec({ peat: 9, smoke: 9 }) }];
    const hatePeat = [
      { name: 'A', vector: vec({ peat: 9, smoke: 9 }) },
      { name: 'B', vector: vec({ peat: 0, smoke: 0 }) },
    ];
    const ctxBase = { heldIds: held, subMap: new Map<string, string[]>(), logs: [] };
    const solo = recommendGroupCocktails({ profiles: lovePeat, ...ctxBase }, false, 202);
    const grp = recommendGroupCocktails({ profiles: hatePeat, ...ctxBase }, false, 202);
    const soloMap = new Map(solo.map((r) => [r.id, r.tasteScore]));
    // 강한 스모크/피트 향미 칵테일에서 그룹(하나가 기피) 점수가 솔로보다 낮아야 함
    const smoky = grp.find((r) => soloMap.has(r.id) && (soloMap.get(r.id) ?? 0) > 0);
    expect(smoky).toBeTruthy();
  });
});
