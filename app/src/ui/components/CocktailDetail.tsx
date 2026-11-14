/**
 * CocktailDetail — 한 잔의 상세. PC 는 목록 옆, 모바일은 화면 전체에서 같은 컴포넌트를 쓴다.
 *
 * 읽는 순서를 데이터가 아니라 행동에 맞췄다:
 *   이름·이미지 → 맛과 제조 가능 상태(없는 재료 이름까지) → 재료와 용량(없는 줄에 표시) → 만드는 법 → 기록하기 → (펼침) 수치·분류·출처.
 * 만드는 순서는 DB 에 없다. 지어내지 않고 원문 조주 방식만 적는다.
 */
import { cocktailWords } from '../../services/tasteWords';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { garnishState } from '../../services/garnishStock';
import { cocktailAbvLabel } from '../../services/cocktailStrength';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail, STATUS_LEAD_KO } from '../../services/availabilityService';
import { FlavorBars, Term } from './common';
import { GlassArt } from './GlassArt';
import { glassOf, GLASS_LABEL_KO } from '../../data/drinkVisual';
import { methodSteps } from '../../data/beginnerGuide';
import { METHOD_LABELS_KO, type Cocktail, type RecommendationResult } from '../../models/types';

/** 받침이 있으면 '으로', 없으면 '로' — 레몬즙으로 / 코앵트로로 */
function ro(word: string): string {
  const last = word.trim().slice(-1).charCodeAt(0);
  const hangul = last >= 0xac00 && last <= 0xd7a3;
  return hangul && (last - 0xac00) % 28 !== 0 ? '으로' : '로';
}

/** "버번 45ml" 에서 재료명을 뺀 나머지 = 용량 표기 */
export function amountOf(raw: string, name: string): string {
  const rest = raw.startsWith(name) ? raw.slice(name.length).trim() : raw;
  return rest === name ? '' : rest;
}

/** 제조 요소 한 줄 — 기주 · 도수 · 기법 · 글라스 · 가니시. 메인 스펙 시트도 같은 줄을 쓴다 */
export function cocktailSpecLine(ck: Cocktail): string {
  const abv = cocktailAbvLabel(ck);
  return [
    `기주 ${ck.base}`,
    abv && `도수 ${abv}`,
    ck.methodKeys.map((k) => METHOD_LABELS_KO[k]).join('·'),
    GLASS_LABEL_KO[glassOf(ck)],
    ck.garnish,
  ].filter(Boolean).join(' · ');
}

/** 이 잔을 왜 골랐는지 — 추천에서 들어왔을 때만, 이유 한 줄(점수 칸은 두지 않는다) */
function WhyPicked({ rec }: { rec: RecommendationResult }) {
  return <p>추천 이유 · {rec.reason}</p>;
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
  const ck = referenceRepo.cocktailById(id);
  if (!ck) return <div className="empty">레시피를 찾을 수 없어요.</div>;

  const ev = evaluateCocktail(ck, heldIds, subMap);
  const words = cocktailWords(ck);
  const rec = lastRec && lastRec.id === ck.id ? lastRec : null;

  return (
    <article className="detail">
      {/* ① 이름 · 제조 요소 한 줄 · 이미지 */}
      <h2>{ck.name}</h2>
      {ck.nameEn && <p className="sub en">{ck.nameEn}</p>}
      <p className="specline">
        {cocktailSpecLine(ck)}
        {/* 가니시까지 갖췄을 때만 알린다(가니시는 없어도 만들 수 있다) */}
        {garnishState(ck, heldIds) === 'all' && <span className="gnhave">가니시 있음</span>}
      </p>
      <div className="art"><GlassArt cocktail={ck} size={120} /></div>

      {/* ② 맛 설명과 제조 가능 상태 */}
      <p className="taste">{words.join(' · ')}</p>
      <div className={`state s-${ev.status}`}>
        {STATUS_LEAD_KO[ev.status]}{ev.lack.length > 0 && ` · 없는 재료: ${ev.lack.join(', ')}`}
      </div>

      {/* ③ 재료와 맛 프로필 — 넓으면 나란히, 좁으면 위아래 */}
      <div className="dgrid">
        <div>
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
        </div>
        <div>
          <div className="sechead in">맛 프로필</div>
          <FlavorBars vector={ck.flavor} compact />
        </div>
      </div>

      {/* ④ 만드는 방식 — 방법별 공통 순서(머들은 잔마다 달라 뺐다) */}
      {ck.methodKeys.filter((k) => k !== 'muddle' && methodSteps(k).length > 0).slice(0, 2).map((k) => (
        <div className="steps" key={k}>
          <div className="stepshead">{METHOD_LABELS_KO[k]}</div>
          <ol>{methodSteps(k).map((t, i) => <li key={i}>{t}</li>)}</ol>
        </div>
      ))}

      {/* ⑤ 기록 */}
      <div className="btnrow">
        <button className="btn primary" onClick={() => openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' })}>
          이 잔 기록하기
        </button>
      </div>

      <Variants ck={ck} />

      {/* ⑥ 각주 — 분류 · 출처 */}
      <footer className="dfoot">
        {rec && <WhyPicked rec={rec} />}
        {ck.note && <p>{ck.note}</p>}
        <div className="clstags">
          <Term label={ck.base} />
          <Term label={ck.iba} />
          {ck.methodKeys.map((k) => <Term key={k} label={METHOD_LABELS_KO[k]} />)}
        </div>
        <p>원문 조주법 {ck.method}{(ck.sourceName || ck.url) && <> · 출처 {ck.url
          ? <a href={ck.url} target="_blank" rel="noopener">{ck.sourceName ?? '원문'} ↗</a>
          : ck.sourceName}</>}</p>
      </footer>
    </article>
  );
}
