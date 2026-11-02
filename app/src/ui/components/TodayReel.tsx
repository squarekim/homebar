/**
 * TodayReel — '오늘의 잔' 뽑기 레일.
 * 후보 잔이 놋쇠 레일 위를 천천히 흐르다가, 고르기를 누르면 빨라졌다 느려져서
 * 가운데 펜던트 조명 아래 한 잔에 멈춘다. 멈춘 잔은 커지고 술이 차오른다.
 * 그림은 LeadArt(GlassArt·NeatPour) 그대로다. 위치는 매 프레임 transform 으로만 바꾼다.
 */
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LeadArt } from './Mark';
import { weightedPick } from '../../services/pickService';
import { type RecommendationResult } from '../../models/types';

const W = 104;          // 잔 한 칸 너비(px)
const IDLE = 16;        // 대기 중 흐르는 속도(px/s)
const SPIN_MS = 2000;   // 빨라졌다 느려지는 데 걸리는 시간
const MIN_RUN = W * 22; // 멈추기 전에 최소한 지나가는 거리

type Phase = 'idle' | 'spin' | 'done';

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function Art({ r }: { r: RecommendationResult }) {
  return <LeadArt base={r.base} kind={r.kind} size={88}
    cocktailId={r.kind === 'cocktail' ? r.id : undefined}
    bottleId={r.kind === 'whisky' ? r.id : undefined} />;
}

export function TodayReel({ picks, onPicked, between, children }: {
  picks: RecommendationResult[];
  /** 레일과 버튼 사이(맛 칩) */
  between?: ReactNode;
  /** 멈춘 잔(null 이면 아직 고르지 않음) */
  onPicked: (r: RecommendationResult | null) => void;
  /** 결과 영역 — 고른 뒤에만 보인다 */
  children?: (again: () => void) => ReactNode;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const x = useRef(0);
  const tween = useRef<{ t0: number; x0: number; d: number } | null>(null);
  const last = useRef<number | null>(null);
  const [sets, setSets] = useState(2);
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<number | null>(null);
  const [winSlot, setWinSlot] = useState<number | null>(null);
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const winnerRef = useRef(winner); winnerRef.current = winner;
  const n = picks.length;
  const total = n * sets;

  const width = () => reelRef.current?.clientWidth ?? 360;
  const center = () => width() / 2 - W / 2;
  const span = () => total * W;

  const place = useCallback(() => {
    const L = total * W;
    if (!L) return;
    itemRefs.current.forEach((el, j) => {
      if (!el) return;
      let left = (((j * W - x.current) % L) + L) % L;
      if (left > L - W * 1.5) left -= L;
      el.style.transform = `translateX(${left}px)`;
    });
  }, [total]);

  // 화면 너비를 채울 만큼 후보 묶음을 반복한다
  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!el || !n) return;
    const fit = () => setSets(Math.max(2, Math.ceil((el.clientWidth + W * 3) / (n * W))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  // 후보가 바뀌면(칩 선택·술장 변경) 처음 상태로
  useEffect(() => {
    tween.current = null;
    last.current = null;
    x.current = 0;
    setPhase('idle');
    setWinner(null);
    setWinSlot(null);
    onPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks]);

  const land = useCallback((i: number) => {
    const L = span(), c = center();
    let slot: number | null = null;
    itemRefs.current.forEach((_, j) => {
      const left = (((j * W - x.current) % L) + L) % L;
      if (j % n === i && Math.abs(left - c) < 2) slot = j;
    });
    setWinSlot(slot);
    setPhase('done');
    onPicked(picks[i] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, total, picks, onPicked]);

  useEffect(() => {
    let raf = 0, prev = 0;
    const frame = (t: number) => {
      const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
      prev = t;
      const tw = tween.current;
      if (tw) {
        const p = Math.min(1, (t - tw.t0) / SPIN_MS);
        x.current = tw.x0 + tw.d * easeInOut(p);
        if (p >= 1) { tween.current = null; land(winnerRef.current!); }
      } else if (phaseRef.current === 'idle' && !reduceMotion()) {
        x.current += IDLE * dt;
      }
      place();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [place, land]);

  /** 후보 i 의 잔 하나가 가운데 칸에 오는 x(최소 minRun 만큼 앞으로) */
  const targetX = (i: number, minRun: number) => {
    const L = span(), c = center();
    let best = Infinity;
    for (let j = i; j < total; j += n) {
      const base = j * W - c;
      best = Math.min(best, base + Math.ceil((x.current + minRun - base) / L) * L);
    }
    return best;
  };

  const pick = () => {
    if (!n) return;
    if (phase === 'spin') {               // 건너뛰기
      const tw = tween.current;
      if (tw) { x.current = tw.x0 + tw.d; tween.current = null; place(); land(winner!); }
      return;
    }
    const i = weightedPick(n, last.current);
    last.current = i;
    setWinner(i);
    winnerRef.current = i;
    setWinSlot(null);
    onPicked(null);
    if (reduceMotion()) {
      x.current = targetX(i, 0);
      place();
      land(i);
      return;
    }
    tween.current = { t0: performance.now(), x0: x.current, d: targetX(i, MIN_RUN) - x.current };
    setPhase('spin');
  };

  return (
    <>
      <div className={`stage${phase === 'done' ? ' lit' : ''}`} aria-hidden="true">
        <div className="lamp" />
        <div className="cone" />
        <div className="reel" ref={reelRef}>
          {Array.from({ length: total }, (_, j) => {
            const r = picks[j % n]!;
            const win = phase === 'done' && j === winSlot;
            return (
              <div key={j} className={`slot${win ? ' win' : ''}`} ref={(el) => { itemRefs.current[j] = el; }}>
                <div className="glass">
                  <div className="base"><Art r={r} /></div>
                  {win && <div className="pour"><Art r={r} /></div>}
                </div>
                <div className="mirror"><Art r={r} /></div>
              </div>
            );
          })}
        </div>
        <div className="rail" />
      </div>
      {between}
      {phase === 'done' && children ? children(pick) : (
        <div className="reelact">
          <button className="btn primary big" onClick={pick} disabled={!n}>
            {phase === 'spin' ? '건너뛰기' : '한 잔 고르기'}
          </button>
          <p className="hint">{phase === 'spin' ? '고르는 중이에요' : '취향에 가까운 잔일수록 자주 나와요'}</p>
        </div>
      )}
    </>
  );
}
