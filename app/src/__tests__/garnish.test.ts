import { describe, expect, it } from 'vitest';
import { cocktails } from '../data/adapters';
import { garnishItems, GARNISH_MAX } from '../data/drinkVisual';

const byName = (n: string) => cocktails.find((c) => c.name === n)!;
const brief = (n: string) => garnishItems(byName(n)).map((g) => `${g.kind}/${g.form ?? ''}/${g.place}`);

describe('가니시 자리', () => {
  it('제스트는 가장자리, 체리는 픽 — 세 개까지 그린다', () => {
    expect(brief('뉴욕 사워')).toEqual(['lemon/peel/edge', 'orange/peel/edge', 'cherry//pick']);
    expect(brief('마이 타이')).toEqual(['pineapple/wedge/edge', 'mint//top', 'lime/peel/edge']);
  });
  it('술 속에 넣는 건 하이볼 슬라이스뿐', () => {
    expect(brief('모히토')).toEqual(['mint//top', 'lime/wheel/inside']);
    expect(brief('스프리츠')).toEqual(['orange/wheel/edge']);        // 플루트 슬라이스는 가장자리
    expect(brief('다크 앤 스토미')).toEqual(['lime/wedge/edge']);   // 하이볼이어도 웨지는 가장자리
  });
  it('림·가루·줄기', () => {
    expect(brief('블루 마르가리타')).toEqual(['rim//rim', 'lime/wedge/edge']);
    expect(brief('알렉산더')).toEqual(['dust//dust']);
    expect(brief('블러디 메리')).toEqual(['celery//top', 'lemon/wedge/edge']);
    expect(brief('깁슨')).toEqual(['onion//pick']);
    expect(brief('페니실린')).toEqual(['ginger//pick']);
  });
  it('자리별 개수(가니시 전체 보기 페이지와 같다)', () => {
    const cnt: Record<string, number> = {};
    for (const c of cocktails) {
      const g = garnishItems(c);
      expect(g.length).toBeLessThanOrEqual(GARNISH_MAX);
      for (const x of g) cnt[x.place] = (cnt[x.place] ?? 0) + 1;
    }
    expect(cnt).toEqual({ edge: 37, pick: 17, top: 9, inside: 7, rim: 4, dust: 2 });
    expect(cocktails.filter((c) => !c.garnish).every((c) => garnishItems(c).length === 0)).toBe(true);
  });
});
