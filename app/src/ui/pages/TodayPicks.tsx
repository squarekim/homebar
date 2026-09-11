/**
 * TodayPicks — 홈 첫 화면의 추천.
 *
 * 이슈 #1 의 홈 항목을 그대로 옮겼다: 대표 한 잔을 크게, 성격이 다른 선택지 둘을 그 아래.
 * 카드 앞면에 있어야 할 것은 네 가지다 — 술 이름 · 맛의 방향 · 재료가 되는지 · 레시피로 가는 길.
 * 점수(총점·취향·가용·재고)는 계산 결과지 고르는 이유가 아니라서 '추천 근거'를 눌러야 나온다.
 */
import { useState } from 'react';
import { STATUS_SENTENCE_KO } from '../../services/availabilityService';
import { type RecommendationResult } from '../../models/types';

/** 이 잔을 지금 만들 수 있는지 한 줄로. 위스키는 판정 대상이 아니라 이미 병에 있다. */
function availability(rec: RecommendationResult): { text: string; cls: string } {
  if (rec.kind === 'whisky') return { text: '병에 있어요', cls: 'READY' };
  const status = rec.status ?? 'UNAVAILABLE';
  return { text: STATUS_SENTENCE_KO[status], cls: status };
}

/** 맛의 방향 · 기주 — 이름 다음에 읽히는 한 줄 */
function taste(rec: RecommendationResult): string {
  const words = rec.flavorWords.join(' · ');
  if (!rec.base) return words;
  return words ? `${words} · ${rec.base} 베이스` : `${rec.base} 베이스`;
}

/** 점수 네 개. 숫자를 궁금해하는 사람에게만 보인다. */
function Why({ rec }: { rec: RecommendationResult }) {
  return (
    <div className="why">
      <p>{rec.reason}</p>
      <div className="subscores">
        <span className="ss">총점 <b>{rec.score}</b></span>
        <span className="ss">취향 <b>{rec.tasteScore}</b></span>
        {rec.kind === 'cocktail' && <span className="ss">가용 <b>{rec.availabilityScore}</b></span>}
        {rec.kind === 'cocktail' && <span className="ss">재고 <b>{rec.inventoryScore}</b></span>}
        <span className="ss">신선 <b>{rec.noveltyScore}</b></span>
      </div>
    </div>
  );
}

function Hero({ rec, onOpen }: { rec: RecommendationResult; onOpen: () => void }) {
  const [why, setWhy] = useState(false);
  const av = availability(rec);
  return (
    <article className="pick hero">
      <div className="kicker">오늘의 한 잔</div>
      <h3>{rec.name}</h3>
      <p className="taste">{taste(rec)}</p>
      <div className={`avail a-${av.cls}`}>{av.text}</div>
      <div className="btnrow">
        <button className="btn primary" onClick={onOpen}>
          {rec.kind === 'cocktail' ? '레시피 보기' : '기록하기'}
        </button>
        <button className="btn ghost" onClick={() => setWhy((v) => !v)} aria-expanded={why}>
          {why ? '근거 접기' : '추천 근거'}
        </button>
      </div>
      {why && <Why rec={rec} />}
    </article>
  );
}

function Alt({ rec, onOpen }: { rec: RecommendationResult; onOpen: () => void }) {
  const av = availability(rec);
  return (
    <button className="pick alt" onClick={onOpen}>
      <span className="nm">{rec.name}</span>
      <span className="taste">{taste(rec)}</span>
      <span className={`avail a-${av.cls}`}>{av.text}</span>
    </button>
  );
}

export function TodayPicks({ picks, hasTaste, onOpen, onMore }: {
  picks: RecommendationResult[];
  hasTaste: boolean;
  onOpen: (rec: RecommendationResult) => void;
  onMore: () => void;
}) {
  const [hero, ...alts] = picks;
  if (!hero) {
    return <div className="empty">추천할 항목이 없습니다. 술장 → 재고에서 보유 재료를 등록하세요.</div>;
  }
  return (
    <>
      <Hero rec={hero} onOpen={() => onOpen(hero)} />
      {alts.length > 0 && (
        <>
          <div className="sechead sm">다른 성격으로</div>
          <div className="picks">
            {alts.map((r) => <Alt key={r.kind + r.id} rec={r} onOpen={() => onOpen(r)} />)}
          </div>
        </>
      )}
      <div className="basis">
        {hasTaste ? '취향 설정과 보유 재료를 함께 봤습니다.' : '취향을 아직 설정하지 않아 보유 재료 기준으로 골랐습니다.'}
        <button className="lnk" onClick={onMore}>추천 더 보기</button>
      </div>
    </>
  );
}
