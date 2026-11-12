/**
 * browsers.tsx — 칵테일 화면이 곁들여 쓰는 재료 목록.
 * 칵테일·위스키·보유 술 목록은 각 화면(pages/)이 직접 들고 있다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap, useBottles } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { ChipRow, ChipToggle, SearchBox, allChips } from './common';
import { normalize, hits, ingredientAliases } from '../listUtils';

/** 재료 목록 — 항목을 누르면 활용 레시피·보유 여부·대체재를 보여준다 */
export function IngredientBrowser() {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const bottles = useBottles();
  const { showTerm } = useUI();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const cats = useMemo(() => allChips(referenceRepo.categories()), []);

  const rows = useMemo(() => {
    const t = normalize(q);
    return referenceRepo.ingredients().filter((i) =>
      (cat === 'all' || i.category === cat) && hits(t, i.name, ...ingredientAliases(i.name)) && (!ownedOnly || heldIds.has(i.id)));
  }, [q, cat, ownedOnly, heldIds]);

  const describe = (id: string, name: string, category: string, usage: number) => {
    const uses = referenceRepo.cocktails().filter((c) => c.ingredients.some((x) => x.ingredientId === id)).map((c) => c.name);
    const subs = (subMap.get(id) ?? []).map((sid) => referenceRepo.ingredientById(sid)?.name).filter(Boolean) as string[];
    const mine = bottles.filter((b) => b.ingredientIds.includes(id));
    const lines = [
      `${category} · 레시피 ${usage}회 사용 · ${heldIds.has(id) ? '가지고 있어요' : '없어요'}`,
      mine.length ? `내 술: ${mine.map((b) => `${b.name}${b.abv ? ` (${b.abv})` : ''}`).join(', ')}` : '',
      subs.length ? `대체 가능: ${subs.join(', ')}` : '',
      uses.length ? `쓰이는 레시피: ${uses.slice(0, 12).join(', ')}${uses.length > 12 ? ` 외 ${uses.length - 12}종` : ''}` : '이 재료를 쓰는 레시피가 없어요.',
    ].filter(Boolean);
    showTerm(name, lines.join('\n\n'));
  };

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="재료 검색" />
      <ChipRow value={cat} options={cats} onChange={setCat}>
        <ChipToggle label="가진 것만" cls="ok" on={ownedOnly} onToggle={() => setOwnedOnly((v) => !v)} />
      </ChipRow>
      <p className="hint">{rows.length}종 · 가진 것 {rows.filter((r) => heldIds.has(r.id)).length} · 숫자는 쓰이는 레시피 수</p>
      <div className="items">
        {rows.map((i) => (
          <button className={`it ${heldIds.has(i.id) ? '' : 'off'}`} key={i.id}
            onClick={() => describe(i.id, i.name, i.category, i.usageCount)}>
            <span>{heldIds.has(i.id) ? '●' : '○'} {i.name}</span>
            <small>{i.usageCount}</small>
          </button>
        ))}
      </div>
    </>
  );
}
