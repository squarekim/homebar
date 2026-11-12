/**
 * TodayEditorial — 넓은 PC(1100px 이상)의 메인. 매거진 지면처럼 둔다.
 *   왼쪽 7칸: 고른 잔 한 장(칵테일은 레시피 지면 그대로, 위스키는 잔과 맛 한 줄)
 *   오른쪽 5칸: 메뉴 인덱스(지금 만들 수 있는 잔에 번호를 붙인 목록) · 내 술장(체크한 재료) · 다음에 들일 재료
 * 카드 뽑기는 모바일의 얼굴이고, 여기서는 '골라 주기' 버튼이 같은 가중 뽑기(pickService)를 쓴다.
 * 무작위는 어느 잔을 보여 줄지에만 쓴다. 그림은 레시피 데이터로 그린다.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useHeldIds } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { inventoryRepo } from '../../repositories/inventoryRepo';
import { calculatePurchases } from '../../services/purchaseService';
import { weightedPick } from '../../services/pickService';
import { CocktailDetail } from '../components/CocktailDetail';
import { LeadArt } from '../components/Mark';
import { StartButtons } from '../components/common';
import { type RecommendationResult } from '../../models/types';

const two = (n: number) => String(n).padStart(2, '0');
/** 받침 따라 '을/를' */
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '을' : '를'; };

export function TodayEditorial({ list, subline, filters, emptyText }: {
  /** 지금 만들 수 있는 잔(추천 순서) — 카드에 담기 전 전체 */
  list: RecommendationResult[];
  subline: string;
  filters: ReactNode;
  emptyText: ReactNode;
}) {
  const { openLog, openBottle, setCellarSub, goTab, toast } = useUI();
  const ctx = useRecommendContext();
  const heldIds = useHeldIds();
  const [selId, setSelId] = useState<string | null>(null);
  const last = useRef<number | null>(null);

  // 목록이 바뀌어 고른 잔이 빠지면 맨 앞(추천 1순위)으로
  const sel = list.find((r) => r.id === selId) ?? list[0] ?? null;
  useEffect(() => { if (selId && !list.some((r) => r.id === selId)) setSelId(null); }, [list, selId]);

  const pickOne = () => {
    const i = weightedPick(list.length, last.current);
    if (i < 0) return;
    last.current = i;
    setSelId(list[i]!.id);
    toast(`오늘의 잔: ${list[i]!.name}`);
  };

  const held = useMemo(() => referenceRepo.ingredients().filter((i) => heldIds.has(i.id)), [heldIds]);
  // 하나 더해도 새로 열리는 잔이 없는 재료는 권하지 않는다
  const buys = useMemo(() => calculatePurchases(ctx, 10).filter((b) => b.addedRecipes > 0).slice(0, 3), [ctx]);

  return (
    <section className="ed">
      <div className="ed-top">
        <div>
          <h2 className="ask">오늘 뭐 마실까요?</h2>
          <p className="asksub">{subline}</p>
        </div>
        <div className="ed-tools">
          {filters}
          {list.length > 1 && <button className="btn primary" onClick={pickOne}>↻ 골라 주기</button>}
        </div>
      </div>

      <div className="ed-grid">
        {/* 왼쪽 — 고른 잔 한 장 */}
        <div className="ed-main">
          {!sel && <div className="empty">{emptyText}<StartButtons /></div>}
          {sel?.kind === 'cocktail' && <CocktailDetail key={sel.id} id={sel.id} />}
          {sel?.kind === 'whisky' && (
            <article className="detail">
              <LeadArt kind="whisky" bottleId={sel.id} size={160} />
              <h2>{sel.name}</h2>
              <p className="taste">{sel.flavorWords.join(' · ')}</p>
              <p className="hint">가지고 있는 병이에요.</p>
              <div className="btnrow">
                <button className="btn primary" onClick={() => openLog({ drinkId: sel.id, drinkType: 'whisky', drinkName: sel.name, servingStyle: 'neat' })}>마신 잔 남기기</button>
                <button className="btn" onClick={() => openBottle(sel.id)}>위스키 상세 보기</button>
              </div>
            </article>
          )}
        </div>

        {/* 오른쪽 — 인덱스 · 술장 · 다음 재료 */}
        <aside className="ed-side">
          <div className="ed-block">
            <div className="ed-head"><span className="k">Menu Index</span><h3>지금 만들 수 있는 잔 <small>{list.length}</small></h3></div>
            {list.length === 0
              ? <p className="hint">아직 없어요.</p>
              : (
                <ol className="ed-index">
                  {list.slice(0, 24).map((r, i) => (
                    <li key={r.id}>
                      <button aria-current={sel?.id === r.id} onClick={() => setSelId(r.id)}>
                        <span className="no">{two(i + 1)}</span>
                        <span className="nm">{r.name}</span>
                        <span className="sub">{r.kind === 'whisky' ? '위스키 한 잔' : r.flavorWords.slice(0, 2).join(' · ')}</span>
                        <span className={`st ${r.status === 'SUBSTITUTE' ? 'alt' : ''}`}>{r.kind === 'whisky' ? '병 있음' : r.status === 'SUBSTITUTE' ? '대체 재료' : '바로 가능'}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            {list.length > 24 && <p className="hint">나머지 {list.length - 24}잔은 칵테일 목록에서 볼 수 있어요.</p>}
          </div>

          <div className="ed-block">
            <div className="ed-head"><span className="k">My Bar Cabinet</span><h3>체크한 재료 <small>{held.length} / {referenceRepo.ingredients().length}</small></h3></div>
            {held.length === 0
              ? <p className="hint">아직 체크한 재료가 없어요.</p>
              : <p className="ed-cab">{held.slice(0, 18).map((i) => <span key={i.id}>{i.name}</span>)}{held.length > 18 && <span className="more">외 {held.length - 18}</span>}</p>}
            <button className="lnk" onClick={() => { setCellarSub('stock'); goTab('cellar'); }}>재료 체크 고치기 →</button>
          </div>

          <div className="ed-block">
            <div className="ed-head"><span className="k">Next Addition</span><h3>하나만 더 들이면</h3></div>
            {buys.length === 0
              ? <p className="hint">없어요.</p>
              : (
                <ul className="ed-next">
                  {buys.map((b) => (
                    <li key={b.ingredientId}>
                      <div>
                        <b>{b.name}</b> <span className="plus">+{b.addedRecipes}잔</span>
                        <div className="sub">{b.unlockedRecipeNames.slice(0, 3).join(', ')}{b.unlockedRecipeNames.length > 3 ? ` 외 ${b.unlockedRecipeNames.length - 3}` : ''}</div>
                      </div>
                      <button className="btn sm" onClick={async () => { await inventoryRepo.setOwned(b.ingredientId, b.name, true); toast(`${b.name}${eul(b.name)} 체크했어요`); }}>체크</button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </aside>
      </div>
    </section>
  );
}
