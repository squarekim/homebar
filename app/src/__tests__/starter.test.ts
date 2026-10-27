import { describe, it, expect } from 'vitest';
import { FLAVOR_AXES } from '../models/types';
import { liquorMasterById } from '../data/liquorMaster';
import { referenceRepo } from '../repositories/referenceRepo';
import {
  DRINK_CARDS, LIQUOR_CARDS, STARTER_PICKS, STARTER_PRICES, priceBandLabel,
} from '../data/starterGuide';
import { cardsFor, examplesFor, tasteFromCards, starterRecommend } from '../services/starterService';

describe('입문 취향 찾기 데이터', () => {
  it('추천 38개는 모두 기준 DB 위스키나 레시피를 가리킨다', () => {
    expect(STARTER_PICKS).toHaveLength(38);
    for (const p of STARTER_PICKS) {
      if (p.kind === 'whisky') expect(liquorMasterById.get(p.id)?.category, p.id).toBe('whisky');
      else expect(referenceRepo.cocktailById(p.id), p.id).toBeDefined();
    }
  });

  it('카드 향미는 14축 안의 0~10 값만 쓴다', () => {
    for (const c of [...DRINK_CARDS, ...LIQUOR_CARDS]) {
      for (const [axis, v] of Object.entries(c.flavor)) {
        expect(FLAVOR_AXES as readonly string[], `${c.id}.${axis}`).toContain(axis);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(10);
      }
    }
  });

  it('가격은 입문 위스키에만 있다', () => {
    const whiskyIds = new Set(STARTER_PICKS.filter((p) => p.kind === 'whisky').map((p) => p.id));
    for (const id of Object.keys(STARTER_PRICES)) expect(whiskyIds.has(id), id).toBe(true);
  });

  it('가격대는 10만 원 미만이면 1만 원, 그 위는 5만 원 단위로 묶는다', () => {
    expect(priceBandLabel(45900)).toBe('4~5만 원');
    expect(priceBandLabel(115200)).toBe('10~15만 원');
    expect(priceBandLabel(595200)).toBe('50~60만 원');
  });

  it('라거 카드는 기준 DB 의 라거를 예시로 든다', () => {
    const lager = LIQUOR_CARDS.find((c) => c.id === 'l_lager')!;
    expect(examplesFor(lager, 10)).toContain('테라');
  });
});

describe('입문 추천', () => {
  it('술을 잘 안 마시면 음료 카드만 보여 준다', () => {
    expect(cardsFor('rarely').every((c) => c.id.startsWith('d_'))).toBe(true);
    expect(cardsFor('often').some((c) => c.id === 'l_lager')).toBe(true);
  });

  it('좋아요가 없으면 취향을 만들지 않는다', () => {
    expect(tasteFromCards([], ['d_cola'])).toBeNull();
  });

  it('별로는 좋아요보다 약하게 뺀다', () => {
    const t = tasteFromCards(['d_cola', 'd_americano'], ['d_darkchoco'])!;
    expect(t.chocolate).toBeGreaterThan(0);
    expect(t.sweet).toBeGreaterThan(t.chocolate);
  });

  it('예산을 넘는 위스키는 빼고, 가격을 모르는 병은 남긴다', () => {
    const r = starterRecommend({ habit: 'often', likes: ['d_cola'], dislikes: [], strength: 'strong', budget: 'u3' }, 18);
    for (const w of r.whiskies) {
      const price = STARTER_PRICES[w.pick.id];
      if (price != null) expect(price, w.name).toBeLessThanOrEqual(30000);
      else expect(w.priceLabel).toBeUndefined();
    }
  });

  it('가볍게를 고르면 43% 넘는 위스키는 나오지 않는다', () => {
    const r = starterRecommend({ habit: 'often', likes: ['l_highball'], dislikes: [], strength: 'light', budget: 'unknown' }, 18);
    expect(r.whiskies.length).toBeGreaterThan(0);
    for (const w of r.whiskies) expect(w.abv ?? 0, w.name).toBeLessThanOrEqual(43);
  });

  it('과일 음료를 좋아하면 과일 칵테일이 커피 칵테일보다 앞선다', () => {
    const r = starterRecommend({ habit: 'rarely', likes: ['d_orange', 'd_cranberry'], dislikes: [], strength: 'unknown', budget: 'unknown' }, 20);
    const idx = (id: string) => r.cocktails.findIndex((c) => c.pick.id === id);
    expect(idx('ck_d3n1iy')).toBeLessThan(idx('ck_sx6kgy')); // 섹스 온 더 비치 > 블랙 러시안
  });
});
