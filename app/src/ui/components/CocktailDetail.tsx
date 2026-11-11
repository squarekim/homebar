/**
 * CocktailDetail — 한 잔의 상세. PC 는 목록 옆, 모바일은 화면 전체에서 같은 컴포넌트를 쓴다.
 *
 * 읽는 순서를 데이터가 아니라 행동에 맞췄다:
 *   이름·이미지 → 맛과 제조 가능 상태(없는 재료 이름까지) → 재료와 용량(없는 줄에 표시) → 만드는 법 → 기록하기 → (펼침) 수치·분류·출처.
 * 만드는 순서는 DB 에 없다. 지어내지 않고 원문 조주 방식만 적는다.
 */
import { cocktailWords } from '../../services/tasteWords';
import { useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { garnishState } from '../../services/garnishStock';
import { cocktailAbvLabel } from '../../services/cocktailStrength';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail, STATUS_LEAD_KO } from '../../services/availabilityService';
import { FlavorBars, MethodIcon, Term } from './common';
import { GlassArt } from './GlassArt';
import { methodSteps } from '../../data/beginnerGuide';
import { METHOD_PLAIN_KO, METHOD_LABELS_KO, type Cocktail, type RecommendationResult } from '../../models/types';

/** IBA 분류를 풀어 쓴 말. 공식 목록에 없는 잔은 적지 않는다 */
const IBA_PLAIN: Record<string, string> = { 현행IBA: 'IBA 공식 칵테일', 구IBA: '예전 IBA 공식 칵테일' };

/** 받침이 있으면 '으로', 없으면 '로' — 레몬즙으로 / 코앵트로로 */
function ro(word: string): string {
  const last = word.trim().slice(-1).charCodeAt(0);
  const hangul = last >= 0xac00 && last <= 0xd7a3;
  return hangul && (last - 0xac00) % 28 !== 0 ? '으로' : '로';
}

/** "버번 45ml" 에서 재료명을 뺀 나머지 = 용량 표기 */
function amountOf(raw: string, name: string): string {
  const rest = raw.startsWith(name) ? raw.slice(name.length).trim() : raw;
  return rest === name ? '' : rest;
}

/** 이 잔을 왜 골랐는지 — 추천에서 들어왔을 때만 보여준다(점수는 여기서만) */
function WhyPicked({ rec }: { rec: RecommendationResult }) {
  return (
    <>
      <div className="sechead in">추천 이유</div>
      <p className="hint" style={{ margin: 0 }}>{rec.reason}</p>
      <div className="subscores">
        <span className="ss">총점 <b>{rec.score}</b></span>
        <span className="ss">취향 <b>{rec.tasteScore}</b></span>
        <span className="ss">가용 <b>{rec.availabilityScore}</b></span>
        <span className="ss">재고 <b>{rec.inventoryScore}</b></span>
        <span className="ss">신선 <b>{rec.noveltyScore}</b></span>
      </div>
    </>
  );
}

/** 원형·변형 이동 */
function Variants({ ck }: { ck: Cocktail }) {
  const { openCocktail } = useUI();
  const parent = ck.variantOf ? referenceRepo.cocktailById(ck.variantOf) : undefined;
  const children = ck.variants
    .map((id) => referenceRepo.cocktailById(id))
    .filter((c): c is Cocktail => !!c)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  if (!parent && children.length === 0) return null;
  return (
    <div className="variants">
      {parent && (
        <div className="vrow">
          <span className="vlabel">원형</span>
          <div className="vlinks">
            <button className="vchip" onClick={() => openCocktail(parent.id)}>{parent.name}</button>
            {ck.variantNote && <p className="vnote">{ck.variantNote}</p>}
          </div>
        </div>
      )}
      {children.length > 0 && (
        <div className="vrow">
          <span className="vlabel">변형 {children.length}</span>
          <div className="vlinks">
            {children.map((c) => <button className="vchip" key={c.id} onClick={() => openCocktail(c.id)}>{c.name}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function CocktailDetail({ id }: { id: string }) {
  const { openLog, lastRec, openGuide } = useUI();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const [more, setMore] = useState(false);
  const ck = referenceRepo.cocktailById(id);
  if (!ck) return <div className="empty">레시피를 찾을 수 없어요.</div>;

  const ev = evaluateCocktail(ck, heldIds, subMap);
  const words = cocktailWords(ck);
  const abv = cocktailAbvLabel(ck);
  const rec = lastRec && lastRec.id === ck.id ? lastRec : null;

  return (
    <article className="detail">
      {/* ① 이름과 이미지 */}
      <h2 className="withmethod">{ck.name}<MethodIcon keys={ck.methodKeys} raw={ck.method} /></h2>
      <div className="art"><GlassArt cocktail={ck} size={120} /></div>

      {/* ② 맛 설명과 제조 가능 상태 */}
      <p className="taste">{words.join(' · ')}</p>
      <div className="meta">
        <span className="mi">{ck.base}</span>
        {IBA_PLAIN[ck.iba] && <span className="mi">{IBA_PLAIN[ck.iba]}</span>}
        {abv !== null && (
          <span className="mi" title="재료 양과 제품 라벨 도수로 계산한 값에 ±2%를 둔 폭이에요. 쓰는 제품과 얼음이 녹는 정도에 따라 달라져요.">
            도수 {abv}
          </span>
        )}
      </div>
      <div className={`state s-${ev.status}`}>
        {STATUS_LEAD_KO[ev.status]}{ev.lack.length > 0 && ` · 없는 재료: ${ev.lack.join(', ')}`}
      </div>

      {/* ③ 필요한 재료와 용량 */}
      <div className="sechead in">재료</div>
      <div className="recipe">
        {ck.ingredients.map((ing, i) => {
          const has = heldIds.has(ing.ingredientId);
          // 내가 가진 대체재로 채워지는 경우 — 무엇으로 바꾸는지까지 적는다
          const swapId = has ? undefined : (subMap.get(ing.ingredientId) ?? []).find((s) => heldIds.has(s));
          const swap = swapId ? referenceRepo.ingredientById(swapId)?.name : undefined;
          const off = !has && !swap && !ing.optional;
          return (
            <div className={`ing ${off ? 'off' : ''}`.trim()} key={i}>
              <span>
                {swap ? <s>{ing.ingredientName}</s> : ing.ingredientName}
                {swap && <span className="swap">→ {swap}{ro(swap)} 대체</span>}
                {!swap && ing.substitute && <span className="tag">대체 재료</span>}
                {off && <span className="lackmark">없음</span>}
                {ing.optional && <span className="opt">선택</span>}
              </span>
              <span className="amt">{amountOf(ing.raw, ing.ingredientName) || '적당량'}</span>
            </div>
          );
        })}
      </div>

      {/* ④ 만드는 방식 — DB 에 순서가 없으므로 조주 방식만 */}
      <div className="method">
        <span className="lb">만드는 법</span>
        <span>{ck.methodKeys.length ? `${ck.methodKeys.map((k) => METHOD_PLAIN_KO[k]).join(", ")} (${ck.method})` : ck.method}</span>
      </div>
      {/* 방법별 기본 순서 — 레시피마다 적은 글이 아니라 그 방법의 공통 순서다(머들은 잔마다 달라 뺐다) */}
      {ck.methodKeys.filter((k) => k !== 'muddle' && methodSteps(k).length > 0).slice(0, 2).map((k) => (
        <div className="steps" key={k}>
          <div className="stepshead">{METHOD_LABELS_KO[k]} 기본 순서</div>
          <ol>{methodSteps(k).map((t, i) => <li key={i}>{t.replace(/^\d\.\s*/, '')}</li>)}</ol>
        </div>
      ))}
      {ck.garnish && (
        <div className="garnish">
          <span className="gl">가니시</span><span className="gv">{ck.garnish}</span>
          {/* 있을 때만 알린다 — 없다고 매 잔마다 적지 않는다(가니시는 없어도 만들 수 있다) */}
          {garnishState(ck, heldIds) === 'all' && <span className="gnhave">있어요</span>}
        </div>
      )}
      <div className="guidelinks">
        <button onClick={() => openGuide('methods')}>만드는 방법</button>
        <button onClick={() => openGuide('units')}>단위 읽는 법</button>
        <button onClick={() => openGuide('garnish')}>가니시 준비</button>
        <button onClick={() => openGuide('glasses')}>잔</button>
      </div>

      {/* ⑥ 기록 */}
      <div className="btnrow">
        <button className="btn primary" onClick={() => openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' })}>
          이 잔 기록하기
        </button>
      </div>

      <Variants ck={ck} />

      {/* ⑦ 펼쳐보는 수치·분류·출처 */}
      <div className="more">
        <button onClick={() => setMore((v) => !v)} aria-expanded={more}>
          {more ? '향미 수치 · 분류 · 출처 접기' : '향미 수치 · 분류 · 출처 보기'}
        </button>
        {more && (
          <div className="inner">
            {rec && <WhyPicked rec={rec} />}
            {ck.note && <><div className="sechead in">메모</div><p className="hint">{ck.note}</p></>}
            <div className="sechead in">향미 프로파일</div>
            <FlavorBars vector={ck.flavor} compact />
            <div className="sechead in">분류</div>
            <div className="clstags">
              <Term label={ck.base} />
              <Term label={ck.iba} />
              {ck.methodKeys.map((k) => <Term key={k} label={METHOD_LABELS_KO[k]} />)}
            </div>
            {(ck.sourceName || ck.url) && (
              <>
                <div className="sechead in">출처</div>
                <p className="hint" style={{ margin: 0 }}>
                  {ck.url
                    ? <a href={ck.url} target="_blank" rel="noopener">{ck.sourceName ?? '원문 확인'} ↗</a>
                    : ck.sourceName}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
