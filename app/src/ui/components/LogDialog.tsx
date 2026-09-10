import { useEffect, useState } from 'react';
import { useUI } from '../UIContext';
import { drinkLogRepo } from '../../repositories/drinkLogRepo';
import { tasteService } from '../../services/tasteService';
import {
  type ServingStyle, SERVING_STYLES, SERVING_LABELS_KO,
  FLAVOR_AXES, FLAVOR_LABELS_KO, type FlavorAxis,
} from '../../models/types';

export function LogDialog() {
  const { logPrefill, closeLog, toast } = useUI();
  const on = !!logPrefill;

  const [style, setStyle] = useState<ServingStyle>('cocktail');
  const [rating, setRating] = useState(4);
  const [retry, setRetry] = useState(true);
  const [memo, setMemo] = useState('');
  const [flavors, setFlavors] = useState<Partial<Record<FlavorAxis, number>>>({});
  const [showFlavors, setShowFlavors] = useState(false);

  useEffect(() => {
    if (logPrefill) {
      setStyle(logPrefill.servingStyle ?? 'cocktail');
      setRating(4); setRetry(true); setMemo(''); setFlavors({}); setShowFlavors(false);
    }
  }, [logPrefill]);

  if (!on || !logPrefill) return <div className={`scrim`} style={{ display: 'none' }} />;

  const save = async () => {
    await drinkLogRepo.add({
      drinkId: logPrefill.drinkId,
      drinkType: logPrefill.drinkType,
      drinkName: logPrefill.drinkName,
      date: new Date().toISOString(),
      servingStyle: style,
      rating,
      retryIntent: retry,
      flavorRatings: flavors,
      memo: memo.trim() || undefined,
    });
    await tasteService.recomputeMe();
    toast('기록 저장 · 취향 갱신됨');
    closeLog();
  };

  return (
    <>
      <div className="scrim on" onClick={closeLog} />
      <div className="modal on" role="dialog" aria-modal="true">
        <button className="close" onClick={closeLog} aria-label="닫기">×</button>
        <h2>기록: {logPrefill.drinkName}</h2>

        <div className="sechead">서빙 스타일</div>
        <div className="controls strip">
          {SERVING_STYLES.map((s) => (
            <button key={s} className="chip" aria-pressed={style === s} onClick={() => setStyle(s)}>{SERVING_LABELS_KO[s]}</button>
          ))}
        </div>

        <div className="slider">
          <label>평점 <b>{rating} / 5</b></label>
          <input type="range" min={0} max={5} step={1} value={rating} onChange={(e) => setRating(+e.target.value)} />
        </div>

        <div className="controls">
          <button className="chip" aria-pressed={retry} onClick={() => setRetry(true)}>또 마실래</button>
          <button className="chip" aria-pressed={!retry} onClick={() => setRetry(false)}>재음용 X</button>
        </div>

        <button className="btn ghost" style={{ margin: '6px 0' }} onClick={() => setShowFlavors((v) => !v)}>
          {showFlavors ? '향미 평가 접기' : '향미 평가 입력 (선택)'}
        </button>
        {showFlavors && (
          <div>
            {FLAVOR_AXES.map((a) => (
              <div className="slider" key={a}>
                <label>{FLAVOR_LABELS_KO[a]} <b>{flavors[a] ?? '-'}</b></label>
                <input type="range" min={0} max={10} step={1} value={flavors[a] ?? 0}
                  onChange={(e) => setFlavors((f) => ({ ...f, [a]: +e.target.value }))} />
              </div>
            ))}
          </div>
        )}

        <div className="sechead">메모</div>
        <textarea rows={2} value={memo} placeholder="느낀 점" onChange={(e) => setMemo(e.target.value)} />

        <div className="btnrow">
          <button className="btn primary" onClick={save}>저장</button>
          <button className="btn" onClick={closeLog}>취소</button>
        </div>
      </div>
    </>
  );
}
