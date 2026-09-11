/**
 * UIContext — 화면 전환과 겹쳐 뜨는 것(기록·술 추가·용어)을 한곳에서 관리한다.
 * 주요 메뉴는 오늘 / 칵테일 / 위스키 / 내 술장 / 기록이고, 설정은 헤더에서 들어간다.
 * 칵테일·병 상세는 '어느 탭의 무엇이 선택됐는가'로 표현한다 —
 * 그래야 PC 에서 목록 옆에 상세를 붙이고, 모바일에서 전체 화면으로 띄우는 걸 같은 상태로 처리할 수 있다.
 */
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { type DrinkType, type ServingStyle, type RecommendationResult } from '../models/types';

export type Tab = 'today' | 'cocktails' | 'whisky' | 'cellar' | 'notes' | 'settings';

export interface LogPrefill {
  drinkId: string;
  drinkType: DrinkType;
  drinkName: string;
  servingStyle?: ServingStyle;
}

export interface TermInfo { title: string; body: string; }

interface UIState {
  tab: Tab;
  goTab: (tab: Tab) => void;
  /** 칵테일 상세 열기 — 어느 화면에서 눌러도 칵테일 탭의 상세로 간다.
   *  추천에서 들어왔다면 그 추천 결과를 함께 넘겨 상세의 '추천 이유'에 쓴다. */
  openCocktail: (id: string, rec?: RecommendationResult) => void;
  /** 마지막으로 따라 들어간 추천 (없으면 null) */
  lastRec: RecommendationResult | null;
  closeCocktail: () => void;
  cocktailId: string | null;
  /** 병(위스키·보유 술) 상세 */
  openBottle: (id: string) => void;
  closeBottle: () => void;
  bottleId: string | null;
  openLog: (prefill: LogPrefill) => void;
  closeLog: () => void;
  logPrefill: LogPrefill | null;
  toast: (msg: string) => void;
  toastMsg: string | null;
  showTerm: (title: string, body: string) => void;
  closeTerm: () => void;
  termInfo: TermInfo | null;
  openAdd: (query?: string) => void;
  closeAdd: () => void;
  addOpen: boolean;
  addQuery: string;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('today');
  const [cocktailId, setCocktailId] = useState<string | null>(null);
  const [lastRec, setLastRec] = useState<RecommendationResult | null>(null);
  const [bottleId, setBottleId] = useState<string | null>(null);
  const [logPrefill, setLogPrefill] = useState<LogPrefill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [termInfo, setTermInfo] = useState<TermInfo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');

  const goTab = useCallback((t: Tab) => { setTab(t); window.scrollTo(0, 0); }, []);
  const openCocktail = useCallback((id: string, rec?: RecommendationResult) => {
    setCocktailId(id);
    setLastRec(rec ?? null);
    setTab((t) => (t === 'cocktails' ? t : 'cocktails'));
  }, []);
  const openBottle = useCallback((id: string) => {
    setBottleId(id);
    setTab((t) => (t === 'whisky' || t === 'cellar' ? t : 'whisky'));
  }, []);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);
  const showTerm = useCallback((title: string, body: string) => setTermInfo({ title, body }), []);
  const openAdd = useCallback((query = '') => { setAddQuery(query); setAddOpen(true); }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return (
    <Ctx.Provider value={{
      tab, goTab,
      cocktailId, lastRec, openCocktail, closeCocktail: () => setCocktailId(null),
      bottleId, openBottle, closeBottle: () => setBottleId(null),
      logPrefill, openLog: setLogPrefill, closeLog: () => setLogPrefill(null),
      toastMsg, toast,
      termInfo, showTerm, closeTerm: () => setTermInfo(null),
      addOpen, addQuery, openAdd, closeAdd,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUI(): UIState {
  const c = useContext(Ctx);
  if (!c) throw new Error('UIProvider 필요');
  return c;
}
