import { describe, it, expect } from 'vitest';
import { DISTILLERIES, distilleryById, mapGroupOf, productsOfDistillery } from '../data/distilleries';
import { REGION_GUIDES, regionGuideById } from '../data/regionGuide';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WORLD_DISTILLERIES, WORLD_GROUPS, inView, located, notProducing, projectionFor, tourLabel, type MapViewId } from '../data/worldMap';
import { SCOTCH_DISPLAY_REGIONS } from '../data/whiskySpec';
import { buildWorldDistilleries } from '../../scripts/buildWorldDistilleries.mjs';
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

  it('기준 DB 에서 아일라 제품은 스페이사이드보다 피트를 쓴 비율이 높다', () => {
    const ratio = (group: string) => {
      const ps = DISTILLERIES.filter((d) => mapGroupOf(d) === group).flatMap((d) => productsOfDistillery(d.id));
      return ps.filter((p) => p.whiskyClass && specOf(p.whiskyClass).peat === '피티드').length / ps.length;
    };
    expect(ratio('아일라')).toBeGreaterThan(ratio('스페이사이드'));
  });
});

describe('세계 증류소 지도 (2026-10-28 조사)', () => {
  const byId = new Map(WORLD_DISTILLERIES.map((d) => [d.id, d]));

  it('생성 파일이 조사 JSON 과 같다', () => {
    const json = JSON.parse(readFileSync(resolve(__dirname, '../../scripts/data/worldDistilleries.json'), 'utf8'));
    const ts = readFileSync(resolve(__dirname, '../data/worldDistilleries.ts'), 'utf8');
    expect(buildWorldDistilleries(json)).toBe(ts);
    expect(WORLD_DISTILLERIES).toHaveLength(737);
  });

  it('좌표 없는 곳은 11곳뿐이고, 좌표가 있는 점은 모두 자기 묶음 화면 안에 찍힌다', () => {
    expect(WORLD_DISTILLERIES.filter((d) => !located(d))).toHaveLength(11);
    const views: MapViewId[] = ['세계', ...WORLD_GROUPS, ...SCOTCH_DISPLAY_REGIONS];
    for (const v of views) {
      const ds = WORLD_DISTILLERIES.filter((d) => inView(d, v)).filter(located);
      const { project, box } = projectionFor(v, ds);
      for (const d of ds) {
        const [x, y] = project(d.lat, d.lng);
        expect(x >= box[0] && x <= box[0] + box[2] && y >= box[1] && y <= box[1] + box[3], `${v} ${d.id}`).toBe(true);
      }
    }
  });

  it('모든 증류소가 큰 묶음 하나에 들어간다', () => {
    const n = WORLD_GROUPS.reduce((s, g) => s + WORLD_DISTILLERIES.filter((d) => inView(d, g)).length, 0);
    expect(n).toBe(WORLD_DISTILLERIES.length);
  });

  it('투어를 확인하지 못한 곳은 없음으로 적지 않는다', () => {
    for (const d of WORLD_DISTILLERIES.filter((x) => !x.tour)) expect(tourLabel(d)).toBe('투어 확인 안 됨');
  });

  it('생산을 멈춘 곳은 까닭과 출처가 있다', () => {
    const stopped = WORLD_DISTILLERIES.filter(notProducing);
    expect(stopped.length).toBeGreaterThan(0);
    for (const d of stopped) { expect(d.statusNote, d.id).toBeTruthy(); expect(d.src, d.id).toMatch(/^https:/); }
    expect(byId.get('teaninich')?.status).toBe('증류 중단');
    expect(byId.get('glendalough')?.status).toBe('운영 (근거 약함)');
  });

  it('섬 판정: 스카이·오크니·아란은 섬, 본섬 해안 증류소는 하이랜드', () => {
    for (const id of ['talisker', 'highlandpark', 'lochranza', 'jura']) expect(inView(byId.get(id)!, '섬'), id).toBe(true);
    for (const id of ['glenmorangie', 'oban', 'ncnean']) expect(inView(byId.get(id)!, '하이랜드'), id).toBe(true);
  });

  it('기존 40곳과 연결한 id 는 모두 있다', () => {
    const linked = WORLD_DISTILLERIES.filter((d) => d.appId);
    expect(linked).toHaveLength(40);
    for (const d of linked) expect(distilleryById.has(d.appId!), d.id).toBe(true);
  });
});
