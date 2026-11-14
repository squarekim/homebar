/**
 * UIContext — 화면 전환과 겹쳐 뜨는 것(기록·술 추가·용어)을 한곳에서 관리한다.
 * 주요 메뉴는 메인 / 칵테일 / 위스키 / 술장 / 취향이고, 설정은 헤더와 취향 화면에서 들어간다.
 * 칵테일·병 상세는 '어느 탭의 무엇이 선택됐는가'로 표현한다 —
 * 그래야 PC 에서 목록 옆에 상세를 붙이고, 모바일에서 전체 화면으로 띄우는 걸 같은 상태로 처리할 수 있다.
 */
import { createContext, useContext, useState, useEffect, useRef, type ReactNode, useCallback } from 'react';
import { type DrinkType, type ServingStyle, type RecommendationResult } from '../models/types';
import { type GuideId } from '../data/beginnerGuide';

export type Tab = 'today' | 'cocktails' | 'whisky' | 'cellar' | 'taste' | 'settings' | 'starter' | 'qna';
const TABS_ALL: readonly Tab[] = ['today', 'cocktails', 'whisky', 'cellar', 'taste', 'settings', 'starter', 'qna'];

export type CellarSub = 'bottles' | 'stock' | 'logs';

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
  /** 탭을 누를 때마다 오른다 — 같은 탭을 다시 누르면 그 탭의 첫 화면으로 돌아가게 하는 데 쓴다 */
  tabTick: number;
  /** 술장 안에서 보고 있는 화면 — 보유 술 · 재료 재고 · 마신 기록 */
  cellarSub: CellarSub;
  setCellarSub: (s: CellarSub) => void;
  /** 술장의 마신 기록으로 바로 간다 */
  goLogs: () => void;
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
  /** 입문 안내 팝업 — 'menu' 는 안내 목록 */
  guide: GuideId | 'menu' | null;
  /** skipIntro: 소개 장을 건너뛰고 첫 장부터 연다 */
  openGuide: (id: GuideId | 'menu', opts?: { skipIntro?: boolean }) => void;
  guideSkipIntro: boolean;
  closeGuide: () => void;
  openAdd: (query?: string) => void;
  closeAdd: () => void;
  addOpen: boolean;
  addQuery: string;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  // 보고 있던 화면을 주소 끝(#cocktails 등)에 적어 두어, 새로고침해도 그 화면으로 돌아온다.
  // 뒤로 가기 기록은 아래 pushState 가 맡으므로 여기서는 replaceState 로 주소만 바꾼다
  const [tab, setTab] = useState<Tab>(() => {
    const h = window.location.hash.slice(1);
    return (TABS_ALL as readonly string[]).includes(h) ? (h as Tab) : 'today';
  });
  // 브라우저 기록이 움직인 뒤(뒤로 가기·앱이 되돌린 기록)에는 그 기록의 주소가 예전 화면(#whisky 등)일 수 있다.
  // 기록이 움직일 때마다 urlTick 을 올려, 지금 보고 있는 화면 기준으로 주소를 다시 적는다.
  // 주소만 보고 화면을 바꾸지는 않는다 — 기록을 되돌릴 때 예전 주소를 따라 엉뚱한 화면으로 가는 버그가 있었다.
  const [urlTick, setUrlTick] = useState(0);
  useEffect(() => {
    const url = tab === 'today' ? window.location.pathname + window.location.search : `#${tab}`;
    window.history.replaceState(window.history.state, '', url);
  }, [tab, urlTick]);
  const [cellarSub, setCellarSub] = useState<CellarSub>('bottles');
  const [cocktailId, setCocktailId] = useState<string | null>(null);
  const [lastRec, setLastRec] = useState<RecommendationResult | null>(null);
  const [bottleId, setBottleId] = useState<string | null>(null);
  const [logPrefill, setLogPrefill] = useState<LogPrefill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [termInfo, setTermInfo] = useState<TermInfo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [guide, setGuide] = useState<GuideId | 'menu' | null>(null);
  const [guideSkipIntro, setGuideSkipIntro] = useState(false);
  const openGuide = useCallback((id: GuideId | 'menu', opts?: { skipIntro?: boolean }) => { setGuideSkipIntro(!!opts?.skipIntro); setGuide(id); }, []);
  const [addQuery, setAddQuery] = useState('');

  const [tabTick, setTabTick] = useState(0);
  // 아래 탭을 누르면 열려 있던 상세는 닫는다 — 상세가 열린 채 탭만 바뀌면 다른 탭에서 그 상세가 다시 뜬다
  const goTab = useCallback((t: Tab) => { setCocktailId(null); setBottleId(null); setTab(t); setTabTick((n) => n + 1); window.scrollTo(0, 0); }, []);
  const goLogs = useCallback(() => { setCellarSub('logs'); setTab('cellar'); window.scrollTo(0, 0); }, []);
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

  /*
   * 뒤로 가기 — 안드로이드의 뒤로 버튼과 브라우저의 뒤로 가기가 "지금 떠 있는 것 하나 닫기"가 되게 한다.
   * 겹쳐 뜬 것(용어·안내·기록·술 추가·상세)과 "메인이 아닌 탭"을 각각 한 단계로 세고, 그 수만큼 history 에 쌓아 둔다.
   * 화면에서 직접 닫으면 쌓아 둔 것을 되돌리고, 뒤로 가기를 누르면 맨 위 하나를 닫는다. 메인에서 한 번 더 누르면 앱을 나간다.
   */
  const layers = [tab !== 'today', !!(cocktailId || bottleId), addOpen, !!logPrefill, !!guide, !!termInfo];
  const depth = layers.filter(Boolean).length;
  const pushed = useRef(0);
  const skip = useRef(0);
  const closeTop = useRef<() => void>(() => {});
  closeTop.current = () => {
    if (termInfo) setTermInfo(null);
    else if (guide) setGuide(null);
    else if (logPrefill) setLogPrefill(null);
    else if (addOpen) setAddOpen(false);
    else if (cocktailId || bottleId) { setCocktailId(null); setBottleId(null); }
    else if (tab !== 'today') { setTab('today'); setTabTick((n) => n + 1); }
  };
  useEffect(() => {
    if (depth > pushed.current) {
      for (let i = pushed.current; i < depth; i++) window.history.pushState({ homebar: i + 1 }, '');
      pushed.current = depth;
    } else if (depth < pushed.current) {
      const n = pushed.current - depth;
      pushed.current = depth;
      skip.current += 1;
      window.history.go(-n);
    }
  }, [depth]);
  useEffect(() => {
    const onPop = () => {
      setUrlTick((n) => n + 1);
      if (skip.current > 0) { skip.current -= 1; return; }
      if (pushed.current > 0) { pushed.current -= 1; closeTop.current(); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <Ctx.Provider value={{
      tab, goTab, tabTick, cellarSub, setCellarSub, goLogs,
      cocktailId, lastRec, openCocktail, closeCocktail: () => setCocktailId(null),
      bottleId, openBottle, closeBottle: () => setBottleId(null),
      logPrefill, openLog: setLogPrefill, closeLog: () => setLogPrefill(null),
      toastMsg, toast,
      termInfo, showTerm, closeTerm: () => setTermInfo(null),
      addOpen, addQuery, openAdd, closeAdd,
      guide, openGuide, guideSkipIntro, closeGuide: () => setGuide(null),
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
