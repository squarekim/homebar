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
import { simpleBuilds, evaluateSimpleBuild, pickMyBottles } from '../../services/simpleBuildService';
import { StatusBadge, FlavorBars, MakerNoteView, WhiskyClassTags, MethodIcon, ChipRow, ChipToggle, SearchBox, allChips, type ChipOption } from './common';
import { normalize, hits, byReadyThenName, useGroupChips } from '../listUtils';
import { CLASS_FILTERS, classMatchesTerm, classTags } from '../../data/whiskyClass';
import { type AvailabilityStatus, type Bottle } from '../../models/types';
import { isUserBottle } from '../../data/userBottles';
import { bottleKindLabel } from '../../data/bottleIngredients';
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

type StatusFilter = 'all' | AvailabilityStatus;
const STATUS_FILTERS: ChipOption<StatusFilter>[] = [
  { v: 'all', label: '전체' },
  { v: 'READY', label: '정규', cls: 'ok' },
  { v: 'SUBSTITUTE', label: '근사' },
  { v: 'MISSING', label: '일부부족' },
  { v: 'UNAVAILABLE', label: '불가', cls: 'no' },
];
const IBA_FILTERS: ChipOption<string>[] = [
  { v: 'all', label: 'IBA 전체' },
  { v: '현행IBA', label: '현행IBA' },
  { v: '구IBA', label: '구IBA' },
  { v: '비IBA', label: '비IBA' },
];

export function CocktailBrowser() {
  const heldIds = useHeldIds();
  const subMap = useSubMap();
  const { openCocktail } = useUI();
  const [q, setQ] = useState('');
  const [base, setBase] = useState('all');
  const [iba, setIba] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const bases = useGroupChips(referenceRepo.cocktails(), (c) => c.base, '기주 전체');

  const rows = useMemo(() => {
    const t = normalize(q);
    return referenceRepo.cocktails()
      .map((c) => ({ c, e: evaluateCocktail(c, heldIds, subMap) }))
      .filter(({ c, e }) => {
        if (base !== 'all' && c.base !== base) return false;
        if (iba !== 'all' && c.iba !== iba) return false;
        if (status !== 'all' && e.status !== status) return false;
        return hits(t, c.name, ...c.ingredients.map((i) => i.ingredientName));
      })
      .sort(byReadyThenName((x) => x.e.status, (x) => x.c.name));
  }, [q, base, iba, status, heldIds, subMap]);

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="칵테일 또는 재료 검색" />
      <ChipRow value={status} options={STATUS_FILTERS} onChange={setStatus} />
      <ChipRow value={base} options={bases} onChange={setBase} />
      <ChipRow value={iba} options={IBA_FILTERS} onChange={setIba} />
      <div className="hint">{rows.length}종</div>
      <div className="list">
        {rows.map(({ c, e }) => (
          <button className={`card row v${e.status}`} key={c.id} onClick={() => openCocktail(c.id)}>
            <h3 className="withmethod">
              <span className="nmwrap">{c.name}<MethodIcon keys={c.methodKeys} raw={c.method} /></span>
              <em><StatusBadge status={e.status} /></em>
            </h3>
            <div className="meta">
              <span className="mi">{c.base}</span>
              <span className="mi">재료 {c.ingredients.length}</span>
              {c.garnish && <span className="mi">가니시 {c.garnish}</span>}
              {c.variants.length > 0 && <span className="mi">변형 {c.variants.length}</span>}
            </div>
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
          <button className="card row" key={i.id} onClick={() => openAdd(i.nameKo)}>
            <h3>{i.nameKo}<em>담기 +</em></h3>
            <div className="hint sub">{i.nameEn}</div>
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

/**
 * SimpleBuildBrowser — 셰이커 없이 잔에 바로 붓는 술만 모은 화면.
 * 믹서 조합표(기주+믹서 비율)와 Build 계열 3재료 이하 레시피를 합쳐 기주별로 보여준다.
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

  /** 판정은 재고가 바뀔 때만 다시 한다 (검색어·필터가 바뀌어도 재계산하지 않는다) */
  const judged = useMemo(
    () => all.map((b) => ({ b, e: evaluateSimpleBuild(b, heldIds, subMap) })),
    [all, heldIds, subMap],
  );
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
      <div className="hint">
        셰이커 없이 <b>잔에 바로 붓는</b> 조합만 모았습니다. {all.length}종 중 지금 <b>{readyCount}종</b> 가능.
        항목을 누르면 내 술로 어떻게 만드는지 보여줍니다.
      </div>
      <div className="list">
        {rows.map(({ b, e }) => {
          const mine = pickMyBottles(b, bottles);
          return (
            <div className={`card row v${e.status}`} key={b.id}>
              <button className="full" onClick={() => setOpen(open === b.id ? null : b.id)}>
                <h3 className="withmethod">
                  <span className="nmwrap">{b.name}<MethodIcon keys={['build']} raw="Build" /></span>
                  <em><StatusBadge status={e.status} /></em>
                </h3>
                <div className="parts">
                  {b.parts.map((p, i) => <span key={i}>{p}</span>)}
                  {b.ratio && <span className="ratio">{b.ratio}</span>}
                </div>
                <div className="meta">
                  <span className="mi">{b.group}</span>
                  {b.glass && <span className="mi">{b.glass} 잔</span>}
                  {b.cocktail?.garnish && <span className="mi">가니시 {b.cocktail.garnish}</span>}
                  {mine.length > 0 && <span className="mi">내 술 {mine.length}종</span>}
                </div>
                {e.lack.length > 0 && <div className="lack">{e.lack.map((n) => <span key={n}>{n}</span>)}</div>}
              </button>
              {open === b.id && (
                <>
                  <div className="sechead in">내 술로 만들기</div>
                  {mine.length > 0 ? (
                    <div className="parts">
                      {mine.map((x) => <span key={x.id}>{x.name}{x.abv ? ` ${x.abv}` : ''}</span>)}
                    </div>
                  ) : (
                    <div className="hint" style={{ margin: '2px 0' }}>
                      보유한 {b.group}이(가) 없습니다. 우하단 <b>+</b> 버튼으로 추가하면 여기에 뜹니다.
                    </div>
                  )}
                  {b.ratio && <div className="hint" style={{ margin: '8px 0 0' }}>비율 {b.ratio} (기주 1 기준){b.glass ? ` · ${b.glass} 잔` : ''}</div>}
                  {b.note && <div className="hint" style={{ margin: '6px 0 0' }}>{b.note}</div>}
                  {b.recipeId && (
                    <div className="btnrow">
                      <button className="btn primary" onClick={() => openCocktail(b.recipeId!)}>레시피 상세</button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** 카드 우측에 적을 술 종류 — 위스키는 타입(싱글몰트/블렌디드), 나머지는 대분류(데킬라·리큐르…) */
function kindOf(b: Bottle): string {
  return b.whiskyClass?.type ?? bottleKindLabel(b);
}

/**
 * BottleCard — 보유 병 하나. 눌러 펼치면 분류·향미·공식 노트·내 메모·기록/삭제가 나온다.
 * 위스키 탭과 홈바의 '내 술' 탭이 같은 카드를 쓴다.
 */
function BottleCard({ bottle: w, open, onToggle }: { bottle: Bottle; open: boolean; onToggle: () => void }) {
  const { openLog, toast } = useUI();
  const bottleNotes = useBottleNotes();
  const heldIds = useHeldIds();
  const linked = w.ingredientIds
    .map((id) => referenceRepo.ingredientById(id))
    .filter((x): x is NonNullable<typeof x> => !!x);
  return (
    <div className="card">
      <button className="full" onClick={onToggle}>
        <h3>{w.name}<em>{kindOf(w)}</em></h3>
        <div className="meta">
          {w.abv && <span className="mi">{w.abv}</span>}
          {w.qty > 1 && <span className="mi">{w.qty}병</span>}
          {w.makerNote && <span className="mi note">공식 노트</span>}
        </div>
        {w.whiskyClass && <WhiskyClassTags cls={w.whiskyClass} />}
      </button>
      {open && (
        <>
          {linked.length > 0 && (
            <div className="meta" style={{ marginTop: 8 }}>
              {linked.map((i) => (
                <span className={`mi ${heldIds.has(i.id) ? 'on' : ''}`} key={i.id}>재료 {i.name}</span>
              ))}
            </div>
          )}
          <FlavorBars vector={w.flavor} compact />
          {w.note && <div className="hint">{w.note}</div>}
          <div className="sechead in">제조사 공식 노트</div>
          <MakerNoteView note={w.makerNote} />
          <div className="sechead in">내 메모</div>
          <PersonalNote bottleId={w.id} initial={bottleNotes.get(w.id) ?? ''} onSaved={() => toast('메모 저장')} />
          <div className="btnrow">
            <button className="btn primary" onClick={() => openLog({ drinkId: w.id, drinkType: w.isWhisky ? 'whisky' : 'spirit', drinkName: w.name, servingStyle: 'neat' })}>기록하기</button>
            {isUserBottle(w.id) && (
              <button className="btn ghost" onClick={async () => { await bottleService.remove(w.id); toast('삭제됨'); }}>삭제</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * MyBottlesBrowser — 내 술장 전체. 재고가 "데킬라"로 켜져 있을 때
 * 그게 어떤 제품인지(호세 쿠엘보 에스페시알 골드) 여기서 확인한다.
 */
export function MyBottlesBrowser() {
  const bottles = useBottles();
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const [detail, setDetail] = useState<string | null>(null);

  const groups = useGroupChips(bottles, (b) => b.group);
  const rows = useMemo(() => {
    const t = normalize(q);
    return bottles.filter((b) => (grp === 'all' || b.group === grp) && hits(t, b.name, b.group, b.abv));
  }, [bottles, q, grp]);

  const byGroup = useMemo(() => {
    const m = new Map<string, Bottle[]>();
    for (const b of rows) m.set(b.group, [...(m.get(b.group) ?? []), b]);
    return [...m.entries()];
  }, [rows]);

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="내 술 이름 검색" />
      <ChipRow value={grp} options={groups} onChange={setGrp} wrap />
      <div className="hint">
        보유 {bottles.length}종 · 항목을 누르면 도수·분류·공식 노트·연결된 표준 재료가 나옵니다.
        새 술은 우하단 <b>+</b> 버튼으로 추가합니다.
      </div>
      {rows.length === 0 && !q.trim() && <MasterSuggestions category="all" />}
      {byGroup.map(([g, items]) => (
        <div key={g}>
          <div className="sechead in">{g} <small className="sub">{items.length}종</small></div>
          <div className="list">
            {items.map((b) => (
              <BottleCard key={b.id} bottle={b} open={detail === b.id} onToggle={() => setDetail(detail === b.id ? null : b.id)} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

type WhiskyScope = 'whisky' | 'mine' | 'notes';
const WHISKY_SCOPES: ChipOption<WhiskyScope>[] = [
  { v: 'whisky', label: '위스키' },
  { v: 'mine', label: '내가 추가' },
  { v: 'notes', label: '공식 노트 있는 전체' },
];
const WHISKY_CLASS_CHIPS = allChips(CLASS_FILTERS, '분류 전체');

export function WhiskyBrowser() {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<WhiskyScope>('whisky');
  const [cls, setCls] = useState<string>('all');
  const [detail, setDetail] = useState<string | null>(null);
  const whiskies = useWhiskies();
  const allBottles = useBottles();

  const rows = useMemo(() => {
    const t = normalize(q);
    const base = scope === 'whisky'
      ? whiskies
      : scope === 'mine'
        ? allBottles.filter((b) => isUserBottle(b.id))
        : allBottles.filter((b) => b.makerNote);
    return base.filter((w) =>
      (cls === 'all' || classMatchesTerm(w.whiskyClass, cls))
      && hits(t, w.name, w.node, w.whiskyClass ? classTags(w.whiskyClass).join(' ') : ''));
  }, [q, scope, cls, whiskies, allBottles]);

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="이름·분류(셰리/피트/싱글몰트…) 검색" />
      <ChipRow value={scope} options={WHISKY_SCOPES} onChange={setScope} />
      {scope === 'whisky' && <ChipRow value={cls} options={WHISKY_CLASS_CHIPS} onChange={setCls} wrap tight />}
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
          <BottleCard key={w.id} bottle={w} open={detail === w.id} onToggle={() => setDetail(detail === w.id ? null : w.id)} />
        ))}
      </div>
    </>
  );
}

/** 재료 목록 — 항목을 누르면 활용 레시피·보유 여부·대체재를 팝오버로 보여준다 */
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
      (cat === 'all' || i.category === cat)
      && hits(t, i.name)
      && (!ownedOnly || heldIds.has(i.id)));
  }, [q, cat, ownedOnly, heldIds]);

  const describe = (id: string, name: string, category: string, usage: number) => {
    const uses = referenceRepo.cocktails()
      .filter((c) => c.ingredients.some((x) => x.ingredientId === id))
      .map((c) => c.name);
    const subs = (subMap.get(id) ?? [])
      .map((sid) => referenceRepo.ingredientById(sid)?.name)
      .filter(Boolean) as string[];
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
      <div className="hint">{rows.length}종 · 보유 {rows.filter((r) => heldIds.has(r.id)).length} · 항목을 누르면 어디에 쓰이는지 보여줍니다.</div>
      <div className="items">
        {rows.map((i) => (
          <button className={`it ${heldIds.has(i.id) ? '' : 'off'}`} key={i.id} onClick={() => describe(i.id, i.name, i.category, i.usageCount)}>
            <span>{heldIds.has(i.id) ? '●' : '○'} {i.name}</span>
            <small>{i.usageCount}</small>
          </button>
        ))}
      </div>
    </>
  );
}
