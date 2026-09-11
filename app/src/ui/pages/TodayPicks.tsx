/**
 * TodayPicks — 홈 첫 화면의 추천. 이슈 #1 의 '바 메뉴판' 방향을 이 블록에만 적용했다.
 *
 * 메뉴판이 그렇듯 잔 이름이 가장 크고, 맛이 그 다음이며, 점수는 적지 않는다.
 * 재료 상태도 평소와 다를 때만 적는다 — 레시피대로 만들 수 있는 건 기본값이라
 * 모든 줄에 "만들 수 있어요"를 붙이면 아무것도 알려주지 못한다.
 * 대표 한 잔 · 성격이 다른 선택지 둘 · 추천 근거(접힘) 순서다.
 */
import { useState } from 'react';
import { STATUS_SENTENCE_KO } from '../../services/availabilityService';
import { IconMartini, IconWhisky } from '../components/icons';
import { type RecommendationResult } from '../../models/types';

/** 평소와 다를 때만 한 줄. 정상이면 아무것도 적지 않는다(위스키는 이미 병에 있다). */
export function availabilityLine(rec: RecommendationResult): { text: string; cls: string } | null {
  if (rec.kind === 'whisky' || !rec.status) return null;
  const text = STATUS_SENTENCE_KO[rec.status];
  return text ? { text, cls: rec.status } : null;
}

/** 사진이 없는 항목의 기본 표현 — 잔 모양 하나로 통일한다 */
function GlassMark({ kind }: { kind: RecommendationResult['kind'] }) {
  return <span className="glass" aria-hidden="true">{kind === 'whisky' ? <IconWhisky /> : <IconMartini />}</span>;
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
  const av = availabilityLine(rec);
  return (
    <article className="pick lead">
      <div className="kicker">오늘의 한 잔</div>
      <GlassMark kind={rec.kind} />
      <h3>{rec.name}</h3>
      {rec.flavorWords.length > 0 && <p className="taste">{rec.flavorWords.join(' · ')}</p>}
      {rec.base && <p className="sub">{rec.base} 베이스</p>}
      {av && <div className={`avail a-${av.cls}`}>{av.text}</div>}
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
  const av = availabilityLine(rec);
  return (
    <button className="pick alt" onClick={onOpen}>
      <span className="line">
        <span className="nm">{rec.name}</span>
        <span className="taste">{rec.flavorWords.join(' · ')}</span>
      </span>
      <span className="foot">
        {rec.base && <span className="sub">{rec.base} 베이스</span>}
        {av && <span className={`avail a-${av.cls}`}>{av.text}</span>}
      </span>
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
    <section className="menucard">
      <Hero rec={hero} onOpen={() => onOpen(hero)} />
      {alts.length > 0 && (
        <>
          <div className="rule"><span>다른 성격으로</span></div>
          <div className="picks">
            {alts.map((r) => <Alt key={r.kind + r.id} rec={r} onOpen={() => onOpen(r)} />)}
          </div>
        </>
      )}
      <div className="basis">
        {hasTaste ? '취향 설정과 보유 재료를 함께 봤습니다.' : '취향을 아직 설정하지 않아 보유 재료 기준으로 골랐습니다.'}
        <button className="lnk" onClick={onMore}>추천 더 보기</button>
      </div>
    </section>
  );
}
