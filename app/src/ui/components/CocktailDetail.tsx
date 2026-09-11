/**
 * CocktailDetail — 한 잔의 상세. PC 는 목록 옆, 모바일은 화면 전체에서 같은 컴포넌트를 쓴다.
 *
 * 읽는 순서를 데이터가 아니라 행동에 맞췄다:
 *   이름·이미지 → 맛과 제조 가능 상태 → 재료와 용량 → 조주 방식 → 대체·부족 → 기록하기 → (펼침) 수치·분류·출처.
 * 만드는 순서는 DB 에 없다. 지어내지 않고 원문 조주 방식만 적는다.
 */
import { useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail, STATUS_LEAD_KO } from '../../services/availabilityService';
import { flavorWords } from '../../services/flavorService';
import { FlavorBars, MethodIcon, Term } from './common';
import { GlassArt } from './GlassArt';
import { type Cocktail, type RecommendationResult } from '../../models/types';

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
  const { openLog, lastRec } = useUI();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const [more, setMore] = useState(false);
  const ck = referenceRepo.cocktailById(id);
  if (!ck) return <div className="empty">레시피를 찾을 수 없습니다.</div>;

  const ev = evaluateCocktail(ck, heldIds, subMap);
  const words = flavorWords(ck.flavor);
  const rec = lastRec && lastRec.id === ck.id ? lastRec : null;

  return (
    <article className="detail">
      {/* ① 이름과 이미지 */}
      <h2 className="withmethod">{ck.name}<MethodIcon keys={ck.methodKeys} raw={ck.method} /></h2>
      <div className="art"><GlassArt cocktail={ck} size={120} /></div>

      {/* ② 맛 설명과 제조 가능 상태 */}
      <p className="taste">{words.join(' · ')}{ck.note ? ` — ${ck.note}` : ''}</p>
      <div className="meta">
        <span className="mi">{ck.base}</span>
        <span className="mi">{ck.method}</span>
        <span className="mi">{ck.iba}</span>
      </div>
      <div className={`state s-${ev.status}`}>{STATUS_LEAD_KO[ev.status]}</div>

      {/* ③ 필요한 재료와 용량 */}
      <div className="sechead in">재료</div>
      <div className="recipe">
        {ck.ingredients.map((ing, i) => {
          const has = heldIds.has(ing.ingredientId);
          const bySub = !has && (subMap.get(ing.ingredientId) ?? []).some((s) => heldIds.has(s));
          const off = !has && !bySub && !ing.optional;
          return (
            <div className={`ing ${off ? 'off' : ''}`.trim()} key={i}>
              <span>
                {ing.ingredientName}
                {(ing.substitute || bySub) && <span className="tag">대체 재료로 가능</span>}
                {ing.optional && <span className="opt">선택</span>}
              </span>
              <span className="amt">{amountOf(ing.raw, ing.ingredientName) || '적당량'}</span>
            </div>
          );
        })}
      </div>

      {/* ④ 만드는 방식 — DB 에 순서가 없으므로 조주 방식만 */}
      <div className="method">
        <span className="lb">조주</span>
        <span>{ck.method}</span>
      </div>
      {ck.garnish && (
        <div className="garnish"><span className="gl">가니시</span><span className="gv">{ck.garnish}</span></div>
      )}

      {/* ⑤ 대체·부족 */}
      {(ev.lack.length > 0 || ev.sub.length > 0) && (
        <div className="shortage">
          <h4>{ev.lack.length > 0 ? '지금 없는 재료' : '대체 재료로 채우는 것'}</h4>
          <ul>
            {ev.lack.map((n) => <li key={n}>{n}</li>)}
            {ev.sub.map((n) => <li className="s" key={n}>{n} — 대체 재료로 가능</li>)}
          </ul>
        </div>
      )}

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
            <div className="sechead in">향미 프로파일</div>
            <FlavorBars vector={ck.flavor} compact />
            <div className="sechead in">분류</div>
            <div className="clstags">
              <Term label={ck.base} />
              <Term label={ck.iba} />
              {ck.methodKeys.map((k) => <Term key={k} label={k} />)}
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
