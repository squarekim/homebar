/**
 * worldMap.ts — 세계 증류소 지도의 묶음·화면·투영. 그리는 일은 DistilleryMap.tsx 가 한다.
 *
 * 묶음: 스코틀랜드는 지역(섬 포함), 아일랜드섬은 하나, 그 밖은 대륙·나라 단위로 묶는다.
 * 투영: 등장방형. 세계 화면은 경도를 그대로 쓰고, 확대한 화면은 가운데 위도의 cos 를 곱해 모양이 눌리지 않게 한다.
 * 윤곽: 영국·아일랜드 안쪽만 보는 화면은 정밀 윤곽(ISLES_LAND), 나머지는 세계 윤곽(WORLD_LAND)을 쓴다.
 */
import { type WorldDistillery } from '../models/types';
import { WORLD_DISTILLERIES } from './worldDistilleries';
import { ISLES_LAND, WORLD_LAND } from './worldOutline';
import { SCOTCH_DISPLAY_REGIONS } from './whiskySpec';

export { WORLD_DISTILLERIES };

const ASIA = ['대만', '중국', '인도', '태국', '베트남', '파키스탄', '이스라엘'];
const NORTH_AMERICA = ['미국', '캐나다', '멕시코'];
const OCEANIA = ['호주', '뉴질랜드'];
const SOUTH = ['브라질', '아르헨티나', '페루', '나미비아', '남아프리카공화국'];

/** 큰 묶음(첫째 칩 줄). 스코틀랜드는 지역 칩이 한 줄 더 붙는다 */
export const WORLD_GROUPS = ['스코틀랜드', '아일랜드', '잉글랜드·웨일스', '유럽', '북미', '일본', '한국', '아시아', '오세아니아', '중남미·아프리카'] as const;
export type WorldGroup = (typeof WORLD_GROUPS)[number];

export function worldGroupOf(d: WorldDistillery): WorldGroup {
  const c = d.country;
  if (c === '스코틀랜드') return '스코틀랜드';
  if (c === '아일랜드' || c === '북아일랜드') return '아일랜드';
  if (c === '잉글랜드' || c === '웨일스') return '잉글랜드·웨일스';
  if (c === '일본' || c === '한국') return c;
  if (ASIA.includes(c)) return '아시아';
  if (NORTH_AMERICA.includes(c)) return '북미';
  if (OCEANIA.includes(c)) return '오세아니아';
  if (SOUTH.includes(c)) return '중남미·아프리카';
  return '유럽';
}

/** 스코틀랜드 화면용 지역. 하이랜드 중 섬에 있는 곳은 '섬'으로 묶는다(법정 지역은 하이랜드) */
export function scotchRegionOf(d: WorldDistillery): string | null {
  if (d.country !== '스코틀랜드') return null;
  if (d.region === '하이랜드' && d.isle) return '섬';
  return (SCOTCH_DISPLAY_REGIONS as readonly string[]).includes(d.region ?? '') ? d.region! : null;
}

/** 화면 하나. '세계' · 큰 묶음 · 스코틀랜드 지역 */
export type MapViewId = '세계' | WorldGroup | (typeof SCOTCH_DISPLAY_REGIONS)[number];

export function inView(d: WorldDistillery, view: MapViewId): boolean {
  if (view === '세계') return true;
  if ((WORLD_GROUPS as readonly string[]).includes(view)) return worldGroupOf(d) === view;
  return scotchRegionOf(d) === view;
}

/** 지역 소개(regionGuide)와 기존 40곳의 묶음 이름이 같은 화면 */
export function isScotchView(view: MapViewId): boolean {
  return view === '스코틀랜드' || (SCOTCH_DISPLAY_REGIONS as readonly string[]).includes(view);
}

export type Located = WorldDistillery & { lat: number; lng: number };
export const located = (d: WorldDistillery): d is Located => d.lat !== undefined && d.lng !== undefined;

/** 화면 폭(지도 단위). 높이는 화면마다 범위에 맞춰 정한다 */
export const MAP_W = 1000;

export interface Projection {
  /** 위경도 → 지도 좌표 */
  project: (lat: number, lng: number) => [x: number, y: number];
  /** viewBox [x, y, w, h] */
  box: [number, number, number, number];
  /** 이 화면에 쓸 육지 윤곽(SVG path d) */
  land: string[];
}

const WORLD_BOUNDS = { lng0: -170, lng1: 180, lat0: -56, lat1: 75 };
const ISLES_BOUNDS = { lng0: -11, lng1: 2, lat0: 49.8, lat1: 61 };

function decode(rings: readonly string[], unit: number): [number, number][][] {
  return rings.map((r) => {
    let x = 0, y = 0;
    return r.split(' ').map((pair) => {
      const [dx, dy] = pair.split(',').map(Number) as [number, number];
      x += dx; y += dy;
      return [x * unit, y * unit] as [number, number];
    });
  });
}
const WORLD_RINGS = decode(WORLD_LAND, 0.1);
const ISLES_RINGS = decode(ISLES_LAND, 0.01);

/** 점들이 모두 들어오는 경위도 범위. 너무 좁으면 최소 폭을 둔다 */
function boundsOf(ds: Located[], minSpan: number) {
  let lng0 = Math.min(...ds.map((d) => d.lng)), lng1 = Math.max(...ds.map((d) => d.lng));
  let lat0 = Math.min(...ds.map((d) => d.lat)), lat1 = Math.max(...ds.map((d) => d.lat));
  const pad = Math.max(lng1 - lng0, lat1 - lat0) * 0.12;
  lng0 -= pad; lng1 += pad; lat0 -= pad; lat1 += pad;
  if (lng1 - lng0 < minSpan) { const c = (lng0 + lng1) / 2; lng0 = c - minSpan / 2; lng1 = c + minSpan / 2; }
  if (lat1 - lat0 < minSpan * 0.6) { const c = (lat0 + lat1) / 2; lat0 = c - minSpan * 0.3; lat1 = c + minSpan * 0.3; }
  return { lng0, lng1, lat0, lat1 };
}

/**
 * 화면의 투영. 세계는 고정 범위, 그 밖은 화면에 든 점의 범위로 맞춘다.
 * 세로가 가로의 1.4배를 넘으면(일본처럼 남북으로 긴 곳) 가로를 넓혀 휴대폰 화면을 넘지 않게 한다.
 */
export function projectionFor(view: MapViewId, ds: Located[]): Projection {
  const b = view === '세계' || ds.length === 0 ? WORLD_BOUNDS : boundsOf(ds, 0.9);
  const k = view === '세계' ? 1 : Math.cos(((b.lat0 + b.lat1) / 2) * Math.PI / 180);
  let w = (b.lng1 - b.lng0) * k, h = b.lat1 - b.lat0;
  let lng0 = b.lng0;
  if (h > w * 1.4) { const grow = (h / 1.4 - w) / k; lng0 -= grow / 2; w = h / 1.4; }
  const s = MAP_W / w;
  const project = (lat: number, lng: number): [number, number] => [(lng - lng0) * k * s, (b.lat1 - lat) * s];
  const inIsles = b.lng0 >= ISLES_BOUNDS.lng0 && b.lng1 <= ISLES_BOUNDS.lng1 && b.lat0 >= ISLES_BOUNDS.lat0 && b.lat1 <= ISLES_BOUNDS.lat1;
  const rings = inIsles ? ISLES_RINGS : WORLD_RINGS;
  // 화면 밖 고리는 그리지 않는다(세계 윤곽 416개 중 확대 화면에 드는 것은 몇 개뿐)
  const land = rings
    .filter((r) => r.some(([x, y]) => x >= lng0 - 5 && x <= lng0 + w / k + 5 && y >= b.lat0 - 5 && y <= b.lat1 + 5))
    .map((r) => 'M' + r.map(([x, y]) => project(y, x).map((v) => v.toFixed(1)).join(',')).join(' ') + 'Z');
  return { project, box: [0, 0, MAP_W, h * s], land };
}

/** 투어 표시 이름. 확인하지 못한 곳을 '없음'으로 적지 않는다 */
export function tourLabel(d: WorldDistillery): string {
  if (d.tour === '운영') return '투어 운영';
  if (d.tour === '중단') return '투어 중단';
  if (d.tour === '없음') return '정규 투어 없음';
  return '투어 확인 안 됨';
}

/** 점 색 키 (styles.css 의 .dot.t-*) */
export function tourKey(d: WorldDistillery): 'on' | 'pause' | 'none' | 'unk' {
  return d.tour === '운영' ? 'on' : d.tour === '중단' ? 'pause' : d.tour === '없음' ? 'none' : 'unk';
}

/** 생산을 멈췄거나 아직 시작 확인이 안 된 곳 */
export const notProducing = (d: WorldDistillery) => d.status !== '운영' && d.status !== '운영 (근거 약함)';

/** 묶음별 곳 수와 투어 운영 수 — 세계 화면 아래 목록 */
export function groupCounts(ds: WorldDistillery[]): { group: WorldGroup; total: number; tours: number }[] {
  return WORLD_GROUPS.map((group) => {
    const g = ds.filter((d) => worldGroupOf(d) === group);
    return { group, total: g.length, tours: g.filter((d) => d.tour === '운영').length };
  });
}
