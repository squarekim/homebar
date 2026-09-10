import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { UIProvider, useUI } from './UIContext';
import { useHeldIds, useSubMap } from '../hooks/useData';
import { evaluateAll, tallyStatus } from '../services/availabilityService';
import { CocktailModal } from './components/CocktailModal';
import { LogDialog } from './components/LogDialog';
import { AddBottleDialog } from './components/AddBottleDialog';
import { Modal } from './components/common';
import { HomePage } from './pages/HomePage';
import { HomeBarPage, type Sub as HomeBarSub } from './pages/HomeBarPage';
import { WhiskyPage } from './pages/WhiskyPage';
import { CellarPage, type CellarSub } from './pages/CellarPage';
import { ProfilePage } from './pages/ProfilePage';
import { IconHome, IconMartini, IconWhisky, IconBottle, IconProfile, IconLogo } from './components/icons';
import { IS_BETA } from '../config';

/** 집계 타일 설명 — 처음 들어온 사람이 숫자의 뜻을 바로 알 수 있게 */
type TallyLabel = '정규' | '근사' | '불가' | '보유재료';
const TALLY_TERMS: Record<TallyLabel, [title: string, body: string]> = {
  정규: ['정규', '필수 재료를 전부 보유하고 대체 없이 원 레시피대로 만들 수 있는 칵테일 수입니다.'],
  근사: ['근사', '필수 재료는 다 있지만 일부를 대체재로 채워 만드는 경우입니다. 맛이 원형과 조금 달라집니다.'],
  불가: ['불가', '필수 재료가 빠져 지금은 못 만드는 칵테일 수입니다. 재고를 체크하거나 술을 추가하면 즉시 줄어듭니다.'],
  보유재료: ['보유재료', '지금 보유로 체크된 재료 수입니다. 목록은 술장 → 재고에서 보고 고칩니다. 남의 재고로 시작했다면 그곳의 \'보유재료 초기화\'로 비우고 내 것만 채우면 됩니다.'],
};

export type Tab = 'home' | 'homebar' | 'whisky' | 'cellar' | 'profile';

const TABS: { id: Tab; label: string; ic: ReactNode }[] = [
  { id: 'home', label: '홈', ic: <IconHome /> },
  { id: 'homebar', label: '홈바', ic: <IconMartini /> },
  { id: 'whisky', label: '위스키', ic: <IconWhisky /> },
  { id: 'cellar', label: '술장', ic: <IconBottle /> },
  { id: 'profile', label: '프로필', ic: <IconProfile /> },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('home');
  const [homebarSub, setHomebarSub] = useState<HomeBarSub>('cocktail');
  const [cellarSub, setCellarSub] = useState<CellarSub>('bottles');
  const go = (t: Tab, sub?: HomeBarSub | CellarSub) => {
    if (sub === 'stock' || sub === 'bottles') setCellarSub(sub);
    else if (sub) setHomebarSub(sub);
    setTab(t);
    window.scrollTo(0, 0);
  };
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const { toastMsg, termInfo, closeTerm, addOpen, addQuery, openAdd, closeAdd, showTerm } = useUI();

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
          <div className="brand">
            <span className="logomark"><IconLogo /></span>
            <div className="brandtext">
              <h1>홈바 플랫폼{IS_BETA && <i className="betatag">BETA</i>}</h1>
              <span>{IS_BETA ? '오너 컬렉션 기준 · 바꾼 건 내 브라우저에만 저장' : '내 취향·재고 기반'}</span>
            </div>
          </div>
          <div className="tally">
            {([['t-ok', tally.READY, '정규'], ['t-ap', tally.SUBSTITUTE, '근사'],
               ['t-no', tally.MISSING + tally.UNAVAILABLE, '불가'], ['t-st', heldIds.size, '보유재료']] as const).map(
              ([cls, value, label]) => {
                const [title, body] = TALLY_TERMS[label];
                return (
                  <button key={label} className={cls} onClick={() => showTerm(title, body)} title={body}>
                    <b>{value}</b><small>{label}</small>
                  </button>
                );
              })}
          </div>
        </div>
      </header>

      <main className="wrap">
        {tab === 'home' && <HomePage go={go} />}
        {tab === 'homebar' && <HomeBarPage sub={homebarSub} onSub={setHomebarSub} />}
        {tab === 'whisky' && <WhiskyPage />}
        {tab === 'cellar' && <CellarPage sub={cellarSub} onSub={setCellarSub} />}
        {tab === 'profile' && <ProfilePage />}
      </main>

      <button className="fab" onClick={() => openAdd()} aria-label="술 추가" title="술 추가">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <nav className="tabbar">
        <div className="wrap">
          {TABS.map((t) => (
            <button key={t.id} aria-selected={tab === t.id} onClick={() => go(t.id)}>
              <span className="ic">{t.ic}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>

      <CocktailModal />
      <LogDialog />
      <AddBottleDialog open={addOpen} initialQuery={addQuery} onClose={closeAdd} />
      <Modal open={!!termInfo} onClose={closeTerm} shell="terminfo">
        <b>{termInfo?.title}</b>
        <p>{termInfo?.body}</p>
      </Modal>
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
