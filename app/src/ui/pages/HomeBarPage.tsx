import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useInventory, inventoryRepo } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { resetInventoryToSeed } from '../../db/migrate';

const SPIRIT_CATS = ['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디', '리큐르', '비터·아페리티프', '베르무트·와인'];
const MIXER_CATS = ['주스·과즙', '탄산·음료', '시럽·감미', '신선·허브', '유제품·기타'];

type View = 'all' | 'spirit' | 'mixer';

export function HomeBarPage() {
  const inv = useInventory();
  const { toast } = useUI();
  const [view, setView] = useState<View>('all');
  const [showRemaining, setShowRemaining] = useState(false);

  const remainingById = useMemo(() => new Map((inv ?? []).map((i) => [i.ingredientId, i.remaining])), [inv]);
  const ownedById = useMemo(() => new Map((inv ?? []).map((i) => [i.ingredientId, i.owned])), [inv]);

  const cats = referenceRepo.categories().filter((c) =>
    view === 'all' ? true : view === 'spirit' ? SPIRIT_CATS.includes(c) : MIXER_CATS.includes(c));

  const allIngredients = referenceRepo.ingredients();

  return (
    <>
      <div className="controls strip">
        <button className="chip" aria-pressed={view === 'all'} onClick={() => setView('all')}>전체</button>
        <button className="chip" aria-pressed={view === 'spirit'} onClick={() => setView('spirit')}>술·리큐르</button>
        <button className="chip" aria-pressed={view === 'mixer'} onClick={() => setView('mixer')}>믹서·재료</button>
        <button className="chip" aria-pressed={showRemaining} onClick={() => setShowRemaining((v) => !v)}>잔량 표시</button>
      </div>
      <div className="btnrow">
        <button className="btn" onClick={async () => { await resetInventoryToSeed(); toast('기본 컬렉션으로 초기화'); }}>기본 컬렉션</button>
        <button className="btn" onClick={async () => { await inventoryRepo.setAll(true, allIngredients.map((i) => ({ id: i.id, name: i.name }))); toast('전부 보유'); }}>전부 보유</button>
        <button className="btn" onClick={async () => { await inventoryRepo.setAll(false, allIngredients.map((i) => ({ id: i.id, name: i.name }))); toast('전부 해제'); }}>전부 해제</button>
      </div>
      <div className="hint">체크한 재료만 보유로 계산되어 상단 판정이 즉시 갱신됩니다. IndexedDB 에 저장됩니다.</div>

      {cats.map((c) => {
        const items = allIngredients.filter((i) => i.category === c);
        if (!items.length) return null;
        return (
          <div className="grpbox" key={c}>
            <h4>{c}</h4>
            <div className="items">
              {items.map((i) => {
                const owned = ownedById.get(i.id) ?? false;
                const rem = remainingById.get(i.id) ?? (owned ? 100 : 0);
                return (
                  <label className={`it ${owned ? '' : 'off'}`} key={i.id} style={showRemaining && owned ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
                      <input type="checkbox" checked={owned} onChange={(e) => inventoryRepo.setOwned(i.id, i.name, e.target.checked)} />
                      <span>{i.name}</span><small>{i.usageCount}</small>
                    </div>
                    {showRemaining && owned && (
                      <div className="rem" onClick={(e) => e.preventDefault()}>
                        <input type="range" min={0} max={100} step={10} value={rem} onChange={(e) => inventoryRepo.setRemaining(i.id, +e.target.value)} />
                        <b>{rem}%</b>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
