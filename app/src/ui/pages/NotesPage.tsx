/**
 * 마신 기록 — 술장 안의 한 화면. 마신 것을 다시 읽는 개인 시음 노트.
 * 날짜 · 술 이름 · 평가 · 메모가 한 줄에 다 보이게 두고, 검색과 간단한 합계만 곁들인다.
 * 기록이 없으면 가짜 기록 대신 어디서 남기는지 알려준다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useLogs } from '../../hooks/useData';
import { drinkLogRepo } from '../../repositories/drinkLogRepo';
import { LogCard, SearchBox } from '../components/common';
import { normalize, hits } from '../listUtils';
import { SERVING_LABELS_KO } from '../../models/types';

export function LogList() {
  const logs = useLogs();
  const { toast, goTab } = useUI();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const t = normalize(q);
    return logs.filter((l) => hits(t, l.drinkName, l.memo, SERVING_LABELS_KO[l.servingStyle]));
  }, [logs, q]);

  const summary = useMemo(() => {
    if (logs.length === 0) return null;
    const avg = logs.reduce((s, l) => s + l.rating, 0) / logs.length;
    const retry = logs.filter((l) => l.retryIntent).length;
    return { avg, retry };
  }, [logs]);

  return (
    <>
      {logs.length > 0 && summary && (
        <p className="hint">{logs.length}잔 · 평균 {summary.avg.toFixed(1)} · 재음용 {summary.retry}</p>
      )}

      {logs.length === 0 ? (
        <div className="empty">
          <p>기록 없음</p>
          <div className="btnrow" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => goTab('cocktails')}>칵테일 보러 가기</button>
          </div>
        </div>
      ) : (
        <>
          <SearchBox value={q} onChange={setQ} placeholder="술 이름·메모 검색" />
          {rows.length === 0 && <div className="empty">검색 결과 없음</div>}
          {rows.map((l) => (
            <LogCard key={l.id} log={l}>
              <div className="btnrow">
                <button className="btn sm ghost" onClick={async () => { await drinkLogRepo.remove(l.id); toast('지웠어요'); }}>삭제</button>
              </div>
            </LogCard>
          ))}
        </>
      )}
    </>
  );
}
