import { useMemo } from 'react';
import { useHeldIds, inventoryRepo } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { ingredientIdOf } from '../../data/adapters';
import { GARNISH_STOCK, garnishUsage } from '../../services/garnishStock';

/** 재료에도 있는 가니시 — 같은 체크를 쓴다 */
const SHARED_ROWS = ['민트 잎', '칵테일 어니언'];

/**
 * 술장 › 재료 재고 맨 아래의 '가니시' 묶음.
 * 여기 체크는 만들 수 있는 잔 수를 바꾸지 않는다. 레시피에 '가니시까지 있어요'만 붙인다.
 */
export function GarnishStockBox({ own }: { own: 'all' | 'owned' | 'missing' }) {
  const held = useHeldIds();
  const usage = useMemo(() => garnishUsage(referenceRepo.cocktails()), []);
  const rows = [
    ...GARNISH_STOCK.map((g) => ({ id: g.id, name: g.name, hint: g.hint, shared: false })),
    ...SHARED_ROWS.map((n) => ({ id: ingredientIdOf(n), name: n, hint: '', shared: true })),
  ].filter((r) => own === 'all' || (own === 'owned' ? held.has(r.id) : !held.has(r.id)));
  if (!rows.length) return null;

  return (
    <div className="grpbox garnishbox">
      <h4>가니시 <small>{rows.filter((r) => held.has(r.id)).length}/{rows.length}</small></h4>
      <div className="items">
        {rows.map((r) => {
          const owned = held.has(r.id);
          return (
            <label className={`it ${owned ? '' : 'off'}`} key={r.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <input type="checkbox" checked={owned} onChange={(e) => inventoryRepo.setOwned(r.id, r.name, e.target.checked)} />
                <span>
                  {r.name}
                  {r.hint && ` (${r.hint})`}
                </span>
                <small>{usage.get(r.id) ?? 0}</small>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
