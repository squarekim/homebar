import { useState } from 'react';
/**
 * HomeBarPage — 칵테일 중심 홈바 허브.
 * [칵테일] 제조 가능/검색  ·  [재고] 보유·잔량 관리  ·  [재료] 재료 목록.
 */
import { CocktailBrowser, IngredientBrowser, SimpleBuildBrowser } from '../components/browsers';
import { ChipRow, type ChipOption } from '../components/common';

export type Sub = 'cocktail' | 'simple' | 'ingredient';

const SUBS: ChipOption<Sub>[] = [
  { v: 'cocktail', label: '칵테일' },
  { v: 'simple', label: '간단 조합' },
  { v: 'ingredient', label: '재료' },
];

export function HomeBarPage({ sub: subProp, onSub }: { sub?: Sub; onSub?: (s: Sub) => void } = {}) {
  const [local, setLocal] = useState<Sub>('cocktail');
  const sub = subProp ?? local;
  const setSub = (s: Sub) => { setLocal(s); onSub?.(s); };
  return (
    <>
      <ChipRow value={sub} onChange={setSub} options={SUBS} />
      {sub === 'cocktail' && <CocktailBrowser />}
      {sub === 'simple' && <SimpleBuildBrowser />}
      {sub === 'ingredient' && <IngredientBrowser />}
    </>
  );
}
