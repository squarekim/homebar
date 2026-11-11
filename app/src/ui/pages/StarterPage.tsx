/**
 * StarterPage — 입문 취향 찾기 (초안).
 * 술을 얼마나 마시나 → 평소 마시는 것 고르기 → 도수 → 예산 → 위스키·칵테일 추천 순서다.
 * 카드는 한 번 누르면 좋아요, 두 번 누르면 별로, 세 번 누르면 원래대로 돌아간다.
 * 결과는 아직 취향 프로필에 저장하지 않는다.
 */
import { useMemo, useState } from 'react';
import { useUI } from '../UIContext';
import { ChipRow } from '../components/common';
import {
  HABITS, STRENGTHS, BUDGETS,
  type DrinkHabit, type StrengthPref, type BudgetKey, type TasteCard,
} from '../../data/starterGuide';
import { cardsFor, examplesFor, starterRecommend, type StarterResult } from '../../services/starterService';

type Step = 'habit' | 'cards' | 'strength' | 'budget' | 'result';
type Mark = 'like' | 'dislike';

const STEPS: Step[] = ['habit', 'cards', 'strength', 'budget', 'result'];
const DIFFICULTY_KO = { 1: '바로 마셔요', 2: '도구 하나', 3: '손이 더 가요' } as const;

function CardChip({ card, mark, onToggle }: { card: TasteCard; mark: Mark | undefined; onToggle: () => void }) {
  const ex = examplesFor(card, 3);
  return (
    <button className={`chip ${mark === 'like' ? 'ok' : mark === 'dislike' ? 'no' : ''}`}
      aria-pressed={!!mark} onClick={onToggle} title={ex.length ? `예: ${ex.join(', ')}` : undefined}>
      {mark === 'like' ? '좋아요 · ' : mark === 'dislike' ? '별로 · ' : ''}{card.name}
    </button>
  );
}

function ResultRow({ r, onOpen }: { r: StarterResult; onOpen?: () => void }) {
  const foot = [
    r.flavorWords.join(' · '),
    r.abv ? `${r.abv}%` : '',
    r.pick.kind === 'whisky' ? (r.priceLabel ? `약 ${r.priceLabel}` : '가격 확인 중') : DIFFICULTY_KO[r.pick.difficulty],
  ].filter(Boolean).join(' · ');
  const body = (
    <div className="body">
      <span className="nm">{r.name}</span>
      <div className="taste">{r.pick.reason}</div>
      <div className="foot"><span className="sub">{foot}</span></div>
    </div>
  );
  return onOpen
    ? <button className="rowitem" onClick={onOpen}>{body}</button>
    : <div className="rowitem">{body}</div>;
}

export function StarterPage() {
  const { openCocktail, goTab } = useUI();
  const [step, setStep] = useState<Step>('habit');
  const [habit, setHabit] = useState<DrinkHabit>('sometimes');
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [strength, setStrength] = useState<StrengthPref>('unknown');
  const [budget, setBudget] = useState<BudgetKey>('unknown');

  const cards = useMemo(() => cardsFor(habit), [habit]);
  const result = useMemo(() => {
    if (step !== 'result') return null;
    const ids = Object.keys(marks);
    return starterRecommend({
      habit, strength, budget,
      likes: ids.filter((id) => marks[id] === 'like'),
      dislikes: ids.filter((id) => marks[id] === 'dislike'),
    });
  }, [step, habit, marks, strength, budget]);

  const toggle = (id: string) => setMarks((m) => {
    const next = { ...m };
    if (!m[id]) next[id] = 'like';
    else if (m[id] === 'like') next[id] = 'dislike';
    else delete next[id];
    return next;
  });

  const at = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(at + 1, STEPS.length - 1)]!);
  const back = () => setStep(STEPS[Math.max(at - 1, 0)]!);

  return (
    <>
      <h2 className="pagetitle">
        취향 찾기
        <span className="sub">평소 마시는 걸 고르면 처음 마셔 볼 위스키와 칵테일을 골라 드려요.</span>
      </h2>

      {step === 'habit' && (
        <>
          <div className="sechead sm">술 좋아하세요?</div>
          <ChipRow value={habit} options={HABITS} onChange={setHabit} />
        </>
      )}

      {step === 'cards' && (
        <>
          <div className="sechead sm">평소 마시는 걸 골라 주세요</div>
          <p className="hint">한 번 누르면 좋아요, 두 번 누르면 별로예요. 안 마셔 본 건 그냥 두세요.</p>
          <div className="controls">
            {cards.map((c) => <CardChip key={c.id} card={c} mark={marks[c.id]} onToggle={() => toggle(c.id)} />)}
          </div>
        </>
      )}

      {step === 'strength' && (
        <>
          <div className="sechead sm">술은 어느 정도로 마시고 싶어요?</div>
          <ChipRow value={strength} options={STRENGTHS} onChange={setStrength} />
        </>
      )}

      {step === 'budget' && (
        <>
          <div className="sechead sm">한 병에 이 정도까지는 쓸 수 있어요</div>
          <ChipRow value={budget} options={BUDGETS} onChange={setBudget} />
        </>
      )}

      {step === 'result' && result && (
        <>
          {!result.taste && <p className="hint">고른 게 없어서 처음 마시기 쉬운 것부터 보여 드려요.</p>}
          {habit === 'rarely' ? (
            <>
              <div className="sechead">칵테일</div>
              <div className="rowlist">{result.cocktails.map((r) => <ResultRow key={r.pick.id} r={r} onOpen={() => openCocktail(r.pick.id)} />)}</div>
              <div className="sechead">위스키</div>
              <div className="rowlist">{result.whiskies.map((r) => <ResultRow key={r.pick.id} r={r} />)}</div>
            </>
          ) : (
            <>
              <div className="sechead">위스키</div>
              {result.whiskies.length === 0
                ? <div className="empty">이 예산에 맞는 입문 위스키가 아직 없어요.</div>
                : <div className="rowlist">{result.whiskies.map((r) => <ResultRow key={r.pick.id} r={r} />)}</div>}
              <div className="sechead">칵테일</div>
              <div className="rowlist">{result.cocktails.map((r) => <ResultRow key={r.pick.id} r={r} onOpen={() => openCocktail(r.pick.id)} />)}</div>
            </>
          )}
        </>
      )}

      <div className="btnrow">
        {at > 0 && <button className="btn" onClick={back}>이전</button>}
        {step !== 'result' && <button className="btn primary" onClick={next}>{step === 'budget' ? '추천 보기' : '다음'}</button>}
        {step === 'result' && <button className="btn" onClick={() => { setMarks({}); setStep('habit'); }}>처음부터</button>}
        <button className="btn" onClick={() => goTab('today')}>닫기</button>
      </div>
    </>
  );
}
