import { ReactNode, useEffect, useMemo, useState } from 'react';
import { UIProvider, useUI } from './UIContext';
import { useHeldIds, useSubMap } from '../hooks/useData';
import { evaluateAll, tallyStatus } from '../services/availabilityService';
import { CocktailModal } from './components/CocktailModal';
import { LogDialog } from './components/LogDialog';
import { HomePage } from './pages/HomePage';
import { HomeBarPage } from './pages/HomeBarPage';
import { WhiskyPage } from './pages/WhiskyPage';
import { RecommendPage } from './pages/RecommendPage';
import { ProfilePage } from './pages/ProfilePage';
import { IconHome, IconMartini, IconWhisky, IconSparkle, IconProfile } from './components/icons';

export type Tab = 'home' | 'homebar' | 'whisky' | 'recommend' | 'profile';

const TABS: { id: Tab; label: string; ic: ReactNode }[] = [
  { id: 'home', label: '홈', ic: <IconHome /> },
  { id: 'homebar', label: '홈바', ic: <IconMartini /> },
  { id: 'whisky', label: '위스키', ic: <IconWhisky /> },
  { id: 'recommend', label: '추천', ic: <IconSparkle /> },
  { id: 'profile', label: '프로필', ic: <IconProfile /> },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('home');
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const { toastMsg, termInfo, closeTerm } = useUI();

  const tally = useMemo(() => tallyStatus(evaluateAll(heldIds, subMap)), [heldIds, subMap]);

  // 데스크톱: 가로 칩 스트립을 마우스 휠로 스크롤(넘치는 경우) — 뒤쪽 칩에 닿게 한다.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const strip = (e.target as HTMLElement)?.closest?.('.controls.strip') as HTMLElement | null;
      if (!strip || strip.scrollWidth <= strip.clientWidth || e.deltaY === 0) return;
      strip.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <>
      <header>
        <div className="wrap">
          <div className="brand"><h1>홈바 플랫폼</h1><span>내 취향·재고 기반</span></div>
          <div className="tally">
            <div className="t-ok"><b>{tally.READY}</b><small>정규</small></div>
            <div className="t-ap"><b>{tally.SUBSTITUTE}</b><small>근사</small></div>
            <div className="t-no"><b>{tally.MISSING + tally.UNAVAILABLE}</b><small>불가</small></div>
            <div className="t-st"><b>{heldIds.size}</b><small>보유재료</small></div>
          </div>
        </div>
      </header>

      <main className="wrap">
        {tab === 'home' && <HomePage go={setTab} />}
        {tab === 'homebar' && <HomeBarPage />}
        {tab === 'whisky' && <WhiskyPage />}
        {tab === 'recommend' && <RecommendPage />}
        {tab === 'profile' && <ProfilePage />}
      </main>

      <nav className="tabbar">
        <div className="wrap">
          {TABS.map((t) => (
            <button key={t.id} aria-selected={tab === t.id} onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}>
              <span className="ic">{t.ic}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>

      <CocktailModal />
      <LogDialog />
      {termInfo && (
        <>
          <div className="scrim on" onClick={closeTerm} />
          <div className="terminfo" role="dialog" aria-modal="true">
            <button className="close" onClick={closeTerm} aria-label="닫기">×</button>
            <b>{termInfo.title}</b>
            <p>{termInfo.body}</p>
          </div>
        </>
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  );
}

export function App() {
  return (
    <UIProvider>
      <Shell />
    </UIProvider>
  );
}
