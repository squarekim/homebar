/**
 * FirstRun — 처음 연 사람에게 한 번만 보이는 하단 한 줄 배너. 화면을 덮지 않는다.
 * 건전한 음주 문화 한 줄과 시작 버튼만 둔다.
 * 연령은 묻지 않는다(판매·광고가 없는 기록 앱). 쓸 때마다 띄우는 경고도 두지 않는다.
 * 본 적이 있다는 표시는 이 브라우저에만 둔다. 저장이 막혀 있으면 매번 보일 수 있다.
 */
import { useState } from 'react';
import { useUI } from '../UIContext';

const KEY = 'homebar.firstRunSeen';

function seen(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
function markSeen(): void {
  try { localStorage.setItem(KEY, '1'); } catch { /* 저장이 막혀도 이번에는 닫힌다 */ }
}

export function FirstRun() {
  const { goTab, openAdd } = useUI();
  const [open, setOpen] = useState(() => !seen());
  if (!open) return null;

  const close = (then?: () => void) => { markSeen(); setOpen(false); then?.(); };

  return (
    <div className="firstrun" role="note">
      <p>홈바는 건전한 음주 문화를 지향합니다.</p>
      <button className="btn sm primary" onClick={() => close(() => { goTab('cellar'); openAdd(); })}>시작하기</button>
      <button className="skip" aria-label="닫기" onClick={() => close()}>✕</button>
    </div>
  );
}
