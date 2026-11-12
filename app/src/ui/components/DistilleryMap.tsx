/**
 * DistilleryMap — 세계 증류소 지도.
 * 점 색은 투어(운영·중단·없음·확인 안 됨), 테두리 점선은 생산을 멈춘 곳이다.
 * 묶음 칩을 누르면 그 묶음이 화면을 채우게 확대하고, 스코틀랜드는 지역 칩이 한 줄 더 붙는다.
 * 지역 소개(regionGuide)와 이 앱 제품의 피트 비율은 기존 싱글몰트 40곳 기준이다. 지도 라이브러리 없이 SVG 하나로 그린다.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DISTILLERIES, mapGroupOf, productsOfDistillery } from '../../data/distilleries';
import { regionGuideById } from '../../data/regionGuide';
import { normalizeQuery } from '../../data/textMatch';
import { SCOTCH_DISPLAY_REGIONS, specOf } from '../../data/whiskySpec';
import {
  WORLD_DISTILLERIES, WORLD_GROUPS, groupCounts, inView, isScotchView, located, notProducing, projectionFor,
  scotchRegionOf, tourKey, tourLabel, worldGroupOf, type Located, type MapViewId,
} from '../../data/worldMap';
import { type WorldDistillery } from '../../models/types';
import { ChipRow, ChipToggle, SearchBox } from './common';

const MAIN_CHIPS = (['세계', ...WORLD_GROUPS] as MapViewId[]).map((v) => ({ v, label: v }));
const SCOTCH_CHIPS = (['스코틀랜드', ...SCOTCH_DISPLAY_REGIONS] as MapViewId[]).map((v) => ({ v, label: v === '스코틀랜드' ? '스코틀랜드 전체' : v }));

/** 기존 40곳 중 이 묶음의 피티드 비율 — 지역 맛 경향을 실제 수치로 보여 주기 위해서다 */
function peatStats(group: string): { total: number; peated: number } {
  let total = 0, peated = 0;
  for (const d of DISTILLERIES.filter((x) => mapGroupOf(x) === group)) {
    for (const p of productsOfDistillery(d.id)) {
      total++;
      if (p.whiskyClass && specOf(p.whiskyClass).peat === '피티드') peated++;
    }
  }
  return { total, peated };
}

type Pt = { d: Located; x: number; y: number };

/**
 * 누르는 영역. 기본은 점보다 넉넉하게 잡되, 이웃 점까지 거리의 절반을 넘지 않게 한다.
 * 그래야 글렌피딕·발베니처럼 수백 미터 떨어진 점도 나중에 그린 점이 앞의 점을 가리지 않는다.
 */
function tapRadii(pts: Pt[], unit: number): Map<string, number> {
  return new Map(pts.map((p) => {
    let nn = Infinity;
    for (const q of pts) if (q !== p) nn = Math.min(nn, Math.hypot(q.x - p.x, q.y - p.y));
    return [p.d.id, Math.max(unit * 1.1, Math.min(unit * 3.2, nn / 2))];
  }));
}

/**
 * 같은 마을 좌표를 받은 곳(김포의 두 곳, 태즈메이니아 케임브리지의 네 곳 등)은 점이 겹쳐 하나만 눌린다.
 * 겹친 점을 목록 순서대로 둘레에 고르게 벌려 놓는다. 마을 좌표라 원래도 정확한 위치가 아니다.
 */
function spread(pts: Pt[], unit: number): Pt[] {
  const seen = new Map<string, Pt[]>();
  for (const p of pts) {
    const key = `${p.d.lat.toFixed(3)},${p.d.lng.toFixed(3)}`;
    seen.set(key, [...(seen.get(key) ?? []), p]);
  }
  return [...seen.values()].flatMap((g) => g.length === 1 ? g : g.map((p, i) => {
    const a = (2 * Math.PI * i) / g.length;
    return { ...p, x: p.x + Math.cos(a) * unit * 1.4, y: p.y + Math.sin(a) * unit * 1.4 };
  }));
}

type Box = [x0: number, y0: number, x1: number, y1: number];
const overlaps = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/**
 * 이름표 자리. 오른쪽 → 왼쪽 → 위 → 아래 순서로 놓아 보고, 지도 안에 들어가면서 이미 놓인 이름표·점과 겹치지 않는 첫 자리를 쓴다.
 * 투어를 운영하는 곳부터 자리를 준다. 자리가 없으면 이름표를 달지 않는다. 이름은 지도 아래 목록에 있다.
 */
function placeLabels(pts: Pt[], unit: number, vb: readonly number[]): Map<string, { x: number; y: number; anchor: 'start' | 'end' }> {
  const frame: Box = [vb[0]!, vb[1]!, vb[0]! + vb[2]!, vb[1]! + vb[3]!];
  const inside = (b: Box) => b[0] >= frame[0] && b[1] >= frame[1] && b[2] <= frame[2] && b[3] <= frame[3];
  const fs = unit * 2.3, r = unit * 1.6;
  const dots: Box[] = pts.map(({ x, y }) => [x - r, y - r, x + r, y + r]);
  const placed: Box[] = [];
  const out = new Map<string, { x: number; y: number; anchor: 'start' | 'end' }>();
  const order = [...pts].sort((a, b) => Number(b.d.tour === '운영') - Number(a.d.tour === '운영'));
  for (const { d, x, y } of order) {
    const w = d.ko.length * fs * 0.95, h = fs;
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

/** 확대 — 묶음 화면(vb) 안의 한 부분을 본다. k 배율, (cx, cy) 가운데. 화면 밖으로 나가지 않게 가둔다 */
type Zoom = { k: number; cx: number; cy: number };
const MAX_ZOOM = 16;
function clampZoom(z: Zoom, vb: readonly number[]): Zoom {
  const k = Math.min(MAX_ZOOM, Math.max(1, z.k));
  const w = vb[2]! / k, h = vb[3]! / k;
  const lim = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { k, cx: lim(z.cx, vb[0]! + w / 2, vb[0]! + vb[2]! - w / 2), cy: lim(z.cy, vb[1]! + h / 2, vb[1]! + vb[3]! - h / 2) };
}
/** 점 (px, py) 를 그 자리에 둔 채 f 배 확대·축소 */
function zoomAt(z: Zoom, f: number, px: number, py: number, vb: readonly number[]): Zoom {
  const k = Math.min(MAX_ZOOM, Math.max(1, z.k * f));
  const g = z.k / k;
  return clampZoom({ k, cx: px + (z.cx - px) * g, cy: py + (z.cy - py) * g }, vb);
}

const placeOf = (d: WorldDistillery) => [d.country, scotchRegionOf(d) ?? d.region, d.place].filter(Boolean).join(' · ');

export function DistilleryMapView({ tabs }: { tabs: ReactNode }) {
  const [view, setView] = useState<MapViewId>('세계');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [tourOnly, setTourOnly] = useState(false);
  const [producingOnly, setProducingOnly] = useState(false);
  const [q, setQ] = useState('');

  const shown = useMemo(
    () => WORLD_DISTILLERIES.filter((d) => inView(d, view) && (!tourOnly || d.tour === '운영') && (!producingOnly || !notProducing(d))),
    [view, tourOnly, producingOnly],
  );
  // 확대 범위는 필터와 상관없이 묶음 전체로 잡는다. 필터를 바꿀 때 지도가 움직이지 않게
  const proj = useMemo(() => projectionFor(view, WORLD_DISTILLERIES.filter((d) => inView(d, view)).filter(located)), [view]);
  const vb = proj.box;
  const full: Zoom = { k: 1, cx: vb[0] + vb[2] / 2, cy: vb[1] + vb[3] / 2 };
  const [zoom, setZoom] = useState<Zoom>(full);
  // 묶음을 바꾸면 그 묶음 전체로 돌아간다
  useEffect(() => { setZoom({ k: 1, cx: vb[0] + vb[2] / 2, cy: vb[1] + vb[3] / 2 }); }, [vb]);
  // 지도 틀의 화면 크기 — 보이는 범위를 틀 비율에 맞춰 넓히고, 점·글자 크기를 화면 픽셀로 정한다
  const svgRef = useRef<SVGSVGElement>(null);
  const [frame, setFrame] = useState({ w: 720, h: 480 });
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(([e]) => { const r = e!.contentRect; if (r.width && r.height) setFrame({ w: r.width, h: r.height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /** 확대 상태 z 에서 화면에 보이는 범위 [x, y, w, h] — 묶음 범위를 틀 비율에 맞게 넓힌다 */
  const viewOf = (z: Zoom): [number, number, number, number] => {
    let w = vb[2] / z.k, h = vb[3] / z.k;
    const a = frame.w / frame.h;
    if (w / h < a) w = h * a; else h = w / a;
    return [z.cx - w / 2, z.cy - h / 2, w, h];
  };
  const zc = clampZoom(zoom, vb); // 묶음을 바꾼 첫 화면에서도 범위 안에 둔다
  const cur = viewOf(zc);
  const unit = (cur[2] / frame.w) * (frame.w < 600 ? 5 : 6); // 점 반지름 ≈ 6~7px, 확대해도 화면에서 같은 크기
  const pts = useMemo(() => spread(shown.filter(located).map((d) => { const [x, y] = proj.project(d.lat, d.lng); return { d, x, y }; }), unit), [shown, proj, unit]);
  const hitR = useMemo(() => tapRadii(pts, unit), [pts, unit]);
  // 세계 지도는 점이 빽빽해 처음엔 이름을 달지 않고, 2.5배 넘게 확대하면 단다
  // 이름표 자리는 화면에 보이는 점만 놓고 따진다(끌 때 느려지지 않게)
  const labels = useMemo(() => (view === '세계' && zoom.k < 2.5 ? new Map() : placeLabels(
    pts.filter(({ x, y }) => x >= cur[0] && x <= cur[0] + cur[2] && y >= cur[1] && y <= cur[1] + cur[3]), unit, cur)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts, unit, cur[0], cur[1], cur[2], view, zoom.k]);

  // 휠 · 끌기 · 두 손가락으로 확대하고 옮긴다. 끌고 난 뒤의 클릭은 점 고르기로 치지 않는다
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const dragged = useRef(false);
  const toSvg = (clientX: number, clientY: number, z: Zoom) => {
    const r = svgRef.current!.getBoundingClientRect();
    const [x, y, w, h] = viewOf(z);
    return [x + ((clientX - r.left) / r.width) * w, y + ((clientY - r.top) / r.height) * h] as const;
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => { const [px, py] = toSvg(e.clientX, e.clientY, z); // 휠을 굴린 양만큼(트랙패드의 작은 값도) 부드럽게. 한 번에 2배를 넘지 않게 묶는다
        const f = Math.min(2, Math.max(0.5, Math.exp(-e.deltaY * 0.0025)));
        return zoomAt(z, f, px, py, vb); });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vb, frame.w, frame.h]);
  const onPointerDown = (e: React.PointerEvent) => { ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.current.size === 1) dragged.current = false; };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId);
    if (!prev) return;
    const others = [...ptrs.current.entries()].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
    const r = svgRef.current!.getBoundingClientRect();
    if (others.length === 0) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragged.current = true;
      if (dragged.current) setZoom((z) => { const [, , w, h] = viewOf(z); return clampZoom({ ...z, cx: z.cx - (dx / r.width) * w, cy: z.cy - (dy / r.height) * h }, vb); });
    } else {
      // 두 손가락 — 사이 거리의 변화만큼 가운데를 기준으로 확대
      const o = others[0]!;
      const before = Math.hypot(prev.x - o.x, prev.y - o.y), after = Math.hypot(e.clientX - o.x, e.clientY - o.y);
      dragged.current = true;
      if (before > 0) setZoom((z) => { const [px, py] = toSvg((e.clientX + o.x) / 2, (e.clientY + o.y) / 2, z); return zoomAt(z, after / before, px, py, vb); });
    }
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => { ptrs.current.delete(e.pointerId); };
  const zoomBy = (f: number) => setZoom((z) => zoomAt(z, f, z.cx, z.cy, vb));

  const picked = WORLD_DISTILLERIES.find((d) => d.id === pickedId) ?? null;
  const guide = regionGuideById.get(view);
  const stats = guide ? peatStats(view) : null;
  const scotch = isScotchView(view);

  const found = useMemo(() => {
    const t = normalizeQuery(q);
    if (!t) return [];
    return WORLD_DISTILLERIES.filter((d) => [d.ko, d.en, d.country, d.region ?? ''].some((s) => normalizeQuery(s).includes(t))).slice(0, 30);
  }, [q]);

  const choose = (v: MapViewId) => { setView(v); setPickedId(null); };
  /** 검색 결과를 누르면 그 묶음으로 확대하고 고른다 */
  const pickFound = (d: WorldDistillery) => { setView(scotchRegionOf(d) as MapViewId ?? worldGroupOf(d)); setPickedId(d.id); setQ(''); };

  const tourCount = shown.filter((d) => d.tour === '운영').length;
  const list = [...shown].sort((a, b) => Number(b.tour === '운영') - Number(a.tour === '운영') || a.ko.localeCompare(b.ko, 'ko'));

  return (
    <>
      <h2 className="pagetitle" data-k="Distillery Atlas">증류소 지도</h2>
      {tabs}
      <SearchBox value={q} onChange={setQ} placeholder="증류소 이름·나라로 찾기" />
      {found.length > 0 && (
        <div className="rowlist">
          {found.map((d) => (
            <button className="rowitem" key={d.id} onClick={() => pickFound(d)}>
              <div className="body"><span className="nm">{d.ko}</span><div className="taste">{d.en} · {placeOf(d)} · {tourLabel(d)}</div></div>
            </button>
          ))}
        </div>
      )}
      <ChipRow value={scotch ? '스코틀랜드' : view} options={MAIN_CHIPS} onChange={choose} />
      {scotch && <ChipRow tight value={view} options={SCOTCH_CHIPS} onChange={choose} />}
      <div className="controls tight">
        <ChipToggle label="투어 운영만" on={tourOnly} onToggle={() => setTourOnly(!tourOnly)} />
        <ChipToggle label="생산 중인 곳만" on={producingOnly} onToggle={() => setProducingOnly(!producingOnly)} />
      </div>

      <div className="mapwrap">
      <svg ref={svgRef} className="distmap" viewBox={cur.join(' ')} role="img" aria-label={`${view} 증류소 지도`}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}
        onClickCapture={(e) => { if (dragged.current) { e.stopPropagation(); dragged.current = false; } }}>
        <rect className="sea" x={cur[0]} y={cur[1]} width={cur[2]} height={cur[3]} />
        {proj.land.map((d, i) => <path key={i} className="land" d={d} strokeWidth={unit * 0.2} />)}
        {pts.map(({ d, x, y }) => {
          const on = pickedId === d.id;
          const label = labels.get(d.id);
          return (
            <g key={d.id} className={`dot t-${tourKey(d)}${notProducing(d) ? ' stop' : ''}${on ? ' picked' : ''}`}
              role="button" tabIndex={0} aria-label={`${d.ko}, ${tourLabel(d)}${notProducing(d) ? `, ${d.status}` : ''}`}
              onClick={() => setPickedId(d.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPickedId(d.id); }}>
              <circle className="hit" cx={x} cy={y} r={hitR.get(d.id) ?? unit * 1.1} />
              <circle cx={x} cy={y} r={unit * (on ? 1.8 : 1.1)} strokeWidth={unit * 0.35} strokeDasharray={notProducing(d) ? `${unit * 0.6} ${unit * 0.4}` : undefined} />
              {label && <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={unit * 2.3} strokeWidth={unit * 0.5}>{d.ko}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mapzoom">
        <button type="button" aria-label="확대" onClick={() => zoomBy(1.6)} disabled={zoom.k >= MAX_ZOOM}>+</button>
        <button type="button" aria-label="축소" onClick={() => zoomBy(1 / 1.6)} disabled={zoom.k <= 1}>−</button>
        <button type="button" aria-label="전체 보기" onClick={() => setZoom(full)} disabled={zoom.k <= 1}>⤢</button>
      </div>
      </div>
      <div className="maplegend" aria-hidden="true">
        <span><i className="t-on" />투어 운영</span><span><i className="t-pause" />투어 중단</span>
        <span><i className="t-none" />정규 투어 없음</span><span><i className="t-unk" />확인 안 됨</span>
        <span><i className="stop" />생산 중단 등</span>
      </div>
      <div className="hint">{shown.length}곳 · 투어 {tourCount}곳 (2026.10 기준)</div>

      {picked && <><div className="sechead in">증류소</div><WorldDistilleryCard d={picked} /></>}

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

      {view === '세계' ? (
        <>
          <div className="sechead in">묶음별</div>
          <div className="rowlist">
            {groupCounts(shown).filter((g) => g.total > 0).map((g) => (
              <button className="rowitem" key={g.group} onClick={() => choose(g.group)}>
                <div className="body"><span className="nm">{g.group}</span><div className="taste">{g.total}곳 · 투어 운영 {g.tours}곳</div></div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sechead in">{view} 증류소 {shown.length}곳</div>
          <div className="rowlist">
            {list.map((d) => (
              <button className="rowitem" key={d.id} aria-current={pickedId === d.id} onClick={() => setPickedId(d.id)}>
                <div className="body">
                  <span className="nm">{d.ko}</span>
                  <div className="taste">{[placeOf(d), tourLabel(d), notProducing(d) && d.status, !located(d) && '좌표 없음'].filter(Boolean).join(' · ')}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

    </>
  );
}

/** 세계 지도에서 고른 증류소. 확인한 것만 적고, 투어를 확인하지 못했으면 '없음'으로 적지 않는다 */
function WorldDistilleryCard({ d }: { d: WorldDistillery }) {
  const products = d.appId ? productsOfDistillery(d.appId) : [];
  return (
    <div className="makernote">
      <p className="mn-line"><b>{d.ko}</b> {d.en}</p>
      <p className="mn-line">{placeOf(d)}{d.isle ? ' (법정 지역은 하이랜드)' : ''}</p>
      {d.founded && <p className="mn-line">{d.founded}년 설립</p>}
      {d.status !== '운영' && <p className="mn-line"><b>{d.status}</b>{d.statusNote ? ` · ${d.statusNote}` : ''}</p>}
      {products.length > 0 && <p className="mn-line">이 앱의 제품 {products.map((p) => p.nameKo).join(', ')}</p>}
      <p className="mn-line">
        {d.tourUrl && d.tour ? <a href={d.tourUrl} target="_blank" rel="noopener">{tourLabel(d)} ↗</a> : <span>{tourLabel(d)}</span>}
        {d.tour && <small className="sub"> (2026-10-28 확인)</small>}
      </p>
      {d.coord === '마을' && <p className="mn-line"><small className="sub">점은 증류소가 있는 마을 위치예요(Wikidata)</small></p>}
      {d.src && <a className="mn-src" href={d.src} target="_blank" rel="noopener">출처 ↗</a>}
      {located(d) && (
        <> · <a className="mn-src" href={`https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=11/${d.lat}/${d.lng}`} target="_blank" rel="noopener">지도에서 보기 ↗</a></>
      )}
    </div>
  );
}
