import { useMemo } from 'react';
import { useHeldIds, inventoryRepo } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { ingredientIdOf } from '../../data/adapters';
import { GARNISH_STOCK, garnishUsage } from '../../services/garnishStock';
import { useUI } from '../UIContext';

/** 재료에도 있는 가니시 — 같은 체크를 쓴다 */
const SHARED_ROWS = ['민트 잎', '칵테일 어니언'];

/**
 * 술장 › 재료 재고 맨 아래의 '가니시' 묶음.
 * 여기 체크는 만들 수 있는 잔 수를 바꾸지 않는다. 레시피에 '가니시까지 있어요'만 붙인다.
 */
export function GarnishStockBox({ own }: { own: 'all' | 'owned' | 'missing' }) {
  const held = useHeldIds();
  const { openGuide } = useUI();
  const usage = useMemo(() => garnishUsage(referenceRepo.cocktails()), []);
  const rows = [
    ...GARNISH_STOCK.map((g) => ({ id: g.id, name: g.name, hint: g.hint, shared: false })),
    ...SHARED_ROWS.map((n) => ({ id: ingredientIdOf(n), name: n, hint: '재료 체크와 같이 바뀌어요.', shared: true })),
  ].filter((r) => own === 'all' || (own === 'owned' ? held.has(r.id) : !held.has(r.id)));
  if (!rows.length) return null;

  return (
    <div className="grpbox garnishbox">
      <h4>가니시 <small>{rows.filter((r) => held.has(r.id)).length}/{rows.length}</small></h4>
      <p className="hint">
        가니시가 있든 없든 음료를 만드는 데는 문제가 없어요. 중요한 손님이 온다면 올리는 편이 더 먹음직스러워요.
        체크해 두면 레시피에 <b>가니시까지 있어요</b>가 붙어요. 만들 수 있는 잔 수는 바뀌지 않아요.
      </p>
      <p className="hint">
        생과일을 늘 챙기기 어렵다면 말린 레몬·라임·오렌지 칩으로 슬라이스를 대신할 수 있어요.
        말린 칩은 보기 좋게 해 주지만 향이나 오일은 더하지 않아요. 그래서 사제락, 베스퍼, 불바디에처럼
        껍질을 비틀어 오일을 뿌리는 잔에는 생과일 껍질이 있어야 해요.{' '}
        <button className="lnk" onClick={() => openGuide('garnish')}>가니시 준비</button>
      </p>
      <div className="items">
        {rows.map((r) => {
          const owned = held.has(r.id);
          return (
            <label className={`it ${owned ? '' : 'off'}`} key={r.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <input type="checkbox" checked={owned} onChange={(e) => inventoryRepo.setOwned(r.id, r.name, e.target.checked)} />
                <span>
                  {r.name}
                  {r.hint && <b className="bmine">{r.hint}</b>}
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
