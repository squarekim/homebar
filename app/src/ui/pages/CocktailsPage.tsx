/**
 * CocktailsPage — '칵테일'. 목록과 상세를 한 화면에서 오간다.
 * PC 는 왼쪽 목록 · 오른쪽 상세, 모바일은 목록 위에 상세가 전체 화면으로 덮인다.
 * 목록이 그대로 살아 있으므로 상세를 닫으면 검색어·필터·스크롤이 유지된다.
 *
 * 상단에는 자주 쓰는 것만 둔다 — 검색, '지금 만들 수 있는 것', 필터.
 * 기주·IBA·상태는 필터 안으로 모았고 기능은 그대로다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail } from '../../services/availabilityService';
import { CocktailDetail } from '../components/CocktailDetail';
import { SimpleBuildBrowser, IngredientBrowser } from '../components/browsers';
import { ChipRow, ChipToggle, SearchBox, StateLine, MethodIcon, type ChipOption } from '../components/common';
import { CocktailMark } from '../components/Mark';
import { flavorWords } from '../../services/flavorService';
import { normalize, hits, byReadyThenName, useGroupChips } from '../listUtils';
import { type AvailabilityStatus } from '../../models/types';

type StatusFilter = 'all' | AvailabilityStatus;
const STATUS_FILTERS: ChipOption<StatusFilter>[] = [
  { v: 'all', label: '전체' },
  { v: 'READY', label: '그대로 가능', cls: 'ok' },
  { v: 'SUBSTITUTE', label: '대체로 가능' },
  { v: 'MISSING', label: '일부 부족' },
  { v: 'UNAVAILABLE', label: '재료 없음' },
];
const IBA_FILTERS: ChipOption<string>[] = [
  { v: 'all', label: 'IBA 전체' }, { v: '현행IBA', label: '현행IBA' },
  { v: '구IBA', label: '구IBA' }, { v: '비IBA', label: '비IBA' },
];

type View = 'recipe' | 'simple' | 'ingredient';

export function CocktailsPage() {
  const { cocktailId, openCocktail, closeCocktail } = useUI();
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const [view, setView] = useState<View>('recipe');
  const [q, setQ] = useState('');
  const [ready, setReady] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [base, setBase] = useState('all');
  const [iba, setIba] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const bases = useGroupChips(referenceRepo.cocktails(), (c) => c.base, '기주 전체');
  const filtered = base !== 'all' || iba !== 'all' || status !== 'all';

  const rows = useMemo(() => {
    const t = normalize(q);
    return referenceRepo.cocktails()
      .map((c) => ({ c, e: evaluateCocktail(c, heldIds, subMap) }))
      .filter(({ c, e }) => {
        if (ready && e.status !== 'READY' && e.status !== 'SUBSTITUTE') return false;
        if (base !== 'all' && c.base !== base) return false;
        if (iba !== 'all' && c.iba !== iba) return false;
        if (status !== 'all' && e.status !== status) return false;
        return hits(t, c.name, ...c.ingredients.map((i) => i.ingredientName));
      })
      .sort(byReadyThenName((x) => x.e.status, (x) => x.c.name));
  }, [q, ready, base, iba, status, heldIds, subMap]);

  const selected = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;

  if (view !== 'recipe') {
    return (
      <>
        <h2 className="pagetitle">{view === 'simple' ? '간단 조합' : '재료'}</h2>
        <div className="btnrow"><button className="btn ghost" onClick={() => setView('recipe')}>← 칵테일 레시피로</button></div>
        {view === 'simple' ? <SimpleBuildBrowser /> : <IngredientBrowser />}
      </>
    );
  }

  return (
    <>
      <h2 className="pagetitle">칵테일<span className="sub">레시피 {referenceRepo.cocktails().length}종</span></h2>

      <SearchBox value={q} onChange={setQ} placeholder="칵테일 또는 재료 검색" />
      <div className="controls tight">
        <ChipToggle label="지금 만들 수 있는 것" cls="ok" on={ready} onToggle={() => setReady((v) => !v)} />
        <ChipToggle label={filtered ? '필터 켜짐' : '필터'} on={openFilter} onToggle={() => setOpenFilter((v) => !v)} />
      </div>

      {openFilter && (
        <div className="filterpanel">
          <div className="hint lbl">기주</div>
          <ChipRow value={base} options={bases} onChange={setBase} wrap tight />
          <div className="hint lbl">IBA 분류</div>
          <ChipRow value={iba} options={IBA_FILTERS} onChange={setIba} wrap tight />
          <div className="hint lbl">제조 가능 상태</div>
          <ChipRow value={status} options={STATUS_FILTERS} onChange={setStatus} wrap tight />
          <div className="btnrow">
            <button className="btn sm ghost" onClick={() => { setBase('all'); setIba('all'); setStatus('all'); }}>필터 비우기</button>
          </div>
        </div>
      )}

      <div className="split">
        <div className="listpane">
          <div className="hint">{rows.length}종 · <button className="lnk" onClick={() => setView('simple')}>간단 조합</button> · <button className="lnk" onClick={() => setView('ingredient')}>재료 목록</button></div>
          {rows.length === 0 && <div className="empty">조건에 맞는 레시피가 없습니다. 검색어나 필터를 지워보세요.</div>}
          <div className="rowlist">
            {rows.map(({ c, e }) => (
              <button className="rowitem" key={c.id} aria-current={cocktailId === c.id}
                onClick={() => openCocktail(c.id)}>
                <CocktailMark base={c.base} size="sm" />
                <div className="body">
                  <span className="nm withmethod">
                    <span className="nmwrap">{c.name}</span>
                    <MethodIcon keys={c.methodKeys} raw={c.method} />
                  </span>
                  <div className="taste">{flavorWords(c.flavor).join(' · ')} · {c.base}</div>
                  <div className="foot"><StateLine status={e.status} lack={e.lack} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="detailpane">
          {selected
            ? (
              <div className="sheet">
                <div className="sheetbar">
                  <button className="btn sm ghost" onClick={closeCocktail}>← 목록</button>
                  <b>{selected.name}</b>
                </div>
                <CocktailDetail id={selected.id} />
              </div>
            )
            : <div className="placeholder">목록에서 한 잔을 고르면 여기에 레시피가 열립니다.</div>}
        </div>
      </div>
    </>
  );
}
