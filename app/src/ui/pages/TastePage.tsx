/**
 * TastePage — '취향'. 마신 기록으로 "내 술 취향은 이래요"를 적어 두는 곳이다.
 * 새 계산은 없다. 기록에서 취향을 뽑는 기존 계산(tasteService.recomputeMe)과 기록 합계만 쓴다.
 * 기록이 3잔이 안 되면 취향을 말하지 않고, 어떻게 쌓는지만 알려 준다.
 * 직접 고르는 취향과 함께 마시는 사람은 그 아래에, 설정은 맨 아래 버튼으로 둔다.
 */
import { useMemo } from 'react';
import { useUI } from '../UIContext';
import { useLogs, useMe } from '../../hooks/useData';
import { tasteService } from '../../services/tasteService';
import { flavorWords, isNeutralTaste, summarizeLogs, TASTE_MIN_LOGS } from '../../services/flavorService';
import { FlavorBars } from '../components/common';
import { TasteSetup, PeopleManager } from './SettingsPage';

export function TastePage() {
  const logs = useLogs();
  const me = useMe();
  const { toast, goTab, goLogs } = useUI();
  const sum = useMemo(() => summarizeLogs(logs), [logs]);
  const set = !!me && !isNeutralTaste(me.vector);
  const words = set ? flavorWords(me.vector, 3) : [];

  return (
    <>
      <h2 className="pagetitle" data-k="Tasting Profile">취향{sum.count > 0 && <span className="sub">기록 {sum.count}잔</span>}</h2>

      <div className="tastecard">
        <div className="sechead">내 취향</div>
        {set && <b>{words.join(' · ')}</b>}
        {!sum.enough && (
          <div className="tprog">
            <div className="tprog-row"><span>취향 분석까지</span><span>{Math.min(sum.count, TASTE_MIN_LOGS)} / {TASTE_MIN_LOGS}잔</span></div>
            <progress max={TASTE_MIN_LOGS} value={Math.min(sum.count, TASTE_MIN_LOGS)} />
          </div>
        )}
        <div className="btnrow">
          {sum.enough && (
            <button className="btn primary" onClick={async () => { await tasteService.recomputeMe(); toast('기록으로 다시 계산했어요'); }}>
              기록으로 다시 계산
            </button>
          )}
          <button className={sum.enough ? 'btn' : 'btn primary'} onClick={() => goTab('starter')}>취향 찾기</button>
        </div>
      </div>

      {set && (
        <>
          <div className="sechead">맛 축별 취향</div>
          <FlavorBars vector={me.vector} compact />
        </>
      )}

      {sum.enough && (
        <>
          <div className="sechead">기록으로 본 나</div>
          <div className="statline">
            <div className="cell"><b>{sum.count}</b><small>마신 잔</small></div>
            <div className="cell"><b>{sum.avg.toFixed(1)}</b><small>평균 점수</small></div>
            <div className="cell"><b>{sum.retry}</b><small>재음용</small></div>
            <div className="cell"><b>{sum.kinds.cocktail}</b><small>칵테일</small></div>
            <div className="cell"><b>{sum.kinds.whisky}</b><small>위스키</small></div>
          </div>
          {sum.loved.length > 0 && (
            <>
              <div className="sechead sm">높게 평가한 잔</div>
              <div className="rowlist">
                {sum.loved.map((x) => <div className="kvrow" key={x.name}><div><span className="nm">{x.name}</span></div><div className="num">{x.rating}점</div></div>)}
              </div>
            </>
          )}
          {sum.often.length > 0 && (
            <>
              <div className="sechead sm">자주 마신 잔</div>
              <div className="rowlist">
                {sum.often.map((x) => <div className="kvrow" key={x.name}><div><span className="nm">{x.name}</span></div><div className="num">{x.n}번</div></div>)}
              </div>
            </>
          )}
          <div className="btnrow"><button className="btn ghost" onClick={goLogs}>마신 기록 전체 보기</button></div>
        </>
      )}

      <TasteSetup />
      <PeopleManager />

      <div className="sechead">설정</div>
      <div className="btnrow"><button className="btn" onClick={() => goTab('settings')}>설정 열기</button></div>
    </>
  );
}
