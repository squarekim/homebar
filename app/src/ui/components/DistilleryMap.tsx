/**
 * DistilleryMap — 싱글몰트 증류소 지도.
 * 스코틀랜드와 아일랜드섬은 지도에 점으로, 일본·한국은 지도 아래 목록으로 보여 준다.
 * 지역 칩을 누르면 그 지역 증류소가 모두 들어오게 확대하고, 지역 소개(공식 출처가 있는 맛 경향 포함)와
 * 기준 DB 제품의 피트 비율을 함께 보여 준다. 지도 라이브러리 없이 SVG 하나로 그린다.
 */
import { useMemo, useState } from 'react';
import { DISTILLERIES, mapGroupOf, productsOfDistillery } from '../../data/distilleries';
import { COASTLINE, MAP_W, MAP_H, project } from '../../data/mapOutline';
import { regionGuideById } from '../../data/regionGuide';
import { SCOTCH_DISPLAY_REGIONS, specOf } from '../../data/whiskySpec';
import { type Distillery } from '../../models/types';
import { ChipRow } from './common';
import { DistilleryCard } from './DistilleryCard';

const ON_MAP = ['전체', ...SCOTCH_DISPLAY_REGIONS, '아일랜드'] as const;
const OFF_MAP = ['일본', '한국'] as const;
type Region = (typeof ON_MAP)[number] | (typeof OFF_MAP)[number];
const CHIPS = [...ON_MAP, ...OFF_MAP].map((v) => ({ v, label: v }));

/** 지역 묶음 → 점 색 키 (styles.css 의 .dot.g-*) */
const GROUP_KEY: Record<string, string> = {
  스페이사이드: 'spey', 하이랜드: 'high', 섬: 'isle', 아일라: 'islay', 캠벨타운: 'camp', 로우랜드: 'low', 아일랜드: 'ire',
};

/** 기준 DB 싱글몰트 중 피티드 비율 — 지역 맛 경향을 실제 수치로 보여 주기 위해서다 */
function peatStats(ds: Distillery[]): { total: number; peated: number } {
  let total = 0, peated = 0;
  for (const d of ds) {
    for (const p of productsOfDistillery(d.id)) {
      total++;
      if (p.whiskyClass && specOf(p.whiskyClass).peat === '피티드') peated++;
    }
  }
  return { total, peated };
}

/** 고른 증류소가 모두 들어오는 viewBox. 너무 작게 확대되지 않게 최소 크기를 둔다 */
function viewBoxOf(ds: Distillery[]): [number, number, number, number] {
  const pts = ds.filter((d) => d.lat !== null && d.lng !== null).map((d) => project(d.lat!, d.lng!));
  if (pts.length === 0) return [0, 0, MAP_W, MAP_H];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  // 여백은 범위에 비례하게 잡는다. 아일라처럼 좁은 지역도 섬 전체가 화면을 채우게 한다
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const pad = Math.max(10, span * 0.12), min = 60;
  let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  if (x1 - x0 < min) { const c = (x0 + x1) / 2; x0 = c - min / 2; x1 = c + min / 2; }
  if (y1 - y0 < min) { const c = (y0 + y1) / 2; y0 = c - min / 2; y1 = c + min / 2; }
  return [x0, y0, x1 - x0, y1 - y0];
}

const ON_MAP_DS = DISTILLERIES.filter((d) => d.lat !== null && d.lng !== null);

/**
 * 누르는 영역. 기본은 점보다 넉넉하게 잡되, 이웃 점까지 거리의 절반을 넘지 않게 한다.
 * 그래야 글렌피딕·발베니처럼 수백 미터 떨어진 점도 나중에 그린 점이 앞의 점을 가리지 않는다.
 */
function tapRadii(unit: number): Map<string, number> {
  const pts = ON_MAP_DS.map((d) => [d.id, ...project(d.lat!, d.lng!)] as const);
  return new Map(pts.map(([id, x, y]) => {
    const nn = Math.min(...pts.filter((p) => p[0] !== id).map((p) => Math.hypot(p[1] - x, p[2] - y)));
    return [id, Math.max(unit * 1.3, Math.min(unit * 3.2, nn / 2))];
  }));
}

type Box = [x0: number, y0: number, x1: number, y1: number];
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/**
 * 이름표 자리. 아일라 남쪽처럼 1~2km 사이에 증류소가 붙어 있으면 이름표가 서로·점과 겹친다.
 * 오른쪽 → 왼쪽 → 위 → 아래 순서로 놓아 보고, 지도 안에 들어가면서 이미 놓인 이름표·점과 겹치지 않는 첫 자리를 쓴다.
 * 그런 자리가 없으면 이름표를 달지 않는다. 점은 그대로 있고, 이름은 지도 아래 목록에 있다.
 */
function placeLabels(ds: Distillery[], unit: number, vb: readonly number[]): Map<string, { x: number; y: number; anchor: 'start' | 'end' }> {
  const frame: Box = [vb[0]!, vb[1]!, vb[0]! + vb[2]!, vb[1]! + vb[3]!];
  const inside = (b: Box) => b[0] >= frame[0] && b[1] >= frame[1] && b[2] <= frame[2] && b[3] <= frame[3];
  const fs = unit * 2.8, r = unit * 1.6;
  const dots: Box[] = ds.map((d) => { const [x, y] = project(d.lat!, d.lng!); return [x - r, y - r, x + r, y + r]; });
  const placed: Box[] = [];
  const out = new Map<string, { x: number; y: number; anchor: 'start' | 'end' }>();
  for (const d of ds) {
    const [x, y] = project(d.lat!, d.lng!);
    const w = d.nameKo.length * fs * 0.95, h = fs;
    const tries: { x: number; y: number; anchor: 'start' | 'end'; box: Box }[] = [
      { x: x + unit * 2, y: y + fs * 0.35, anchor: 'start', box: [x + unit * 2, y - h * 0.65, x + unit * 2 + w, y + h * 0.35] },
      { x: x - unit * 2, y: y + fs * 0.35, anchor: 'end', box: [x - unit * 2 - w, y - h * 0.65, x - unit * 2, y + h * 0.35] },
      { x: x + unit * 1.2, y: y - unit * 2, anchor: 'start', box: [x + unit * 1.2, y - unit * 2 - h, x + unit * 1.2 + w, y - unit * 2] },
      { x: x + unit * 1.2, y: y + unit * 2 + fs * 0.8, anchor: 'start', box: [x + unit * 1.2, y + unit * 2 - h * 0.2, x + unit * 1.2 + w, y + unit * 2 + fs * 0.8] },
    ];
    const ok = tries.find((t) => inside(t.box) && !placed.some((b) => overlaps(b, t.box)) && !dots.some((b) => overlaps(b, t.box)));
    if (!ok) continue;
    placed.push(ok.box);
    out.set(d.id, { x: ok.x, y: ok.y, anchor: ok.anchor });
  }
  return out;
}

export function DistilleryMapView({ onBack }: { onBack: () => void }) {
  const [region, setRegion] = useState<Region>('전체');
  const [pickedId, setPickedId] = useState<string | null>(null);

  const inRegion = useMemo(
    () => (region === '전체' ? DISTILLERIES.filter((d) => d.lat !== null) : DISTILLERIES.filter((d) => mapGroupOf(d) === region)),
    [region],
  );
  const offMap = (OFF_MAP as readonly string[]).includes(region);
  const vb = region === '전체' || offMap ? [0, 0, MAP_W, MAP_H] as const : viewBoxOf(inRegion);
  const unit = vb[2] / 100; // 확대해도 점과 글자가 화면에서 같은 크기로 보이게
  const guide = regionGuideById.get(region);
  const stats = region === '전체' ? null : peatStats(inRegion);
  const picked = DISTILLERIES.find((d) => d.id === pickedId) ?? null;
  const hitR = useMemo(() => tapRadii(unit), [unit]);
  const labels = region === '전체' || offMap ? new Map() : placeLabels(inRegion.filter((d) => d.lat !== null), unit, vb);

  const choose = (r: Region) => { setRegion(r); setPickedId(null); };

  return (
    <>
      <h2 className="pagetitle">증류소 지도<span className="sub">싱글몰트 {DISTILLERIES.length}곳 · 지역을 고르면 확대돼요</span></h2>
      <ChipRow value={region} options={CHIPS} onChange={choose} />

      {!offMap && (
        <svg className="distmap" viewBox={vb.join(' ')} role="img" aria-label={`${region} 증류소 지도`}>
          <rect className="sea" x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} />
          {COASTLINE.map((d, i) => <path key={i} className="land" d={d} strokeWidth={unit * 0.25} />)}
          {ON_MAP_DS.map((d) => {
            const [x, y] = project(d.lat!, d.lng!);
            const on = region === '전체' || inRegion.includes(d);
            return (
              <g key={d.id} className={`dot g-${GROUP_KEY[mapGroupOf(d)] ?? 'other'}${on ? '' : ' off'}${pickedId === d.id ? ' picked' : ''}`}
                role="button" tabIndex={on ? 0 : -1} aria-label={d.nameKo}
                onClick={() => setPickedId(d.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPickedId(d.id); }}>
                <circle className="hit" cx={x} cy={y} r={hitR.get(d.id) ?? unit * 1.3} />
                <circle cx={x} cy={y} r={unit * (pickedId === d.id ? 1.9 : 1.3)} strokeWidth={unit * 0.35} />
                {labels.has(d.id) && (
                  <text x={labels.get(d.id)!.x} y={labels.get(d.id)!.y} textAnchor={labels.get(d.id)!.anchor} fontSize={unit * 2.8} strokeWidth={unit * 0.6}>{d.nameKo}</text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {picked && <><div className="sechead in">증류소</div><DistilleryCard d={picked} showProducts /></>}

      {guide && (
        <>
          <div className="sechead in">{guide.id} 소개</div>
          <div className="makernote">
            <p className="mn-line">{guide.legal}</p>
            {guide.facts.map((f) => <p className="mn-line" key={f}>{f}</p>)}
            {guide.style && <p className="mn-line"><b>맛 경향</b> {guide.style}</p>}
            {stats && stats.total > 0 && (
              <p className="mn-line"><b>이 앱의 제품</b> 싱글몰트 {stats.total}종 중 피트를 쓴 제품 {stats.peated}종</p>
            )}
            {guide.sources.map((s) => <a className="mn-src" key={s} href={s} target="_blank" rel="noopener">출처 ↗ </a>)}
          </div>
        </>
      )}

      <div className="sechead in">{region === '전체' ? '지도 밖 증류소' : `${region} 증류소 ${inRegion.length}곳`}</div>
      <div className="rowlist">
        {(region === '전체' ? DISTILLERIES.filter((d) => (OFF_MAP as readonly string[]).includes(mapGroupOf(d))) : inRegion).map((d) => (
          <button className="rowitem" key={d.id} aria-current={pickedId === d.id} onClick={() => setPickedId(d.id)}>
            <div className="body">
              <span className="nm">{d.nameKo}</span>
              <div className="taste">{[mapGroupOf(d), d.place].filter(Boolean).join(' · ')}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="btnrow"><button className="btn" onClick={onBack}>← 위스키 목록</button></div>
    </>
  );
}
