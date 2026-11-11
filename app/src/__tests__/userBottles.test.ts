import { describe, expect, it } from 'vitest';
import { recommendWhiskies, type RecommendContext } from '../services/recommendationService';
import { simpleBuilds } from '../services/simpleBuildService';
import { fold, hits } from '../ui/listUtils';
import { userBottleToDomain } from '../data/userBottles';
import { neutralVector } from '../hooks/useData';
import { type UserBottle } from '../models/types';

describe('사용자가 넣은 위스키', () => {
  it('추천은 넘겨받은 위스키 목록을 쓴다(공개 배포는 앱에 든 위스키가 없다)', () => {
    const ub = { id: 'ub_test', name: '테스트 12년', group: '위스키', category: 'whisky', abv: '43%', qty: 1 } as unknown as UserBottle;
    const ctx: RecommendContext = {
      taste: neutralVector(), hasTaste: false, heldIds: new Set(), subMap: new Map(), logs: [], remainingById: new Map(),
      whiskies: [userBottleToDomain(ub)],
    };
    expect(recommendWhiskies(ctx).map((r) => r.id)).toEqual(['ub_test']);
  });
});

describe('칵테일 검색이 간단 조합도 찾는다', () => {
  const find = (q: string) => simpleBuilds().filter((b) => !b.recipeId && hits(fold(q), b.name, b.parts.join(' '))).map((b) => b.name);
  it('진토닉은 띄어 써도 붙여 써도 찾는다', () => {
    expect(find('진토닉')).toContain('진 토닉');
    expect(find('gin tonic')).toContain('진 토닉');
  });
  it('레시피로 있는 조합(위스키 하이볼)은 레시피 목록에 맡기고, 조합표에만 있는 것을 더한다', () => {
    expect(find('하이볼')).toEqual(expect.arrayContaining(['가쿠 하이볼', 'CS 하이볼']));
    expect(find('하이볼')).not.toContain('위스키 하이볼');
  });
});

describe('위스키 둘러보기', () => {
  it('술장에 넣지 않은 제품도 병처럼 그린다(분류·공식 노트 포함)', async () => {
    const { LIQUOR_MASTER } = await import('../data/liquorMaster');
    const { previewBottle, isPreviewId } = await import('../data/userBottles');
    const { drawsAsCask } = await import('../data/caskVisual');
    const items = LIQUOR_MASTER.filter((m) => m.category === 'whisky');
    const all = items.map(previewBottle);
    expect(all.length).toBeGreaterThan(100);
    expect(all.every((b) => isPreviewId(b.id) && b.isWhisky && b.qty === 0)).toBe(true);
    expect(all.every(drawsAsCask)).toBe(true);
    const balvenie = all.find((b) => b.name === '발베니 더블우드 12년')!;
    expect(balvenie.whiskyClass?.type).toBe('싱글몰트');
    expect(balvenie.makerNote).toBeTruthy();
  });
});

describe('칵테일 도수(재료 기준)', () => {
  it('양과 라벨 도수로 계산하고, 양이 정해지지 않으면 비운다', async () => {
    const { cocktails } = await import('../data/adapters');
    const { cocktailAbv } = await import('../services/cocktailStrength');
    const at = (n: string) => cocktailAbv(cocktails.find((c) => c.name === n)!);
    expect(at('네그로니')).toBeGreaterThan(20);
    expect(at('네그로니')).toBeLessThan(35);
    expect(at('미모사')).toBeLessThan(10);
    expect(at('올드 패션드')).not.toBeNull();   // 각설탕은 부피 0
    expect(at('모히토')).toBeNull();            // 탄산수 Top
  });
  it('화면에는 ±2% 폭으로 적는다', async () => {
    const { cocktails } = await import('../data/adapters');
    const { cocktailAbvLabel } = await import('../services/cocktailStrength');
    const lab = (n: string) => cocktailAbvLabel(cocktails.find((c) => c.name === n)!);
    expect(lab('네그로니')).toBe('약 26~30%');
    expect(lab('카시스 오렌지')).toBe('약 2~6%');
    expect(lab('모히토')).toBeNull();
  });
});

describe('노트 출처', () => {
  it('공식·수입사는 공식 노트, 매체 정리는 따로 표시한다', async () => {
    const { isOfficialNote, noteSourceLabel } = await import('../data/makerNoteSource');
    expect(isOfficialNote({ source: 'x', sourceName: 'The Macallan 공식' })).toBe(true);
    expect(isOfficialNote({ source: 'x', sourceName: 'The Whiskey Wash (JW Black 12)' })).toBe(false);
    expect(isOfficialNote({ source: 'x', sourceName: '참고: 나무위키(화요) — 공식 영문 노트 부재' })).toBe(false);
    expect(noteSourceLabel({ source: 'x', sourceName: 'The Balvenie 공식 — 숙성 설명(향미 3분할 노트는 공식 페이지에 없음)' })).toBe('The Balvenie 공식');
  });
});
