import { describe, expect, it } from 'vitest';
import { cocktails, ingredientIdOf } from '../data/adapters';
import { garnishState, garnishUsage, GARNISH_STOCK, DRIED_ID } from '../services/garnishStock';

const byName = (n: string) => cocktails.find((c) => c.name === n)!;
const held = (...ids: string[]) => new Set(ids);

describe('가니시 재고', () => {
  it('가니시가 없는 레시피는 none', () => {
    expect(garnishState(byName('갓파더'), held())).toBe('none');
  });
  it('꼭 필요한 조각이 다 있어야 all', () => {
    const of = byName('올드 패션드'); // 오렌지 슬라이스+체리
    expect(garnishState(of, held('gn_orange'))).toBe('missing');
    expect(garnishState(of, held('gn_orange', 'gn_cherry'))).toBe('all');
  });
  it('말린 칩은 슬라이스만 대신하고 껍질·웨지는 대신하지 못한다', () => {
    expect(garnishState(byName('네그로니'), held(DRIED_ID))).toBe('all');        // 오렌지 슬라이스
    expect(garnishState(byName('뉴욕 사워'), held(DRIED_ID, 'gn_cherry'))).toBe('missing'); // 제스트
    expect(garnishState(byName('다크 앤 스토미'), held(DRIED_ID))).toBe('missing'); // 라임 웨지
  });
  it('민트·칵테일 어니언은 재료 체크를 같이 쓴다', () => {
    expect(garnishState(byName('깁슨'), held(ingredientIdOf('칵테일 어니언')))).toBe('all');
    expect(garnishState(byName('민트 줄립'), held(ingredientIdOf('민트 잎')))).toBe('all');
  });
  it('(선택) 조각은 없어도 된다', () => {
    const c = cocktails.find((x) => x.garnish === '라임 웨지 · 소금 리밍(선택)')!;
    expect(garnishState(c, held('gn_lime'))).toBe('all');
  });
  it('항목마다 쓰는 레시피 수를 센다', () => {
    const u = garnishUsage(cocktails);
    expect(GARNISH_STOCK.every((g) => (u.get(g.id) ?? 0) > 0)).toBe(true);
    expect(u.get('gn_lemon')).toBeGreaterThan(u.get(DRIED_ID)!);
  });
});
