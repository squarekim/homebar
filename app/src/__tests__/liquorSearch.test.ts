import { describe, it, expect } from 'vitest';
import { searchLiquor, guessCategory } from '../services/liquorSearchService';
import { LIQUOR_MASTER, liquorMasterById } from '../data/liquorMaster';
import { ingredients } from '../data/adapters';
import { CATEGORY_GROUP } from '../data/liquorCategory';
import { MASTER_MAKER_NOTES } from '../data/makerNotesMaster';
import { SEED_BOTTLE_MASTER } from '../data/makerNotes';

const top = (q: string) => searchLiquor(q, { limit: 5 })[0]?.item.nameKo;

describe('liquor master', () => {
  it('제품 수와 필수 필드', () => {
    expect(LIQUOR_MASTER.length).toBeGreaterThanOrEqual(200);
    for (const i of LIQUOR_MASTER) {
      expect(i.nameKo.length).toBeGreaterThan(0);
      expect(i.nameEn.length).toBeGreaterThan(0);
      expect(i.subcategory.length).toBeGreaterThan(0);
      expect(CATEGORY_GROUP[i.category]).toBeTruthy();
      expect(i.source).toBe('master');
    }
  });
  it('ID 중복 없음', () => {
    expect(new Set(LIQUOR_MASTER.map((i) => i.id)).size).toBe(LIQUOR_MASTER.length);
  });
  it('ingredientName 은 전부 기존 재료 마스터(128종)에 존재한다', () => {
    const names = new Set(ingredients.map((i) => i.name));
    for (const i of LIQUOR_MASTER) {
      if (!i.ingredientName) continue;
      expect(names.has(i.ingredientName), `${i.nameKo} → ${i.ingredientName}`).toBe(true);
    }
  });
  it('위스키는 분류(whiskyClass)를 자동으로 들고 있다', () => {
    const w = LIQUOR_MASTER.filter((i) => i.category === 'whisky');
    const withClass = w.filter((i) => i.whiskyClass);
    expect(withClass.length / w.length).toBeGreaterThan(0.9);
    expect(liquorMasterById.get('m_lagavulin16')!.whiskyClass!.region).toBe('아일라');
    expect(liquorMasterById.get('m_makers')!.whiskyClass!.type).toBe('휘티드 버번');
  });
});

describe('liquor search', () => {
  it('요구된 검색 예시가 맞는 제품을 1위로 올린다', () => {
    expect(top('발베니 12')).toBe('발베니 더블우드 12년');
    expect(top('조니블랙')).toBe('조니워커 블랙라벨 12년');
    expect(top('메이커스')).toBe('메이커스 마크');
    expect(top('Tanqueray No.10')).toBe('탱커레이 No.TEN');
    expect(top('Absolut')).toBe('앱솔루트');
    expect(top('Jose Cuervo')).toContain('호세 쿠엘보');
    expect(top('Cointreau')).toBe('코앵트로');
  });
  it('영문/한글/띄어쓰기 차이를 흡수한다', () => {
    expect(top('발베니12년')).toBe('발베니 더블우드 12년');
    expect(top('balvenie 12')).toBe('발베니 더블우드 12년');
    expect(top('조니 워커 블랙')).toBe('조니워커 블랙라벨 12년');
    expect(top('makers mark')).toBe('메이커스 마크');
    expect(top('짐 빔')).toContain('짐빔');
  });
  it('결과는 요청한 개수만 반환한다', () => {
    expect(searchLiquor('위스키', { limit: 5 }).length).toBeLessThanOrEqual(5);
    expect(searchLiquor('', { limit: 5 })).toHaveLength(0);
  });
  it('카테고리 필터', () => {
    const hits = searchLiquor('마티니', { category: 'vermouth', limit: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.item.category === 'vermouth')).toBe(true);
  });
  it('마스터에 없는 이름도 카테고리를 추정한다', () => {
    expect(guessCategory('아무개 싱글몰트 위스키')).toBe('whisky');
    expect(guessCategory('무명 드라이 진')).toBe('gin');
    expect(guessCategory('수제 라즈베리 리큐르')).toBe('liqueur');
    expect(guessCategory('로컬 크래프트 라거 맥주')).toBe('beer');
  });
});

describe('제품 → 표준 재료 → 레시피 매칭', () => {
  it('마스터 제품이 canonical 재료 ID 로 해석되고, 레시피 판정이 열린다', async () => {
    const { draftFromMaster } = await import('../data/userBottles');
    const { resolveIngredient } = await import('../services/bottleService');
    const { evaluateCocktail } = await import('../services/availabilityService');
    const { cocktails } = await import('../data/adapters');

    // Bombay Sapphire → ingredient: 런던 드라이 진, Campari → 캄파리, Martini Rosso → 스위트 베르무트
    const picks = ['m_bombay_sapphire', 'm_campari', 'm_martini_rosso']
      .map((id) => liquorMasterById.get(id)!)
      .map((item) => draftFromMaster(item));
    expect(picks[0]!.ingredientName).toBe('런던 드라이 진');
    expect(picks[2]!.ingredientName).toBe('스위트 베르무트');

    const ids = picks.map((p) => resolveIngredient(p.ingredientName)!.id);
    expect(ids.every(Boolean)).toBe(true);

    const negroni = cocktails.find((c) => c.name === '네그로니')!;
    const empty = evaluateCocktail(negroni, new Set(), new Map());
    expect(empty.status).not.toBe('READY');
    const held = evaluateCocktail(negroni, new Set(ids), new Map());
    expect(held.status).toBe('READY'); // 제품명이 아니라 표준 재료 ID 로 판정된다
  });

  it('마스터에서 고른 위스키가 분류를 자동으로 물고 결손 축을 채운다', async () => {
    const { draftFromMaster, userBottleToDomain } = await import('../data/userBottles');
    const { computeCoverage } = await import('../services/whiskyDiversityService');
    const { whiskies } = await import('../data/adapters');

    const draft = draftFromMaster(liquorMasterById.get('m_lagavulin16')!);
    expect(draft.group).toBe('위스키');              // 레거시 컬렉션 그룹으로도 이어진다
    expect(draft.whiskyClass!.region).toBe('아일라'); // 사용자가 고르지 않았는데 분류가 붙는다
    const bottle = userBottleToDomain({ ...draft, id: 'ub_x', createdAt: Date.now() });
    expect(bottle.isWhisky).toBe(true);
    expect(bottle.abvNum).toBe(43);

    const cell = (list: typeof whiskies) =>
      computeCoverage(list).find((f) => f.key === 'region')!.cells.find((c) => c.value === '아일라')!;
    expect(cell(whiskies).gap).toBe(true);
    expect(cell([...whiskies, bottle]).gap).toBe(false);
  });

  it('마스터 미등록 술도 카테고리만으로 레거시 그룹·기본 재료가 채워진다', async () => {
    const { draftManual } = await import('../data/userBottles');
    const d = draftManual('무명 크래프트 진', 'gin');
    expect(d.group).toBe('진');
    expect(d.ingredientName).toBe('런던 드라이 진');
    expect(d.source).toBe('user');
  });
});

describe('기준 DB 제품 공식 노트', () => {
  it('노트의 키는 실재하는 제품이고, 모든 노트는 출처 URL 을 가진다', () => {
    for (const [id, note] of Object.entries(MASTER_MAKER_NOTES)) {
      expect(liquorMasterById.get(id), `${id} 제품이 기준 DB에 없음`).toBeTruthy();
      expect(note.source, `${id} 출처 누락`).toMatch(/^https?:\/\//);
      expect(note.nose || note.palate || note.finish || note.text, `${id} 본문 없음`).toBeTruthy();
    }
    expect(Object.keys(MASTER_MAKER_NOTES).length).toBeGreaterThanOrEqual(40);
  });

  it('보유 병 → 제품 연결이 전부 실재하는 제품을 가리킨다', () => {
    for (const [bottleId, masterId] of Object.entries(SEED_BOTTLE_MASTER)) {
      expect(liquorMasterById.get(masterId), `${bottleId} → ${masterId} 없음`).toBeTruthy();
    }
  });

  it('마스터에서 고른 제품은 수기 입력 없이 공식 노트를 물고 온다', async () => {
    const { draftFromMaster, userBottleToDomain } = await import('../data/userBottles');
    const draft = draftFromMaster(liquorMasterById.get('m_talisker10')!);
    const bottle = userBottleToDomain({ ...draft, id: 'ub_t', createdAt: Date.now() });
    expect(bottle.makerNote?.source).toMatch(/^https?:\/\//);
    // 노트가 없는 제품은 없는 채로 둔다 (추정해서 채우지 않는다)
    const plain = userBottleToDomain({
      ...draftFromMaster(liquorMasterById.get('m_kelly')!), id: 'ub_k', createdAt: Date.now(),
    });
    expect(plain.makerNote).toBeUndefined();
  });
});

describe('기준 DB 확장', () => {
  it('새로 들어온 제품을 이름으로 찾는다', () => {
    expect(top('블랙 루비')).toBe('조니워커 블랙 루비');
    expect(top('애플트리')).toBe('애플트리');
    expect(top('원소주')).toBe('원소주 스피릿');
    expect(top('토끼소주')).toBe('토끼소주 화이트');
    expect(top('커클랜드')).toBe('커클랜드 프렌치 보드카');
    expect(top('부자진')).toBe('부자진');
  });

  it('도수를 확인하지 못한 제품은 값을 지어내지 않는다', () => {
    expect(liquorMasterById.get('m_glenallachie10cs')!.abv).toBeUndefined();  // 배치별 상이
    expect(liquorMasterById.get('m_joeunday')!.abv).toBeUndefined();          // 희석식 소주는 도수가 자주 바뀐다
    // 수입사 제품 설명으로 확인된 값은 채운다
    const appletree = liquorMasterById.get('m_appletree')!;
    expect(appletree.abv).toBe(15);
    expect(appletree.volumeMl).toBe(700);
  });

  it('RTD·캔칵테일도 이름으로 찾는다', () => {
    expect(top('호로요이')).toContain('호로요이');
    expect(top('하이볼 캔')).toContain('하이볼 캔');
    expect(top('엑스레이티드')).toBe('엑스레이티드 퓨전');
    expect(top('장수막걸리')).toBe('장수 생막걸리');
    expect(LIQUOR_MASTER.filter((i) => i.category === 'rtd').length).toBeGreaterThanOrEqual(8);
  });
});
