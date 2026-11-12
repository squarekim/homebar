/**
 * TodayPage — '메인'. 오늘의 잔과 입문을 한 화면에 둔다.
 * 샘플 안내 → 오늘의 잔 뽑기 → 고른 잔 → 처음이라면(입문) → 다르게 골라 보기 → 최근 기록 순서다.
 * 첫 화면이 답해야 할 것은 넷뿐이다: 무엇을 마실까 · 무슨 맛인가 · 지금 만들 수 있나 · 뭘 누르면 되나.
 * 뽑기 후보는 지금 만들 수 있는 잔뿐이다(칩으로 좁혀도 같다). 점수는 여기서 말하지 않는다.
 * 넓은 PC(1100px 이상)는 카드 뽑기 대신 지면 배치(TodayEditorial)를 쓰고, 아래 입문·기록 칸은 같이 쓴다.
 */
import { IconMartini, IconWhisky } from '../components/icons';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs, useHeldIds } from '../../hooks/useData';
import { garnishState } from '../../services/garnishStock';
import { whatToDrink, type RecommendMode, diversePool } from '../../services/recommendationService';
import { STATUS_LEAD_KO } from '../../services/availabilityService';
import { ChipRow, FilterButton, LogCard, StarterNotice, StartButtons, allChips, GarnishBadge } from '../components/common';
import { referenceRepo } from '../../repositories/referenceRepo';
import { TodayReel } from '../components/TodayReel';
import { MODES, GroupRec, PurchaseRec, ClearStockRec } from './RecommendPage';
import { type RecommendationResult } from '../../models/types';
import { IS_BETA } from '../../config';
import { TodayEditorial } from './TodayEditorial';
import { useEffect } from 'react';

/** 넓은 PC(1100px 이상)인지 — 메인 지면 배치를 바꾸는 데만 쓴다 */
function useWide(): boolean {
  const q = '(min-width: 1100px)';
  const [wide, setWide] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/**
 * 평소와 다를 때만 상태를 적는다.
 * 기본 모드('있는 재료만')는 만들 수 있는 것만 골라 오므로 '재료가 모두 있어요'는 모든 줄에 붙는 말이 된다.
 * 다른 모드(달달한·상큼한…)는 부족한 잔도 올라오기 때문에, 그때만 무엇이 문제인지 적는다.
 * 위스키는 이미 병에 있으니 아무것도 적지 않는다.
 */
function state(rec: RecommendationResult): { text: string; cls: string } | null {
  if (rec.kind === 'whisky' || !rec.status || rec.status === 'READY') return null;
  return { text: STATUS_LEAD_KO[rec.status], cls: rec.status };
}

/** 받침 따라 '와/과' */
const wa = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '과' : '와'; };
const asTaste = (w: string) => (w.endsWith('맛') ? w : `${w} 맛`);

/** '허브와 과일 맛' */
function taste(rec: RecommendationResult): string {
  const [a, b] = rec.flavorWords;
  if (!a) return rec.base ? `${rec.base} 베이스` : '';
  return b ? `${a}${wa(a)} ${asTaste(b)}` : asTaste(a);
}

/** 뽑기 후보 — 만들 수 있는 칵테일(대체 포함)과 가진 위스키, 추천 순서 상위 12개 */
const POOL = 12;
function reelPool(all: RecommendationResult[], mode: RecommendMode): RecommendationResult[] {
  const ok = all.filter((r) => r.kind === 'whisky' || r.status === 'READY' || r.status === 'SUBSTITUTE');
  // '위스키' 칩을 골랐을 때는 일부러 한 종류만 보는 것이라 섞지 않는다
  return mode === 'whisky' ? ok.slice(0, POOL) : diversePool(ok, POOL);
}

/** 화면 위 한 줄 — 칵테일 목록·술장과 같은 숫자(바로 가능 / 대체 재료)로 적고, 카드에 담은 수는 따로 밝힌다 */
function subline(p: { ready: number; sub: number; whisky: number }, inHand: number): string {
  const parts = [
    p.ready ? `바로 만들 수 있는 칵테일 ${p.ready}잔` : '',
    p.sub ? `대체 재료로 ${p.sub}잔` : '',
    p.whisky ? `가진 위스키 ${p.whisky}병` : '',
  ].filter(Boolean);
  const total = p.ready + p.sub + p.whisky;
  return `${parts.join(' · ')}${total > inHand ? ` 가운데 ${inHand}개를 카드에 담았어요` : ''}`;
}

/** 한 잔 고르기의 종류 필터 */
type Kind = 'all' | 'cocktail' | 'whisky';
const KINDS: { v: Kind; label: string; icon?: () => ReactElement }[] = [
  { v: 'all', label: '전체' },
  { v: 'cocktail', label: '칵테일', icon: IconMartini },
  { v: 'whisky', label: '위스키 한 잔', icon: IconWhisky },
];
/** 베이스 술 필터 — 레시피에 있는 베이스 순서 그대로 */
const BASES = allChips([...new Set(referenceRepo.cocktails().map((c) => c.base))], '전체');
/** 맛 필터 — 칵테일에만 적용된다. 위스키는 종류 필터로 옮겼다 */
const TASTES = MODES.filter((m) => m.v !== 'whisky').map((m) => (m.v === 'available' ? { ...m, label: '맛 전체' } : m));

type Way = 'group' | 'purchase' | 'clearstock';
const WAYS: { v: Way; label: string; hint: string }[] = [
  { v: 'group', label: '함께 마실 사람', hint: '' },
  { v: 'purchase', label: '뭘 사면 좋을까', hint: '' },
  { v: 'clearstock', label: '재고 소진', hint: '' },
];

/** 다른 기준으로 고르기 — 기존 추천 기능을 한 자리에 접어 둔다 */
function OtherWays() {
  const [way, setWay] = useState<Way | null>(null);
  return (
    <div className="more">
      <button onClick={() => setWay(way ? null : 'group')} aria-expanded={!!way}>
        {way ? '다르게 골라 보기 접기' : '다르게 골라 보기'}
      </button>
      {way && (
        <div className="inner">
          <div className="controls tight">
            {WAYS.map((w) => (
              <button key={w.v} className="chip" aria-pressed={way === w.v} onClick={() => setWay(w.v)}>{w.label}</button>
            ))}
          </div>
          {way === 'group' && <GroupRec />}
          {way === 'purchase' && <PurchaseRec />}
          {way === 'clearstock' && <ClearStockRec />}
        </div>
      )}
    </div>
  );
}

export function TodayPage() {
  const ctx = useRecommendContext();
  const { openCocktail, openLog, goTab, goLogs, openGuide } = useUI();
  const logs = useLogs();
  const [mode, setMode] = useState<RecommendMode>('available');
  const [kind, setKind] = useState<Kind>('all');
  const [base, setBase] = useState('all');
  const [openFilter, setOpenFilter] = useState(false);
  const picks = useMemo(() => {
    if (kind === 'whisky') return reelPool(whatToDrink(ctx, 'whisky', 80), 'whisky');
    let all = whatToDrink(ctx, mode, 120);
    if (kind === 'cocktail' || base !== 'all') all = all.filter((r) => r.kind === 'cocktail');
    if (base !== 'all') all = all.filter((r) => r.base === base);
    return reelPool(all, mode);
  }, [ctx, mode, kind, base]);
  // 카드에 담는 후보는 12잔까지라, 화면 위 숫자는 자르기 전의 전체를 센다(칵테일 목록·술장과 같은 기준)
  const pool = useMemo(() => {
    const all = kind === 'whisky' ? whatToDrink(ctx, 'whisky', 200) : whatToDrink(ctx, mode, 400)
      .filter((r) => (kind === 'all' && base === 'all') || r.kind === 'cocktail')
      .filter((r) => base === 'all' || r.base === base);
    return {
      ready: all.filter((r) => r.kind === 'cocktail' && r.status === 'READY').length,
      sub: all.filter((r) => r.kind === 'cocktail' && r.status === 'SUBSTITUTE').length,
      // 섞어 볼 때 위스키는 추천에서 4병만 섞이므로, 가진 위스키 수는 따로 센다
      whisky: kind === 'cocktail' || base !== 'all' ? 0 : whatToDrink(ctx, 'whisky', 200).length,
    };
  }, [ctx, mode, kind, base]);
  // 넓은 PC의 메뉴 인덱스 — 위 숫자와 같은 범위 전체(만들 수 있는 칵테일 + 가진 위스키), 추천 순서
  const full = useMemo(() => {
    const ok = (r: RecommendationResult) => r.kind === 'whisky' || r.status === 'READY' || r.status === 'SUBSTITUTE';
    if (kind === 'whisky') return whatToDrink(ctx, 'whisky', 200);
    const cks = whatToDrink(ctx, mode, 400).filter((r) => r.kind === 'cocktail' && ok(r)).filter((r) => base === 'all' || r.base === base);
    const wks = kind === 'all' && base === 'all' ? whatToDrink(ctx, 'whisky', 200) : [];
    return [...cks, ...wks].sort((x, y) => y.score - x.score);
  }, [ctx, mode, kind, base]);
  const wide = useWide();
  // 종류 칩만 바깥에 두고, 맛과 베이스 술은 칵테일 목록처럼 "필터" 안에 모은다
  const tasteOn = mode !== 'available';
  const baseOn = base !== 'all';
  const emptyMsg = (
    <>{kind === 'whisky'
              ? <>아직 넣은 위스키가 없어요.</>
              : baseOn
                ? <>이 베이스 술로 만들 수 있는 잔이 없어요.</>
              : mode === 'available'
                ? <>집에 있는 술을 넣으면 만들 수 있는 잔을 골라 드려요.</>
                : <>이 맛으로 만들 수 있는 잔이 없어요.</>}</>
  );
  const filterCount = (kind !== 'whisky' && tasteOn ? 1 : 0) + (kind !== 'whisky' && baseOn ? 1 : 0);
  const filters = (
    <div className="pickfilters">
      <div className="controls tight">
        {/* 위스키 한 잔일 때도 자리를 지켜 칩이 옆으로 밀리지 않게 한다. 맛·베이스는 칵테일 조건이라 그때는 끈다 */}
        <FilterButton open={openFilter && kind !== 'whisky'} count={filterCount} disabled={kind === 'whisky'} onToggle={() => setOpenFilter((v) => !v)} />
        {KINDS.map((k) => (
          <button key={k.v} className={k.icon ? 'chip iconchip' : 'chip'} aria-pressed={kind === k.v} aria-label={k.label} title={k.label}
            onClick={() => setKind(k.v)}>{k.icon ? <k.icon /> : k.label}</button>
        ))}
      </div>
      {openFilter && kind !== 'whisky' && (
        <div className="filterpanel">
          <div className="hint lbl">맛</div>
          <ChipRow value={mode} options={TASTES} onChange={setMode} wrap tight />
          <div className="hint lbl">베이스 술 (칵테일)</div>
          <ChipRow value={base} options={BASES} onChange={setBase} wrap tight />
          <div className="btnrow">
            <button className="btn sm ghost" onClick={() => { setMode('available'); setBase('all'); }}>필터 비우기</button>
          </div>
        </div>
      )}
    </div>
  );
  const [picked, setPicked] = useState<RecommendationResult | null>(null);
  const heldIds = useHeldIds();
  const onPicked = useCallback((r: RecommendationResult | null) => setPicked(r), []);
  const recent = logs.slice(0, 3);

  const open = (r: RecommendationResult) => {
    if (r.kind === 'cocktail') openCocktail(r.id, r);
    else openLog({ drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' });
  };
  const made = (r: RecommendationResult) => openLog(r.kind === 'cocktail'
    ? { drinkId: r.id, drinkType: 'cocktail', drinkName: r.name, servingStyle: 'cocktail' }
    : { drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' });

  return (
    <>
      {IS_BETA && (
        <div className="sample">
          <span><b>예시 재고</b>로 둘러보는 중이에요.</span>
          <button className="btn sm" onClick={() => goTab('cellar')}>술장 채우기</button>
        </div>
      )}

      {wide ? (
        <>
          <TodayEditorial list={full} subline={picks.length ? subline(pool, full.length) : '고를 수 있는 잔이 아직 없어요'}
            filters={filters} emptyText={emptyMsg} />
          <StarterNotice />
        </>
      ) : (
      <section className={picks.length ? 'today' : 'today none'}>
        <h2 className="ask">오늘 뭐 마실까요?</h2>
        <p className="asksub">
          {picks.length ? subline(pool, picks.length) : '고를 수 있는 잔이 아직 없어요'}
        </p>

        {picks.length > 0 ? (
          <TodayReel picks={picks} onPicked={onPicked}
            between={filters}>
            {(again) => picked && (
              <div className="picked">
                <h3>{picked.name}</h3>
                <p className="taste">{taste(picked)}</p>
                <p className="why">
                  {ctx.hasTaste && picked.flavorWords[0]
                    ? `좋아하는 ${asTaste(picked.flavorWords[0])}에 가까워요`
                    : picked.kind === 'whisky' ? '가지고 있는 병이에요' : '지금 술장으로 만들 수 있어요'}
                </p>
                {state(picked) && <div className={`state s-${state(picked)!.cls}`}>{state(picked)!.text}</div>}
                {picked.kind === 'cocktail' && (() => {
                  const ck = referenceRepo.cocktailById(picked.id);
                  return ck && garnishState(ck, heldIds) === 'all' ? <GarnishBadge /> : null;
                })()}
                <div className="pickbtns">
                  {/* 칵테일은 고른 다음 할 일이 '만들기'라 레시피가 먼저다. 위스키는 따르기만 하면 되니 기록이 먼저다 */}
                  {picked.kind === 'cocktail' && <button className="btn primary big" onClick={() => open(picked)}>레시피 보기</button>}
                  <button className={picked.kind === 'cocktail' ? 'btn ghost big' : 'btn primary big'} onClick={() => made(picked)}>
                    {picked.kind === 'cocktail' ? '만든 잔 남기기' : '마신 잔 남기기'}
                  </button>
                  <button className="btn ghost big" onClick={again}>다시 고르기</button>
                </div>
              </div>
            )}
          </TodayReel>
        ) : (
          <>
          {filters}
          <div className="empty">
            {emptyMsg}
            {(kind === 'whisky' || (mode === 'available' && !baseOn)) && <StartButtons />}
          </div>
          </>
        )}
        <StarterNotice />
      </section>
      )}

      {/* 입문 — 처음 온 사람이 할 수 있는 세 가지. 취향을 이미 정했으면 문구만 바꾼다 */}
      <div className="sechead">처음이라면</div>
      <div className="starts">
        <button onClick={() => goTab('starter')}>
          <b>{ctx.hasTaste ? '취향 다시 찾기' : '취향 찾기'}</b>
          <span>입맛에 맞는 첫 잔 찾기</span>
        </button>
        {/* 잔이 없을 때는 위 빈 안내에 같은 버튼이 있다 — 두 번 보이지 않게 뺀다 */}
        {picks.length > 0 && (
          <button onClick={() => goTab('cellar')}>
            <b>집에 있는 술 넣기</b>
            <span>만들 수 있는 잔 계산</span>
          </button>
        )}
        <button onClick={() => openGuide('menu')}>
          <b>입문 안내서</b>
          <span>마시는 법 · 첫 병 · 도구 · 보관</span>
        </button>
        <button onClick={() => openGuide('health')}>
          <b>건강한 음주 안내</b>
          <span>마시기 전에 알아 둘 것</span>
        </button>
      </div>

      <OtherWays />

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="empty">아직 기록이 없어요.</div>
        : (
          <>
            {recent.map((l) => <LogCard key={l.id} log={l} />)}
            <div className="btnrow"><button className="btn ghost" onClick={goLogs}>기록 전체 보기</button></div>
          </>
        )}
    </>
  );
}
