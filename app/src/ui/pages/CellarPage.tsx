/**
 * CellarPage — '내 술장'. 무엇을 얼마나 갖고 있는지 관리하는 곳이다.
 *
 * 모든 화면 위에 붙어 있던 통계('정규·근사·불가·보유재료')를 여기로 옮겼다.
 * 개별 제품(병)과 표준 재료는 서로 다른 집계라 한 줄에 섞지 않고 나눠 적는다.
 * 제품 소개는 위스키 화면이 맡고, 여기서는 보유 수량·용량·잔량·재료 연결만 다룬다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useBottles, useHeldIds, useSubMap, useInventory, inventoryRepo } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateAll, tallyStatus } from '../../services/availabilityService';
import { bottleService } from '../../services/bottleService';
import { resetInventoryToSeed } from '../../db/migrate';
import { isUserBottle } from '../../data/userBottles';
import { bottleKindLabel } from '../../data/bottleIngredients';
import { ChipRow, ChipToggle, SearchBox, BottleBadges, type ChipOption } from '../components/common';
import { normalize, hits, useGroupChips } from '../listUtils';
import { IS_PUBLIC } from '../../config';
import { type Bottle } from '../../models/types';

type Sub = 'bottles' | 'stock';
const SUBS: ChipOption<Sub>[] = [{ v: 'bottles', label: '보유 술' }, { v: 'stock', label: '재료 재고' }];

export function CellarPage() {
  const [sub, setSub] = useState<Sub>('bottles');
  const bottles = useBottles();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const tally = useMemo(() => tallyStatus(evaluateAll(heldIds, subMap)), [heldIds, subMap]);
  const totalIngredients = referenceRepo.ingredients().length;

  return (
    <>
      <h2 className="pagetitle">내 술장</h2>

      {/* 두 가지 집계를 나눠 적는다 — 병 수와 재료 수는 다른 것이다 */}
      <div className="statline">
        <div className="cell"><b>{bottles.length}</b><small>보유 제품(병)</small></div>
        <div className="cell"><b>{heldIds.size}<small style={{ fontSize: 14 }}> / {totalIngredients}</small></b><small>표준 재료</small></div>
        <div className="cell ok"><b>{tally.READY}</b><small>그대로 만들 수 있는 레시피</small></div>
        <div className="cell alt"><b>{tally.SUBSTITUTE}</b><small>대체로 가능</small></div>
        <div className="cell"><b>{tally.MISSING + tally.UNAVAILABLE}</b><small>재료 부족</small></div>
      </div>

      <ChipRow value={sub} onChange={setSub} options={SUBS} />
      {sub === 'bottles' ? <BottleList bottles={bottles} /> : <StockManager />}
    </>
  );
}

/** 보유 술 — 비교하기 쉬운 정렬된 행. 저장된 값만 적는다(없는 항목은 비워 둔다). */
function BottleList({ bottles }: { bottles: Bottle[] }) {
  const { openAdd, openBottle, toast } = useUI();
  const heldIds = useHeldIds();
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const groups = useGroupChips(bottles, (b) => b.group);

  const rows = useMemo(() => {
    const t = normalize(q);
    return bottles
      .filter((b) => (grp === 'all' || b.group === grp) && hits(t, b.name, b.group, b.abv))
      .sort((a, b) => a.group.localeCompare(b.group, 'ko') || a.name.localeCompare(b.name, 'ko'));
  }, [bottles, q, grp]);

  return (
    <>
      <div className="btnrow">
        <button className="btn primary" onClick={() => openAdd()}>술 추가</button>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder="내 술 이름 검색" />
      <ChipRow value={grp} options={groups} onChange={setGrp} wrap />
      {rows.length === 0 && (
        <div className="empty">
          {q.trim() ? '검색 결과가 없습니다.' : '아직 등록한 술이 없습니다. 위의 술 추가로 시작하세요.'}
        </div>
      )}
      <div className="rowlist">
        {rows.map((b) => {
          const linked = b.ingredientIds
            .map((id) => referenceRepo.ingredientById(id))
            .filter((x): x is NonNullable<typeof x> => !!x);
          return (
            <div className="kvrow" key={b.id}>
              <div>
                <button className="full" onClick={() => openBottle(b.id)}>
                  <span className="nm">{b.name}</span>
                  <div className="meta">
                    <span className="mi">{bottleKindLabel(b)}</span>
                    {b.abv && <span className="mi">{b.abv}</span>}
                    {b.volumeMl ? <span className="mi">{b.volumeMl}ml</span> : null}
                    {linked.map((i) => (
                      <span className={`mi ${heldIds.has(i.id) ? 'on' : ''}`} key={i.id}>재료 {i.name}</span>
                    ))}
                  </div>
                  <BottleBadges badges={b.badges} />
                </button>
              </div>
              <div className="num">
                {b.qty > 1 ? `${b.qty}병` : '1병'}
                {isUserBottle(b.id) && (
                  <div><button className="btn sm ghost" onClick={async () => { await bottleService.remove(b.id); toast('삭제됨'); }}>삭제</button></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint">항목을 누르면 위스키 화면의 상세(맛·공식 노트)로 갑니다. 수량·용량은 저장된 값이며, 없는 항목은 비워 둡니다.</p>
    </>
  );
}

const SPIRIT_CATS = ['위스키', '진', '보드카', '럼', '데킬라·아가베', '브랜디', '리큐르', '비터·아페리티프', '베르무트·와인'];
const MIXER_CATS = ['주스·과즙', '탄산·음료', '시럽·감미', '신선·허브', '유제품·기타'];

type View = 'all' | 'spirit' | 'mixer';
type Own = 'all' | 'owned' | 'missing';
const OWN_FILTERS: ChipOption<Own>[] = [
  { v: 'all', label: '전체' }, { v: 'owned', label: '보유만', cls: 'ok' }, { v: 'missing', label: '미보유만' },
];

/** 재료 재고 — 레시피 판정에 직접 쓰이는 표준 재료의 보유·잔량 */
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
  const bottlesByIngredient = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const b of bottles) for (const id of b.ingredientIds) m.set(id, [...(m.get(id) ?? []), b.name]);
    return m;
  }, [bottles]);
  const ownedCount = allIngredients.filter((i) => ownedById.get(i.id)).length;

  const cats = referenceRepo.categories().filter((c) =>
    view === 'all' ? true : view === 'spirit' ? SPIRIT_CATS.includes(c) : MIXER_CATS.includes(c));
  const visible = (i: { id: string }) => {
    const isOwned = ownedById.get(i.id) ?? false;
    return own === 'all' || (own === 'owned' ? isOwned : !isOwned);
  };

  return (
    <>
      <p className="hint">
        레시피 판정은 <b>표준 재료</b>로 합니다. 체크한 재료만 보유로 계산되고, 위 숫자가 즉시 바뀝니다.
        현재 {ownedCount}/{allIngredients.length}종.
      </p>
      <ChipRow value={own} onChange={setOwn} options={OWN_FILTERS} wrap />
      <div className="controls tight">
        <ChipToggle label="술·리큐르" on={view === 'spirit'} onToggle={() => setView(view === 'spirit' ? 'all' : 'spirit')} />
        <ChipToggle label="믹서·재료" on={view === 'mixer'} onToggle={() => setView(view === 'mixer' ? 'all' : 'mixer')} />
        <ChipToggle label="잔량 표시" on={showRemaining} onToggle={() => setShowRemaining((v) => !v)} />
      </div>

      {confirmReset ? (
        <div className="confirm">
          <p>보유 재료를 <b>전부 해제</b>합니다. 지금 켜져 있는 {ownedCount}종이 모두 꺼집니다.</p>
          <p className="sub">음용 기록·취향·추가한 술은 지워지지 않습니다.</p>
          <div className="btnrow">
            <button className="btn danger" onClick={async () => {
              await inventoryRepo.setAll(false, allIngredients.map((i) => ({ id: i.id, name: i.name })));
              setConfirmReset(false); setOwn('all'); toast('보유재료를 비웠습니다');
            }}>비우기</button>
            <button className="btn" onClick={() => setConfirmReset(false)}>취소</button>
          </div>
        </div>
      ) : (
        <div className="btnrow">
          <button className="btn sm" onClick={() => setConfirmReset(true)}>보유재료 초기화</button>
          <button className="btn sm" onClick={async () => { await resetInventoryToSeed(); toast(IS_PUBLIC ? '기본 홈바 세트로 되돌림' : '기본 컬렉션으로 되돌림'); }}>
            {IS_PUBLIC ? '기본 홈바 세트' : '기본 컬렉션'}
          </button>
          <button className="btn sm" onClick={async () => { await inventoryRepo.setAll(true, allIngredients.map((i) => ({ id: i.id, name: i.name }))); toast('전부 보유'); }}>전부 보유</button>
        </div>
      )}

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
                  <label className={`it ${owned ? '' : 'off'}`} key={i.id}
                    style={showRemaining && owned ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <input type="checkbox" checked={owned} onChange={(e) => inventoryRepo.setOwned(i.id, i.name, e.target.checked)} />
                      <span>
                        {i.name}
                        {mine.length > 0 && <b className="bmine">{mine.slice(0, 2).join(' · ')}{mine.length > 2 ? ` 외 ${mine.length - 2}` : ''}</b>}
                      </span>
                      <small>{i.usageCount}</small>
                    </div>
                    {showRemaining && owned && (
                      <div className="rem" onClick={(e) => e.preventDefault()}>
                        <input type="range" min={0} max={100} step={10} value={rem}
                          onChange={(e) => inventoryRepo.setRemaining(i.id, +e.target.value)} />
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
