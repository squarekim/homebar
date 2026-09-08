import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail } from '../../services/availabilityService';
import { StatusBadge, FlavorBars } from '../components/common';
import { AvailabilityStatus } from '../../models/types';

type Sub = 'cocktail' | 'whisky' | 'ingredient';

export function ExplorePage() {
  const [sub, setSub] = useState<Sub>('cocktail');
  return (
    <>
      <div className="controls strip">
        <button className="chip" aria-pressed={sub === 'cocktail'} onClick={() => setSub('cocktail')}>칵테일</button>
        <button className="chip" aria-pressed={sub === 'whisky'} onClick={() => setSub('whisky')}>위스키</button>
        <button className="chip" aria-pressed={sub === 'ingredient'} onClick={() => setSub('ingredient')}>재료</button>
      </div>
      {sub === 'cocktail' && <CocktailExplore />}
      {sub === 'whisky' && <WhiskyExplore />}
      {sub === 'ingredient' && <IngredientExplore />}
    </>
  );
}

function CocktailExplore() {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const { openCocktail } = useUI();
  const [q, setQ] = useState('');
  const [base, setBase] = useState('all');
  const [iba, setIba] = useState('all');
  const [status, setStatus] = useState<'all' | AvailabilityStatus>('all');

  const bases = useMemo(() => [...new Set(referenceRepo.cocktails().map((c) => c.base))], []);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return referenceRepo.cocktails()
      .map((c) => ({ c, e: evaluateCocktail(c, heldIds, subMap) }))
      .filter(({ c, e }) => {
        if (base !== 'all' && c.base !== base) return false;
        if (iba !== 'all' && c.iba !== iba) return false;
        if (status !== 'all' && e.status !== status) return false;
        if (t && !c.name.toLowerCase().includes(t) && !c.ingredients.some((i) => i.ingredientName.toLowerCase().includes(t))) return false;
        return true;
      })
      .sort((a, b) => rank(b.e.status) - rank(a.e.status) || a.c.name.localeCompare(b.c.name, 'ko'));
  }, [q, base, iba, status, heldIds, subMap]);

  return (
    <>
      <div className="controls"><input type="search" placeholder="칵테일 또는 재료 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="controls strip">
        {(['all', 'READY', 'SUBSTITUTE', 'MISSING', 'UNAVAILABLE'] as const).map((s) => (
          <button key={s} className={`chip ${s === 'READY' ? 'ok' : s === 'UNAVAILABLE' ? 'no' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
            {s === 'all' ? '전체' : ({ READY: '정규', SUBSTITUTE: '근사', MISSING: '일부부족', UNAVAILABLE: '불가' } as const)[s]}
          </button>
        ))}
      </div>
      <div className="controls strip">
        <button className="chip" aria-pressed={base === 'all'} onClick={() => setBase('all')}>기주 전체</button>
        {bases.map((b) => <button key={b} className="chip" aria-pressed={base === b} onClick={() => setBase(b)}>{b}</button>)}
      </div>
      <div className="controls strip">
        {['all', '현행IBA', '구IBA', '비IBA'].map((v) => (
          <button key={v} className="chip" aria-pressed={iba === v} onClick={() => setIba(v)}>{v === 'all' ? 'IBA 전체' : v}</button>
        ))}
      </div>
      <div className="hint">{rows.length}종</div>
      <div className="list">
        {rows.map(({ c, e }) => (
          <button className={`card row v${e.status}`} key={c.id} onClick={() => openCocktail(c.id)}>
            <h3>{c.name}<em><StatusBadge status={e.status} /></em></h3>
            <div className="meta"><span className="mi">{c.base}</span><span className="mi">{c.method}</span><span className="mi">재료 {c.ingredients.length}</span></div>
            {e.lack.length > 0 && <div className="lack">{e.lack.slice(0, 4).map((n) => <span key={n}>{n}</span>)}{e.lack.length > 4 && <span>외 {e.lack.length - 4}</span>}</div>}
            {e.lack.length === 0 && e.sub.length > 0 && <div className="lack">{e.sub.map((n) => <span className="s" key={n}>{n} 대체</span>)}</div>}
          </button>
        ))}
      </div>
    </>
  );
}
function rank(s: AvailabilityStatus) { return { READY: 3, SUBSTITUTE: 2, MISSING: 1, UNAVAILABLE: 0 }[s]; }

function WhiskyExplore() {
  const { openLog } = useUI();
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return referenceRepo.whiskies().filter((w) => !t || w.name.toLowerCase().includes(t) || w.node.toLowerCase().includes(t));
  }, [q]);
  return (
    <>
      <div className="controls"><input type="search" placeholder="위스키 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="hint">{rows.length}종 (보유 컬렉션)</div>
      <div className="list">
        {rows.map((w) => (
          <div className="card" key={w.id}>
            <button style={{ width: '100%', textAlign: 'left' }} onClick={() => setDetail(detail === w.id ? null : w.id)}>
              <h3>{w.name}<em>{w.abv}{w.qty > 1 ? ` · ${w.qty}병` : ''}</em></h3>
              <div className="meta"><span className="mi">{w.node}</span><span className="mi">{w.use}</span></div>
            </button>
            {detail === w.id && (
              <>
                <FlavorBars vector={w.flavor} compact />
                {w.note && <div className="hint">{w.note}</div>}
                <div className="btnrow"><button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: 'whisky', drinkName: w.name, servingStyle: 'neat' })}>기록하기</button></div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function IngredientExplore() {
  const heldIds = useHeldIds();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const cats = referenceRepo.categories();
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return referenceRepo.ingredients().filter((i) => (cat === 'all' || i.category === cat) && (!t || i.name.toLowerCase().includes(t)));
  }, [q, cat]);
  return (
    <>
      <div className="controls"><input type="search" placeholder="재료 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="controls strip">
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>전체</button>
        {cats.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="hint">{rows.length}종 · 보유 {rows.filter((r) => heldIds.has(r.id)).length}</div>
      <div className="items">
        {rows.map((i) => (
          <div className={`it ${heldIds.has(i.id) ? '' : 'off'}`} key={i.id}>
            <span>{heldIds.has(i.id) ? '●' : '○'} {i.name}</span>
            <small>{i.usageCount}</small>
          </div>
        ))}
      </div>
    </>
  );
}
