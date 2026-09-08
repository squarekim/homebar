import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { DrinkType, ServingStyle } from '../models/types';

export interface LogPrefill {
  drinkId: string;
  drinkType: DrinkType;
  drinkName: string;
  servingStyle?: ServingStyle;
}

interface UIState {
  openCocktail: (id: string) => void;
  openLog: (prefill: LogPrefill) => void;
  toast: (msg: string) => void;
  cocktailId: string | null;
  logPrefill: LogPrefill | null;
  toastMsg: string | null;
  closeCocktail: () => void;
  closeLog: () => void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cocktailId, setCocktailId] = useState<string | null>(null);
  const [logPrefill, setLogPrefill] = useState<LogPrefill | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);

  return (
    <Ctx.Provider value={{
      cocktailId, logPrefill, toastMsg,
      openCocktail: setCocktailId,
      openLog: setLogPrefill,
      toast,
      closeCocktail: () => setCocktailId(null),
      closeLog: () => setLogPrefill(null),
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
