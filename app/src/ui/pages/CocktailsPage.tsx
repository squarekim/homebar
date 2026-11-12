/**
 * CocktailsPage — '칵테일'. 목록과 상세를 한 화면에서 오간다.
 * PC 는 왼쪽 목록 · 오른쪽 상세, 모바일은 목록 위에 상세가 전체 화면으로 덮인다.
 * 목록이 그대로 살아 있으므로 상세를 닫으면 검색어·필터·스크롤이 유지된다.
 *
 * 상단에는 자주 쓰는 것만 둔다 — 검색, '지금 만들 수 있는 것', 필터.
 * 기주·IBA·상태는 필터 안으로 모았고 기능은 그대로다.
 */
import { GuideHint } from '../components/GuidePopup';
import { cocktailWords } from '../../services/tasteWords';
import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap } from '../../hooks/useData';
import { garnishState } from '../../services/garnishStock';
import { referenceRepo } from '../../repositories/referenceRepo';
import { evaluateCocktail } from '../../services/availabilityService';
import { CocktailDetail } from '../components/CocktailDetail';
import { IngredientBrowser } from '../components/browsers';
import { ChipRow, ChipToggle, SearchBox, StateLine, MethodIcon, type ChipOption, FilterButton, GarnishBadge } from '../components/common';
import { CocktailMark } from '../components/Mark';
import { normalize, hitsKey, cocktailKey, byReadyThenName, useGroupChips } from '../listUtils';
import { type AvailabilityStatus } from '../../models/types';

type StatusFilter = 'all' | AvailabilityStatus;
const STATUS_FILTERS: ChipOption<StatusFilter>[] = [
  { v: 'all', label: '전체' },
  { v: 'READY', label: '바로 만들 수 있음', cls: 'ok' },
  { v: 'SUBSTITUTE', label: '대체 재료로 가능' },
  { v: 'MISSING', label: '재료 일부 없음' },
  { v: 'UNAVAILABLE', label: '재료 대부분 없음' },
];
const IBA_FILTERS: ChipOption<string>[] = [
  { v: 'all', label: '전체' }, { v: '현행IBA', label: '지금 공식' },
  { v: '구IBA', label: '예전 공식' }, { v: '비IBA', label: '그 밖' },
];

type View = 'recipe' | 'ingredient';

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
  /** 잔에 바로 붓는 레시피만(예전 '간단 조합' 칸을 대신한다) */
  const [buildOnly, setBuildOnly] = useState(false);

  const bases = useGroupChips(referenceRepo.cocktails(), (c) => c.base, '베이스 술 전체');
  const filterCount = (base !== 'all' ? 1 : 0) + (iba !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (buildOnly ? 1 : 0);

  const rows = useMemo(() => {
    const t = normalize(q);
    return referenceRepo.cocktails()
      .map((c) => ({ c, e: evaluateCocktail(c, heldIds, subMap) }))
      .filter(({ c, e }) => {
        if (ready && e.status !== 'READY' && e.status !== 'SUBSTITUTE') return false;
        if (base !== 'all' && c.base !== base) return false;
        if (iba !== 'all' && c.iba !== iba) return false;
        if (status !== 'all' && e.status !== status) return false;
        if (buildOnly && c.methodKeys[0] !== 'build') return false;
        return hitsKey(t, cocktailKey(c));
      })
      .sort(byReadyThenName((x) => x.e.status, (x) => x.c.name));
  }, [q, ready, base, iba, status, buildOnly, heldIds, subMap]);

  // 검색·필터를 바꿔 열려 있던 잔이 목록에서 빠지면 상세도 닫는다 — 왼쪽은 진 토닉인데 오른쪽은 위스키 사워인 일이 없게
  const listKey = `${q}|${ready}|${base}|${iba}|${status}|${buildOnly}`;
  useEffect(() => {
    if (cocktailId && !rows.some((x) => x.c.id === cocktailId)) closeCocktail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  // 만들 수 있는 잔과 재료가 모자란 잔을 두 묶음으로 나눠 보여 준다
  const groups = useMemo(() => {
    const can = rows.filter((x) => x.e.status === 'READY' || x.e.status === 'SUBSTITUTE');
    return [
      { title: '지금 만들 수 있어요', rows: can },
      { title: '재료가 부족해요', rows: rows.filter((x) => !can.includes(x)) },
    ];
  }, [rows]);

  const selected = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;

  if (view !== 'recipe') {
    return (
      <>
        <h2 className="pagetitle" data-k="Recipe Index">재료</h2>
        <div className="btnrow"><button className="btn ghost" onClick={() => setView('recipe')}>← 칵테일 레시피로</button></div>
        <IngredientBrowser />
      </>
    );
  }

  return (
    <>
      <h2 className="pagetitle" data-k="Recipe Index">칵테일<span className="sub">레시피 {referenceRepo.cocktails().length}종</span></h2>
      <GuideHint tab="cocktails" />

      <SearchBox value={q} onChange={setQ} placeholder="칵테일 또는 재료 검색" />
      <div className="controls tight">
        <FilterButton open={openFilter} count={filterCount} onToggle={() => setOpenFilter((v) => !v)} />
        <ChipToggle label="지금 만들 수 있는 것" cls="ok" on={ready} onToggle={() => setReady((v) => !v)} />
      </div>

      {openFilter && (
        <div className="filterpanel">
          <div className="hint lbl">베이스 술</div>
          <ChipRow value={base} options={bases} onChange={setBase} wrap tight />
          <div className="hint lbl">공식 칵테일 (국제바텐더협회 IBA)</div>
          <ChipRow value={iba} options={IBA_FILTERS} onChange={setIba} wrap tight />
          <div className="hint lbl">만들 수 있는지</div>
          <ChipRow value={status} options={STATUS_FILTERS} onChange={setStatus} wrap tight />
          <div className="hint lbl">만드는 법</div>
          <div className="controls tight"><ChipToggle label="잔에 바로 붓기" on={buildOnly} onToggle={() => setBuildOnly((v) => !v)} /></div>
          <div className="btnrow">
            <button className="btn sm ghost" onClick={() => { setBase('all'); setIba('all'); setStatus('all'); setBuildOnly(false); }}>필터 비우기</button>
          </div>
        </div>
      )}

      <div className="split">
        <div className="listpane">
          <div className="hint">{rows.length}종 · <button className="lnk" onClick={() => setView('ingredient')}>재료 목록</button></div>
          {rows.length === 0 && <div className="empty">조건에 맞는 레시피가 없어요.</div>}
          {groups.map((g) => g.rows.length > 0 && (
            <div key={g.title}>
              <div className="sechead sm">{g.title} <small className="sub">{g.rows.length}</small></div>
              <div className="rowlist">
                {g.rows.map(({ c, e }) => (
              <button className="rowitem" key={c.id} aria-current={cocktailId === c.id}
                onClick={() => openCocktail(c.id)}>
                <CocktailMark base={c.base} cocktailId={c.id} size="sm" />
                <div className="body">
                  <span className="nm withmethod">
                    <span className="nmwrap">{c.name}</span>
                    <MethodIcon keys={c.methodKeys} raw={c.method} />
                  </span>
                  <div className="taste">{cocktailWords(c).join(' · ')} · {c.base}</div>
                  {/* 묶음 제목이 이미 '지금 만들 수 있어요'라서, 그대로 만들 수 있는 잔에는 상태를 다시 적지 않는다 */}
                  {(e.status !== 'READY' || garnishState(c, heldIds) === 'all') && (
                    <div className="foot">
                      {e.status !== 'READY' && <StateLine status={e.status} lack={e.lack} />}
                      {(e.status === 'READY' || e.status === 'SUBSTITUTE') && garnishState(c, heldIds) === 'all' && <GarnishBadge />}
                    </div>
                  )}
                </div>
              </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="detailpane">
          {selected
            ? (
              <div className="sheet">
                <div className="sheetbar">
                  <button className="btn sm ghost" onClick={closeCocktail}>← 목록</button>
                  <b>{selected.name}</b>
                </div>
                <CocktailDetail key={selected.id} id={selected.id} />
              </div>
            )
            : <div className="placeholder">목록에서 한 잔을 고르세요.</div>}
        </div>
      </div>
    </>
  );
}
