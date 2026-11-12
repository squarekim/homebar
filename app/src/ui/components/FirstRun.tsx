/**
 * FirstRun — 처음 연 사람에게 한 번만 보이는 안내 3장.
 * ① 건전한 음주 문화 한 줄 ② 잔·오크통으로 보여 준다는 소개 ③ 시작 방법 고르기.
 * 연령은 묻지 않는다(판매·광고가 없는 기록 앱). 쓸 때마다 띄우는 경고도 두지 않는다.
 * 본 적이 있다는 표시는 이 브라우저에만 둔다. 저장이 막혀 있으면 매번 보일 수 있다.
 */
import { useState } from 'react';
import { useUI } from '../UIContext';
import { GlassArt } from './GlassArt';
import { CaskArt } from './CaskArt';
import { referenceRepo } from '../../repositories/referenceRepo';

const KEY = 'homebar.firstRunSeen';

function seen(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
function markSeen(): void {
  try { localStorage.setItem(KEY, '1'); } catch { /* 저장이 막혀도 이번에는 닫힌다 */ }
}

export function FirstRun() {
  const { goTab, openAdd } = useUI();
  const [step, setStep] = useState<number | null>(() => (seen() ? null : 0));
  if (step === null) return null;

  const close = (then?: () => void) => { markSeen(); setStep(null); then?.(); };
  const ck = referenceRepo.cocktails().find((c) => c.name === '네그로니');
  const wk = referenceRepo.whiskies()[0];

  return (
    <div className="firstrun" role="dialog" aria-modal="true" aria-label="처음 안내">
      <div className="sheetcard">
        {step === 0 && (
          <>
            <p className="lead1">홈바는 건전한 음주 문화를 지향해요.</p>
            <button className="btn primary big" onClick={() => setStep(1)}>시작하기</button>
          </>
        )}
        {step === 1 && (
          <>
            <div className="duo" aria-hidden="true">
              {ck && <GlassArt cocktail={ck} size={96} />}
              {wk && <CaskArt bottle={wk} size={96} />}
            </div>
            <p className="lead1">칵테일은 잔으로, 위스키는 오크통으로 보여 드려요.</p>
            <button className="btn primary big" onClick={() => setStep(2)}>다음</button>
          </>
        )}
        {step === 2 && (
          <>
            <p className="lead1">어떻게 시작할까요?</p>
            <div className="pickbtns">
              <button className="btn primary big" onClick={() => close(() => { goTab('cellar'); openAdd(); })}>집에 있는 술 넣기</button>
              <button className="btn ghost big" onClick={() => close(() => goTab('starter'))}>평소 마시는 음료로 취향 찾기</button>
              <button className="btn ghost big" onClick={() => close()}>나중에</button>
            </div>
          </>
        )}
        <small className="steps">{step + 1} / 3</small>
        {step < 2 && <button className="skip" onClick={() => close()}>건너뛰기</button>}
      </div>
    </div>
  );
}
