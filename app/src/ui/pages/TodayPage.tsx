/**
 * TodayPage — '오늘'.
 * 샘플 안내 → 오늘의 잔 뽑기(레일) → 고른 잔 → 다르게 골라보기 → 최근 기록 순서다.
 * 첫 화면이 답해야 할 것은 넷뿐이다: 무엇을 마실까 · 무슨 맛인가 · 지금 만들 수 있나 · 뭘 누르면 되나.
 * 뽑기 후보는 지금 만들 수 있는 잔뿐이다(칩으로 좁혀도 같다). 점수는 여기서 말하지 않는다.
 */
import { useCallback, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs } from '../../hooks/useData';
import { whatToDrink, type RecommendMode } from '../../services/recommendationService';
import { STATUS_LEAD_KO } from '../../services/availabilityService';
import { ChipRow, LogCard } from '../components/common';
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
function reelPool(all: RecommendationResult[]): RecommendationResult[] {
  return all.filter((r) => r.kind === 'whisky' || r.status === 'READY' || r.status === 'SUBSTITUTE').slice(0, POOL);
}

type Way = 'group' | 'purchase' | 'clearstock';
const WAYS: { v: Way; label: string; hint: string }[] = [
  { v: 'group', label: '함께 마실 사람', hint: '여러 명의 취향을 함께 봅니다.' },
  { v: 'purchase', label: '뭘 사면 좋을까', hint: '한 병 더 샀을 때 열리는 레시피 수로 순위를 냅니다.' },
  { v: 'clearstock', label: '재고 소진', hint: '잔량이 적은 재료를 먼저 씁니다.' },
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
  const { openCocktail, openLog, goTab } = useUI();
  const logs = useLogs();
  const [mode, setMode] = useState<RecommendMode>('available');
  const picks = useMemo(() => reelPool(whatToDrink(ctx, mode, 40)), [ctx, mode]);
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
          <button className="btn sm" onClick={() => goTab('cellar')}>내 술장 설정</button>
        </div>
      )}

      <section className="today">
        <h2 className="ask">오늘 뭐 마실까요?</h2>
        <p className="asksub">
          {picks.length ? `지금 술장으로 만들 수 있는 ${picks.length}잔 중에서 골라요` : '고를 수 있는 잔이 아직 없어요'}
        </p>

        {picks.length > 0 ? (
          <TodayReel picks={picks} onPicked={onPicked}
            between={<ChipRow value={mode} options={MODES} onChange={setMode} />}>
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
          <ChipRow value={mode} options={MODES} onChange={setMode} />
          <div className="empty">
            {mode === 'available'
              ? <>지금 술장으로 만들 수 있는 잔이 없어요. 내 술장에서 가진 술과 재료를 넣으면 여기서 골라 드려요.</>
              : <>이 맛으로 지금 만들 수 있는 잔이 없어요. 다른 칩을 골라 보세요.</>}
            <div className="btnrow center"><button className="btn primary" onClick={() => goTab('cellar')}>술장에 술 넣기</button></div>
          </div>
          </>
        )}
      </section>

      {!ctx.hasTaste && (
        <div className="sample">
          <span><b>처음이라면</b> 평소 마시는 음료로 위스키와 칵테일을 골라 드려요.</span>
          <button className="btn sm" onClick={() => goTab('starter')}>취향 찾기</button>
        </div>
      )}

      <OtherWays />

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="empty">아직 기록이 없어요. 고른 잔을 만들고 <b>만든 잔 남기기</b>를 누르면 여기에 쌓여요.</div>
        : (
          <>
            {recent.map((l) => <LogCard key={l.id} log={l} />)}
            <div className="btnrow"><button className="btn ghost" onClick={() => goTab('notes')}>기록 전체 보기</button></div>
          </>
        )}
    </>
  );
}
