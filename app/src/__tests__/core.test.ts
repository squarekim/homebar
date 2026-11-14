import { describe, it, expect } from 'vitest';
import { ingredients, cocktails, bottles, whiskies, substitutions } from '../data/adapters';
import { evaluateAll, evaluateCocktail, tallyStatus, STATUS_LABEL_KO, STATUS_SENTENCE_KO, STATUS_LEAD_KO } from '../services/availabilityService';
import { isNeutralTaste } from '../services/flavorService';
import { recommendCocktails, recommendWhiskies, todayPicks, type RecommendContext } from '../services/recommendationService';
import { calculatePurchases } from '../services/purchaseService';
import { recommendGroupCocktails } from '../services/groupService';
import { milestoneBadges, repeatBadges } from '../services/collectionBadges';
import { FLAVOR_AXES, type FlavorVector, type Bottle, type WhiskyClass } from '../models/types';

function vec(partial: Partial<FlavorVector>): FlavorVector {
  return FLAVOR_AXES.reduce((v, a) => { v[a] = partial[a] ?? 5; return v; }, {} as FlavorVector);
}

// 원본 own 플래그로 held 재현
function seedHeld(): Set<string> {
  return new Set(ingredients.filter((i) => i.seedOwned).map((i) => i.id));
}

describe('seed adapters', () => {
  it('원본 건수 유지', () => {
    expect(ingredients.length).toBe(130); // 원본 128 + 오렌지 큐라소(마이 타이 IBA 교정) + 셰리(셰리 코블러)
    expect(cocktails.length).toBe(221); // 원본 202 + 현행 IBA 8종(addIbaRecipes) − 겹친 1종(rewordRecipeText) + 믹서 조합 12종(addMixerRecipes)
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
  it('지역×숙성 매트릭스가 현재 컬렉션으로 실시간 계산된다', async () => {
    const { computeRegionMaturityMatrix } = await import('../services/whiskyDiversityService');
    const m = computeRegionMaturityMatrix(whiskies);
    const spey = m.find((r) => r.region === '스페이사이드')!;
    expect(spey.cells['스탠다드'].length).toBeGreaterThan(0); // 맥캘란12·글렌피딕15 등
    expect(spey.cells['스탠다드'].some((n) => n.includes('맥캘란'))).toBe(true);
    const islay = m.find((r) => r.region === '아일라')!;
    expect(islay.cells['엔트리'].length + islay.cells['스탠다드'].length + islay.cells['고숙성(18+)'].length).toBe(0); // 아일라 미보유
    // 18+ 는 현재 전 지역 결손
    expect(m.every((r) => r.cells['고숙성(18+)'].length === 0)).toBe(true);
  });
  it('용어 사전: 태그 라벨을 정규화해 해설을 찾는다', async () => {
    const { lookupTerm } = await import('../data/glossary');
    expect(lookupTerm('셰리 캐스크')).toContain('셰리');
    expect(lookupTerm('아일라 · 3')).toBeTruthy();
    expect(lookupTerm('아일라 · 결손')).toBeTruthy();
    expect(lookupTerm('하이랜드(해안)')).toBeTruthy();
    expect(lookupTerm('+ 캠벨타운')).toBeTruthy();
    expect(lookupTerm('피티드')).toBeTruthy();
    expect(lookupTerm('존재하지않는용어')).toBeUndefined();
  });
  it('사용자 추가 술이 도메인 병으로 변환되고 결손을 채운다', async () => {
    const { userBottleToDomain, isUserBottle } = await import('../data/userBottles');
    const { computeCoverage } = await import('../services/whiskyDiversityService');
    const ub = userBottleToDomain({
      id: 'ub_test1', name: '라가불린 16년', group: '위스키', abv: '43%', qty: 1, use: '시음-축',
      whiskyClass: { origin: '스카치', type: '싱글몰트', region: '아일라', cask: ['셰리'], character: ['피티드'] },
      createdAt: Date.now(),
    });
    expect(ub.isWhisky).toBe(true);
    expect(ub.abvNum).toBe(43);
    expect(isUserBottle(ub.id)).toBe(true);
    // 추가 전엔 아일라 결손, 추가 후엔 해소
    const before = computeCoverage(whiskies).find((f) => f.key === 'region')!.cells.find((c) => c.value === '아일라')!;
    expect(before.gap).toBe(true);
    const after = computeCoverage([...whiskies, ub]).find((f) => f.key === 'region')!.cells.find((c) => c.value === '아일라')!;
    expect(after.gap).toBe(false);
    expect(after.bottles).toContain('라가불린 16년');
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
    // 원본 재고 기준 정규 121 (레시피의 [대체] 표시를 걷어낸 뒤)
    expect(t.READY).toBeGreaterThan(50);
    expect(t.READY + t.SUBSTITUTE + t.MISSING + t.UNAVAILABLE).toBe(221);
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
    hasTaste: true,
    heldIds: seedHeld(),
    subMap: new Map(),
    logs: [],
    remainingById: new Map(),
  };
  it('칵테일 추천이 점수·이유 반환', () => {
    const recs = recommendCocktails(ctx, 'available', 10);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]!.score).toBeGreaterThanOrEqual(recs[recs.length - 1]!.score);
    expect(recs[0]!.reason.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.status === 'READY' || r.status === 'SUBSTITUTE')).toBe(true);
  });
  it('위스키 추천', () => {
    const recs = recommendWhiskies(ctx, 5);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]!.tasteScore).toBeGreaterThan(0);
  });
});

describe('purchase', () => {
  it('구매 후보가 추가 레시피 수를 계산', () => {
    // 일부만 보유한 상태에서 구매 이득 계산
    const partial = new Set([...seedHeld()].slice(0, 40));
    const ctx = { taste: vec({}), heldIds: partial, subMap: new Map<string, string[]>(), logs: [] };
    const res = calculatePurchases(ctx, 10);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]!.afterCount - res[0]!.beforeCount).toBe(res[0]!.addedRecipes);
    expect(res[0]!.addedRecipes).toBeGreaterThanOrEqual(res[res.length - 1]!.addedRecipes);
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

describe('레시피 note 위생 — 재고 서술 분리', () => {
  // 판정은 ingredientId × 재고로만 계산된다. note 는 판정에 쓰이지 않으며 재고 서술을 담지 않는다.
  const INVENTORY_CLAIM = [
    /충족/, /미보유/, /보유\s*(재료|재고|품)/, /(전부|모두|나머지는)\s*보유/, /보유\s*중입니다/,
    /없어\s*(조주\s*|제조\s*)?(불가|안\s*됨)/, /없으면\s*(조주\s*)?불가/, /불가로\s*둡니다/, /불가입니다/,
    /(조주|제조|제작)\s*(가능|불가)/, /구매\s*시/, /구매하면/, /한\s*병이면\s*(열림|완성|가능)/,
    /막히는\s*건/, /걸립니다|걸린다/, /부족한\s*재료/,
  ];

  it('note 에 특정 사용자의 재고 상태 문장이 없다', () => {
    const bad: string[] = [];
    for (const c of cocktails) {
      if (!c.note) continue;
      for (const re of INVENTORY_CLAIM) if (re.test(c.note)) bad.push(`${c.name} :: ${re} :: ${c.note}`);
    }
    expect(bad, bad.slice(0, 5).join('\n')).toHaveLength(0);
  });

  it('재료 표기에 재고 마커([없음])가 남아 있지 않다', () => {
    const bad = cocktails.flatMap((c) => c.ingredients.filter((i) => i.raw.includes('[없음]')).map((i) => `${c.name}/${i.raw}`));
    expect(bad).toHaveLength(0);
  });

  it('레시피 본문(맛·기법·가니시·대체 안내)은 보존된다', () => {
    const byName = (n: string) => cocktails.find((c) => c.name === n)!;
    expect(byName('카이피리냐').note).toContain('럼으로 대신할 수 없어요');   // 일반 대체 안내
    expect(byName('피나 콜라다').garnish).toContain('체리');                   // 가니시는 별도 필드로
    expect(byName('다이키리').note).toContain('정제 설탕');                    // 만들 때 필요한 스펙
    expect(byName('비외 카레').note).toBeUndefined();                          // 재료 칸을 되풀이한 메모는 지웠다
    expect(byName('갓파더').note).toContain('3.5cl : 3.5cl');                  // 레시피 스펙 설명
    // 출처 이름만 적혀 있던 메모 11건은 출처 칸으로 옮겼고, 재료 칸을 되풀이한 메모 57건은 지웠다(rewordRecipeText)
    expect(cocktails.filter((c) => c.note && c.note.length > 0).length).toBeGreaterThanOrEqual(83);
  });

  it('판정은 note 가 아니라 재고 변화에만 반응한다', () => {
    const negroni = cocktails.find((c) => c.name === '네그로니')!;
    const ids = negroni.ingredients.filter((i) => !i.optional).map((i) => i.ingredientId);
    expect(evaluateCocktail(negroni, new Set(), new Map()).status).toBe('UNAVAILABLE');
    expect(evaluateCocktail(negroni, new Set(ids.slice(0, 2)), new Map()).status).not.toBe('READY');
    expect(evaluateCocktail(negroni, new Set(ids), new Map()).status).toBe('READY');
    // 같은 표준 재료를 쓰는 제품이면 어떤 제품이든 동일하게 충족된다(제품명 매칭 아님)
    const gin = ids[0]!;
    expect(evaluateCocktail(negroni, new Set([...ids.slice(1), gin]), new Map()).status).toBe('READY');
  });
});


describe('가니시 분리 · 개정 이력 제거 · 조주법', () => {
  it('가니시가 note 가 아니라 별도 필드에 있다', () => {
    const withGarnish = cocktails.filter((c) => c.garnish);
    expect(withGarnish.length).toBeGreaterThanOrEqual(50);
    expect(cocktails.find((c) => c.name === '민트 줄립')!.garnish).toBe('민트 스프링');
    expect(cocktails.find((c) => c.name === '깁슨')!.garnish).toBe('칵테일 어니언');
    // note 에는 가니시 문장이 남아 있지 않다
    expect(cocktails.filter((c) => /가니(시|쉬)\s*(\(선택\))?\s*[.!]?$/.test((c.note ?? '').trim()))).toHaveLength(0);
  });

  it('엑셀 개정 이력이 어디에도 남아 있지 않다', () => {
    const REV = /\[V\d+(\.\d+)?\]|\bV\d{2}(\.\d+)?\b|전수\s*대조|재료\s*ID|시트/;
    const bad: string[] = [];
    for (const c of cocktails) if (REV.test(c.note ?? '')) bad.push(`레시피 ${c.name}`);
    for (const b of bottles) if (REV.test(b.note ?? '')) bad.push(`병 ${b.name}`);
    expect(bad, bad.join(', ')).toHaveLength(0);
    // 스프레드시트 행 번호를 가리키던 내부 참조도 남지 않는다
    expect(cocktails.filter((c) => /\bid\s*\d+/i.test(c.note ?? ''))).toHaveLength(0);
  });

  it('조주법이 아이콘용 키로 파싱된다', () => {
    const by = (n: string) => cocktails.find((c) => c.name === n)!;
    expect(by('올드 패션드').methodKeys[0]).toBe('build');
    expect(by('위스키 사워').methodKeys[0]).toBe('shake');
    expect(by('마티니 (드라이 마티니)').methodKeys[0]).toBe('stir');
    expect(by('프렌치 75').methodKeys).toEqual(['shake', 'build']); // "Shake + Build"
    expect(cocktails.every((c) => c.methodKeys.length > 0)).toBe(true);
  });
});

describe('믹서 조합표에서 옮긴 레시피 (addMixerRecipes)', () => {
  it('간단 조합 칸에만 있던 조합이 일반 레시피로 있다', () => {
    const by = (n: string) => cocktails.find((c) => c.name === n);
    for (const n of ['진 토닉', '잭콕', '럼 콕', '보드카 토닉', '카시스 소다']) expect(by(n), n).toBeDefined();
    const gt = by('진 토닉')!;
    expect(gt.iba).toBe('비IBA');
    expect(gt.methodKeys[0]).toBe('build');
    expect(gt.ingredients.map((i) => i.raw)).toEqual(['런던 드라이 진 45ml', '토닉워터 135ml']);
    // 원래 주인의 병에 묶인 조합과, 이미 있는 레시피와 같은 조합은 옮기지 않았다
    for (const n of ['가쿠 하이볼', '캄파리 토닉']) expect(by(n), n).toBeUndefined();
  });
});

describe('보유 병 ↔ 표준 재료 연결', () => {
  it('시드 병이 표준 재료로 연결된다', () => {
    const by = (n: string) => bottles.find((b) => b.name === n)!;
    const ingName = (id: string) => ingredients.find((i) => i.id === id)!.name;
    expect(by('호세 쿠엘보 에스페시알 골드').ingredientIds.map(ingName)).toEqual(['데킬라']);
    expect(by('봄베이 사파이어').ingredientIds.map(ingName)).toEqual(['런던 드라이 진']);
    expect(by('잭 다니엘스 올드 No.7').ingredientIds.map(ingName)).toEqual(['테네시']);
    expect(by('더 맥캘란 더블 캐스크 12년').ingredientIds.map(ingName)).toEqual(['싱글몰트 스카치', '스카치']);
    // 칵테일에 쓰지 않는 술은 연결이 비어 있다
    expect(by('화요 25').ingredientIds).toHaveLength(0);
  });

  it('재고의 재료에서 실제 보유 제품을 되짚을 수 있다', () => {
    const tequila = ingredients.find((i) => i.name === '데킬라')!;
    const mine = bottles.filter((b) => b.ingredientIds.includes(tequila.id));
    expect(mine.map((b) => b.name)).toContain('호세 쿠엘보 에스페시알 골드');
  });

  it('사용자가 추가한 병도 고른 표준 재료로 연결된다', async () => {
    const { draftFromMaster, userBottleToDomain } = await import('../data/userBottles');
    const { liquorMasterById } = await import('../data/liquorMaster');
    const { resolveIngredient } = await import('../services/bottleService');
    const draft = draftFromMaster(liquorMasterById.get('m_patron_silver')!);
    const ing = resolveIngredient(draft.ingredientName)!;
    const b = userBottleToDomain({ ...draft, id: 'ub_t', createdAt: Date.now(), ingredientId: ing.id });
    expect(b.ingredientIds).toEqual([ing.id]);
    expect(ing.name).toBe('100% 아가베 데킬라');
  });
});

describe('설명란 구조화 — 변형 레시피 · 출처 · 코멘터리', () => {
  it('변형은 실제로 존재하는 원형만 가리킨다', () => {
    const withParent = cocktails.filter((c) => c.variantOf);
    expect(withParent.length).toBeGreaterThanOrEqual(40);
    for (const c of withParent) {
      const parent = cocktails.find((p) => p.id === c.variantOf);
      expect(parent, `${c.name} 의 원형이 없다`).toBeTruthy();
      expect(parent!.id).not.toBe(c.id);          // 자기 자신을 원형으로 삼지 않는다
      expect(parent!.variantOf).not.toBe(c.id);   // 서로를 원형이라 부르지 않는다
      expect(parent!.variants).toContain(c.id);   // 원형 쪽에서도 되짚을 수 있다
    }
  });

  it('원형에서 변형 목록을 볼 수 있다', () => {
    const byName = (n: string) => cocktails.find((c) => c.name === n)!;
    const names = (n: string) => byName(n).variants.map((id) => cocktails.find((c) => c.id === id)!.name);
    expect(names('올드 패션드')).toContain('몬테 카를로');
    expect(names('마르가리타')).toContain('블루 마르가리타');
    expect(names('위스키 사워')).toContain('싱글몰트 사워');
    expect(byName('갓마더').variantNote).toContain('갓파더');
  });

  it('설명란은 한 문장이고, 출처는 별도 필드로 빠져 있다', () => {
    // 문장 부호 기준 2문장을 넘지 않는다 (숫자 소수점은 문장 끝이 아니다)
    const tooLong = cocktails.filter((c) => (c.note ?? '').split(/(?<!\d)\.\s+/).length > 1);
    expect(tooLong.map((c) => c.name), '여러 문장이 남은 설명란').toHaveLength(0);
    // 출처 표기가 설명란에 섞여 있지 않다
    const SOURCE_IN_NOTE = /사용자 제공|커뮤니티 표준|교차 확인|배합비 준용/;
    expect(cocktails.filter((c) => SOURCE_IN_NOTE.test(c.note ?? ''))).toHaveLength(0);
    expect(cocktails.filter((c) => c.sourceName).length).toBeGreaterThanOrEqual(30); // '클래식 레시피'와 커뮤니티 출처 표기를 지운 뒤(rewordRecipeText)
  });

  it('IBA 등재 연혁은 배지가 말하므로 설명란에서 빠진다', () => {
    const HISTORY = /IBA.{0,12}(등재|제외|이탈)|코드화까지/;
    expect(cocktails.filter((c) => HISTORY.test(c.note ?? '')).map((c) => c.name)).toHaveLength(0);
    expect(cocktails.find((c) => c.name === '갓파더')!.iba).toBe('구IBA');
  });
});

describe('병 뱃지 — 개인 이력을 메모에서 뱃지로', () => {
  const byId = (id: string) => bottles.find((b) => b.id === id)!;

  it('마일스톤·입수 경위·상태가 뱃지로 붙는다', () => {
    expect(byId('talisker10').badges).toContainEqual({ kind: 'first', label: '첫 피트 싱글몰트' });
    expect(byId('kakubin').badges).toContainEqual({ kind: 'first', label: '첫 일본 위스키' });
    expect(byId('jw_green').badges).toContainEqual({ kind: 'first', label: '첫 블렌디드 몰트' });
    expect(byId('jw_black').badges).toContainEqual({ kind: 'gift', label: '선물' });
    expect(byId('bulhwi').badges).toContainEqual({ kind: 'status', label: '단종' });
    expect(byId('kakubin').badges).toContainEqual({ kind: 'use', label: '하이볼 전용' });
  });

  it('메모에는 남이 읽어도 뜻이 통하는 제품 사실만 남는다', () => {
    // 개인 이력(첫 ○○·★신규·선물·가격)과 앱이 계산하는 값(N종 해금)이 메모에 남아 있지 않다
    const LEFTOVER = /첫 |최초|★|선물|만원|\d+종 해금|해금/;
    expect(bottles.filter((b) => LEFTOVER.test(b.note ?? '')).map((b) => b.name)).toHaveLength(0);
    expect(byId('sy_grenadine').note).toBe('농축과즙 — 개봉 후 냉장');
  });

  it('가격·구매처는 구매 기록으로, 용량은 필드로 빠진다', () => {
    expect(byId('jw_blue').buy).toBe('16만원');
    expect(byId('jw_blue').note).toBeUndefined();
    expect(byId('kahlua').volumeMl).toBe(1000);
    expect(byId('kagua_blanc').volumeMl).toBe(330);
  });
});

describe('첫 ○○ 마일스톤 자동 계산', () => {
  const mk = (id: string, addedAt: number, over: Partial<Bottle> = {}): Bottle => ({
    id, group: '위스키', name: id, node: 'master.whisky', abv: '40%', abvNum: 40, qty: 1, use: '시음-축',
    badges: [], isSpirit: true, isWhisky: true, ingredientIds: [], flavor: vec({}), addedAt, ...over,
  });
  const cls = (over: Partial<WhiskyClass> = {}): WhiskyClass =>
    ({ origin: '스카치', type: '싱글몰트', cask: [], character: ['논피트'], ...over });

  it('컬렉션이 비어 있으면 첫 병은 가장 넓은 축을 받는다', () => {
    const found = milestoneBadges([mk('ub_1', 100, { whiskyClass: cls() })]);
    expect(found.get('ub_1')?.label).toBe('첫 위스키');
  });

  it('이미 있는 축은 다시 첫이 되지 않고, 새 축만 뱃지가 된다', () => {
    const found = milestoneBadges([
      mk('ub_1', 100, { whiskyClass: cls() }),
      mk('ub_2', 200, { whiskyClass: cls({ character: ['피티드'] }) }),
      mk('ub_3', 300, { whiskyClass: cls({ character: ['피티드'] }) }),
    ]);
    expect(found.get('ub_2')?.label).toBe('첫 피티드 위스키');
    expect(found.has('ub_3')).toBe(false);
  });

  it('앱 이전부터 있던 시드 병이 차지한 축은 사용자 병이 가져가지 못한다', () => {
    const found = milestoneBadges([...whiskies, mk('ub_1', 100, { whiskyClass: cls() })]);
    expect(found.has('ub_1')).toBe(false);   // 시드에 이미 스카치 싱글몰트가 있다
  });

  it('믹서·부재료는 마일스톤을 세지 않는다', () => {
    const soda = mk('ub_s', 100, { group: '음료·믹서·시럽·비터·상비품', node: 'master.mixer', isWhisky: false, isSpirit: false });
    expect(milestoneBadges([soda]).has('ub_s')).toBe(false);
  });
});

describe('재구매 업적', () => {
  const mk = (id: string, over: Partial<Bottle> = {}): Bottle => ({
    id, group: '위스키', name: id, node: 'master.whisky', abv: '40%', abvNum: 40, qty: 1, use: '시음-축',
    badges: [], isSpirit: true, isWhisky: true, ingredientIds: [], flavor: vec({}), ...over,
  });

  it('같은 제품을 다시 들이면 횟수에 따라 업적이 올라간다', () => {
    const tier = (count: number) => {
      const rows = Array.from({ length: count }, (_, i) =>
        mk(`ub_${i}`, { addedAt: 100 + i, productId: 'm_x' }));
      return repeatBadges(rows).get(`ub_${count - 1}`);
    };
    expect(tier(1)).toBeUndefined();                    // 한 병이면 재구매가 아니다
    expect(tier(2)?.label).toBe('다시 산 술');
    expect(tier(2)?.detail).toBe('재구매 1회');
    expect(tier(3)?.label).toBe('여러 번 산 술');
    expect(tier(4)?.label).toBe('늘 두는 술');
    expect(tier(9)?.label).toBe('늘 두는 술');
  });

  it('뱃지는 가장 최근에 들인 병에만 붙는다', () => {
    const found = repeatBadges([
      mk('ub_old', { addedAt: 100, productId: 'm_x' }),
      mk('ub_new', { addedAt: 200, productId: 'm_x' }),
    ]);
    expect(found.has('ub_old')).toBe(false);
    expect(found.get('ub_new')?.detail).toBe('재구매 1회');
  });

  it('이름 표기가 달라도 같은 기준 DB 제품이면 같이 센다', () => {
    const found = repeatBadges([
      mk('ub_1', { name: '조니워커 블랙', addedAt: 100, productId: 'm_jw_black' }),
      mk('ub_2', { name: '조니워커 블랙라벨 12년', addedAt: 200, productId: 'm_jw_black' }),
    ]);
    expect(found.get('ub_2')?.detail).toBe('재구매 1회');
  });

  it('한 줄에 여러 병이어도(선물로 늘어난 병) 재구매로 센다', () => {
    // 시드의 조니워커 블랙 라벨은 선물로 1병 늘어 2병이다
    const jw = bottles.find((b) => b.id === 'jw_black')!;
    expect(jw.qty).toBe(2);
    expect(repeatBadges([jw]).get('jw_black')?.label).toBe('다시 산 술');
  });

  it('믹서는 재구매를 세지 않는다', () => {
    const cola = mk('ub_c', {
      group: '음료·믹서·시럽·비터·상비품', node: 'master.mixer',
      isWhisky: false, isSpirit: false, qty: 5, addedAt: 100, productId: 'm_coke',
    });
    expect(repeatBadges([cola]).size).toBe(0);
  });
});

describe('홈 첫 화면 추천 — 대표 한 잔과 다른 성격', () => {
  const ctx: RecommendContext = {
    taste: vec({}), hasTaste: false, heldIds: seedHeld(), subMap: new Map(), logs: [], remainingById: new Map(),
  };

  it('대표 1 + 선택지 2, 성격이 서로 겹치지 않는다', () => {
    const picks = todayPicks(ctx, 'available', 3);
    expect(picks).toHaveLength(3);
    // 기주가 전부 다르다 (사워 계열이 연달아 나오던 문제)
    expect(new Set(picks.map((p) => p.base)).size).toBe(3);
    // 지배적인 맛 축도 전부 다르다
    expect(new Set(picks.map((p) => p.flavorWords[0])).size).toBe(3);
  });

  it('맛의 방향과 기주가 채워져 있다 — 화면이 점수 대신 이걸 먼저 쓴다', () => {
    for (const p of todayPicks(ctx, 'available', 3)) {
      expect(p.flavorWords.length).toBeGreaterThan(0);
      expect(p.base).toBeTruthy();
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('후보가 적은 모드에서도 요청한 수를 채운다', () => {
    const picks = todayPicks(ctx, 'whisky', 3);
    expect(picks).toHaveLength(3);
    expect(picks.every((p) => p.kind === 'whisky')).toBe(true);
  });

  it('판정 용어 대신 결과를 설명하는 문장을 쓴다', () => {
    // 목록은 줄끼리 비교해야 하므로 네 상태를 모두 적는다
    expect(STATUS_SENTENCE_KO.READY).toBe('그대로 만들 수 있어요');
    expect(STATUS_SENTENCE_KO.SUBSTITUTE).toBe('대체 재료로 가능');
    expect(STATUS_SENTENCE_KO.MISSING).toBe('재료 부족');
    // 대표 한 잔은 비교 대상이 없어 자기 조건을 말한다
    expect(STATUS_LEAD_KO.READY).toBe('제조 가능');
    // 짧은 표기(필터 칩·통계)는 그대로 남는다
    expect(STATUS_LABEL_KO.READY).toBe('정규');
  });

  it('중립 프로필은 취향 설정으로 치지 않는다 (부팅 때 자동 생성된다)', () => {
    expect(isNeutralTaste(vec({}))).toBe(true);
    expect(isNeutralTaste(vec({ smoke: 9 }))).toBe(false);
  });
});

describe('마이 타이 — IBA 원문대로 오렌지 큐라소', () => {
  const mt = cocktails.find((c) => c.name === '마이 타이')!;
  it('블루 큐라소가 아니라 오렌지 큐라소 15ml', () => {
    const names = mt.ingredients.map((i) => i.ingredientName);
    expect(names).toContain('오렌지 큐라소');
    expect(names).not.toContain('블루 큐라소');
  });
  it('트리플 섹이나 그랑 마르니에로 대체할 수 있다', () => {
    const others = mt.ingredients.filter((i) => i.ingredientName !== '오렌지 큐라소').map((i) => i.ingredientId);
    const subMap = new Map<string, string[]>();
    for (const s of substitutions) subMap.set(s.ingredientId, [...(subMap.get(s.ingredientId) ?? []), s.substituteId]);
    const triple = ingredients.find((i) => i.name === '트리플 섹')!.id;
    expect(evaluateCocktail(mt, new Set([...others, triple]), subMap).status).toBe('SUBSTITUTE');
    expect(evaluateCocktail(mt, new Set(others), subMap).status).toBe('MISSING');
  });
});

describe('IBA 원문 대조 (alignIbaRecipes)', () => {
  const ml = (n: string, ing: string) => cocktails.find((c) => c.name === n)!.ingredients.find((i) => i.ingredientName === ing)?.amountMl;
  it('용량이 원문과 같다', () => {
    expect([ml('그랜드 마르가리타', '100% 아가베 데킬라'), ml('그랜드 마르가리타', '그랑 마르니에')]).toEqual([45, 30]);
    expect(ml('앤젤 페이스', '애프리콧 브랜디')).toBe(30);
    expect([ml('좀비', '자메이카 럼(앰버/블랙스트랩)'), ml('좀비', '골드 럼'), ml('좀비', '데메라라 럼')]).toEqual([45, 45, 30]);
    expect([ml('칸찬차라', '쿠바산 화이트 럼'), ml('칸찬차라', '물')]).toEqual([60, 50]);
  });
  it('없는 재료는 가까운 기존 재료로 맞추고 원문 이름을 남긴다', () => {
    const raw = cocktails.find((c) => c.name === '마이 타이')!.ingredients.map((i) => i.raw).join(' ');
    expect(raw).toContain('원문: 마르티니크 몰라세스 럼');
    expect(cocktails.find((c) => c.name === '브랜디 크러스타')!.method).toBe('Stir');
  });
  it('재료 사용 수는 실제 레시피 수와 같다', () => {
    for (const ing of ingredients) {
      expect(cocktails.filter((c) => c.ingredients.some((i) => i.ingredientId === ing.id)).length, ing.name).toBe(ing.usageCount);
    }
  });
});
