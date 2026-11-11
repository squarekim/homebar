/**
 * 추천 조각들 — '오늘' 화면 아래의 '다르게 골라보기'에서 펼쳐 쓴다.
 * 점수 계산은 서비스가 그대로 하고, 여기서는 목록 모양만 맞춘다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useTasteProfiles, useHeldIds, useSubMap, useLogs } from '../../hooks/useData';
import { recommendCocktails, type RecommendMode } from '../../services/recommendationService';
import { recommendGroupCocktails } from '../../services/groupService';
import { calculatePurchases } from '../../services/purchaseService';
import { RecList, ChipRow, ChipMulti, type ChipOption } from '../components/common';

const AVAIL_CHIPS: ChipOption<'avail' | 'all'>[] = [{ v: 'avail', label: '만들 수 있는 것만' }, { v: 'all', label: '전체' }];

/** 기분별 추천 모드 — 홈의 '오늘'과 칵테일 추천이 함께 쓴다 */
export const MODES: { v: RecommendMode; label: string }[] = [
  { v: 'available', label: '있는 재료만' },
  { v: 'sweet', label: '달달한' },
  { v: 'refreshing', label: '상큼한' },
  { v: 'strong', label: '강한' },
  { v: 'light', label: '가벼운' },
  { v: 'whisky', label: '위스키' },
];

export function GroupRec() {
  const profiles = useTasteProfiles();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const logs = useLogs();
  const { openCocktail } = useUI();
  const [selected, setSelected] = useState<Set<string>>(new Set(['me']));
  const [onlyAvail, setOnlyAvail] = useState(true);

  const chosen = profiles.filter((p) => selected.has(p.id));
  const profileChips = useMemo(() => profiles.map((p) => ({ v: p.id, label: p.name })), [profiles]);
  const recs = useMemo(() => {
    if (chosen.length === 0) return [];
    return recommendGroupCocktails({ profiles: chosen.map((p) => ({ name: p.name, vector: p.vector })), heldIds, subMap, logs }, onlyAvail, 30);
  }, [chosen, heldIds, subMap, logs, onlyAvail]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <div className="hint">함께 마실 사람을 골라 주세요. 한 명이라도 많이 싫어하는 맛이 강한 잔은 뒤로 미뤄요. 사람은 취향 탭에서 추가해요.</div>
      <ChipMulti options={profileChips} values={[...selected]} onToggle={toggle} />
      <ChipRow value={onlyAvail ? 'avail' : 'all'} options={AVAIL_CHIPS} onChange={(v) => setOnlyAvail(v === 'avail')} wrap />
      {chosen.length < 2 && <div className="hint">두 명 이상 고르면 모두가 마실 만한 잔을 찾아 드려요. 지금은 {chosen.length}명이에요.</div>}
      <RecList recs={recs} onPick={(r) => openCocktail(r.id)} />
    </>
  );
}

export function ClearStockRec() {
  const ctx = useRecommendContext();
  const { openCocktail } = useUI();
  const recs = useMemo(() => recommendCocktails(ctx, 'clearstock', 30), [ctx]);
  return (
    <>
      <div className="hint">조금 남은 재료를 쓰는 잔부터 보여 드려요. 남은 양은 술장의 재료 재고에서 적어요.</div>
      <RecList recs={recs} onPick={(r) => openCocktail(r.id)} />
    </>
  );
}

export function PurchaseRec() {
  const ctx = useRecommendContext();
  const buys = useMemo(() => calculatePurchases(ctx, 30), [ctx]);
  const max = Math.max(1, ...buys.map((b) => b.addedRecipes));
  return (
    <>
      <div className="hint">하나만 더 사면 새로 만들 수 있는 잔이 많은 순서예요.</div>
      {buys.map((b) => (
        <div className="rank" key={b.ingredientId}>
          <b>+{b.addedRecipes}</b>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{b.name} <span className="pill">{b.category}</span></div>
            <div style={{ fontSize: 12, color: 'var(--mute)' }}>만들 수 있는 잔 {b.beforeCount}종 → {b.afterCount}종</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{b.reason}</div>
            <div className="bar"><i style={{ width: `${(b.addedRecipes / max) * 100}%` }} /></div>
          </div>
        </div>
      ))}
    </>
  );
}
