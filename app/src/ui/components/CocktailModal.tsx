import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail, STATUS_LABEL_KO } from '../../services/availabilityService';
import { FlavorBars, MethodIcon, Modal } from './common';
import { type Cocktail } from '../../models/types';

/**
 * 변형 레시피 — 이 잔이 어느 레시피를 비틀어 만든 것인지, 그리고
 * 이 잔을 원형으로 하는 변형에는 뭐가 있는지. 눌러서 바로 넘어간다.
 */
function VariantLinks({ ck }: { ck: Cocktail }) {
  const { openCocktail } = useUI();
  const parent = ck.variantOf ? referenceRepo.cocktailById(ck.variantOf) : undefined;
  const children = ck.variants
    .map((id) => referenceRepo.cocktailById(id))
    .filter((c): c is Cocktail => !!c)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  if (!parent && !children.length) return null;
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
            {children.map((c) => (
              <button className="vchip" key={c.id} onClick={() => openCocktail(c.id)}>{c.name}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CocktailModal() {
  const { cocktailId, closeCocktail, openLog } = useUI();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const ck = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;

  const on = !!ck;
  const ev = ck ? evaluateCocktail(ck, heldIds, subMap) : null;

  return (
    <Modal open={on} onClose={closeCocktail}>
      {ck && ev && (
        <>
          <h2 className="withmethod">{ck.name}<MethodIcon keys={ck.methodKeys} raw={ck.method} /></h2>
          <div className="sub">
            <span className="mi">{ck.base}</span>
            <span className="mi">{ck.method}</span>
            <span className="mi">{ck.iba}</span>
          </div>
          <div className={`verdict v${ev.status}`}>{STATUS_LABEL_KO[ev.status]}</div>
          <div>
            {ck.ingredients.map((ing, idx) => {
              const has = heldIds.has(ing.ingredientId);
              const bySub = !has && (subMap.get(ing.ingredientId) ?? []).some((s) => heldIds.has(s));
              const mark = ing.optional ? '○' : has ? (ing.substitute ? '◐' : '●') : bySub ? '◐' : '✕';
              const color = ing.optional ? 'var(--dim)' : (has || bySub) ? (ing.substitute || bySub ? 'var(--mid)' : 'var(--ok)') : 'var(--no)';
              return (
                <div className="ing" key={idx}>
                  <i style={{ color }}>{mark}</i>
                  <div className={!has && !bySub && !ing.optional ? 'no' : ''}>
                    {ing.raw}
                    {(ing.substitute || bySub) && <span className="tag">대체 조주</span>}
                    {ing.optional && <span className="opt">선택</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {ck.garnish && (
            <div className="garnish">
              <span className="gl">가니시</span>
              <span className="gv">{ck.garnish}</span>
            </div>
          )}
          <div className="sechead">향미 프로파일</div>
          <FlavorBars vector={ck.flavor} compact />
          <VariantLinks ck={ck} />
          {(ck.note || ck.url || ck.sourceName) && (
            <div className="blk">
              {ck.note}
              {(ck.url || ck.sourceName) && (
                <div className="src">
                  {ck.url
                    ? <a href={ck.url} target="_blank" rel="noopener">출처: {ck.sourceName ?? '원문 확인'} ↗</a>
                    : <span>출처: {ck.sourceName}</span>}
                </div>
              )}
            </div>
          )}
          <div className="btnrow">
            <button className="btn primary" onClick={() => { openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' }); closeCocktail(); }}>
              이 잔 기록하기
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
