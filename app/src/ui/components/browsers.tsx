/**
 * browsers.tsx — 재사용 브라우저 컴포넌트.
 * 칵테일(제조가능/검색), 위스키(분류/노트), 재료 목록. 홈바·위스키 탭에서 공유한다.
 */
import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useHeldIds, useSubMap, useBottleNotes, useWhiskies, useBottles } from '../../hooks/useData';
import { referenceRepo } from '../../repositories/referenceRepo';
import { bottleNoteRepo } from '../../repositories/bottleNoteRepo';
import { evaluateCocktail } from '../../services/availabilityService';
import { StatusBadge, FlavorBars, MakerNoteView, WhiskyClassTags } from './common';
import { CLASS_FILTERS, classMatchesTerm, classTags } from '../../data/whiskyClass';
import { AvailabilityStatus } from '../../models/types';
import { isUserBottle } from '../../data/userBottles';
import { LIQUOR_MASTER } from '../../data/liquorMaster';
import { CATEGORY_LABELS } from '../../data/liquorCategory';
import { bottleService } from '../../services/bottleService';

function PersonalNote({ bottleId, initial, onSaved }: { bottleId: string; initial: string; onSaved: () => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => { setText(initial); }, [initial, bottleId]);
  const dirty = text !== initial;
  return (
    <div>
      <textarea rows={2} value={text} placeholder="시음 소감·구매처·가격 등 자유 기록" onChange={(e) => setText(e.target.value)} />
      <div className="btnrow">
        <button className="btn" disabled={!dirty} onClick={async () => { await bottleNoteRepo.set(bottleId, text); onSaved(); }}>메모 저장</button>
      </div>
    </div>
  );
}

function rank(s: AvailabilityStatus) { return { READY: 3, SUBSTITUTE: 2, MISSING: 1, UNAVAILABLE: 0 }[s]; }

export function CocktailBrowser() {
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

/** 컬렉션이 비었을 때 — 기준 DB에서 대표 제품을 보여주고 탭하면 바로 추가 흐름으로 넘긴다. */
function MasterSuggestions({ category }: { category: 'whisky' | 'all' }) {
  const { openAdd } = useUI();
  const picks = useMemo(() => {
    const pool = category === 'whisky' ? LIQUOR_MASTER.filter((i) => i.category === 'whisky') : LIQUOR_MASTER;
    const seen = new Set<string>();
    return pool.filter((i) => {
      const key = category === 'whisky' ? i.subcategory + i.country : i.category;
      if (seen.has(key + i.brand)) return false;
      seen.add(key + i.brand);
      return true;
    }).slice(0, 12);
  }, [category]);
  return (
    <>
      <div className="sechead">기준 DB에서 골라 담기</div>
      <div className="hint">우하단 <b>+</b> 버튼으로도 언제든 추가할 수 있습니다. 제품을 누르면 검색창에 채워집니다.</div>
      <div className="list">
        {picks.map((i) => (
          <button className="card row" key={i.id} style={{ width: '100%', textAlign: 'left' }} onClick={() => openAdd(i.nameKo)}>
            <h3>{i.nameKo}<em>담기 +</em></h3>
            <div className="hint" style={{ margin: '2px 0 4px' }}>{i.nameEn}</div>
            <div className="meta">
              <span className="mi">{CATEGORY_LABELS[i.category]}</span>
              <span className="mi">{i.subcategory}</span>
              {i.abv ? <span className="mi">{i.abv}%</span> : null}
              <span className="mi">{i.country}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export function WhiskyBrowser() {
  const { openLog, toast } = useUI();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<'whisky' | 'mine' | 'notes'>('whisky');
  const [cls, setCls] = useState<string>('all');
  const [detail, setDetail] = useState<string | null>(null);
  const bottleNotes = useBottleNotes();
  const whiskies = useWhiskies();
  const allBottles = useBottles();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = scope === 'whisky'
      ? whiskies
      : scope === 'mine'
        ? allBottles.filter((b) => isUserBottle(b.id))
        : allBottles.filter((b) => b.makerNote);
    return base.filter((w) => {
      if (cls !== 'all' && !classMatchesTerm(w.whiskyClass, cls)) return false;
      if (!t) return true;
      const hay = (w.name + ' ' + w.node + ' ' + (w.whiskyClass ? classTags(w.whiskyClass).join(' ') : '')).toLowerCase();
      return hay.includes(t);
    });
  }, [q, scope, cls, whiskies, allBottles]);

  return (
    <>
      <div className="controls"><input type="search" placeholder="이름·분류(셰리/피트/싱글몰트…) 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="controls strip">
        <button className="chip" aria-pressed={scope === 'whisky'} onClick={() => setScope('whisky')}>위스키</button>
        <button className="chip" aria-pressed={scope === 'mine'} onClick={() => setScope('mine')}>내가 추가</button>
        <button className="chip" aria-pressed={scope === 'notes'} onClick={() => setScope('notes')}>공식 노트 있는 전체</button>
      </div>
      {scope === 'whisky' && (
        <div className="controls" style={{ paddingTop: 0 }}>
          <button className="chip" aria-pressed={cls === 'all'} onClick={() => setCls('all')}>분류 전체</button>
          {CLASS_FILTERS.map((c) => <button key={c} className="chip" aria-pressed={cls === c} onClick={() => setCls(c)}>{c}</button>)}
        </div>
      )}
      <div className="hint">
        {rows.length}종 · {scope === 'mine'
          ? '내가 추가한 술 전체(위스키 외 카테고리 포함). 삭제는 항목을 눌러 상세에서.'
          : '위스키는 원산지·타입·지역·캐스크·캐릭터로 분류됩니다. 제조사 공식 노트는 출처와 함께 표기.'}
      </div>
      {rows.length === 0 && !q.trim() && cls === 'all' && (
        <MasterSuggestions category={scope === 'whisky' ? 'whisky' : 'all'} />
      )}
      <div className="list">
        {rows.map((w) => (
          <div className="card" key={w.id}>
            <button style={{ width: '100%', textAlign: 'left' }} onClick={() => setDetail(detail === w.id ? null : w.id)}>
              <h3>{w.name}<em>{w.abv || w.group}{w.qty > 1 ? ` · ${w.qty}병` : ''}{w.makerNote ? ' · 📝' : ''}</em></h3>
              {w.whiskyClass ? <WhiskyClassTags cls={w.whiskyClass} /> : <div className="meta"><span className="mi">{w.node}</span><span className="mi">{w.use}</span></div>}
            </button>
            {detail === w.id && (
              <>
                {w.whiskyClass && <div className="meta"><span className="mi">{w.node}</span><span className="mi">{w.use}</span></div>}
                <FlavorBars vector={w.flavor} compact />
                {w.note && <div className="hint">{w.note}</div>}
                <div className="sechead" style={{ margin: '12px 0 4px' }}>제조사 공식 노트</div>
                <MakerNoteView note={w.makerNote} />
                <div className="sechead" style={{ margin: '12px 0 4px' }}>내 메모</div>
                <PersonalNote bottleId={w.id} initial={bottleNotes.get(w.id) ?? ''} onSaved={() => toast('메모 저장')} />
                <div className="btnrow">
                  <button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: 'whisky', drinkName: w.name, servingStyle: 'neat' })}>기록하기</button>
                  {isUserBottle(w.id) && (
                    <button className="btn ghost" onClick={async () => { await bottleService.remove(w.id); toast('삭제됨'); }}>삭제</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function IngredientBrowser() {
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
