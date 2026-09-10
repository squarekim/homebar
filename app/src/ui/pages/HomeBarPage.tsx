import { useState } from 'react';
/**
 * HomeBarPage — 칵테일 중심 홈바 허브.
 * [칵테일] 제조 가능/검색  ·  [재고] 보유·잔량 관리  ·  [재료] 재료 목록.
 */
import { CocktailBrowser, IngredientBrowser, SimpleBuildBrowser } from '../components/browsers';

export type Sub = 'cocktail' | 'simple' | 'ingredient';

export function HomeBarPage({ sub: subProp, onSub }: { sub?: Sub; onSub?: (s: Sub) => void } = {}) {
  const [local, setLocal] = useState<Sub>('cocktail');
  const sub = subProp ?? local;
  const setSub = (s: Sub) => { setLocal(s); onSub?.(s); };
  return (
    <>
      <div className="controls strip">
        <button className="chip" aria-pressed={sub === 'cocktail'} onClick={() => setSub('cocktail')}>칵테일</button>
        <button className="chip" aria-pressed={sub === 'simple'} onClick={() => setSub('simple')}>간단 조합</button>
        <button className="chip" aria-pressed={sub === 'ingredient'} onClick={() => setSub('ingredient')}>재료</button>
      </div>
      {sub === 'cocktail' && <CocktailBrowser />}
      {sub === 'simple' && <SimpleBuildBrowser />}
      {sub === 'ingredient' && <IngredientBrowser />}
    </>
  );
}
