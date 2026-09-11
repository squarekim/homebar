/**
 * browsers.tsx — 칵테일 화면이 곁들여 쓰는 두 목록.
 * 간단 조합(셰이커 없이 잔에 바로 붓는 것)과 재료 목록. 둘 다 같은 행 규칙을 따른다.
 * 칵테일·위스키·보유 술 목록은 각 화면(pages/)이 직접 들고 있다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap, useBottles } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { simpleBuilds, evaluateSimpleBuild, pickMyBottles } from '../../services/simpleBuildService';
import { StateLine, ChipRow, ChipToggle, SearchBox, allChips } from './common';
import { normalize, hits, byReadyThenName, useGroupChips } from '../listUtils';

/**
 * SimpleBuildBrowser — 믹서 조합표와 Build 계열 레시피를 합쳐 기주별로 보여준다.
 */
export function SimpleBuildBrowser() {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const bottles = useBottles();
  const { openCocktail } = useUI();
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const [readyOnly, setReadyOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const all = useMemo(() => simpleBuilds(), []);
  const groups = useGroupChips(all, (b) => b.group);
  const judged = useMemo(() => all.map((b) => ({ b, e: evaluateSimpleBuild(b, heldIds, subMap) })), [all, heldIds, subMap]);
  const readyCount = useMemo(() => judged.filter(({ e }) => e.status === 'READY').length, [judged]);

  const rows = useMemo(() => {
    const t = normalize(q);
    return judged
      .filter(({ b, e }) => {
        if (grp !== 'all' && b.group !== grp) return false;
        if (readyOnly && e.status !== 'READY') return false;
        return hits(t, b.name, b.parts.join(' '));
      })
      .sort(byReadyThenName((x) => x.e.status, (x) => x.b.name));
  }, [judged, q, grp, readyOnly]);

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="하이볼·토닉 등 이름·재료 검색" />
      <ChipRow value={grp} options={groups} onChange={setGrp}>
        <ChipToggle label="바로 가능" cls="ok" on={readyOnly} onToggle={() => setReadyOnly((v) => !v)} />
      </ChipRow>
      <p className="hint">셰이커 없이 <b>잔에 바로 붓는</b> 조합 {all.length}종 중 지금 <b>{readyCount}종</b> 가능합니다.</p>
      <div className="rowlist">
        {rows.map(({ b, e }) => {
          const mine = pickMyBottles(b, bottles);
          const isOpen = open === b.id;
          return (
            <div key={b.id}>
              <button className="rowitem" aria-current={isOpen} onClick={() => setOpen(isOpen ? null : b.id)}>
                <div className="body">
                  <span className="nm">{b.name}</span>
                  <div className="taste">{b.parts.join(' · ')}{b.ratio ? ` · ${b.ratio}` : ''}</div>
                  <div className="foot">
                    <StateLine status={e.status} lack={e.lack} />
                    {b.glass && <span className="mi">{b.glass} 잔</span>}
                    {mine.length > 0 && <span className="mi">내 술 {mine.length}종</span>}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '0 2px 14px' }}>
                  <div className="sechead in">내 술로 만들기</div>
                  {mine.length > 0
                    ? <div className="parts">{mine.map((x) => <span key={x.id}>{x.name}{x.abv ? ` ${x.abv}` : ''}</span>)}</div>
                    : <p className="hint">보유한 {b.group}이(가) 없습니다. 내 술장에서 추가하면 여기에 뜹니다.</p>}
                  {b.note && <p className="hint">{b.note}</p>}
                  {b.recipeId && (
                    <div className="btnrow">
                      <button className="btn sm primary" onClick={() => openCocktail(b.recipeId!)}>레시피 상세</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

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
      (cat === 'all' || i.category === cat) && hits(t, i.name) && (!ownedOnly || heldIds.has(i.id)));
  }, [q, cat, ownedOnly, heldIds]);

  const describe = (id: string, name: string, category: string, usage: number) => {
    const uses = referenceRepo.cocktails().filter((c) => c.ingredients.some((x) => x.ingredientId === id)).map((c) => c.name);
    const subs = (subMap.get(id) ?? []).map((sid) => referenceRepo.ingredientById(sid)?.name).filter(Boolean) as string[];
    const mine = bottles.filter((b) => b.ingredientIds.includes(id));
    const lines = [
      `${category} · 레시피 ${usage}회 사용 · ${heldIds.has(id) ? '보유 중' : '미보유'}`,
      mine.length ? `내 술: ${mine.map((b) => `${b.name}${b.abv ? ` (${b.abv})` : ''}`).join(', ')}` : '',
      subs.length ? `대체 가능: ${subs.join(', ')}` : '',
      uses.length ? `쓰이는 레시피: ${uses.slice(0, 12).join(', ')}${uses.length > 12 ? ` 외 ${uses.length - 12}종` : ''}` : '이 재료를 쓰는 레시피가 없습니다.',
    ].filter(Boolean);
    showTerm(name, lines.join('\n\n'));
  };

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="재료 검색" />
      <ChipRow value={cat} options={cats} onChange={setCat}>
        <ChipToggle label="보유만" cls="ok" on={ownedOnly} onToggle={() => setOwnedOnly((v) => !v)} />
      </ChipRow>
      <p className="hint">{rows.length}종 · 보유 {rows.filter((r) => heldIds.has(r.id)).length} · 항목을 누르면 어디에 쓰이는지 보여줍니다.</p>
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
