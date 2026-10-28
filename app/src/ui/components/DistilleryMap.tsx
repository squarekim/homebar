/**
 * DistilleryMap — 세계 증류소 지도.
 * 점 색은 투어(운영·중단·없음·확인 안 됨), 테두리 점선은 생산을 멈춘 곳이다.
 * 묶음 칩을 누르면 그 묶음이 화면을 채우게 확대하고, 스코틀랜드는 지역 칩이 한 줄 더 붙는다.
 * 지역 소개(regionGuide)와 이 앱 제품의 피트 비율은 기존 싱글몰트 40곳 기준이다. 지도 라이브러리 없이 SVG 하나로 그린다.
 */
import { useMemo, useState } from 'react';
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
  const fs = unit * 2.8, r = unit * 1.6;
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

const placeOf = (d: WorldDistillery) => [d.country, scotchRegionOf(d) ?? d.region, d.place].filter(Boolean).join(' · ');

export function DistilleryMapView({ onBack }: { onBack: () => void }) {
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
  const unit = vb[2] / (view === '세계' ? 160 : 100); // 확대해도 점과 글자가 화면에서 같은 크기로 보이게
  const pts = useMemo(() => spread(shown.filter(located).map((d) => { const [x, y] = proj.project(d.lat, d.lng); return { d, x, y }; }), unit), [shown, proj, unit]);
  const hitR = useMemo(() => tapRadii(pts, unit), [pts, unit]);
  const labels = useMemo(() => (view === '세계' ? new Map() : placeLabels(pts, unit, vb)), [pts, unit, vb, view]);

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
      <h2 className="pagetitle">증류소 지도<span className="sub">{WORLD_DISTILLERIES.length}곳 · 묶음을 고르면 확대돼요</span></h2>
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

      <svg className="distmap" viewBox={vb.join(' ')} role="img" aria-label={`${view} 증류소 지도`}>
        <rect className="sea" x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} />
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
              {label && <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={unit * 2.8} strokeWidth={unit * 0.6}>{d.ko}</text>}
            </g>
          );
        })}
      </svg>
      <div className="maplegend" aria-hidden="true">
        <span><i className="t-on" />투어 운영</span><span><i className="t-pause" />투어 중단</span>
        <span><i className="t-none" />정규 투어 없음</span><span><i className="t-unk" />확인 안 됨</span>
        <span><i className="stop" />생산 중단 등</span>
      </div>
      <div className="hint">{view} {shown.length}곳 · 투어 운영 {tourCount}곳. 투어 정보는 2026-10-28 조사 기준이라 방문 전에 공식 안내를 확인하세요.</div>

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

      <div className="btnrow"><button className="btn" onClick={onBack}>← 위스키 목록</button></div>
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
