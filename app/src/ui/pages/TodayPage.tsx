/**
 * TodayPage — '오늘'.
 * 샘플 안내 → 오늘의 한 잔(대표 1) → 다른 선택 둘 → 최근 기록 순서다.
 * 첫 화면이 답해야 할 것은 넷뿐이다: 무엇을 마실까 · 무슨 맛인가 · 지금 만들 수 있나 · 뭘 누르면 되나.
 * 점수는 여기서 말하지 않는다. 상세의 '추천 이유'에 있다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs } from '../../hooks/useData';
import { todayPicks, type RecommendMode } from '../../services/recommendationService';
import { STATUS_LEAD_KO } from '../../services/availabilityService';
import { ChipRow, LogCard } from '../components/common';
import { CocktailMark, LeadArt } from '../components/Mark';
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

function taste(rec: RecommendationResult): string {
  const words = rec.flavorWords.join(' · ');
  return rec.base ? [words, `${rec.base} 베이스`].filter(Boolean).join(' · ') : words;
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
  const picks = useMemo(() => todayPicks(ctx, mode, 3), [ctx, mode]);
  const [lead, ...alts] = picks;
  const leadState = lead ? state(lead) : null;
  const recent = logs.slice(0, 3);

  const open = (r: RecommendationResult) => {
    if (r.kind === 'cocktail') openCocktail(r.id, r);
    else openLog({ drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' });
  };

  return (
    <>
      {IS_BETA && (
        <div className="sample">
          <span><b>샘플 술장</b>으로 둘러보는 중입니다. 바꾼 내용은 이 브라우저에만 저장됩니다.</span>
          <button className="btn sm" onClick={() => goTab('cellar')}>내 술장 설정</button>
        </div>
      )}

      <h2 className="pagetitle">
        오늘의 한 잔
        <span className="sub">{ctx.hasTaste ? '취향과 보유 재료 기준' : '보유 재료 기준 (취향 설정 전)'}</span>
      </h2>

      <ChipRow value={mode} options={MODES} onChange={setMode} />

      {!lead && <div className="empty">추천할 항목이 없습니다. 내 술장에서 보유 재료를 등록해 주세요.</div>}

      {lead && (
        <>
          <section className="lead">
            <div className="inner">
              <LeadArt base={lead.base} kind={lead.kind} cocktailId={lead.kind === 'cocktail' ? lead.id : undefined} />
              <div className="text">
                <h3>{lead.name}</h3>
                <p className="taste">{taste(lead)}</p>
                {leadState && <div className={`state s-${leadState.cls}`}>{leadState.text}</div>}
                <div className="btnrow">
                  <button className="btn primary" onClick={() => open(lead)}>
                    {lead.kind === 'cocktail' ? '레시피 보기' : '기록하기'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {alts.length > 0 && (
            <>
              <div className="sechead sm">다른 선택</div>
              <div className="rowlist">
                {alts.map((r) => (
                  <button className="rowitem" key={r.kind + r.id} onClick={() => open(r)}>
                    <CocktailMark base={r.base} cocktailId={r.kind === 'cocktail' ? r.id : undefined} size="sm" />
                    <div className="body">
                      <span className="nm">{r.name}</span>
                      <div className="taste">{taste(r)}</div>
                      {state(r) && <div className="foot"><span className={`state s-${state(r)!.cls}`}>{state(r)!.text}</span></div>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <OtherWays />

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="empty">아직 기록이 없습니다. 레시피 상세에서 <b>이 잔 기록하기</b>를 누르면 여기에 쌓입니다.</div>
        : (
          <>
            {recent.map((l) => <LogCard key={l.id} log={l} />)}
            <div className="btnrow"><button className="btn ghost" onClick={() => goTab('notes')}>기록 전체 보기</button></div>
          </>
        )}
    </>
  );
}
