/**
 * GlassArt — 잔 실루엣 + 음료 색 + 얼음 + 가니시를 그리는 SVG.
 * 사진 자산이 없어 data/drinkVisual.ts 가 계산한 값으로 그린다. 크기는 고정이라 목록 높이가 흔들리지 않는다.
 */
import { useId } from 'react';
import { type Cocktail } from '../../models/types';
import { drinkColor, glassOf, garnishOf, ICE, type GlassKind, type GarnishKind } from '../../data/drinkVisual';

interface Shape { outline: string; inner: string; top: number; surface: number; rim: [number, number] }

const GLASS: Record<GlassKind, Shape> = {
  coupe: { outline: 'M13 17 Q32 45 51 17 M32 44 V56 M23 58 H41', inner: 'M16 19 Q32 41 48 19 Z', top: 19, surface: 21, rim: [16, 48] },
  martini: { outline: 'M12 16 L32 43 L52 16 Z M32 43 V56 M23 58 H41', inner: 'M16 19 L32 39 L48 19 Z', top: 19, surface: 21, rim: [16, 48] },
  highball: { outline: 'M23 9 V54 a3 3 0 0 0 3 3 h12 a3 3 0 0 0 3-3 V9', inner: 'M25 12 V54 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2-2 V12 Z', top: 12, surface: 17, rim: [23, 41] },
  rocks: { outline: 'M19 24 L21 54 a3 3 0 0 0 3 3 h16 a3 3 0 0 0 3-3 L45 24', inner: 'M21 26 L23 54 h18 L43 26 Z', top: 26, surface: 33, rim: [19, 45] },
  flute: { outline: 'M25 8 V33 q0 11 7 12 q7-1 7-12 V8 M32 45 V56 M24 58 H40', inner: 'M27 11 V33 q0 8 5 9 q5-1 5-9 V11 Z', top: 11, surface: 13, rim: [25, 39] },
  hurricane: { outline: 'M20 10 q-3 16 5 24 q1 6 0 10 M44 10 q3 16-5 24 q-1 6 0 10 M25 44 h14 M32 44 V54 M24 57 H40', inner: 'M22 13 q-2 14 5 21 h10 q7-7 5-21 Z', top: 13, surface: 18, rim: [22, 42] },
  shot: { outline: 'M24 33 L26 55 a2 2 0 0 0 2 2 h8 a2 2 0 0 0 2-2 L40 33', inner: 'M26 35 L27 55 h10 L38 35 Z', top: 35, surface: 37, rim: [24, 40] },
  mug: { outline: 'M20 16 V53 a3 3 0 0 0 3 3 h14 a3 3 0 0 0 3-3 V16 M40 24 h5 a5 5 0 0 1 0 12 h-5', inner: 'M22 19 V53 h16 V19 Z', top: 19, surface: 22, rim: [20, 40] },
};

function garnishMark(kind: GarnishKind, x: number, y: number, cx: number, surface: number, rim: [number, number]) {
  switch (kind) {
    case 'lemon': return <g key={kind}><path d={`M${x - 6} ${y} a6 6 0 0 1 12 0 z`} fill="#EBCF4A" /><path d={`M${x - 6} ${y} h12`} stroke="#C8A92E" strokeWidth="1" /></g>;
    case 'lime': return <g key={kind}><path d={`M${x - 6} ${y} a6 6 0 0 1 12 0 z`} fill="#9FC24A" /><path d={`M${x - 6} ${y} h12`} stroke="#6F9130" strokeWidth="1" /></g>;
    case 'orange': return <g key={kind}><path d={`M${x - 6} ${y} a6 6 0 0 1 12 0 z`} fill="#E8902A" /><path d={`M${x - 6} ${y} h12`} stroke="#B96C15" strokeWidth="1" /></g>;
    case 'cherry': return <g key={kind}><circle cx={x} cy={y + 3} r="3.6" fill="#A81F33" /><path d={`M${x} ${y} q3-5 6-6`} stroke="#6E7A3A" strokeWidth="1.2" fill="none" /></g>;
    case 'olive': return <ellipse key={kind} cx={x} cy={y + 2} rx="3" ry="4" fill="#7E8B3A" />;
    case 'mint': return <g key={kind} fill="#4E9148"><ellipse cx={x - 3} cy={y} rx="4" ry="2.4" transform={`rotate(-25 ${x - 3} ${y})`} /><ellipse cx={x + 3} cy={y - 2} rx="4" ry="2.4" transform={`rotate(20 ${x + 3} ${y - 2})`} /></g>;
    case 'pineapple': return <g key={kind}><path d={`M${x - 4} ${y + 5} l4-8 4 8z`} fill="#E8C244" /><path d={`M${x} ${y - 4} l2 3 -4 0z`} fill="#4E9148" /></g>;
    case 'berry': return <circle key={kind} cx={x} cy={y + 2} r="3.2" fill="#6E1533" />;
    case 'celery': return <path key={kind} d={`M${x} ${y + 8} L${x + 2} ${y - 8}`} stroke="#5E8A3A" strokeWidth="2.6" strokeLinecap="round" />;
    case 'onion': return <circle key={kind} cx={x} cy={y + 2} r="3.2" fill="#F2EBD8" stroke="#C9BFA0" />;
    case 'ginger': return <rect key={kind} x={x - 3} y={y} width="6" height="5" rx="1.5" fill="#D8A44E" />;
    case 'dust': return <g key={kind} opacity=".6" fill="currentColor"><circle cx={cx - 4} cy={surface + 3} r="1" /><circle cx={cx + 2} cy={surface + 5} r="1" /><circle cx={cx + 6} cy={surface + 2} r="1" /></g>;
    case 'rim': return <path key={kind} d={`M${rim[0]} ${y - 1} H${rim[1]}`} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1 2.6" opacity=".75" />;
  }
}

export function GlassArt({ cocktail, size = 56 }: { cocktail: Cocktail; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const kind = glassOf(cocktail);
  const g = GLASS[kind];
  const { fill, alpha } = drinkColor(cocktail);
  const ice = ICE[kind];
  const [rimL, rimR] = g.rim;
  const cx = (rimL + rimR) / 2;

  return (
    <svg className="glassart" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs><clipPath id={`c${uid}`}><path d={g.inner} /></clipPath></defs>
      <rect x="0" y={g.surface} width="64" height="64" fill={fill} opacity={alpha} clipPath={`url(#c${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        {Array.from({ length: ice }, (_, i) => {
          const bx = cx - 7 + (i % 2) * 9;
          const by = g.surface + 5 + i * 7;
          return <rect key={i} x={bx} y={by} width="9" height="9" rx="1.5" fill="#FFFFFF" opacity=".45"
            stroke="#FFFFFF" strokeOpacity=".7" strokeWidth=".8" transform={`rotate(${i * 17 - 12} ${bx + 4} ${by + 4})`} />;
        })}
      </g>
      <path d={g.outline} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".62" />
      {garnishOf(cocktail).map((k) => garnishMark(k, rimR - 2, g.top - 2, cx, g.surface, g.rim))}
    </svg>
  );
}
