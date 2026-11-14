/**
 * TodayEditorial — 넓은 PC(1100px 이상)의 메인. 매거진 스프레드처럼 둔다.
 *   왼쪽 7칸: 고른 잔 한 장(칵테일은 스펙 시트 — 이름 · 잔 · 재료 비율 · 맛 프로필, 위스키는 잔과 맛 한 줄)
 *   오른쪽 5칸: 메뉴 인덱스 · 내 술장(체크한 재료) · 추가 추천
 * '랜덤 추천' 버튼은 모바일 카드 뽑기와 같은 가중 뽑기(pickService)를 쓴다.
 * 무작위는 어느 잔을 보여 줄지에만 쓴다. 그림은 레시피 데이터로 그린다.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useHeldIds, useBottles } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { inventoryRepo } from '../../repositories/inventoryRepo';
import { calculatePurchases } from '../../services/purchaseService';
import { weightedPick } from '../../services/pickService';
import { glassOf, GLASS_ICE, GLASS_LABEL_KO } from '../../data/drinkVisual';
import { resetInventoryToSeed } from '../../db/migrate';
import { amountOf, cocktailSpecLine } from '../components/CocktailDetail';
import { GlassArt } from '../components/GlassArt';
import { LeadArt } from '../components/Mark';
import { FlavorBars, notifyExample } from '../components/common';
import { type Cocktail, type RecommendationResult } from '../../models/types';

/** 받침 따라 '을/를' */
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '을' : '를'; };

/** 영문명 — IBA 페이지 주소의 마지막 조각(`/iba-cocktail/old-fashioned/` → Old Fashioned). IBA 주소가 없으면 비운다 */
export function enName(url: string | undefined): string {
  const m = url?.match(/iba-world\.com\/iba-cocktail\/([^/?#]+)/);
  return m ? m[1]!.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

/**
 * 시작하기 — 처음 온 사람이 할 일 세 줄. 메인 넓은 화면은 인덱스 위, 모바일은 카드 뽑기 아래에 둔다.
 * 취향을 이미 정했으면 '다시 찾기'로, 술을 넣은 적이 있으면 '술 넣기' 줄은 뺀다.
 */
export function StartLinks() {
  const { goTab, openAdd } = useUI();
  const ctx = useRecommendContext();
  const bottles = useBottles();
  return (
    <div className="ed-block startlinks">
      <div className="ed-head"><span className="k">Start</span><small>시작하기</small></div>
      <ul>
        <li><button onClick={() => goTab('starter')}>{ctx.hasTaste ? '취향 다시 찾기' : '취향 찾기'}<span aria-hidden="true">→</span></button></li>
        <li><button onClick={() => goTab('qna')}>Q&amp;A<span aria-hidden="true">→</span></button></li>
        {bottles.length === 0 && <li><button onClick={() => { goTab('cellar'); openAdd(); }}>집에 있는 술 넣기<span aria-hidden="true">→</span></button></li>}
      </ul>
    </div>
  );
}

/** 왼쪽 스펙 시트 — 이름 · 잔 · 재료 비율 · 맛 프로필 */
function SpecSheet({ ck }: { ck: Cocktail }) {
  const { openCocktail, openLog } = useUI();
  const en = enName(ck.url);
  const glass = glassOf(ck);
  return (
    <article className="spec">
      <p className="spec-meta">{cocktailSpecLine(ck)}</p>
      {en && <p className="spec-en">{en}</p>}
      <h2 className="spec-ko">{ck.name}</h2>
      <div className="spec-frame"><GlassArt cocktail={ck} size={220} /></div>
      <div className="spec-cols">
        <div>
          <div className="spec-lb">재료 및 제조 요소</div>
          <table className="spec-ing">
            <tbody>
              {ck.ingredients.map((ing, i) => (
                <tr key={i}><td>{ing.ingredientName}</td><td>{amountOf(ing.raw, ing.ingredientName) || '적당량'}</td></tr>
              ))}
              {ck.garnish && <tr className="ex"><td>가니시</td><td>{ck.garnish}</td></tr>}
              <tr className="ex"><td>서빙</td><td>{GLASS_LABEL_KO[glass]} · {GLASS_ICE.has(glass) ? '얼음 위' : '얼음 없이'}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="spec-lb">맛 프로필</div>
          <FlavorBars vector={ck.flavor} compact />
        </div>
      </div>
      <div className="btnrow">
        <button className="btn primary" onClick={() => openCocktail(ck.id)}>레시피 보기</button>
        <button className="btn ghost" onClick={() => openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' })}>기록하기</button>
      </div>
    </article>
  );
}

export function TodayEditorial({ list, filters, emptyText }: {
  /** 지금 만들 수 있는 잔(추천 순서) — 카드에 담기 전 전체 */
  list: RecommendationResult[];
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
  };

  const held = useMemo(() => referenceRepo.ingredients().filter((i) => heldIds.has(i.id)), [heldIds]);
  // 하나 더해도 새로 열리는 잔이 없는 재료는 권하지 않는다
  const buys = useMemo(() => calculatePurchases(ctx, 10).filter((b) => b.addedRecipes > 0).slice(0, 3), [ctx]);
  const selCk = sel?.kind === 'cocktail' ? referenceRepo.cocktailById(sel.id) : undefined;

  // 재고가 비었으면 패널을 늘어놓지 않고 버튼 하나만 둔다
  if (heldIds.size === 0) {
    return (
      <section className="ed ed-empty">
        <button className="btn primary big" onClick={async () => { await resetInventoryToSeed(); notifyExample(); toast('예시 재고를 켰어요'); }}>
          예시 재고로 둘러보기
        </button>
      </section>
    );
  }

  return (
    <section className="ed">
      <div className="ed-tools">
        {filters}
        {list.length > 1 && <button className="btn primary" onClick={pickOne}>랜덤 추천</button>}
      </div>

      <div className="ed-grid">
        {/* 왼쪽 — 고른 잔 한 장 */}
        <div className="ed-main">
          {!sel && <div className="empty">{emptyText}</div>}
          {selCk && <SpecSheet key={selCk.id} ck={selCk} />}
          {sel?.kind === 'whisky' && (
            <article className="spec">
              <h2 className="spec-ko">{sel.name}</h2>
              <p className="spec-taste">{sel.flavorWords.join(' · ')}</p>
              <div className="spec-frame"><LeadArt kind="whisky" bottleId={sel.id} size={200} /></div>
              <p className="spec-lb">보유 중</p>
              {(() => { const b = referenceRepo.bottleById(sel.id); return b ? <><div className="spec-lb">맛 프로필</div><FlavorBars vector={b.flavor} compact /></> : null; })()}
              <div className="btnrow">
                <button className="btn primary" onClick={() => openLog({ drinkId: sel.id, drinkType: 'whisky', drinkName: sel.name, servingStyle: 'neat' })}>기록하기</button>
                <button className="btn ghost" onClick={() => openBottle(sel.id)}>위스키 상세</button>
              </div>
            </article>
          )}
        </div>

        {/* 오른쪽 — 인덱스 · 술장 · 추가 추천 */}
        <aside className="ed-side">
          <StartLinks />
          {list.length > 0 && (
            <div className="ed-block">
              <div className="ed-head"><span className="k">Menu Index</span><small>{list.length}</small></div>
              <ol className="ed-index">
                {list.slice(0, 24).map((r) => {
                  const en = r.kind === 'cocktail' ? enName(referenceRepo.cocktailById(r.id)?.url) : '';
                  return (
                    <li key={r.id}>
                      <button aria-current={sel?.id === r.id} onClick={() => setSelId(r.id)}>
                        <span className="no">{r.kind === 'whisky' ? '위스키' : r.base ?? ''}</span>
                        <span className="nm">{r.name}{en && <em>{en}</em>}</span>
                        <span className={`st ${r.status === 'SUBSTITUTE' ? 'alt' : ''}`}>{r.status === 'SUBSTITUTE' ? '대체' : '가능'}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {list.length > 24 && <button className="lnk" onClick={() => goTab('cocktails')}>전체 메뉴에서 +{list.length - 24}잔 더 보기 →</button>}
            </div>
          )}

          <div className="ed-block">
            <div className="ed-head"><span className="k">My Bar Cabinet</span><small>{held.length} / {referenceRepo.ingredients().length}</small></div>
            <p className="ed-cab">{held.slice(0, 18).map((i) => <span key={i.id}>{i.name}</span>)}{held.length > 18 && <span className="more">외 {held.length - 18}</span>}</p>
            <button className="lnk" onClick={() => { setCellarSub('stock'); goTab('cellar'); }}>재료 편집 →</button>
          </div>

          {buys.length > 0 && (
            <div className="ed-block">
              <div className="ed-head"><span className="k">Next Addition</span><small>추가 추천</small></div>
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
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
