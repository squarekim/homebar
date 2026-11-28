/**
 * TodayPage — '메인'. 오늘의 잔과 입문을 한 화면에 둔다.
 * 샘플 안내 → 오늘의 잔(TodayEditorial) → 다르게 골라 보기 → 최근 기록 순서다.
 * 첫 화면이 답해야 할 것은 넷뿐이다: 무엇을 마실까 · 무슨 맛인가 · 지금 만들 수 있나 · 뭘 누르면 되나.
 * 뽑기 후보는 지금 만들 수 있는 잔뿐이다(칩으로 좁혀도 같다). 점수는 여기서 말하지 않는다.
 * 폰과 PC가 같은 지면을 쓴다. 좁은 화면에서는 위아래로 쌓인다.
 */
import { IconMartini, IconWhisky } from '../components/icons';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs, useHeldIds } from '../../hooks/useData';
import { whatToDrink, type RecommendMode, interleaveByBase } from '../../services/recommendationService';
import { ChipRow, FilterButton, LogCard, allChips, useFilterDismiss } from '../components/common';
import { referenceRepo } from '../../repositories/referenceRepo';
import { MODES, GroupRec, PurchaseRec, ClearStockRec } from './RecommendPage';
import { type RecommendationResult } from '../../models/types';
import { IS_BETA } from '../../config';
import { TodayEditorial } from './TodayEditorial';

/** 한 잔 고르기의 종류 필터 */
type Kind = 'all' | 'cocktail' | 'whisky';
const KINDS: { v: Kind; label: string; icon?: () => ReactElement }[] = [
  { v: 'all', label: '전체' },
  { v: 'cocktail', label: '칵테일', icon: IconMartini },
  { v: 'whisky', label: '위스키 한 잔', icon: IconWhisky },
];
/** 상황 칩 — 필터 창을 열지 않아도 바로 보이는 조건 */
type Quick = 'easy' | 'new' | 'fresh';
const QUICKS: { v: Quick; label: string }[] = [
  { v: 'easy', label: '간단하게' },
  { v: 'new', label: '안 마셔 본 잔' },
  { v: 'fresh', label: '상하기 전에' },
];
/** 며칠 안에 상하는 재료. 날짜를 적지 않으니 '가지고 있으면 먼저 쓰자'는 뜻으로만 쓴다. */
const PERISHABLE = new Set(['라임즙', '레몬즙', '라임', '레몬', '민트 잎', '계란흰자', '계란 노른자', '우유', '크림', '오렌지 주스', '파인애플 주스', '자몽 주스']);
const usesPerishable = (id: string) => !!referenceRepo.cocktailById(id)?.ingredients.some((i) => !i.optional && PERISHABLE.has(i.ingredientName.trim()));
/** 재료(선택 재료 제외) 3개 이하 */
const isEasy = (id: string) => (referenceRepo.cocktailById(id)?.ingredients.filter((i) => !i.optional).length ?? 99) <= 3;
/** 베이스 술 필터 — 레시피에 있는 베이스 순서 그대로 */
const BASES = allChips([...new Set(referenceRepo.cocktails().map((c) => c.base))], '전체');
/** 맛 필터 — 칵테일에만 적용된다. 위스키는 종류 필터로 옮겼다 */
const TASTES = MODES.filter((m) => m.v !== 'whisky').map((m) => (m.v === 'available' ? { ...m, label: '맛 전체' } : m));

type Way = 'group' | 'purchase' | 'clearstock';
const WAYS: { v: Way; label: string; hint: string }[] = [
  { v: 'group', label: '함께 마실 사람', hint: '' },
  { v: 'purchase', label: '뭘 사면 좋을까', hint: '' },
  { v: 'clearstock', label: '재고 소진', hint: '' },
];

/** 다른 기준으로 고르기 — 기존 추천 기능을 한 자리에 접어 둔다 */
function OtherWays() {
  const [way, setWay] = useState<Way | null>(null);
  return (
    <div className="more">
      <button onClick={() => setWay(way ? null : 'group')} aria-expanded={!!way}>
        {way ? '다르게 골라 보기 접기' : '다르게 골라 보기'}
      </button>
      {way && (
        <div className="inner">
          <div className="controls tight">
            {WAYS.map((w) => (
              <button key={w.v} className="chip" aria-pressed={way === w.v} onClick={() => setWay(w.v)}>{w.label}</button>
            ))}
          </div>
          {way === 'group' && <GroupRec />}
          {way === 'purchase' && <PurchaseRec />}
          {way === 'clearstock' && <ClearStockRec />}
        </div>
      )}
    </div>
  );
}

export function TodayPage() {
  const ctx = useRecommendContext();
  const { goTab, goLogs } = useUI();
  const logs = useLogs();
  const heldCount = useHeldIds().size;
  const [mode, setMode] = useState<RecommendMode>('available');
  const [kind, setKind] = useState<Kind>('all');
  const [base, setBase] = useState('all');
  const [quick, setQuick] = useState<Quick | null>(null);
  const tried = useMemo(() => new Set(logs.map((l) => l.drinkId)), [logs]);
  const byQuick = useCallback((r: RecommendationResult) => !quick || (quick === 'easy' ? r.kind === 'cocktail' && isEasy(r.id) : quick === 'fresh' ? r.kind === 'cocktail' && usesPerishable(r.id) : !tried.has(r.id)), [quick, tried]);
  const [openFilter, setOpenFilter] = useState(false);
  useFilterDismiss(openFilter, useCallback(() => setOpenFilter(false), []));
  // 넓은 PC의 메뉴 인덱스 — 위 숫자와 같은 범위 전체(만들 수 있는 칵테일 + 가진 위스키), 추천 순서
  const full = useMemo(() => {
    const ok = (r: RecommendationResult) => r.kind === 'whisky' || r.status === 'READY' || r.status === 'SUBSTITUTE';
    if (kind === 'whisky') return whatToDrink(ctx, 'whisky', 200);
    const cks = whatToDrink(ctx, mode, 400).filter((r) => r.kind === 'cocktail' && ok(r)).filter((r) => base === 'all' || r.base === base);
    const wks = kind === 'all' && base === 'all' ? whatToDrink(ctx, 'whisky', 200) : [];
    return interleaveByBase([...cks, ...wks].filter(byQuick).sort((x, y) => y.score - x.score));
  }, [ctx, mode, kind, base, byQuick]);
  // 종류 칩만 바깥에 두고, 맛과 베이스 술은 칵테일 목록처럼 "필터" 안에 모은다
  const tasteOn = mode !== 'available';
  const baseOn = base !== 'all';
  const emptyMsg = (
    <>{kind === 'whisky'
              ? <>넣은 위스키 없음</>
              : baseOn
                ? <>이 베이스 술로 만들 수 있는 잔 없음</>
              : mode === 'available'
                ? heldCount > 0
                  // 넣은 게 있는데 0잔이면 '아직 안 넣었다'로 들리지 않게 — 받았다고 먼저 말한다
                  ? <>넣은 술·재료 {heldCount}가지는 술장에 잘 들어갔어요. 지금 재료로 만들 수 있는 칵테일은 아직 없어요. 아래 '하나만 더 있으면'을 보세요.</>
                  : <>술장에 술을 넣으면 만들 수 있는 잔이 여기 나옵니다.</>
                : <>이 맛으로 만들 수 있는 잔 없음</>}</>
  );
  const filterCount = (kind !== 'whisky' && tasteOn ? 1 : 0) + (kind !== 'whisky' && baseOn ? 1 : 0);
  const filters = (
    <div className="pickfilters">
      <div className="controls tight strip">
        {/* 위스키 한 잔일 때도 자리를 지켜 칩이 옆으로 밀리지 않게 한다. 맛·베이스는 칵테일 조건이라 그때는 끈다 */}
        <FilterButton open={openFilter && kind !== 'whisky'} count={filterCount} disabled={kind === 'whisky'} onToggle={() => setOpenFilter((v) => !v)} />
        {KINDS.map((k) => (
          <button key={k.v} className={k.icon ? 'chip iconchip' : 'chip'} aria-pressed={kind === k.v} aria-label={k.label} title={k.label}
            onClick={() => setKind(k.v)}>{k.icon ? <k.icon /> : k.label}</button>
        ))}
        {QUICKS.map((q) => (
          <button key={q.v} className="chip" aria-pressed={quick === q.v} onClick={() => setQuick((v) => (v === q.v ? null : q.v))}>{q.label}</button>
        ))}
      </div>
      {openFilter && kind !== 'whisky' && (
        <div className="filterpanel">
          <div className="hint lbl">맛</div>
          <ChipRow value={mode} options={TASTES} onChange={setMode} wrap tight />
          <div className="hint lbl">베이스 술 (칵테일)</div>
          <ChipRow value={base} options={BASES} onChange={setBase} wrap tight />
          <div className="btnrow">
            <button className="btn sm ghost" onClick={() => { setMode('available'); setBase('all'); }}>필터 비우기</button>
          </div>
        </div>
      )}
    </div>
  );
  const recent = logs.slice(0, 3);

  return (
    <>
      {IS_BETA && (
        <div className="sample">
          <span><b>예시 재고</b>로 보는 중</span>
          <button className="btn sm" onClick={() => goTab('cellar')}>술장 채우기</button>
        </div>
      )}

      {/* 폰과 PC 모두 같은 지면 — 좁으면 위아래로 쌓인다(styles.css .ed) */}
      <TodayEditorial list={full} filters={filters} emptyText={emptyMsg} />

      <OtherWays />

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="empty">기록 없음</div>
        : (
          <>
            {recent.map((l) => <LogCard key={l.id} log={l} />)}
            <div className="btnrow"><button className="btn ghost" onClick={goLogs}>기록 전체 보기</button></div>
          </>
        )}
    </>
  );
}
