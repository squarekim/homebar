import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { DrinkType, ServingStyle } from '../models/types';

export interface LogPrefill {
  drinkId: string;
  drinkType: DrinkType;
  drinkName: string;
  servingStyle?: ServingStyle;
}

export interface TermInfo { title: string; body: string; }

interface UIState {
  openCocktail: (id: string) => void;
  openLog: (prefill: LogPrefill) => void;
  toast: (msg: string) => void;
  showTerm: (title: string, body: string) => void;
  openAdd: (query?: string) => void;
  cocktailId: string | null;
  logPrefill: LogPrefill | null;
  toastMsg: string | null;
  termInfo: TermInfo | null;
  addOpen: boolean;
  addQuery: string;
  closeCocktail: () => void;
  closeLog: () => void;
  closeTerm: () => void;
  closeAdd: () => void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cocktailId, setCocktailId] = useState<string | null>(null);
  const [logPrefill, setLogPrefill] = useState<LogPrefill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [termInfo, setTermInfo] = useState<TermInfo | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);
  const showTerm = useCallback((title: string, body: string) => setTermInfo({ title, body }), []);
  const openAdd = useCallback((query = '') => { setAddQuery(query); setAddOpen(true); }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return (
    <Ctx.Provider value={{
      cocktailId, logPrefill, toastMsg, termInfo, addOpen, addQuery,
      openCocktail: setCocktailId,
      openLog: setLogPrefill,
      toast,
      showTerm,
      openAdd,
      closeAdd,
      closeCocktail: () => setCocktailId(null),
      closeLog: () => setLogPrefill(null),
      closeTerm: () => setTermInfo(null),
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
