/**
 * 추천 화면 조각들 — 홈 탭의 서브탭에서 쓰인다.
 * (독립 '추천' 탭은 홈과 내용이 겹쳐 홈 안으로 합쳤다)
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useTasteProfiles, useHeldIds, useSubMap, useLogs } from '../../hooks/useData';
import { recommendCocktails, recommendWhiskies, RecommendMode } from '../../services/recommendationService';
import { recommendGroupCocktails } from '../../services/groupService';
import { calculatePurchases } from '../../services/purchaseService';
import { RecCard, ChipRow } from '../components/common';

/** 기분별 추천 모드 — 홈의 '오늘'과 칵테일 추천이 함께 쓴다 */
export const MODES: { v: RecommendMode; label: string }[] = [
  { v: 'available', label: '있는 재료만' },
  { v: 'sweet', label: '달달한' },
  { v: 'refreshing', label: '상큼한' },
  { v: 'strong', label: '강한' },
  { v: 'light', label: '가벼운' },
  { v: 'whisky', label: '위스키' },
];

export function CocktailRec() {
  const ctx = useRecommendContext();
  const { openCocktail } = useUI();
  const [mode, setMode] = useState<RecommendMode>('available');
  const recs = useMemo(() => recommendCocktails(ctx, mode, 30), [ctx, mode]);
  return (
    <>
      <ChipRow value={mode} options={MODES} onChange={setMode} />
      <div className="list">
        {recs.length === 0 && <div className="empty">조건에 맞는 추천이 없습니다.</div>}
        {recs.map((r) => <RecCard key={r.id} rec={r} onClick={() => openCocktail(r.id)} />)}
      </div>
    </>
  );
}

export function WhiskyRec() {
  const ctx = useRecommendContext();
  const { openLog } = useUI();
  const recs = useMemo(() => recommendWhiskies(ctx, 20), [ctx]);
  return (
    <>
      <div className="hint">보유 위스키를 취향·신선도로 정렬합니다.</div>
      <div className="list">
        {recs.map((r) => <RecCard key={r.id} rec={r} onClick={() => openLog({ drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' })} />)}
      </div>
    </>
  );
}

export function GroupRec() {
  const profiles = useTasteProfiles();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const logs = useLogs();
  const { openCocktail } = useUI();
  const [selected, setSelected] = useState<Set<string>>(new Set(['me']));
  const [onlyAvail, setOnlyAvail] = useState(true);

  const chosen = profiles.filter((p) => selected.has(p.id));
  const recs = useMemo(() => {
    if (chosen.length === 0) return [];
    return recommendGroupCocktails({ profiles: chosen.map((p) => ({ name: p.name, vector: p.vector })), heldIds, subMap, logs }, onlyAvail, 30);
  }, [chosen, heldIds, subMap, logs, onlyAvail]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="hint">함께 마실 사람을 선택하세요. 평균이 아니라, 한 명이라도 매우 싫어하는 향미가 강한 술은 감점됩니다. (프로필은 프로필 탭에서 추가)</div>
      <div className="controls strip">
        {profiles.map((p) => <button key={p.id} className="chip" aria-pressed={selected.has(p.id)} onClick={() => toggle(p.id)}>{p.name}</button>)}
      </div>
      <div className="controls">
        <button className="chip" aria-pressed={onlyAvail} onClick={() => setOnlyAvail(true)}>제조 가능만</button>
        <button className="chip" aria-pressed={!onlyAvail} onClick={() => setOnlyAvail(false)}>전체</button>
      </div>
      {chosen.length < 2 && <div className="hint">2명 이상 선택 시 그룹 패널티가 의미를 가집니다. (현재 {chosen.length}명)</div>}
      <div className="list">
        {recs.map((r) => <RecCard key={r.id} rec={r} onClick={() => openCocktail(r.id)} />)}
      </div>
    </>
  );
}

export function ClearStockRec() {
  const ctx = useRecommendContext();
  const { openCocktail } = useUI();
  const recs = useMemo(() => recommendCocktails(ctx, 'clearstock', 30), [ctx]);
  return (
    <>
      <div className="hint">잔량이 적은 보유 재료를 활용하는 레시피를 우선합니다. (술장 → 재고에서 잔량을 입력하세요)</div>
      <div className="list">
        {recs.map((r) => <RecCard key={r.id} rec={r} onClick={() => openCocktail(r.id)} />)}
      </div>
    </>
  );
}

export function PurchaseRec() {
  const ctx = useRecommendContext();
  const buys = useMemo(() => calculatePurchases(ctx, 30), [ctx]);
  const max = Math.max(1, ...buys.map((b) => b.addedRecipes));
  return (
    <>
      <div className="hint">그 재료 하나를 더 확보했을 때 새로 제조 가능해지는 레시피 수와 취향 적합도로 순위화합니다.</div>
      {buys.map((b) => (
        <div className="rank" key={b.ingredientId}>
          <b>+{b.addedRecipes}</b>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{b.name} <span className="pill">{b.category}</span></div>
            <div style={{ fontSize: 12, color: 'var(--mute)' }}>{b.beforeCount}종 → {b.afterCount}종 · 막힘 {b.blockedCount} · 취향 {b.tasteScore}</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{b.reason}</div>
            <div className="bar"><i style={{ width: `${(b.addedRecipes / max) * 100}%` }} /></div>
          </div>
        </div>
      ))}
    </>
  );
}
