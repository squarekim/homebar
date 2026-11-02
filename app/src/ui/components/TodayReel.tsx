/**
 * TodayReel — '오늘의 잔' 카드 셔플.
 * 후보 잔이 앞면 카드로 부채꼴로 펼쳐져 있다가, 고르기를 누르면 모여서 뒤집히고
 * 세 번 섞인 뒤 맨 위 한 장이 펜던트 조명 아래로 나와 앞면으로 뒤집힌다.
 * 카드 앞면 그림은 LeadArt(GlassArt·NeatPour) 그대로다. 움직임은 CSS transition 으로만 한다.
 */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LeadArt } from './Mark';
import { weightedPick } from '../../services/pickService';
import { type RecommendationResult } from '../../models/types';

const HAND = 7;  // 펼쳐 보이는 카드 수(후보가 더 많아도 덱은 7장)

type Phase = 'idle' | 'shuffle' | 'done';
interface Pose { x: number; y: number; r: number; s: number; back: boolean; z: number; dim: boolean; ms: number; delay: number }

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 부채꼴 — 가운데 카드가 가장 높다 */
function fan(k: number): Pose[] {
  const mid = (k - 1) / 2;
  return Array.from({ length: k }, (_, i) => {
    const o = i - mid;
    return { x: o * 27, y: Math.abs(o) * 4, r: o * 6, s: 1, back: false, z: i, dim: false, ms: 420, delay: 0 };
  });
}

/** 맨 위 카드가 앞으로 나와 앞면으로 뒤집힌 끝 모습 */
function dealt(k: number, top: number, back: boolean): Pose[] {
  return Array.from({ length: k }, (_, i) => i === top
    ? { x: 0, y: 16, r: 0, s: 1.28, back, z: 100, dim: false, ms: back ? 380 : 460, delay: 0 }
    : { x: (i % 2 ? 1 : -1) * 6, y: 26, r: (i % 3 - 1) * 2.5, s: .9, back: true, z: i, dim: true, ms: 380, delay: 0 });
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
  const top = k - 1;
  const [phase, setPhase] = useState<Phase>('idle');
  const [poses, setPoses] = useState<Pose[]>(() => fan(k));
  /** 카드 j 의 앞면에 보일 후보 번호 */
  const [faces, setFaces] = useState<number[]>(() => Array.from({ length: k }, (_, i) => i));
  const timers = useRef<number[]>([]);
  const last = useRef<number | null>(null);
  const winner = useRef<number | null>(null);

  const clear = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; };
  const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  // 후보가 바뀌면(칩 선택·술장 변경) 다시 부채꼴로
  useEffect(() => {
    clear();
    last.current = null;
    winner.current = null;
    setPhase('idle');
    setPoses(fan(k));
    setFaces(Array.from({ length: k }, (_, i) => i));
    onPicked(null);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks]);

  const finish = (i: number) => {
    clear();
    setFaces((f) => f.map((v, j) => (j === top ? i : v)));
    setPoses(dealt(k, top, false));
    setPhase('done');
    onPicked(picks[i] ?? null);
  };

  const pick = () => {
    if (!k) return;
    if (phase === 'shuffle') { finish(winner.current!); return; }   // 건너뛰기
    const i = weightedPick(picks.length, last.current);
    last.current = i;
    winner.current = i;
    onPicked(null);
    if (reduceMotion()) { finish(i); return; }
    setPhase('shuffle');

    // 1) 모아서 뒤집기
    setPoses(Array.from({ length: k }, (_, j) => ({ x: 0, y: 0, r: (j - top / 2) * .8, s: 1, back: true, z: j, dim: false, ms: 320, delay: j * 18 })));
    // 2) 세 번 섞기 — 반으로 갈라 벌렸다가 엇갈려 끼운다
    for (let round = 0; round < 3; round++) {
      const t0 = 420 + round * 500;
      at(t0, () => setPoses(Array.from({ length: k }, (_, j) => {
        const left = (j + round) % 2 === 0;
        return { x: left ? -62 : 62, y: -4, r: left ? -9 : 9, s: 1, back: true, z: j, dim: false, ms: 200, delay: 0 };
      })));
      at(t0 + 230, () => setPoses(Array.from({ length: k }, (_, j) => ({
        x: 0, y: 0, r: ((j * 7 + round * 3) % 5 - 2) * .9, s: 1, back: true,
        z: (j * 3 + round) % k, dim: false, ms: 210, delay: (j % 2 ? 1 : 0) * 30 + Math.floor(j / 2) * 22,
      }))));
    }
    // 3) 맨 위 한 장을 앞으로 → 4) 앞면으로 뒤집기
    at(1950, () => {
      setFaces((f) => f.map((v, j) => (j === top ? i : v)));
      setPoses(dealt(k, top, true));
    });
    at(2380, () => setPoses(dealt(k, top, false)));
    at(2860, () => { setPhase('done'); onPicked(picks[i] ?? null); });
  };

  return (
    <>
      <div className={`stage${phase === 'done' ? ' lit' : ''}`} aria-hidden="true">
        <div className="lamp" />
        <div className="cone" />
        <div className="deck">
          {poses.map((p, j) => {
            const r = picks[faces[j] ?? j];
            if (!r) return null;
            return (
              <div key={j} className={`card${p.dim ? ' dim' : ''}`} style={{
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${p.s}) rotateY(${p.back ? 180 : 0}deg)`,
                transitionDuration: `${p.ms}ms`, transitionDelay: `${p.delay}ms`, zIndex: p.z,
              }}>
                <div className="face"><Face r={r} /></div>
                <div className="back"><span>홈바</span></div>
              </div>
            );
          })}
        </div>
      </div>
      {between}
      {phase === 'done' && children ? children(pick) : (
        <div className="reelact">
          <button className="btn primary big" onClick={pick} disabled={!k}>
            {phase === 'shuffle' ? '건너뛰기' : '한 잔 고르기'}
          </button>
          <p className="hint">{phase === 'shuffle' ? '카드를 섞는 중이에요' : '취향에 가까운 잔일수록 자주 나와요'}</p>
        </div>
      )}
    </>
  );
}
