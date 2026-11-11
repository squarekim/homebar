/**
 * TodayReel — '오늘의 잔' 카드 고르기.
 * 후보 잔이 뒷면 카드로 펠트 위에 넓게 펼쳐져 있고, 마음에 드는 카드를 직접 누르면 그 카드가 앞으로 나와 뒤집힌다.
 * "대신 골라 주기" 버튼은 카드를 한 번 모았다 다시 펼친 뒤 아무 카드나 대신 골라 준다.
 * 어느 카드를 눌러도 나오는 잔은 추천 순서에 따른 가중 무작위다(pickService). 무작위는 '어느 잔을 고르나'에만 쓴다.
 * 카드 앞면 그림은 LeadArt(GlassArt·NeatPour) 그대로다. 움직임은 CSS transition 으로만 한다.
 */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LeadArt } from './Mark';
import { weightedPick } from '../../services/pickService';
import { type RecommendationResult } from '../../models/types';

const HAND = 7;  // 펼쳐 보이는 카드 수(후보가 더 많아도 7장)

type Phase = 'idle' | 'shuffle' | 'done';
interface Pose { x: number; y: number; r: number; s: number; back: boolean; z: number; dim: boolean; ms: number; delay: number }

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 펠트 위에 넓게 펼친 카드 — 가운데가 내 쪽(아래), 양끝은 호를 따라 올라가며 바깥으로 기운다. 한 장씩 눌러 고를 수 있게 간격을 둔다 */
function spread(k: number): Pose[] {
  const mid = (k - 1) / 2;
  const gap = k > 5 ? 38 : 50; // 휴대폰 무대(390px)에 7장이 잘리지 않는 간격
  return Array.from({ length: k }, (_, i) => {
    const o = i - mid;
    return { x: o * gap, y: -4 + o * o * 2.2, r: o * 4.5, s: .86, back: true, z: i, dim: false, ms: 420, delay: i * 45 };
  });
}

/** 한데 모은 덱 */
function gathered(k: number): Pose[] {
  return Array.from({ length: k }, (_, j) => ({ x: 0, y: 6, r: (j - (k - 1) / 2) * .8, s: .9, back: true, z: j, dim: false, ms: 300, delay: j * 15 }));
}

/** 고른 카드 j 가 앞으로 나온 모습. 나머지는 펼친 자리에서 뒤로 물러나 흐려진다 */
function chosen(k: number, j: number, back: boolean): Pose[] {
  const base = spread(k);
  return base.map((p, i) => i === j
    ? { x: 0, y: back ? 22 : 30, r: 0, s: back ? 1.14 : 1.28, back, z: 100, dim: false, ms: back ? 360 : 460, delay: 0 }
    : { ...p, y: p.y - 22, s: .78, dim: true, ms: 380, delay: 0 });
}

function Face({ r }: { r: RecommendationResult }) {
  return (
    <>
      <LeadArt base={r.base} kind={r.kind} size={72}
        cocktailId={r.kind === 'cocktail' ? r.id : undefined}
        bottleId={r.kind === 'whisky' ? r.id : undefined} />
      <span className="cardname">{r.name}</span>
    </>
  );
}

export function TodayReel({ picks, onPicked, between, children }: {
  picks: RecommendationResult[];
  /** 뒤집힌 카드(null 이면 아직 고르지 않음) */
  onPicked: (r: RecommendationResult | null) => void;
  /** 카드와 버튼 사이(맛 칩) */
  between?: ReactNode;
  /** 결과 영역 — 고른 뒤에만 보인다 */
  children?: (again: () => void) => ReactNode;
}) {
  const k = Math.min(HAND, picks.length);
  const [phase, setPhase] = useState<Phase>('idle');
  const [poses, setPoses] = useState<Pose[]>(() => spread(k));
  /** 카드 j 의 앞면에 보일 후보 번호 */
  const [faces, setFaces] = useState<number[]>(() => Array.from({ length: k }, (_, i) => i));
  const [picked, setPicked] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const last = useRef<number | null>(null);
  const pending = useRef<{ card: number; i: number } | null>(null);

  const clear = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; };
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  // 후보가 바뀌면(칩 선택·술장 변경) 다시 펼친다
  useEffect(() => {
    clear();
    last.current = null;
    pending.current = null;
    setPhase('idle');
    setPicked(null);
    setPoses(spread(k));
    setFaces(Array.from({ length: k }, (_, i) => i));
    onPicked(null);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks]);

  const finish = (card: number, i: number) => {
    clear();
    pending.current = null;
    setFaces((f) => f.map((v, j) => (j === card ? i : v)));
    setPicked(card);
    setPoses(chosen(k, card, false));
    setPhase('done');
    onPicked(picks[i] ?? null);
  };

  /** 카드 한 장을 고른다 — 그 카드가 앞으로 나와서 뒤집힌다 */
  const choose = (card: number) => {
    if (!k || phase !== 'idle') return;
    const i = weightedPick(picks.length, last.current);
    last.current = i;
    onPicked(null);
    if (reduceMotion()) { finish(card, i); return; }
    pending.current = { card, i };
    setPhase('shuffle');
    setFaces((f) => f.map((v, j) => (j === card ? i : v)));
    setPicked(card);
    setPoses(chosen(k, card, true));
    at(380, () => setPoses(chosen(k, card, false)));
    at(860, () => { pending.current = null; setPhase('done'); onPicked(picks[i] ?? null); });
  };

  /** 버튼 — 모았다 다시 펼친 뒤 아무 카드나 대신 고른다. 도는 중에 누르면 바로 결과로 */
  const pick = () => {
    if (!k) return;
    if (phase === 'shuffle') {
      const p = pending.current;
      if (p) finish(p.card, p.i);
      return;
    }
    if (phase === 'done') { again(); return; }
    const card = Math.floor(Math.random() * k);
    if (reduceMotion()) { choose(card); return; }
    setPhase('shuffle');
    setPoses(gathered(k));
    at(380, () => setPoses(spread(k)));
    at(900, () => { setPhase('idle'); });
    at(920, () => chooseLater(card));
  };
  // pick 안의 타이머가 부를 때 phase 는 이미 'idle' 로 바뀐 뒤라 choose 의 검사를 그대로 쓴다
  const chooseRef = useRef(choose);
  chooseRef.current = choose;
  const chooseLater = (card: number) => chooseRef.current(card);

  /** 다시 고르기 — 모았다가 다시 펼쳐서 새로 고를 수 있게 둔다 */
  const again = () => {
    clear();
    pending.current = null;
    setPicked(null);
    onPicked(null);
    if (reduceMotion()) { setPoses(spread(k)); setPhase('idle'); return; }
    setPhase('shuffle');
    setPoses(gathered(k));
    at(360, () => { setFaces(Array.from({ length: k }, (_, i) => i)); setPoses(spread(k)); });
    at(820, () => setPhase('idle'));
  };

  return (
    <>
      <div className={`stage${phase === 'done' ? ' lit' : ''}`}>
        <div className="deck">
          {poses.map((p, j) => {
            const r = picks[faces[j] ?? j];
            if (!r) return null;
            return (
              <button key={j} type="button" tabIndex={phase === 'idle' ? 0 : -1}
                className={`card${p.dim ? ' dim' : ''}${phase === 'idle' ? ' pickable' : ''}${picked === j ? ' chosen' : ''}`}
                aria-label={`${j + 1}번째 카드 고르기`} disabled={phase !== 'idle'} onClick={() => choose(j)} style={{
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${p.s}) rotateY(${p.back ? 180 : 0}deg)`,
                transitionDuration: `${p.ms}ms`, transitionDelay: `${p.delay}ms`, zIndex: p.z,
              }}>
                <span className="lift">
                  <span className="face"><Face r={r} /></span>
                  <span className="back"><span>Homebar</span></span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {between}
      {phase === 'done' && children ? children(again) : (
        <div className="reelact">
          <button className="btn primary big" onClick={pick} disabled={!k}>
            {phase === 'shuffle' ? '바로 보기' : '대신 골라 주기'}
          </button>
          <p className="hint">{phase === 'shuffle' ? '카드를 뒤집는 중이에요' : '마음에 드는 카드를 눌러 보세요. 취향에 가까운 잔일수록 자주 나와요'}</p>
        </div>
      )}
    </>
  );
}
