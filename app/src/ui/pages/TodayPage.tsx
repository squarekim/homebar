/**
 * TodayPage — '메인'. 오늘의 잔과 입문을 한 화면에 둔다.
 * 샘플 안내 → 오늘의 잔 뽑기 → 고른 잔 → 처음이라면(입문) → 다르게 골라보기 → 최근 기록 순서다.
 * 첫 화면이 답해야 할 것은 넷뿐이다: 무엇을 마실까 · 무슨 맛인가 · 지금 만들 수 있나 · 뭘 누르면 되나.
 * 뽑기 후보는 지금 만들 수 있는 잔뿐이다(칩으로 좁혀도 같다). 점수는 여기서 말하지 않는다.
 */
import { IconMartini, IconWhisky } from '../components/icons';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs } from '../../hooks/useData';
import { whatToDrink, type RecommendMode, diversePool } from '../../services/recommendationService';
import { STATUS_LEAD_KO } from '../../services/availabilityService';
import { ChipRow, FilterButton, LogCard, StarterNotice, StartButtons, allChips } from '../components/common';
import { referenceRepo } from '../../repositories/referenceRepo';
import { TodayReel } from '../components/TodayReel';
import { MODES, GroupRec, PurchaseRec, ClearStockRec } from './RecommendPage';
import { type RecommendationResult } from '../../models/types';
import { IS_BETA } from '../../config';

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
  { v: 'group', label: '함께 마실 사람', hint: '여러 명의 취향을 함께 봐요.' },
  { v: 'purchase', label: '뭘 사면 좋을까', hint: '한 병 더 샀을 때 새로 만들 수 있는 잔 수로 순서를 매겨요.' },
  { v: 'clearstock', label: '재고 소진', hint: '조금 남은 재료를 먼저 써요.' },
];

/** 다른 기준으로 고르기 — 기존 추천 기능을 한 자리에 접어 둔다 */
function OtherWays() {
  const [way, setWay] = useState<Way | null>(null);
  return (
    <div className="more">
      <button onClick={() => setWay(way ? null : 'group')} aria-expanded={!!way}>
        {way ? '다르게 골라보기 접기' : '다르게 골라보기'}
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
  // 종류 칩만 바깥에 두고, 맛과 베이스 술은 칵테일 목록처럼 "필터" 안에 모은다
  const tasteOn = mode !== 'available';
  const baseOn = base !== 'all';
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
          <span><b>샘플 술장</b>으로 둘러보는 중이에요. 바꾼 내용은 이 브라우저에만 저장돼요.</span>
          <button className="btn sm" onClick={() => goTab('cellar')}>술장 채우기</button>
        </div>
      )}

      <section className="today">
        <h2 className="ask">오늘 뭐 마실까요?</h2>
        <p className="asksub">
          {picks.length ? `${kind === 'whisky' ? '가진 위스키' : '지금 술장으로 만들 수 있는'} ${picks.length}잔 중에서 골라요` : '고를 수 있는 잔이 아직 없어요'}
        </p>
        <StarterNotice />

        {picks.length > 0 ? (
          <TodayReel picks={picks} onPicked={onPicked}
            between={filters}>
            {(again) => picked && (
              <div className="picked">
                <h3>{picked.name}</h3>
                <p className="taste">{taste(picked)}</p>
                <p className="why">
                  {ctx.hasTaste && picked.flavorWords[0]
                    ? `취향에서 높은 ${asTaste(picked.flavorWords[0])}${wa(asTaste(picked.flavorWords[0]))} 가까워요`
                    : picked.kind === 'whisky' ? '가지고 있는 병이에요' : '지금 술장으로 만들 수 있어요'}
                </p>
                {state(picked) && <div className={`state s-${state(picked)!.cls}`}>{state(picked)!.text}</div>}
                <div className="pickbtns">
                  <button className="btn primary big" onClick={() => made(picked)}>
                    {picked.kind === 'cocktail' ? '만든 잔 남기기' : '마신 잔 남기기'}
                  </button>
                  {picked.kind === 'cocktail' && <button className="btn ghost big" onClick={() => open(picked)}>레시피 보기</button>}
                  <button className="btn ghost big" onClick={again}>다시 고르기</button>
                </div>
              </div>
            )}
          </TodayReel>
        ) : (
          <>
          {filters}
          <div className="empty">
            {kind === 'whisky'
              ? <>아직 넣은 위스키가 없어요. 가진 위스키를 넣으면 여기서 골라 드려요.</>
              : baseOn
                ? <>이 베이스 술로 지금 만들 수 있는 잔이 없어요. 필터를 바꿔 보세요.</>
              : mode === 'available'
                ? <>아직 넣은 술과 재료로는 만들 수 있는 잔이 없어요. 가진 것을 넣으면 여기서 골라 드려요.</>
                : <>이 맛으로 지금 만들 수 있는 잔이 없어요. 다른 칩을 골라 보세요.</>}
            {(kind === 'whisky' || (mode === 'available' && !baseOn)) && <StartButtons />}
          </div>
          </>
        )}
      </section>

      {/* 입문 — 처음 온 사람이 할 수 있는 세 가지. 취향을 이미 정했으면 문구만 바꾼다 */}
      <div className="sechead">처음이라면</div>
      <div className="starts">
        <button onClick={() => goTab('starter')}>
          <b>{ctx.hasTaste ? '취향 다시 찾기' : '취향 찾기'}</b>
          <span>평소 마시는 음료를 고르면 맞는 위스키와 칵테일을 골라 드려요</span>
        </button>
        <button onClick={() => goTab('cellar')}>
          <b>집에 있는 술 넣기</b>
          <span>가진 술과 재료를 넣으면 지금 만들 수 있는 잔이 나와요</span>
        </button>
        <button onClick={() => openGuide('menu')}>
          <b>입문 안내서</b>
          <span>위스키와 칵테일로 나눠 마시는 법, 첫 병, 도구, 보관, 흔한 오해를 알려 드려요</span>
        </button>
        <button onClick={() => goTab('settings')}>
          <b>건강한 음주 안내</b>
          <span>마시기 전에 알아 둘 것을 설정에 모아 두었어요</span>
        </button>
      </div>

      <OtherWays />

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="empty">아직 기록이 없어요. 고른 잔을 만들고 <b>만든 잔 남기기</b>를 누르면 여기에 쌓여요.</div>
        : (
          <>
            {recent.map((l) => <LogCard key={l.id} log={l} />)}
            <div className="btnrow"><button className="btn ghost" onClick={goLogs}>기록 전체 보기</button></div>
          </>
        )}
    </>
  );
}
