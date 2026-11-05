import { describe, expect, it } from 'vitest';
import { cocktails } from '../data/adapters';
import { garnishItems, GARNISH_MAX, glassOf, liquidLayers } from '../data/drinkVisual';

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
    expect(cnt).toEqual({ edge: 51, pick: 25, top: 9, inside: 12, rim: 5, dust: 2 }); // IBA 가니시 22종 보강 후
    expect(cocktails.filter((c) => !c.garnish).every((c) => garnishItems(c).length === 0)).toBe(true);
  });
});

describe('층', () => {
  const at = (n: string) => liquidLayers(byName(n));
  it('층이 있는 레시피는 12종(페니실린은 IBA 원문대로 아일라 몰트를 띄운다)', () => {
    expect(cocktails.filter((c) => liquidLayers(c)).map((c) => c.name).sort()).toEqual([
      'B-52', 'B-52 (트리플섹 버전)', '다크 앤 스토미', '딥 블루 씨', '뉴욕 사워', '브램블',
      '아이리시 커피', '젤리피시', '테킬라 선라이즈', '페니실린', '하비 월뱅어', '화이트 러시안',
    ].sort());
  });
  it('테킬라 선라이즈 — 바닥이 그레나딘 색', () => {
    const s = at('테킬라 선라이즈')!;
    expect(s[s.length - 1]!.color).toBe('#b3122a');
    expect(s[0]!.color).not.toBe('#b3122a');
  });
  it('뉴욕 사워·다크 앤 스토미 — IBA 원문대로 맨 위에 띄운 층', () => {
    expect(at('뉴욕 사워')![0]!.color).toBe('#6b1220');
    const d = at('다크 앤 스토미')!;
    expect(d[0]!.color).toBe(d[1]!.color);                   // 위쪽은 럼 색 그대로
    expect(d[2]!.at - d[1]!.at).toBeGreaterThanOrEqual(0.3); // 경계는 번진다
  });
  it('B-52 — 깔루아가 바닥, 경계가 또렷하다', () => {
    const s = at('B-52')!;
    expect(s[s.length - 1]!.color).toBe('#3b2012');
    expect(s.filter((x, i) => i > 0 && x.at === s[i - 1]!.at).length).toBe(2);
  });
  it('생크림은 또렷한 층, 술은 번지는 층', () => {
    const crisp = (n: string) => at(n)!.some((x, i, a) => i > 0 && x.at === a[i - 1]!.at && x.color !== a[i - 1]!.color);
    expect(crisp('아이리시 커피')).toBe(true);
    expect(crisp('화이트 러시안')).toBe(true);
    expect(crisp('딥 블루 씨')).toBe(false);
    expect(crisp('하비 월뱅어')).toBe(false);
  });
  it('흔들어 만든 생크림은 층이 아니다', () => {
    expect(at('알렉산더')).toBeNull();
  });
});

describe('IBA 원문의 잔', () => {
  it('데이터에 적힌 잔이 잔 규칙보다 먼저다', () => {
    const g = (n: string) => glassOf(cocktails.find((c) => c.name === n)!);
    expect([g('뉴욕 사워'), g('싱가포르 슬링'), g('라모스 피즈'), g('올드 쿠반')]).toEqual(['rocks', 'hurricane', 'highball', 'coupe']);
  });
});
