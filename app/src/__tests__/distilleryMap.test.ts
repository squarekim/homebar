import { describe, it, expect } from 'vitest';
import { DISTILLERIES, distilleryById, mapGroupOf, productsOfDistillery } from '../data/distilleries';
import { REGION_GUIDES, regionGuideById } from '../data/regionGuide';
import { MAP_W, MAP_H, project } from '../data/mapOutline';
import { specOf } from '../data/whiskySpec';

describe('증류소 조사 병합 (2026-10-27)', () => {
  it('40곳 모두 좌표가 있다 (쿨리 추가)', () => {
    expect(DISTILLERIES).toHaveLength(40);
    expect(DISTILLERIES.filter((d) => d.lat === null)).toEqual([]);
  });

  it('두 조사가 모두 중단이라고 한 투어는 중단으로 둔다', () => {
    expect(distilleryById.get('cragganmore')?.visit?.status).toBe('중단');
    expect(distilleryById.get('clynelish')?.visit?.status).toBe('중단');
    expect(distilleryById.get('tamdhu')?.visit?.status).toBe('없음');
  });

  it('두 조사 모두 찾지 못한 투어는 없음으로 단정하지 않는다', () => {
    for (const id of ['dufftown', 'glenburgie', 'cooley']) expect(distilleryById.get(id)?.visit, id).toBeNull();
  });

  it('설립 연도가 갈린 곳은 메모를 달고, 1년 차이로 갈린 더프타운은 비운다', () => {
    expect(distilleryById.get('clynelish')).toMatchObject({ founded: 1819, foundedNote: expect.stringContaining('1967') });
    expect(distilleryById.get('bushmills')).toMatchObject({ founded: 1784, foundedNote: expect.stringContaining('1608') });
    expect(distilleryById.get('dufftown')?.founded).toBeUndefined();
    expect(DISTILLERIES.filter((d) => d.founded).length).toBe(39);
  });

  it('정보를 넣은 증류소는 출처가 있다', () => {
    for (const d of DISTILLERIES) if (d.founded || d.owner || d.visit) expect(d.sources.length, d.id).toBeGreaterThan(0);
  });
});

describe('증류소 지도', () => {
  it('지도 묶음마다 지역 소개가 있다', () => {
    for (const d of DISTILLERIES) expect(regionGuideById.has(mapGroupOf(d)), `${d.id} → ${mapGroupOf(d)}`).toBe(true);
    for (const g of REGION_GUIDES) expect(g.sources.length, g.id).toBeGreaterThan(0);
  });

  it('스코틀랜드·아일랜드 증류소는 지도 안에 찍힌다', () => {
    for (const d of DISTILLERIES.filter((x) => ['스코틀랜드', '아일랜드'].includes(x.country))) {
      const [x, y] = project(d.lat!, d.lng!);
      expect(x, d.id).toBeGreaterThan(0); expect(x, d.id).toBeLessThan(MAP_W);
      expect(y, d.id).toBeGreaterThan(0); expect(y, d.id).toBeLessThan(MAP_H);
    }
  });

  it('기준 DB 에서 아일라 제품은 스페이사이드보다 피트를 쓴 비율이 높다', () => {
    const ratio = (group: string) => {
      const ps = DISTILLERIES.filter((d) => mapGroupOf(d) === group).flatMap((d) => productsOfDistillery(d.id));
      return ps.filter((p) => p.whiskyClass && specOf(p.whiskyClass).peat === '피티드').length / ps.length;
    };
    expect(ratio('아일라')).toBeGreaterThan(ratio('스페이사이드'));
  });
});
