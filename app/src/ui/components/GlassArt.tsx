/** Recipe-derived SVG artwork; visual rules live in drinkVisual.ts. */
import { useId } from 'react';
import { type Cocktail } from '../../models/types';
import { drinkColor, glassOf, garnishOf, visualEffectOf, ICE, type GlassKind, type GarnishKind } from '../../data/drinkVisual';

type Ellipse = { cx: number; cy: number; rx: number; ry: number };
interface Shape {
  outline: string;
  inner: string;
  surface: Ellipse;
  rim: Ellipse;
  iceArea: { x: number; y: number; width: number; height: number };
}
const GLASS: Record<GlassKind, Shape> = {
  coupe: { outline: 'M15 23 Q18 46 40 46 Q62 46 65 23 M40 46 V68 M28 71 Q40 68 52 71', inner: 'M18 24 Q21 43 40 43 Q59 43 62 24Z', surface: { cx:40, cy:27, rx:21, ry:3 }, rim: { cx:40, cy:23, rx:25, ry:4 }, iceArea: { x:27,y:29,width:26,height:12 } },
  martini: { outline: 'M13 21 L40 48 L67 21 M40 48 V68 M27 71 H53', inner: 'M17 23 L40 45 L63 23Z', surface: { cx:40,cy:26,rx:20,ry:2.5 }, rim: { cx:40,cy:21,rx:27,ry:3 }, iceArea: { x:29,y:28,width:22,height:12 } },
  highball: { outline: 'M26 15 L27 65 Q40 70 53 65 L54 15', inner: 'M29 17 L30 63 Q40 66 50 63 L51 17Z', surface: { cx:40,cy:24,rx:10.5,ry:2.5 }, rim: { cx:40,cy:15,rx:14,ry:3 }, iceArea: { x:31,y:27,width:18,height:33 } },
  rocks: { outline: 'M20 33 L23 65 Q40 71 57 65 L60 33', inner: 'M23 35 L26 63 Q40 67 54 63 L57 35Z', surface: { cx:40,cy:41,rx:16,ry:3 }, rim: { cx:40,cy:33,rx:20,ry:4 }, iceArea: { x:28,y:43,width:24,height:17 } },
  flute: { outline: 'M31 13 L32 40 Q32 52 40 53 Q48 52 48 40 L49 13 M40 53 V69 M30 72 H50', inner: 'M34 15 L35 40 Q35 49 40 50 Q45 49 45 40 L46 15Z', surface: { cx:40,cy:21,rx:5.8,ry:2 }, rim: { cx:40,cy:13,rx:9,ry:2.5 }, iceArea: { x:36,y:24,width:8,height:20 } },
  hurricane: { outline: 'M25 17 C19 33 26 39 30 47 Q33 53 30 59 Q40 63 50 59 Q47 53 50 47 C54 39 61 33 55 17 M40 62 V69 M29 72 H51', inner: 'M28 19 C23 33 29 39 33 47 Q36 53 33 57 Q40 60 47 57 Q44 53 47 47 C51 39 57 33 52 19Z', surface: { cx:40,cy:25,rx:13,ry:3 }, rim: { cx:40,cy:17,rx:15,ry:3 }, iceArea: { x:31,y:28,width:18,height:24 } },
  // 가장 작은 잔이지만 44px 목록에서도 읽히도록 여백을 줄여 키운다.
  shot: { outline: 'M25 36 L29 66 Q40 70 51 66 L55 36', inner: 'M28 38 L32 63 Q40 66 48 63 L52 38Z', surface: { cx:40,cy:43,rx:11,ry:2.4 }, rim: { cx:40,cy:36,rx:15,ry:3 }, iceArea: { x:32,y:45,width:16,height:14 } },
  mug: { outline: 'M23 24 V62 Q23 68 29 68 H47 Q53 68 53 62 V24 M54 32 H59 C72 32 72 54 59 54 H54', inner: 'M26 26 V61 Q26 65 30 65 H46 Q50 65 50 61 V26Z', surface: { cx:38,cy:32,rx:12,ry:3 }, rim: { cx:38,cy:24,rx:15,ry:3.5 }, iceArea: { x:29,y:35,width:18,height:25 } },
};

function garnishMark(kind: GarnishKind, x: number, y: number, shape: Shape) {
  const local = (() => {
    switch (kind) {
      case 'lemon': case 'lime': case 'orange': {
        const colors = { lemon: ['#E5BC26','#FFF3A0'], lime: ['#508F32','#CAE88A'], orange: ['#DE731B','#FFD184'] }[kind];
        return <><path d="M-7 2 A7 7 0 0 1 7 2Z" fill={colors[1]} stroke={colors[0]} strokeWidth="2"/><path d="M0 1 V-4 M0 1 L-4-2 M0 1 L4-2" stroke={colors[0]} strokeWidth=".8"/></>;
      }
      case 'cherry': return <><path d="M0 1 Q0-5 5-7" fill="none" stroke="#526E30" strokeWidth="1.4"/><circle cy="4" r="4.5" fill="#B82442"/><circle cx="-1.5" cy="2.5" r="1.2" fill="#FFB4BA"/></>;
      case 'olive': return <><path d="M-7 7 L6-6" stroke="#AF8551"/><ellipse rx="4" ry="5" fill="#81973E"/><circle cy="-2" r="1.6" fill="#C45135"/></>;
      case 'mint': return <><path d="M0 7 V-4" stroke="#326B40"/><path d="M0 3 Q-10 1-7-5 Q0-6 0 3 M0 0 Q1-9 7-7 Q10-1 0 0" fill="#4C9E59"/><path d="M-5-3 L0 3 L5-5" fill="none" stroke="#B1D58C" strokeWidth=".8"/></>;
      case 'pineapple': return <><path d="M-6 7 L0-4 L7 7Z" fill="#F3CC55" stroke="#BE8E24"/><path d="M-3 5 L2 0 M0 7 L4 3 M-1 0 L4 6" stroke="#D7A134"/><path d="M0-3 L-4-9 L0-7 L3-11 L3-6 L7-8 L4-2" fill="#44834A"/></>;
      case 'berry': return <><path d="M0-2 L-4-5 L1-4 L4-6 L3-1" fill="#548244"/>{[[-2,0],[2,0],[-3,3],[1,3],[0,6]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="2.5" fill={i%2 ? '#A23D69':'#72244D'} stroke="#E49AB4" strokeWidth=".4"/>)}</>;
      case 'celery': return <><path d="M0 10 L2-6" stroke="#609349" strokeWidth="3"/><path d="M1 8 L3-5" stroke="#BBD581"/><path d="M2-4 Q-5-3-4-9 L1-7 L2-12 L5-8 L9-9 Q9-3 2-4" fill="#4B8B4A"/></>;
      // 크림색 양파는 종이색 배경에 묻힌다 — 테두리를 진하게 둬 형태를 남긴다.
      case 'onion': return <><path d="M-6 7 L6-6" stroke="#AF8551"/><path d="M0-5 C-1-2-5-2-5 2 A5 5 0 0 0 5 2 C5-2 1-2 0-5Z" fill="#FFF1D6" stroke="#9C8564" strokeWidth=".9"/><path d="M0-2 Q-4 3 0 6 M1-2 Q4 3 1 6" fill="none" stroke="#C4B294"/></>;
      case 'ginger': return <><path d="M-6 4 Q-8 0-4-1 L-2 0 L-3-4 Q0-7 2-3 L3 0 Q8-3 8 1 L5 5 L0 4 Q-4 8-6 4Z" fill="#E7BF7E" stroke="#AC7D42"/><path d="M-3 1 L-1 3 M2 0 L3 3" stroke="#BA9258"/></>;
      case 'dust': case 'rim': return null;
    }
  })();
  // 소금·설탕 림: 좁은 잔에서 굵은 대시는 빗살처럼 보인다 — 굵기를 잔 너비에 맞춘다.
  if (kind === 'rim') {
    const w = Math.min(2.4, Math.max(1.3, shape.rim.rx / 9));
    return <ellipse key={kind} {...shape.rim} fill="none" stroke="#E7D3AE" strokeWidth={w} strokeDasharray={`${(w * .34).toFixed(2)} ${(w * .95).toFixed(2)}`}/>;
  }
  // 넛맥·시나몬: 진한 음료 위에서도 남도록 옅은 테를 두른다.
  if (kind === 'dust') return <g key={kind} fill="#8A542D" stroke="#FFF1D8" strokeOpacity=".5" strokeWidth=".3">{Array.from({length:11},(_,i)=><circle key={i} cx={shape.surface.cx + ((i*7)%17-8)*shape.surface.rx/12} cy={shape.surface.cy + (i%3-1)*.8} r={i%2 ? .65:.45}/>)}</g>;
  return <g key={kind} transform={`translate(${x} ${y})`}>{local}</g>;
}

export function GlassArt({ cocktail, size = 56 }: { cocktail: Cocktail; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `glass-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const kind = glassOf(cocktail);
  const g = GLASS[kind];
  const { fill, alpha } = drinkColor(cocktail);
  const effects = visualEffectOf(cocktail);
  const a = g.iceArea;
  const bubbles = effects.bubbles
    ? Array.from({length:16},(_,i)=>({ cx:g.surface.cx+((i*7)%13-6)*g.surface.rx/8, cy:g.surface.cy+5+(i*11)%38, r:.6+(i%3)*.35 }))
    : [];
  // 안쪽 하이라이트는 음료 폭에 맞춘다 — 고정값이면 좁은 잔(플루트)에서 한가운데를 가로지른다.
  const hx = g.surface.cx - g.surface.rx + Math.min(4, g.surface.rx*.45);
  const hw = Math.min(1.8, Math.max(.9, g.surface.rx/9));
  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <clipPath id={id('inner')}><path d={g.inner}/></clipPath>
      <clipPath id={id('liquid')}><rect x="0" y={g.surface.cy} width="80" height="80"/><ellipse {...g.surface}/></clipPath>
      <linearGradient id={id('liquid-color')} x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor={fill} stopOpacity={alpha*.7}/><stop offset=".45" stopColor={fill} stopOpacity={alpha}/><stop offset="1" stopColor={fill}/>
      </linearGradient>
      <linearGradient id={id('ice')} x2="1" y2="1"><stop stopColor="#FFFFFF" stopOpacity=".85"/><stop offset="1" stopColor="#D5EDF4" stopOpacity=".18"/></linearGradient>
      <linearGradient id={id('glass')}><stop stopColor="#FFF" stopOpacity=".55"/><stop offset=".35" stopColor="#FFF" stopOpacity=".03"/><stop offset="1" stopColor="#CCE5EC" stopOpacity=".24"/></linearGradient>
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    </defs>
    <ellipse cx="40" cy="73" rx={kind === 'rocks' || kind === 'mug' ? 20:15} ry="2" fill="#263440" opacity=".2" filter={url('shadow')}/>
    <path d={g.inner} fill={url('glass')}/>
    <g clipPath={url('inner')}>
      <g clipPath={url('liquid')}>
        <path d={g.inner} fill={url('liquid-color')}/>
        {Array.from({length:ICE[kind]},(_,i)=>{
          const edge = Math.min(11,a.width*.55,a.height*.55);
          const x = a.x+(i%2)*(a.width-edge);
          const y = a.y+i*(a.height-edge)/Math.max(1,ICE[kind]-1);
          return <g key={i} transform={`translate(${x} ${y}) rotate(${i%2 ? 12:-9} ${edge/2} ${edge/2})`}>
            <rect width={edge} height={edge} rx="1.5" fill={url('ice')} stroke="#F4FDFF" strokeOpacity=".65" strokeWidth=".7"/>
            <path d={`M1 2 L${edge-3} 2 L${edge-1} 0 M${edge-3} 2 V${edge-2} L${edge} ${edge}`} fill="none" stroke="#FFF" strokeOpacity=".6" strokeWidth=".7"/>
            <path d={`M1 ${edge-2} L${edge-3} ${edge-2} L${edge} ${edge} H2Z`} fill="#A9CFDB" opacity=".3"/>
          </g>;
        })}
        {effects.bubbles && <g fill="none">
          {/* 옅은 음료 위에서는 흰 기포가 사라진다 — 어두운 밑테를 한 겹 깔아 형태를 남긴다. */}
          <g stroke="#46565F" strokeOpacity=".22" strokeWidth=".9">{bubbles.map((b,i)=><circle key={i} {...b}/>)}</g>
          <g stroke="#FFF" strokeOpacity=".8" strokeWidth=".6">{bubbles.map((b,i)=><circle key={i} {...b}/>)}</g>
        </g>}
      </g>
      <ellipse {...g.surface} fill={fill} opacity=".65" stroke="#FFF" strokeOpacity=".5" strokeWidth=".7"/>
      {effects.foam && <g fill="#FFF4DC"><rect x={g.surface.cx-g.surface.rx-1} y={g.surface.cy} width={g.surface.rx*2+2} height="3.5"/><ellipse {...g.surface} ry={g.surface.ry+1}/>{Array.from({length:9},(_,i)=><circle key={i} cx={g.surface.cx+(i-4)*g.surface.rx/5} cy={g.surface.cy+2.6+(i%2)*.5} r=".75" fill="#E4D6BB" opacity=".6"/>)}</g>}
      <path d={`M${hx.toFixed(1)} ${g.surface.cy+3} Q${(hx-1).toFixed(1)} ${g.surface.cy+10} ${(hx+1.5).toFixed(1)} ${g.surface.cy+17}`} fill="none" stroke="#FFF" strokeWidth={hw} strokeLinecap="round" opacity=".6"/>
    </g>
    <path d={g.outline} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    <path d={g.outline} fill="none" stroke="#FFFFFF" strokeWidth=".55" strokeLinecap="round" strokeLinejoin="round" opacity=".45"/>
    <ellipse {...g.rim} fill="none" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    <path d={`M${g.rim.cx-g.rim.rx+3} ${g.rim.cy-1} Q${g.rim.cx} ${g.rim.cy-g.rim.ry-1} ${g.rim.cx+g.rim.rx-3} ${g.rim.cy-1}`} fill="none" stroke="#FFF" strokeWidth="1" opacity=".8"/>
    {/* Tall leaves need headroom; separate paired garnishes even on a narrow flute. */}
    {garnishOf(cocktail).map((k,i)=>garnishMark(
      k,
      g.rim.cx+(i===0 ? 1:-1)*Math.max(8,g.rim.rx-3),
      Math.max(14,g.rim.cy-2),
      g,
    ))}
  </svg>;
}
