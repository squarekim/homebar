import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { useRecommendContext } from '../../hooks/useRecommendContext';
import { useLogs } from '../../hooks/useData';
import { whatToDrink, RecommendMode } from '../../services/recommendationService';
import { RecCard, ChipRow } from '../components/common';
import { CocktailRec, WhiskyRec, GroupRec, ClearStockRec, PurchaseRec, MODES } from './RecommendPage';
import { SERVING_LABELS_KO } from '../../models/types';
import { IS_BETA } from '../../config';

const WELCOME_KEY = 'homebar.welcome.v1';

type Go = (t: 'home' | 'homebar' | 'whisky' | 'cellar' | 'profile', sub?: 'cocktail' | 'simple' | 'ingredient' | 'bottles' | 'stock') => void;

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
        <button className="btn primary" onClick={() => go('cellar', 'stock')}>내 재고로 맞추기</button>
        <button className="btn" onClick={() => openAdd()}>술 추가</button>
        <button className="btn ghost" onClick={close}>닫기</button>
      </div>
    </div>
  );
}

type HomeSub = 'today' | 'cocktail' | 'whisky' | 'group' | 'purchase' | 'clearstock';

const HOME_SUBS: [HomeSub, string][] = [
  ['today', '오늘'], ['cocktail', '칵테일 추천'], ['whisky', '위스키 추천'],
  ['group', '그룹'], ['purchase', '구매'], ['clearstock', '재고 소진'],
];

export function HomePage({ go }: { go: Go }) {
  const ctx = useRecommendContext();
  const { openCocktail, openLog } = useUI();
  const logs = useLogs();
  const [sub, setSub] = useState<HomeSub>('today');
  const [mode, setMode] = useState<RecommendMode>('available');

  const today = useMemo(() => whatToDrink(ctx, mode, 6), [ctx, mode]);
  const recent = logs.slice(0, 4);

  return (
    <>
      <Welcome go={go} />
      <div className="controls strip">
        {HOME_SUBS.map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={sub === v} onClick={() => setSub(v)}>{l}</button>
        ))}
      </div>

      {sub === 'today' && (
        <>
          <div className="sechead">오늘 뭐 마실까</div>
          <ChipRow value={mode} options={MODES} onChange={setMode} />
          <div className="list">
            {today.length === 0 && <div className="empty">추천할 항목이 없습니다. 술장 → 재고에서 보유 재료를 등록하세요.</div>}
            {today.map((r) => (
              <RecCard key={r.kind + r.id} rec={r}
                onClick={() => r.kind === 'cocktail' ? openCocktail(r.id) : openLog({ drinkId: r.id, drinkType: 'whisky', drinkName: r.name, servingStyle: 'neat' })} />
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
        </>
      )}

      {sub === 'cocktail' && <CocktailRec />}
      {sub === 'whisky' && <WhiskyRec />}
      {sub === 'group' && <GroupRec />}
      {sub === 'purchase' && <PurchaseRec />}
      {sub === 'clearstock' && <ClearStockRec />}
    </>
  );
}
