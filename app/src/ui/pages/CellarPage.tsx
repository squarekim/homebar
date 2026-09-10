/**
 * CellarPage — 내 술장.
 * [내 술] 실제로 가진 병 목록, [재고] 표준 재료 보유 관리.
 * 둘은 같은 것을 다른 각도에서 본다: 병 → 표준 재료 → 레시피 판정.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useInventory, useBottles, inventoryRepo } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { resetInventoryToSeed } from '../../db/migrate';
import { MyBottlesBrowser } from '../components/browsers';
import { IS_PUBLIC } from '../../config';

export type CellarSub = 'bottles' | 'stock';

export function CellarPage({ sub: subProp, onSub }: { sub?: CellarSub; onSub?: (s: CellarSub) => void } = {}) {
  const [local, setLocal] = useState<CellarSub>('bottles');
  const sub = subProp ?? local;
  const setSub = (s: CellarSub) => { setLocal(s); onSub?.(s); };
  return (
    <>
      <div className="controls strip">
        <button className="chip" aria-pressed={sub === 'bottles'} onClick={() => setSub('bottles')}>내 술</button>
        <button className="chip" aria-pressed={sub === 'stock'} onClick={() => setSub('stock')}>재고</button>
      </div>
      {sub === 'bottles' && <MyBottlesBrowser />}
      {sub === 'stock' && <StockManager />}
    </>
  );
}

const SPIRIT_CATS = ['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디', '리큐르', '비터·아페리티프', '베르무트·와인'];
const MIXER_CATS = ['주스·과즙', '탄산·음료', '시럽·감미', '신선·허브', '유제품·기타'];

type View = 'all' | 'spirit' | 'mixer';
type Own = 'all' | 'owned' | 'missing';

/**
 * StockManager — 내 보유 재료를 보고 고치는 곳.
 * 상단에 보유 현황을 먼저 보여주고, '보유만'으로 좁혀 볼 수 있다.
 * '보유재료 초기화'는 남의 재고(베타 기본값)를 비우고 내 것부터 채우기 위한 출발점이다.
 */
function StockManager() {
  const inv = useInventory();
  const { toast } = useUI();
  const [view, setView] = useState<View>('all');
  const [own, setOwn] = useState<Own>('all');
  const [showRemaining, setShowRemaining] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const remainingById = useMemo(() => new Map((inv ?? []).map((i) => [i.ingredientId, i.remaining])), [inv]);
  const ownedById = useMemo(() => new Map((inv ?? []).map((i) => [i.ingredientId, i.owned])), [inv]);

  const allIngredients = referenceRepo.ingredients();
  const bottles = useBottles();
  /** 재료 ID → 그 재료를 충당하는 내 병 이름들 ("데킬라"가 어떤 술인지 바로 보이게) */
  const bottlesByIngredient = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const b of bottles) for (const id of b.ingredientIds) m.set(id, [...(m.get(id) ?? []), b.name]);
    return m;
  }, [bottles]);
  const ownedCount = allIngredients.filter((i) => ownedById.get(i.id)).length;

  const perCategory = useMemo(() => referenceRepo.categories().map((c) => {
    const items = allIngredients.filter((i) => i.category === c);
    return { cat: c, owned: items.filter((i) => ownedById.get(i.id)).length, total: items.length };
  }), [allIngredients, ownedById]);

  const cats = referenceRepo.categories().filter((c) =>
    view === 'all' ? true : view === 'spirit' ? SPIRIT_CATS.includes(c) : MIXER_CATS.includes(c));

  const visible = (i: { id: string }) => {
    const isOwned = ownedById.get(i.id) ?? false;
    return own === 'all' || (own === 'owned' ? isOwned : !isOwned);
  };

  return (
    <>
      <div className="stockhead">
        <div className="sh-top">
          <b>{ownedCount}</b><span>/ {allIngredients.length}종 보유</span>
        </div>
        <div className="sh-cats">
          {perCategory.filter((p) => p.owned > 0).map((p) => (
            <span className="sh-cat" key={p.cat}>{p.cat} <b>{p.owned}</b><small>/{p.total}</small></span>
          ))}
          {ownedCount === 0 && <span className="sh-empty">아직 체크한 재료가 없습니다. 아래에서 집에 있는 것만 켜세요.</span>}
        </div>
      </div>

      <div className="controls">
        <button className="chip" aria-pressed={own === 'all'} onClick={() => setOwn('all')}>전체</button>
        <button className="chip ok" aria-pressed={own === 'owned'} onClick={() => setOwn('owned')}>보유만</button>
        <button className="chip" aria-pressed={own === 'missing'} onClick={() => setOwn('missing')}>미보유만</button>
      </div>
      <div className="controls" style={{ paddingTop: 0 }}>
        <button className="chip" aria-pressed={view === 'spirit'} onClick={() => setView(view === 'spirit' ? 'all' : 'spirit')}>술·리큐르</button>
        <button className="chip" aria-pressed={view === 'mixer'} onClick={() => setView(view === 'mixer' ? 'all' : 'mixer')}>믹서·재료</button>
        <button className="chip" aria-pressed={showRemaining} onClick={() => setShowRemaining((v) => !v)}>잔량 표시</button>
      </div>

      {confirmReset ? (
        <div className="confirm">
          <p>보유 재료를 <b>전부 해제</b>합니다. 지금 켜져 있는 {ownedCount}종이 모두 꺼지고, 이후 내 것만 체크해 채우면 됩니다.</p>
          <p className="sub">음용 기록·취향·추가한 술은 지워지지 않습니다.</p>
          <div className="btnrow">
            <button className="btn danger" onClick={async () => {
              await inventoryRepo.setAll(false, allIngredients.map((i) => ({ id: i.id, name: i.name })));
              setConfirmReset(false); setOwn('all'); toast('보유재료를 비웠습니다');
            }}>비우기
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)}>취소</button>
          </div>
        </div>
      ) : (
        <div className="btnrow">
          <button className="btn" onClick={() => setConfirmReset(true)}>보유재료 초기화</button>
          <button className="btn" onClick={async () => { await resetInventoryToSeed(); toast(IS_PUBLIC ? '기본 홈바 세트로 되돌림' : '기본 컬렉션으로 되돌림'); }}>{IS_PUBLIC ? '기본 홈바 세트' : '기본 컬렉션'}</button>
          <button className="btn" onClick={async () => { await inventoryRepo.setAll(true, allIngredients.map((i) => ({ id: i.id, name: i.name }))); toast('전부 보유'); }}>전부 보유</button>
        </div>
      )}
      <div className="hint">체크한 재료만 보유로 계산되어 상단 판정이 즉시 갱신됩니다. 이 브라우저에만 저장됩니다.</div>

      {cats.map((c) => {
        const items = allIngredients.filter((i) => i.category === c).filter(visible);
        if (!items.length) return null;
        return (
          <div className="grpbox" key={c}>
            <h4>{c} <small>{items.filter((i) => ownedById.get(i.id)).length}/{items.length}</small></h4>
            <div className="items">
              {items.map((i) => {
                const owned = ownedById.get(i.id) ?? false;
                const rem = remainingById.get(i.id) ?? (owned ? 100 : 0);
                const mine = bottlesByIngredient.get(i.id) ?? [];
                return (
                  <label className={`it ${owned ? '' : 'off'}`} key={i.id} style={showRemaining && owned ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
                      <input type="checkbox" checked={owned} onChange={(e) => inventoryRepo.setOwned(i.id, i.name, e.target.checked)} />
                      <span>
                        {i.name}
                        {mine.length > 0 && <b className="bmine">{mine.slice(0, 2).join(' · ')}{mine.length > 2 ? ` 외 ${mine.length - 2}` : ''}</b>}
                      </span>
                      <small>{i.usageCount}</small>
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
