import { useMemo, useState } from 'react';
import { UIProvider, useUI } from './UIContext';
import { useHeldIds, useSubMap } from '../hooks/useData';
import { evaluateAll, tallyStatus } from '../services/availabilityService';
import { CocktailModal } from './components/CocktailModal';
import { LogDialog } from './components/LogDialog';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { HomeBarPage } from './pages/HomeBarPage';
import { RecommendPage } from './pages/RecommendPage';
import { ProfilePage } from './pages/ProfilePage';

type Tab = 'home' | 'explore' | 'homebar' | 'recommend' | 'profile';

const TABS: { id: Tab; label: string; ic: string }[] = [
  { id: 'home', label: '홈', ic: '🏠' },
  { id: 'explore', label: '탐색', ic: '🔍' },
  { id: 'homebar', label: '홈바', ic: '🍾' },
  { id: 'recommend', label: '추천', ic: '✨' },
  { id: 'profile', label: '프로필', ic: '👤' },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('home');
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const { toastMsg } = useUI();

  const tally = useMemo(() => tallyStatus(evaluateAll(heldIds, subMap)), [heldIds, subMap]);

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
        {tab === 'explore' && <ExplorePage />}
        {tab === 'homebar' && <HomeBarPage />}
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
