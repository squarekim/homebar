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
