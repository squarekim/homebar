import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail, STATUS_LABEL_KO } from '../../services/availabilityService';
import { FlavorBars } from './common';

export function CocktailModal() {
  const { cocktailId, closeCocktail, openLog } = useUI();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const ck = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;

  const on = !!ck;
  const ev = ck ? evaluateCocktail(ck, heldIds, subMap) : null;

  return (
    <>
      <div className={`scrim ${on ? 'on' : ''}`} onClick={closeCocktail} />
      <div className={`modal ${on ? 'on' : ''}`} role="dialog" aria-modal="true">
        {ck && ev && (
          <>
            <button className="close" onClick={closeCocktail} aria-label="닫기">×</button>
            <h2>{ck.name}</h2>
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
            <div className="sechead">향미 프로파일</div>
            <FlavorBars vector={ck.flavor} compact />
            {(ck.note || ck.url) && (
              <div className="blk">
                {ck.note}
                {ck.url && <><br /><a href={ck.url} target="_blank" rel="noopener">출처 확인 →</a></>}
              </div>
            )}
            <div className="btnrow">
              <button className="btn primary" onClick={() => { openLog({ drinkId: ck.id, drinkType: 'cocktail', drinkName: ck.name, servingStyle: 'cocktail' }); closeCocktail(); }}>
                이 잔 기록하기
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
