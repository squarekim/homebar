/**
 * App — 앱 셸.
 * 헤더(로고 · PC 메뉴 · 설정) + 본문 + 모바일 하단 메뉴 5개.
 * 상단에 늘 붙어 있던 통계 카드는 내 술장으로 옮겼다 — 모든 화면에서 본문과 경쟁하던 숫자다.
 * 전역 '+' 버튼도 없앴다. 술 추가는 내 술장에서, 기록은 상세와 기록 화면에서 한다.
 */
import { type ReactNode, useEffect } from 'react';
import { UIProvider, useUI, type Tab } from './UIContext';
import { LogDialog } from './components/LogDialog';
import { AddBottleDialog } from './components/AddBottleDialog';
import { Modal } from './components/common';
import { TodayPage } from './pages/TodayPage';
import { CocktailsPage } from './pages/CocktailsPage';
import { WhiskyPage } from './pages/WhiskyPage';
import { CellarPage } from './pages/CellarPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { IconHome, IconMartini, IconWhisky, IconBottle, IconNote, IconGear, IconLogo } from './components/icons';
import { IS_BETA } from '../config';

const TABS: { id: Tab; label: string; ic: ReactNode }[] = [
  { id: 'today', label: '오늘', ic: <IconHome /> },
  { id: 'cocktails', label: '칵테일', ic: <IconMartini /> },
  { id: 'whisky', label: '위스키', ic: <IconWhisky /> },
  { id: 'cellar', label: '내 술장', ic: <IconBottle /> },
  { id: 'notes', label: '기록', ic: <IconNote /> },
];

function Shell() {
  const { tab, goTab, toastMsg, termInfo, closeTerm, addOpen, addQuery, closeAdd } = useUI();

  // 데스크톱: 가로 칩 줄을 마우스 휠로도 넘긴다(넘치는 경우)
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
          <button className="brand" onClick={() => goTab('today')}>
            <span className="logomark"><IconLogo /></span>
            <h1>홈바{IS_BETA && <i className="betatag">BETA</i>}</h1>
          </button>
          <nav className="topnav">
            {TABS.map((t) => (
              <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => goTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="headact">
            <button className="iconbtn" aria-current={tab === 'settings' ? 'page' : undefined}
              onClick={() => goTab('settings')} aria-label="설정" title="설정">
              <IconGear />
            </button>
          </div>
        </div>
      </header>

      <main className="wrap">
        {tab === 'today' && <TodayPage />}
        {tab === 'cocktails' && <CocktailsPage />}
        {tab === 'whisky' && <WhiskyPage />}
        {tab === 'cellar' && <CellarPage />}
        {tab === 'notes' && <NotesPage />}
        {tab === 'settings' && <SettingsPage />}
        <div className="tailspace" />
      </main>

      <nav className="tabbar">
        <div className="wrap">
          {TABS.map((t) => (
            <button key={t.id} aria-selected={tab === t.id} onClick={() => goTab(t.id)}>
              <span className="ic">{t.ic}</span>{t.label}
            </button>
          ))}
        </div>
      </nav>

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
