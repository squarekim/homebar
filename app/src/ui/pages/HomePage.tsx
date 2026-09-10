import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs } from '../../hooks/useData';
import { whatToDrink, recommendCocktails, RecommendMode } from '../../services/recommendationService';
import { calculatePurchases } from '../../services/purchaseService';
import { RecCard, ChipRow, StatusBadge } from '../components/common';
import { SERVING_LABELS_KO } from '../../models/types';
import { IS_BETA } from '../../config';

const WELCOME_KEY = 'homebar.welcome.v1';

type Go = (t: 'home' | 'homebar' | 'whisky' | 'recommend' | 'profile', sub?: 'cocktail' | 'stock' | 'ingredient') => void;

function readDismissed(): boolean {
  try { return localStorage.getItem(WELCOME_KEY) === '1'; } catch { return false; }
}

/** 링크로 처음 들어온 사람에게 "이게 뭐고 뭘 누르면 되는지"를 한 화면에 준다. 닫으면 이 브라우저에서 다시 안 뜬다. */
function Welcome({ go }: { go: Go }) {
  const { openAdd } = useUI();
  const [hidden, setHidden] = useState(true);
  useEffect(() => { setHidden(readDismissed()); }, []);
  if (hidden) return null;
  const close = () => {
    setHidden(true);
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* 저장 불가여도 화면은 닫힌다 */ }
  };
  return (
    <div className="hero">
      <button className="close" onClick={close} aria-label="닫기">×</button>
      <b>지금 내 술로 뭘 만들 수 있는지부터</b>
      <p>
        보유 재료를 체크하면 레시피 202종을 즉시 대조해 <em>정규 · 근사 · 부족</em>으로 갈라줍니다.
        재료 하나를 더 사면 몇 종이 열리는지, 내 취향에 뭐가 맞는지까지 계산합니다.
      </p>
      {IS_BETA && (
        <p className="betaline">
          베타라 <b>오너의 홈바가 그대로 들어 있습니다.</b> 마음대로 눌러보세요 —
          바꾼 내용은 <b>이 브라우저에만</b> 저장되고 원본은 그대로입니다.
        </p>
      )}
      <div className="btnrow">
        <button className="btn primary" onClick={() => go('homebar', 'stock')}>내 재고로 맞추기</button>
        <button className="btn" onClick={() => openAdd()}>술 추가</button>
        <button className="btn ghost" onClick={close}>닫기</button>
      </div>
    </div>
  );
}

const MODES: { v: RecommendMode; label: string }[] = [
  { v: 'available', label: '있는 재료만' },
  { v: 'sweet', label: '달달한' },
  { v: 'refreshing', label: '상큼한' },
  { v: 'strong', label: '강한' },
  { v: 'light', label: '가벼운' },
  { v: 'whisky', label: '위스키' },
];

export function HomePage({ go }: { go: Go }) {
  const ctx = useRecommendContext();
  const { openCocktail, openLog } = useUI();
  const logs = useLogs();
  const [mode, setMode] = useState<RecommendMode>('available');

  const today = useMemo(() => whatToDrink(ctx, mode, 5), [ctx, mode]);
  const ready = useMemo(() => recommendCocktails(ctx, 'available', 6), [ctx]);
  const buys = useMemo(() => calculatePurchases(ctx, 3), [ctx]);
  const recent = logs.slice(0, 4);

  return (
    <>
      <Welcome go={go} />
      <div className="sechead">오늘 뭐 마실까</div>
      <ChipRow value={mode} options={MODES} onChange={setMode} />
      <div className="list">
        {today.length === 0 && <div className="empty">추천할 항목이 없습니다. 홈바에서 보유 재료를 등록하세요.</div>}
        {today.map((r) => (
          <RecCard key={r.kind + r.id} rec={r}
            onClick={() => r.kind === 'cocktail' ? openCocktail(r.id) : openLog({ drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' })} />
        ))}
      </div>

      <div className="sechead">바로 제조 가능</div>
      <div className="list">
        {ready.map((r) => (
          <button className={`card row v${r.status}`} key={r.id} onClick={() => openCocktail(r.id)}>
            <h3>{r.name}<em>{r.status && <StatusBadge status={r.status} />}</em></h3>
            <div className="rs" style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{r.reason}</div>
          </button>
        ))}
      </div>

      <div className="sechead">최근 기록</div>
      {recent.length === 0
        ? <div className="hint">아직 기록이 없습니다. 추천 카드나 레시피에서 “기록하기”를 눌러보세요.</div>
        : <div className="list">
            {recent.map((l) => (
              <div className="card" key={l.id}>
                <h3>{l.drinkName}<em>{new Date(l.date).toLocaleDateString('ko')}</em></h3>
                <div className="meta">
                  <span className="mi">{SERVING_LABELS_KO[l.servingStyle]}</span>
                  <span className="mi">{'★'.repeat(l.rating)}{'☆'.repeat(5 - l.rating)}</span>
                  {l.retryIntent && <span className="mi">재음용</span>}
                </div>
              </div>
            ))}
          </div>}

      <div className="sechead">추천 구매</div>
      <div className="list">
        {buys.map((b) => (
          <button className="card" key={b.ingredientId} onClick={() => go('recommend')}>
            <h3>{b.name}<em className="delta">+{b.addedRecipes}종</em></h3>
            <div className="rs" style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{b.reason}</div>
          </button>
        ))}
      </div>
    </>
  );
}
