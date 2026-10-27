/**
 * WhiskyPage — '위스키'. 제품을 보고 비교하는 곳이다.
 * 목록은 병 · 이름 · 도수 · 핵심 맛까지만 보여주고, 상세에서 맛 설명과 제조사 공식 노트를 먼저 읽힌다.
 * 지역·캐스크·분류·향미 수치는 그 뒤로 미룬다. 보유 수량·잔량 관리는 내 술장이 맡는다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useWhiskies, useBottles, useBottleNotes } from '../../hooks/useData';
import { bottleNoteRepo } from '../../repositories/bottleNoteRepo';
import { flavorWords } from '../../services/flavorService';
import { computeCoverage, computeRegionMaturityMatrix, simulateAdd, MATRIX_TIERS } from '../../services/whiskyDiversityService';
import { CANDIDATE_WHISKIES } from '../../data/candidateWhiskies';
import { CLASS_FILTERS, classTags } from '../../data/whiskyClass';
import { specOf, specTitle, specMatchesTerm, displayRegionLabel } from '../../data/whiskySpec';
import { distilleryOfProduct } from '../../data/distilleries';
import { DistilleryCard } from '../components/DistilleryCard';
import { DistilleryMapView } from '../components/DistilleryMap';
import { bottleKindLabel } from '../../data/bottleIngredients';
import { FlavorBars, MakerNoteView, BottleBadges, Term, ChipRow, SearchBox, allChips } from '../components/common';
import { BottleMark } from '../components/Mark';
import { normalize, hits } from '../listUtils';
import { type Bottle, type WhiskySpec } from '../../models/types';

const CLASS_CHIPS = allChips(CLASS_FILTERS, '분류 전체');

/** 핵심 맛 — 향미 상위 두 축과 분류 캐릭터(피티드 등) */
function character(w: Bottle): string {
  const words = flavorWords(w.flavor);
  const chars = w.whiskyClass?.character.filter((c) => c !== '논피트') ?? [];
  return [...chars, ...words].slice(0, 3).join(' · ');
}

const specFor = (w: Bottle): WhiskySpec | null => (w.whiskyClass ? specOf(w.whiskyClass, w.name) : null);
const joinDot = (xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' · ');

function RegionTag({ w }: { w: Bottle }) {
  const s = specFor(w);
  const r = s && displayRegionLabel(s.legalRegion, s.subRegion);
  return r ? <span className="mi">{r}</span> : null;
}

/** 3층 분류 — 법적 정체성 · 속성 · 지역. 모르는 칸은 비운다 */
function SpecView({ s }: { s: WhiskySpec }) {
  const rows: [string, string][] = [
    ['분류', specTitle(s)],
    ['법적 명칭', s.legal ?? '기준 충족 미확인'],
    ['나라 · 지역', joinDot([s.country, displayRegionLabel(s.legalRegion, s.subRegion, true)])],
    ['숙성', s.age ? `${s.age}년` : ''],
    ['캐스크', joinDot([...s.casks, ...s.caskMethod])],
    ['피트', s.peat === '미상' ? '' : s.peatNote ?? s.peat],
    ['병입', joinDot([s.strength, s.bottledInBond && '보틀드 인 본드', s.singleBarrel && '싱글 배럴'])],
    ['원료 · 공정', joinDot([s.mashbill, ...s.process])],
    ['향 특징', joinDot(s.flavorNotes)],
  ];
  return (
    <div className="makernote">
      {rows.filter(([, v]) => v).map(([k, v]) => <p className="mn-line" key={k}><b>{k}</b> {v}</p>)}
    </div>
  );
}

function PersonalNote({ bottleId, initial, onSaved }: { bottleId: string; initial: string; onSaved: () => void }) {
  const [text, setText] = useState(initial);
  const dirty = text !== initial;
  return (
    <>
      <textarea rows={3} value={text} placeholder="마셔본 느낌을 적어 두세요" onChange={(e) => setText(e.target.value)} />
      <div className="btnrow">
        <button className="btn sm" disabled={!dirty} onClick={async () => { await bottleNoteRepo.set(bottleId, text); onSaved(); }}>내 메모 저장</button>
      </div>
    </>
  );
}

function WhiskyDetail({ bottle: w }: { bottle: Bottle }) {
  const { openLog, toast } = useUI();
  const notes = useBottleNotes();
  const [more, setMore] = useState(false);
  const spec = specFor(w);
  const distillery = distilleryOfProduct(w.productId);
  return (
    <article className="detail">
      <h2>{w.name}</h2>
      <div className="art"><BottleMark kind={bottleKindLabel(w)} size="lg" /></div>
      <p className="taste">{character(w)}</p>
      <div className="meta">
        {w.abv && <span className="mi">{w.abv}</span>}
        {w.volumeMl ? <span className="mi">{w.volumeMl}ml</span> : null}
        <span className="mi">{spec ? specTitle(spec) : bottleKindLabel(w)}</span>
        {w.qty > 1 && <span className="mi">{w.qty}병 보유</span>}
      </div>
      <BottleBadges badges={w.badges} />

      <div className="sechead in">제조사 공식 노트</div>
      <MakerNoteView note={w.makerNote} empty="이 제품은 확인된 제조사 공식 노트가 없습니다." />

      <div className="sechead in">내 메모 <small className="sub">공식 노트와 별개로 저장됩니다</small></div>
      <PersonalNote bottleId={w.id} initial={notes.get(w.id) ?? ''} onSaved={() => toast('메모 저장')} />

      <div className="btnrow">
        <button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: w.isWhisky ? 'whisky' : 'spirit', drinkName: w.name, servingStyle: 'neat' })}>
          이 잔 기록하기
        </button>
      </div>

      <div className="more">
        <button onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? '증류소 · 분류 · 향미 수치 접기' : '증류소 · 생산 지역 · 캐스크 · 분류 · 향미 수치 보기'}
        </button>
        {more && (
          <div className="inner">
            {distillery && <><div className="sechead in">증류소</div><DistilleryCard d={distillery} /></>}
            {spec && <><div className="sechead in">분류</div><SpecView s={spec} /></>}
            {w.note && <p className="hint">{w.note}</p>}
            <div className="sechead in">향미 프로파일</div>
            <FlavorBars vector={w.flavor} compact />
          </div>
        )}
      </div>
    </article>
  );
}

export function WhiskyPage() {
  const { bottleId, openBottle, closeBottle } = useUI();
  const whiskies = useWhiskies();
  const allBottles = useBottles();
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('all');
  const [gapView, setGapView] = useState(false);
  const [mapView, setMapView] = useState(false);

  const rows = useMemo(() => {
    const t = normalize(q);
    return whiskies.filter((w) => {
      const s = specFor(w);
      return (cls === 'all' || (!!s && specMatchesTerm(s, cls)))
        && hits(t, w.name, w.whiskyClass ? classTags(w.whiskyClass).join(' ') : '', s ? specTitle(s) : '', distilleryOfProduct(w.productId)?.nameKo ?? '');
    });
  }, [whiskies, q, cls]);

  const selected = allBottles.find((b) => b.id === bottleId);

  if (gapView) return <GapView onBack={() => setGapView(false)} />;
  if (mapView) return <DistilleryMapView onBack={() => setMapView(false)} />;

  return (
    <>
      <h2 className="pagetitle">위스키<span className="sub">보유 {whiskies.length}종 · 맛과 공식 노트로 비교</span></h2>
      <SearchBox value={q} onChange={setQ} placeholder="이름·분류(셰리/피트/싱글몰트…) 검색" />
      <ChipRow value={cls} options={CLASS_CHIPS} onChange={setCls} />

      <div className="split">
        <div className="listpane">
          <div className="hint">{rows.length}종 · <button className="lnk" onClick={() => setMapView(true)}>증류소 지도</button> · <button className="lnk" onClick={() => setGapView(true)}>축별 결손 보기</button></div>
          {rows.length === 0 && <div className="empty">조건에 맞는 위스키가 없습니다.</div>}
          <div className="rowlist">
            {rows.map((w) => (
              <button className="rowitem" key={w.id} aria-current={bottleId === w.id} onClick={() => openBottle(w.id)}>
                <BottleMark kind={bottleKindLabel(w)} size="sm" />
                <div className="body">
                  <span className="nm">{w.name}</span>
                  <div className="taste">{character(w)}</div>
                  <div className="foot">
                    {w.abv && <span className="mi">{w.abv}</span>}
                    <RegionTag w={w} />
                    {w.makerNote && <span className="mi note">공식 노트</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="detailpane">
          {selected
            ? (
              <div className="sheet">
                <div className="sheetbar">
                  <button className="btn sm ghost" onClick={closeBottle}>← 목록</button>
                  <b>{selected.name}</b>
                </div>
                <WhiskyDetail bottle={selected} />
              </div>
            )
            : <div className="placeholder">목록에서 한 병을 고르면 맛 설명과 공식 노트가 열립니다.</div>}
        </div>
      </div>
    </>
  );
}

/** 축별 결손 — 보유 위스키에서 실시간 계산한 다양성 지도 (기존 기능 유지) */
function GapView({ onBack }: { onBack: () => void }) {
  const whiskies = useWhiskies();
  const coverage = useMemo(() => computeCoverage(whiskies), [whiskies]);
  const matrix = useMemo(() => computeRegionMaturityMatrix(whiskies), [whiskies]);
  const sims = useMemo(() => CANDIDATE_WHISKIES
    .map((c) => ({ c, sim: simulateAdd(c.cls, whiskies) }))
    .sort((a, b) => b.sim.gain - a.sim.gain), [whiskies]);
  const totalGaps = coverage.reduce((s, f) => s + f.gapCount, 0);

  return (
    <>
      <h2 className="pagetitle">축별 결손<span className="sub">보유 위스키에서 실시간 계산 · 결손 {totalGaps}</span></h2>
      <div className="btnrow"><button className="btn ghost" onClick={onBack}>← 위스키 목록으로</button></div>

      <div className="sechead">스카치 싱글몰트 · 지역 × 숙성</div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>지역</th>{MATRIX_TIERS.map((t) => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.region}>
                <td style={{ whiteSpace: 'nowrap' }}><Term label={row.region} /></td>
                {MATRIX_TIERS.map((t) => {
                  const list = row.cells[t];
                  return <td key={t}>{list.length === 0 ? <span className="tag-na">결손</span> : list.map((n, i) => <div key={i} className="tag-ok">{n}</div>)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">숙성: 엔트리 ≤11년 · 스탠다드 12–17년 · 고숙성 18년+ (병 이름의 연수로 판정, NAS 제외).</p>

      <div className="sechead">축별 커버리지</div>
      {coverage.map((fam) => (
        <div className="grpbox" key={fam.key}>
          <h4>{fam.label} · 결손 {fam.gapCount}</h4>
          <div className="clstags">
            {fam.cells.map((c) => (
              <Term key={c.value} term={c.value} label={`${c.value}${c.gap ? ' · 결손' : ` · ${c.count}`}`} className={c.gap ? 'gap' : 'have'} />
            ))}
          </div>
        </div>
      ))}

      <div className="sechead">구매 시뮬레이터</div>
      <div className="hint">후보를 더했을 때 겹치는 축과 새로 열리는 축을 계산합니다.</div>
      <div className="rowlist">
        {sims.map(({ c, sim }) => (
          <div className="rowitem" key={c.id}>
            <div className="body">
              <span className="nm">{c.name}</span>
              <div className="taste">{c.note}</div>
              <div className="foot">
                <span className={sim.gain > 0 ? 'state s-READY' : 'mi'}>{sim.gain > 0 ? `새 축 ${sim.gain}개` : '겹침만'}</span>
                {sim.newlyFilled.slice(0, 3).map((h, i) => <span className="mi" key={i}>{h.value}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
