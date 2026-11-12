/**
 * WhiskyPage — '위스키'. 제품을 보고 비교하는 곳이다.
 * 목록은 병 · 이름 · 도수 · 핵심 맛까지만 보여주고, 상세에서 맛 설명과 제조사 공식 노트를 먼저 읽힌다.
 * 지역·캐스크·분류·향미 수치는 그 뒤로 미룬다. 보유 수량·잔량 관리는 내 술장이 맡는다.
 */
import { GuideHint } from '../components/GuidePopup';
import { cocktailWords, whiskyWords } from '../../services/tasteWords';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUI } from '../UIContext';
import { useWhiskies, useBottles, useBottleNotes, useHeldIds, useSubMap } from '../../hooks/useData';
import { cocktailsForBottle } from '../../services/pairingService';
import { STATUS_LEAD_KO } from '../../services/availabilityService';
import { CocktailMark } from '../components/Mark';
import { bottleNoteRepo } from '../../repositories/bottleNoteRepo';
import { computeCoverage, computeRegionMaturityMatrix, simulateAdd, MATRIX_TIERS } from '../../services/whiskyDiversityService';
import { CANDIDATE_WHISKIES } from '../../data/candidateWhiskies';
import { CLASS_FILTERS, classTags } from '../../data/whiskyClass';
import { specOf, specTitle, specMatchesTerm, displayRegionLabel } from '../../data/whiskySpec';
import { distilleryOfProduct } from '../../data/distilleries';
import { DistilleryCard } from '../components/DistilleryCard';

/** 세계 지도는 데이터·윤곽이 커서(약 320KB) 열 때 불러온다 */
const DistilleryMapView = lazy(() => import('../components/DistilleryMap').then((m) => ({ default: m.DistilleryMapView })));
import { bottleKindLabel } from '../../data/bottleIngredients';
import { FlavorBars, MakerNoteView, noteHeading, noteTag, BottleBadges, Term, ChipRow, SearchBox, FilterButton, type ChipOption } from '../components/common';
import { BottleMark } from '../components/Mark';
import { liquorMasterById, LIQUOR_MASTER } from '../../data/liquorMaster';
import { previewBottle, isPreviewId } from '../../data/userBottles';

/** 둘러보기 목록 — 기준 DB의 위스키 전부(술장에 넣지 않은 것도) */
const CATALOG: Bottle[] = LIQUOR_MASTER.filter((m) => m.category === 'whisky').map(previewBottle);

/** 넣은 병의 제품 영문명과 별칭 — '맥켈란', 'macallan'으로도 내 병을 찾게 한다 */
const masterNames = (id: string | undefined): string[] => {
  const m = id ? liquorMasterById.get(id) : undefined;
  return m ? [m.nameEn, m.brand, ...m.aliases] : [];
};
import { normalize, hits } from '../listUtils';
import { type Bottle, type WhiskySpec, type ServingStyle } from '../../models/types';
import { guideById } from '../../data/beginnerGuide';
import { lookupTerm } from '../../data/glossary';

/** 분류 필터 — 기준이 다른 말을 한 줄에 섞지 않고 원산지 / 종류 / 맛·캐스크로 나눠 보여 준다(고르는 건 하나) */
const CLASS_GROUPS: { label: string; terms: readonly string[] }[] = [
  { label: '원산지', terms: ['스카치', '버번', '테네시', '재패니즈', '코리안'] },
  { label: '종류', terms: ['싱글몰트', '블렌디드'] },
  { label: '맛·캐스크', terms: ['피티드', '셰리', '캐스크 스트렝스'] },
];
if (CLASS_GROUPS.flatMap((g) => g.terms).length !== CLASS_FILTERS.length) throw new Error('분류 필터 묶음이 CLASS_FILTERS 와 다름');

/** 위스키 탭 안의 세 화면 */
type View = 'list' | 'browse' | 'map' | 'table';
const VIEWS: ChipOption<View>[] = [
  { v: 'list', label: '내 위스키' }, { v: 'browse', label: '둘러보기' },
  { v: 'map', label: '증류소 지도' }, { v: 'table', label: '위스키 분류 표' },
];

/** 핵심 맛 — 향미 상위 두 축과 분류 캐릭터(피티드 등) */
function character(w: Bottle): string {
  const chars = w.whiskyClass?.character.filter((c) => c !== '논피트') ?? [];
  // 분류 말과 같은 뜻의 맛 말은 한 번만 적는다 ('피티드'가 있으면 '피트', '해양성'이 있으면 '바다'는 뺀다)
  const SAME: Record<string, string> = { 피트: '피티드', 바다: '해양성', 스모크: '스모키' };
  const words = whiskyWords(w, 3).filter((x) => !(SAME[x] && chars.includes(SAME[x]!)));
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

/**
 * 마시는 법 고르기 — 입문 안내서 '위스키 마시는 법' 다섯 장(니트·워터드롭·온더록·미즈와리·하이볼)을 그대로 쓴다.
 * 고른 방법은 기록할 때 마신 방식으로 넘어간다. 예전 '간단 조합'의 가쿠 하이볼·CS 하이볼 같은 병별 조합을 대신한다.
 */
const DRINK_WAYS = guideById('drink').cards;
/** 받침 따라 '로/으로' (ㄹ 받침은 '로') */
const ro = (w: string) => { const c = (w.charCodeAt(w.length - 1) - 0xac00) % 28; return c > 0 && c !== 8 ? '으로' : '로'; };
const WAY_STYLE: Record<string, ServingStyle> = { 니트: 'neat', 워터드롭: 'neat', 온더록: 'rocks', 하이볼: 'highball' };
function HowToDrink({ w, canLog = true }: { w: Bottle; canLog?: boolean }) {
  const { openLog } = useUI();
  const [at, setAt] = useState(0);
  const way = DRINK_WAYS[at]!;
  const short = way.title.split(' (')[0]!;
  return (
    <>
      <div className="sechead in">마시는 법</div>
      <div className="controls tight">
        {DRINK_WAYS.map((c, i) => (
          <button key={c.title} className="chip" aria-pressed={i === at} onClick={() => setAt(i)}>{c.title.split(' (')[0]}</button>
        ))}
      </div>
      <p className="hint">{way.body.join(' ')}</p>
      {canLog && <div className="btnrow">
        <button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: 'whisky', drinkName: w.name, servingStyle: WAY_STYLE[short] ?? 'other' })}>
          {short}{ro(short)} 마신 잔 기록하기
        </button>
      </div>}
    </>
  );
}

function PersonalNote({ bottleId, initial, onSaved }: { bottleId: string; initial: string; onSaved: () => void }) {
  const [text, setText] = useState(initial);
  const dirty = text !== initial;
  return (
    <>
      <textarea rows={3} value={text} placeholder="마셔 본 느낌을 적어 두세요" onChange={(e) => setText(e.target.value)} />
      <div className="btnrow">
        <button className="btn sm" disabled={!dirty} onClick={async () => { await bottleNoteRepo.set(bottleId, text); onSaved(); }}>내 메모 저장</button>
      </div>
    </>
  );
}

function WhiskyDetail({ bottle: w, owned }: { bottle: Bottle; owned?: Bottle | undefined }) {
  const { openLog, toast, openCocktail, openAdd, openBottle } = useUI();
  const preview = isPreviewId(w.id);
  const notes = useBottleNotes();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const pairs = useMemo(() => cocktailsForBottle(w, heldIds, subMap), [w, heldIds, subMap]);
  const [more, setMore] = useState(false);
  const spec = specFor(w);
  const distillery = distilleryOfProduct(w.productId);
  return (
    <article className="detail">
      <h2>{w.name}</h2>
      <div className="art"><BottleMark kind={bottleKindLabel(w)} bottleId={w.id} size="lg" /></div>
      <p className="taste">{character(w)}</p>
      <div className="meta">
        {w.abv && <span className="mi">{w.abv}</span>}
        {w.volumeMl ? <span className="mi">{w.volumeMl}ml</span> : null}
        <span className="mi">{spec ? specTitle(spec) : bottleKindLabel(w)}</span>
        {w.qty > 1 && <span className="mi">{w.qty}병 있어요</span>}
      </div>
      <BottleBadges badges={w.badges} />

      <div className="sechead in">{noteHeading(w.makerNote)}</div>
      <MakerNoteView note={w.makerNote} empty="이 술은 확인된 제조사 공식 노트가 없어요." />

      {pairs.length > 0 && (
        <>
          <div className="sechead in">이 위스키로 만들면 좋아요</div>
          <div className="rowlist">
            {pairs.map(({ cocktail: c, status }) => (
              <button className="rowitem" key={c.id} onClick={() => openCocktail(c.id)}>
                <CocktailMark base={c.base} cocktailId={c.id} size="sm" />
                <div className="body">
                  <span className="nm">{c.name}</span>
                  <div className="taste">{cocktailWords(c).join(' · ')}</div>
                  <div className="foot"><span className={`state s-${status}`}>{STATUS_LEAD_KO[status]}</span></div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {preview ? (
        // 둘러보기: 아직 술장에 없는 병이라 메모·기록 대신 넣기를 보여 준다. 마시는 법은 고를 수 있다
        <>
        {w.isWhisky && <HowToDrink w={w} canLog={false} />}
        <div className="btnrow">
          {owned
            ? <button className="btn" onClick={() => openBottle(owned.id)}>가지고 있어요 · 내 병 보기</button>
            : <button className="btn primary" onClick={() => openAdd(w.name)}>내 술장에 넣기</button>}
        </div>
        </>
      ) : (
        <>
          <div className="sechead in">내 메모 <small className="sub">공식 노트와 따로 저장돼요</small></div>
          <PersonalNote bottleId={w.id} initial={notes.get(w.id) ?? ''} onSaved={() => toast('메모를 저장했어요')} />

          {w.isWhisky ? <HowToDrink w={w} /> : (
            <div className="btnrow">
              <button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: 'spirit', drinkName: w.name, servingStyle: 'neat' })}>
                이 잔 기록하기
              </button>
            </div>
          )}
        </>
      )}

      <div className="sechead in">맛 프로필</div>
      <FlavorBars vector={w.flavor} compact />

      <div className="more">
        <button onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? '증류소 · 분류 접기' : '증류소 · 지역 · 캐스크 · 분류'}
        </button>
        {more && (
          <div className="inner">
            {distillery && <><div className="sechead in">증류소</div><DistilleryCard d={distillery} /></>}
            {spec && <><div className="sechead in">분류</div><SpecView s={spec} /></>}
            {w.note && <p className="hint">{w.note}</p>}
          </div>
        )}
      </div>
    </article>
  );
}

export function WhiskyPage() {
  const { bottleId, openBottle, closeBottle, openGuide, goTab, openAdd } = useUI();
  const whiskies = useWhiskies();
  const allBottles = useBottles();
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('all');
  const [openCls, setOpenCls] = useState(false);
  // 넣은 위스키가 없으면 둘러보기부터 연다
  const [view, setView] = useState<View>(() => (whiskies.length ? 'list' : 'browse'));
  const browsing = view === 'browse';
  /** 제품 아이디 → 내가 가진 병 (둘러보기에서 '가지고 있어요' 표시) */
  const ownedByProduct = useMemo(() => new Map(whiskies.filter((w) => w.productId).map((w) => [w.productId!, w])), [whiskies]);

  const rows = useMemo(() => {
    const t = normalize(q);
    return (browsing ? CATALOG : whiskies).filter((w) => {
      const s = specFor(w);
      return (cls === 'all' || (!!s && specMatchesTerm(s, cls)))
        && hits(t, w.name, ...(w.whiskyClass ? classTags(w.whiskyClass) : []), s ? specTitle(s) : '', distilleryOfProduct(w.productId)?.nameKo ?? '',
          ...masterNames(w.productId));
    });
  }, [whiskies, q, cls, browsing]);

  // 검색·분류를 바꿔 열려 있던 병이 목록에서 빠지면 상세도 닫는다
  const firstList = useRef(true);
  useEffect(() => {
    // 다른 화면에서 병을 열고 들어온 첫 화면은 그대로 둔다(둘러보기에 없는 병일 수 있다)
    if (firstList.current) { firstList.current = false; return; }
    if (bottleId && !rows.some((w) => w.id === bottleId)) closeBottle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cls, browsing]);

  const selected = allBottles.find((b) => b.id === bottleId) ?? CATALOG.find((b) => b.id === bottleId);

  const tabs = <ChipRow value={view} options={VIEWS} onChange={setView} />;
  if (view === 'table') return <GapView tabs={tabs} />;
  if (view === 'map') return <Suspense fallback={tabs}><DistilleryMapView tabs={tabs} /></Suspense>;

  return (
    <>
      <h2 className="pagetitle" data-k="Cask Notes">위스키<span className="sub">{browsing ? `둘러보기 ${CATALOG.length}종` : `가진 위스키 ${whiskies.length}종`}</span></h2>
      <GuideHint tab="whisky" />
      {tabs}
      <SearchBox value={q} onChange={setQ} placeholder="이름·분류(셰리/피트/싱글몰트…) 검색"
        after={<FilterButton open={openCls} count={cls === 'all' ? 0 : 1} onToggle={() => setOpenCls((v) => !v)} />} />
      {cls !== 'all' && (
        <div className="controls tight">
          <button className="chip" aria-pressed onClick={() => setCls('all')} aria-label={`${cls} 필터 지우기`}>{cls} ✕</button>
        </div>
      )}
      {openCls && (
        <div className="filterpanel">
          {CLASS_GROUPS.map((g) => (
            <div key={g.label}>
              <div className="hint lbl">{g.label}</div>
              <div className="controls tight">
                {g.terms.map((t) => (
                  <button key={t} className="chip" aria-pressed={cls === t} onClick={() => setCls(cls === t ? 'all' : t)}>{t}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {cls !== 'all' && lookupTerm(cls) && <p className="hint"><b>{cls}</b> {lookupTerm(cls)}</p>}

      <div className="split">
        <div className="listpane">
          <div className="hint">{rows.length}종</div>
          {rows.length === 0 && (browsing || whiskies.length > 0) && <div className="empty">조건에 맞는 위스키가 없어요.</div>}
          {!browsing && whiskies.length === 0 && (
            <div className="empty">
              아직 넣은 위스키가 없어요.
              <div className="btnrow center">
                <button className="btn primary" onClick={() => goTab('starter')}>내 입맛에 맞는 위스키 찾기</button>
                <button className="btn" onClick={() => openGuide('drink')}>위스키 마시는 법</button>
                <button className="btn" onClick={() => openGuide('myths-whisky')}>흔한 오해 10가지</button>
                <button className="btn" onClick={() => setView('browse')}>위스키 둘러보기</button>
                <button className="btn" onClick={() => openAdd()}>가진 위스키 넣기</button>
              </div>
            </div>
          )}
          <div className="rowlist">
            {rows.map((w) => (
              <button className="rowitem" key={w.id} aria-current={bottleId === w.id} onClick={() => openBottle(w.id)}>
                <BottleMark kind={bottleKindLabel(w)} bottleId={w.id} size="sm" />
                <div className="body">
                  <span className="nm">{w.name}</span>
                  <div className="taste">{character(w)}</div>
                  <div className="foot">
                    {w.abv && <span className="mi">{w.abv}</span>}
                    <RegionTag w={w} />
                    {w.makerNote && <span className="mi note">{noteTag(w.makerNote)}</span>}
                    {browsing && w.productId && ownedByProduct.has(w.productId) && <span className="mi own">가지고 있어요</span>}
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
                <WhiskyDetail key={selected.id} bottle={selected}
                  owned={selected.productId && isPreviewId(selected.id) ? ownedByProduct.get(selected.productId) : undefined} />
              </div>
            )
            : <div className="placeholder">목록에서 한 병을 고르세요.</div>}
        </div>
      </div>
    </>
  );
}

/** 위스키 분류 표 — 보유 위스키를 지역·숙성·분류별로 놓고, 아직 없는 칸을 보여 준다 */
function GapView({ tabs }: { tabs: ReactNode }) {
  const whiskies = useWhiskies();
  const coverage = useMemo(() => computeCoverage(whiskies), [whiskies]);
  const matrix = useMemo(() => computeRegionMaturityMatrix(whiskies), [whiskies]);
  const sims = useMemo(() => CANDIDATE_WHISKIES
    .map((c) => ({ c, sim: simulateAdd(c.cls, whiskies) }))
    .sort((a, b) => b.sim.gain - a.sim.gain), [whiskies]);

  return (
    <>
      <h2 className="pagetitle" data-k="Cask Notes">위스키 분류 표</h2>
      {tabs}

      <div className="sechead">스카치 싱글몰트 · 지역 × 숙성</div>
      {matrix.map((row) => (
        <div className="rlist" key={row.region}>
          <h4><Term label={row.region} /></h4>
          {/* 한 병도 없는 지역은 빈 줄 세 개 대신 한 줄로 */}
          {MATRIX_TIERS.every((t) => row.cells[t].length === 0)
            ? <div className="rrow"><span className="rv na">보유 없음</span></div>
            : MATRIX_TIERS.map((t) => (
            <div className="rrow" key={t}>
              <span className="rk">{t}</span>
              <span className={row.cells[t].length ? 'rv' : 'rv na'}>{row.cells[t].join(', ') || '—'}</span>
            </div>
          ))}
        </div>
      ))}
      <p className="hint">엔트리 ~11년 · 스탠다드 12~17년 · 고숙성 18년+ · 연수 미표기 제외</p>

      <div className="sechead">분류별</div>
      {coverage.map((fam) => (
        <div className="rlist" key={fam.key}>
          <h4>{fam.label}</h4>
          {fam.cells.map((c) => (
            <div className="rrow" key={c.value}>
              <span className="rk"><Term term={c.value} label={c.value} /></span>
              <span className={c.gap ? 'rv na' : 'rv'}>{c.gap ? '—' : c.count}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="sechead">이 병을 더하면</div>
      <div className="rowlist">
        {sims.map(({ c, sim }) => (
          <div className="rowitem" key={c.id}>
            <div className="body">
              <span className="nm">{c.name}</span>
              <div className="taste">{c.note}</div>
              <div className="foot">
                <span className={sim.gain > 0 ? 'state s-READY' : 'mi'}>{sim.gain > 0 ? `새 칸 ${sim.gain}개` : '이미 가진 칸이에요'}</span>
                {sim.newlyFilled.slice(0, 3).map((h, i) => <span className="mi" key={i}>{h.value}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
