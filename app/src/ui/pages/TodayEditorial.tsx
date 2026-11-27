/**
 * TodayEditorial — 넓은 PC(1100px 이상)의 메인. 위에서 아래로 중요한 순서다.
 *   1단: 할 일 한 문장 + 필터 · 랜덤 추천
 *   2단: 왼쪽 고른 잔(스펙 시트) · 오른쪽 지금 만들 수 있는 잔 목록
 *   3단: 내 술장 · 하나만 더 있으면 · 처음이라면 (같은 모양의 칸 셋)
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
import { tasteMatch } from '../../services/flavorService';
import { glassOf, GLASS_ICE, GLASS_LABEL_KO } from '../../data/drinkVisual';
import { resetInventoryToSeed } from '../../db/migrate';
import { amountOf, cocktailSpecLine } from '../components/CocktailDetail';
import { GlassArt } from '../components/GlassArt';
import { CaskArt } from '../components/CaskArt';
import { LeadArt } from '../components/Mark';
import { FlavorBars, notifyExample, StartButtons } from '../components/common';
import { IS_PUBLIC } from '../../config';
import { type Bottle, type Cocktail, type RecommendationResult } from '../../models/types';
import { cocktailWords, whiskyWords } from '../../services/tasteWords';
import { bottleKindLabel } from '../../data/bottleIngredients';
import { nameEnOf } from '../../data/liquorMaster';

/** 받침 따라 '을/를' */
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '을' : '를'; };

/** 영문명 — IBA 페이지 주소의 마지막 조각(`/iba-cocktail/old-fashioned/` → Old Fashioned). IBA 주소가 없으면 비운다 */
/**
 * 시작하기 — 처음 온 사람이 할 일 세 줄. 메인 넓은 화면은 인덱스 위, 모바일은 카드 뽑기 아래에 둔다.
 * 취향을 이미 정했으면 '다시 찾기'로, 술을 넣은 적이 있으면 '술 넣기' 줄은 뺀다.
 */
/** 처음 온 사람 — 취향도 기록도 없다. 홈 맨 위를 취향 찾기 안내로 바꾼다 */
export function useIsNew(): boolean {
  const ctx = useRecommendContext();
  return !ctx.hasTaste && ctx.logs.length === 0;
}

export function Welcome() {
  const { goTab } = useUI();
  return (
    <div className="welcome">
      <h2 className="ask">처음이라면? 내 취향을 알아볼까요</h2>
      <p className="asksub">자주 마시는 것을 고르면 좋아할 것들을 추천해요</p>
      <button className="btn primary big" onClick={() => goTab('starter')}>취향 찾기 시작</button>
    </div>
  );
}

/**
 * 다시 온 사람 — 가장 최근에 좋았던 칵테일(별 4개 이상 또는 '또 마실래')과 맛이 가장 가까운,
 * 지금 만들 수 있는 다른 잔 하나를 권한다.
 */
export function LikedNext({ pool }: { pool: RecommendationResult[] }) {
  const { openCocktail } = useUI();
  const ctx = useRecommendContext();
  const liked = ctx.logs.find((l) => l.drinkType === 'cocktail' && (l.rating >= 4 || l.retryIntent));
  const from = liked && referenceRepo.cocktailById(liked.drinkId);
  if (!from) return null;
  let best: { r: RecommendationResult; m: number } | null = null;
  for (const r of pool) {
    if (r.kind !== 'cocktail' || r.id === from.id) continue;
    const ck = referenceRepo.cocktailById(r.id);
    if (!ck) continue;
    const m = tasteMatch(from.flavor, ck.flavor);
    if (!best || m > best.m) best = { r, m };
  }
  if (!best) return null;
  const to = best.r;
  return (
    <button className="likednext" onClick={() => openCocktail(to.id, to)}>
      지난번 <b>{from.name}</b>{eul(from.name) === '을' ? '이' : '가'} 좋았다면 → <b>{to.name}</b>
    </button>
  );
}

export function StartLinks() {
  const { goTab, openAdd } = useUI();
  const ctx = useRecommendContext();
  const bottles = useBottles();
  return (
    <div className="ed-block startlinks">
      <div className="ed-head"><span className="k">처음이라면</span></div>
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
  const en = ck.nameEn;
  const glass = glassOf(ck);
  return (
    <article className="spec">
      <p className="spec-meta">{cocktailSpecLine(ck)}</p>
      <h2 className="spec-ko">{ck.name}</h2>
      {en && <p className="spec-en">{en}</p>}
      <p className="spec-taste">{cocktailWords(ck, 3).join(' · ')}</p>
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
        <button className="btn ghost" onClick={() => openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' })}>만든 잔 남기기</button>
      </div>
    </article>
  );
}

/** 위스키 스펙 시트 — 칵테일 SpecSheet와 같은 순서(분류 줄 · 이름 · 맛 한 줄 · 그림 · 정보 표 | 맛 프로필 · 버튼) */
function WhiskySheet({ b }: { b: Bottle }) {
  const { openLog, openBottle } = useUI();
  return (
    <article className="spec">
      <p className="spec-meta">{[bottleKindLabel(b), b.abv && `도수 ${b.abv}`].filter(Boolean).join(' · ')}</p>
      <h2 className="spec-ko">{b.name}</h2>
      {nameEnOf(b.productId) && <p className="spec-en">{nameEnOf(b.productId)}</p>}
      <p className="spec-taste">{whiskyWords(b, 3).join(' · ')}</p>
      {/* 잔은 '마셔 보라'는 뜻, 오크통은 이 위스키를 구별해 준다(캐스크 나무색·피트 연기·숙성 연수) */}
      <div className="spec-frame pair"><LeadArt kind="whisky" bottleId={b.id} size={180} /><CaskArt bottle={b} size={180} /></div>
      <div className="spec-cols">
        <div>
          <div className="spec-lb">기본 정보</div>
          <table className="spec-ing">
            <tbody>
              <tr><td>종류</td><td>{bottleKindLabel(b)}</td></tr>
              {b.abv && <tr><td>도수</td><td>{b.abv}</td></tr>}
              {b.volumeMl && <tr><td>용량</td><td>{b.volumeMl}ml</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <div className="spec-lb">맛 프로필</div>
          <FlavorBars vector={b.flavor} compact />
        </div>
      </div>
      <div className="btnrow">
        <button className="btn primary" onClick={() => openBottle(b.id)}>위스키 상세</button>
        <button className="btn ghost" onClick={() => openLog({ drinkId: b.id, drinkType: 'whisky', drinkName: b.name, servingStyle: 'neat' })}>마신 잔 남기기</button>
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
  const { setCellarSub, goTab, toast } = useUI();
  const ctx = useRecommendContext();
  const isNew = useIsNew();
  const heldIds = useHeldIds();
  const [selId, setSelId] = useState<string | null>(null);
  const last = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  // 좁은 화면에서는 스펙 시트가 목록 위에 있어 고른 잔이 안 보일 수 있다 — 그때만 올려 보여 준다
  const choose = (id: string) => {
    setSelId(id);
    const el = mainRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 목록이 바뀌어 고른 잔이 빠지면 맨 앞(추천 1순위)으로
  const sel = list.find((r) => r.id === selId) ?? list[0] ?? null;
  useEffect(() => { if (selId && !list.some((r) => r.id === selId)) setSelId(null); }, [list, selId]);

  const pickOne = () => {
    const i = weightedPick(list.length, last.current);
    if (i < 0) return;
    last.current = i;
    choose(list[i]!.id);
  };

  const held = useMemo(() => referenceRepo.ingredients().filter((i) => heldIds.has(i.id)), [heldIds]);
  // 하나 더해도 새로 열리는 잔이 없는 재료는 권하지 않는다
  const buys = useMemo(() => calculatePurchases(ctx, 10).filter((b) => b.addedRecipes > 0).slice(0, 3), [ctx]);
  const selCk = sel?.kind === 'cocktail' ? referenceRepo.cocktailById(sel.id) : undefined;
  const selB = sel?.kind === 'whisky' ? referenceRepo.bottleById(sel.id) : undefined;

  // 재고가 비었으면 할 일 하나만 크게 보여 준다
  if (heldIds.size === 0) {
    return (
      <section className="ed">
        <div className="ed-hero">
          <div>
            <h2 className="ask">먼저 집에 있는 술부터</h2>
            <p className="asksub">술장에 넣은 술과 재료로 지금 만들 수 있는 잔만 추천</p>
          </div>
        </div>
        <div className="ed-empty">
          <StartButtons />
          {!IS_PUBLIC && (
            <button className="btn ghost" onClick={async () => { await resetInventoryToSeed(); notifyExample(); toast('예시 재고를 켰어요'); }}>예시 재고로 둘러보기</button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="ed">
      {/* 1단 — 이 화면에서 할 일 한 문장과 주 행동 하나 */}
      <div className="ed-hero">
        {isNew ? <Welcome /> : <div>
          <h2 className="ask">오늘 뭐 마실까</h2>
          <p className="asksub">{list.length
            ? `제조 가능 ${list.length}종 / 추천 순으로 표시`
            : '조건에 맞는 잔 없음 · 필터를 바꿔 보기'}</p>
          <LikedNext pool={list} />
        </div>}
        <div className="ed-actions">
          {filters}
          {list.length > 1 && <button className={isNew ? 'btn big' : 'btn primary big'} onClick={pickOne}>랜덤 추천</button>}
        </div>
      </div>

      {/* 2단 — 고른 잔(왼쪽)과 고를 수 있는 잔(오른쪽) */}
      <div className="ed-grid">
        <div className="ed-main" ref={mainRef}>
          {!sel && <div className="empty">{emptyText}</div>}
          {selCk && <SpecSheet key={selCk.id} ck={selCk} />}
          {selB && <WhiskySheet key={selB.id} b={selB} />}
        </div>

        {list.length > 0 && (
          <aside className="ed-side ed-block">
            <div className="ed-head"><span className="k">지금 만들 수 있는 잔</span><small>{list.length}잔</small></div>
            <ol className="ed-index">
              {list.slice(0, 12).map((r) => {
                const en = r.kind === 'cocktail' ? referenceRepo.cocktailById(r.id)?.nameEn ?? '' : nameEnOf(referenceRepo.bottleById(r.id)?.productId) ?? '';
                return (
                  <li key={r.id}>
                    <button aria-current={sel?.id === r.id} onClick={() => choose(r.id)}>
                      <span className="no">{r.kind === 'whisky' ? '위스키' : r.base ?? ''}</span>
                      <span className="nm">{r.name}{en && <em>{en}</em>}</span>
                      <span className={`st ${r.status === 'SUBSTITUTE' ? 'alt' : ''}`}>{r.status === 'SUBSTITUTE' ? '대체' : '가능'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {list.length > 12 && <button className="lnk" onClick={() => goTab('cocktails')}>전체 메뉴에서 +{list.length - 12}잔 더 보기 →</button>}
          </aside>
        )}
      </div>

      {/* 3단 — 보조 정보는 같은 모양의 칸 셋으로 */}
      <div className="ed-more">
        <div className="ed-block">
          <div className="ed-head"><span className="k">내 술장</span><small>{held.length} / {referenceRepo.ingredients().length}</small></div>
          <p className="ed-cab">{held.slice(0, 18).map((i) => <span key={i.id}>{i.name}</span>)}{held.length > 18 && <span className="rest">외 {held.length - 18}</span>}</p>
          <button className="lnk" onClick={() => { setCellarSub('stock'); goTab('cellar'); }}>재료 편집 →</button>
        </div>
        <div className="ed-block">
          <div className="ed-head"><span className="k">하나만 더 있으면</span><small>추가 추천</small></div>
          {buys.length ? (
            <ul className="ed-next">
              {buys.map((b) => (
                <li key={b.ingredientId}>
                  <div>
                    <b>{b.name}</b> <span className="plus">+{b.addedRecipes}잔</span>{ctx.hasTaste && b.tasteHits > 0 && <span className="taste-hit"> · 취향 {b.tasteHits}</span>}
                    <div className="sub">{b.unlockedRecipeNames.slice(0, 3).join(', ')}{b.unlockedRecipeNames.length > 3 ? ` 외 ${b.unlockedRecipeNames.length - 3}` : ''}</div>
                  </div>
                  <button className="btn sm" onClick={async () => { await inventoryRepo.setOwned(b.ingredientId, b.name, true); toast(`${b.name}${eul(b.name)} 체크했어요`); }}>체크</button>
                </li>
              ))}
            </ul>
          ) : <p className="ed-cab">재료 하나로 새로 열리는 잔 없음</p>}
        </div>
        <StartLinks />
      </div>
    </section>
  );
}
