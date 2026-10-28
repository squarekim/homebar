/** Whisky-derived oak cask SVG artwork; visual rules live in caskVisual.ts. */
import { useId } from 'react';
import { type Bottle } from '../../models/types';
import { caskVisualOf } from '../../data/caskVisual';

// 눕혀 둔 통을 비스듬히 본 모습 — 마구리(앞면)가 오른쪽, 몸통은 왼쪽 뒤로 물러난다
const HEAD = { cx: 56, cy: 44, rx: 15, ry: 25 };
const BODY = 'M56 19 C42 14 25 15.5 15.5 24.5 Q8.5 43 15.5 62 C25 71 42 73 56 69 Z';
/** 쇠테 — 마구리 쪽 한 쌍, 먼 쪽 한 쌍. 먼 쪽일수록 덜 휜다 */
const HOOPS: Array<[x: number, bow: number]> = [[46, 10], [35, 8.5], [24, 6.5], [17.5, 5]];
/** 판자 이음선. 마구리에서 먼 끝으로 갈수록 모인다 */
const STAVES = [-3, -2, -1, 1, 2, 3].map((i) =>
  `M${HEAD.cx} ${HEAD.cy + i * 7.4} C40 ${HEAD.cy + i * 8.6} 24 ${HEAD.cy + i * 7.6} 12 ${43 + i * 5.6}`);
/** 앞면 글자는 이 크기부터 쓴다. 목록 썸네일(44px)에서는 색과 연기만 남긴다 */
const TEXT_MIN = 56;

export function CaskArt({ bottle, size = 56 }: { bottle: Bottle; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `cask-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const v = caskVisualOf(bottle);
  const { cx, cy, rx, ry } = HEAD;
  const board = (2 * rx) / v.woods.length;
  const text = size >= TEXT_MIN;
  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <clipPath id={id('body')}><path d={BODY}/></clipPath>
      <clipPath id={id('head')}><ellipse cx={cx} cy={cy} rx={rx} ry={ry}/></clipPath>
      <linearGradient id={id('round')} x1="0" y1="15" x2="0" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E120A" stopOpacity=".38"/><stop offset=".28" stopColor="#FFF" stopOpacity=".2"/>
        <stop offset=".6" stopColor="#FFF" stopOpacity="0"/><stop offset="1" stopColor="#1E120A" stopOpacity=".5"/>
      </linearGradient>
      <linearGradient id={id('far')} x1="10" y1="0" x2="55" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E120A" stopOpacity=".38"/><stop offset=".6" stopColor="#1E120A" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id={id('face')} x1={cx - rx} y1="0" x2={cx + rx} y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF" stopOpacity=".26"/><stop offset="1" stopColor="#1E120A" stopOpacity=".16"/>
      </linearGradient>
      <linearGradient id={id('smoke')} x1="0" y1="13" x2="0" y2="1" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6F757C" stopOpacity=".95"/><stop offset="1" stopColor="#6F757C" stopOpacity=".1"/>
      </linearGradient>
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    </defs>
    <ellipse cx="38" cy="73" rx="26" ry="2.2" fill="#263440" opacity=".22" filter={url('shadow')}/>
    {/* 피티드 — 마개 구멍에서 오르는 연기 두 줄 */}
    {v.smoke && <g fill="none" stroke={url('smoke')} strokeWidth="2.4" strokeLinecap="round">
      <path d="M33 13 C29 9.5 36 7.5 32.5 4 C31.5 3 32 2 33 1.2"/>
      <path d="M37.5 13 C41 10 35.5 7 39 3.5"/>
    </g>}
    {/* 몸통 — 주 캐스크(첫째) 나무색 */}
    <g clipPath={url('body')}>
      <rect x="0" y="0" width="80" height="80" fill={v.woods[0]}/>
      <rect x="0" y="0" width="80" height="80" fill={url('round')}/>
      <rect x="0" y="0" width="80" height="80" fill={url('far')}/>
      {STAVES.map((d) => <path key={d} d={d} fill="none" stroke="#2A1A10" strokeWidth=".7" opacity=".3"/>)}
      {HOOPS.map(([x, bow]) => <g key={x}>
        <path d={`M${x} 8 Q${x + bow} 44 ${x} 80`} fill="none" stroke="#4D535A" strokeWidth="3"/>
        <path d={`M${x - 1} 8 Q${x + bow - 1} 44 ${x - 1} 80`} fill="none" stroke="#C9CED4" strokeWidth=".8" opacity=".5"/>
      </g>)}
    </g>
    <path d={BODY} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity=".6"/>
    {/* 마개 */}
    <rect x="33" y="13" width="4.6" height="3.6" rx=".9" fill="#7A5232"/>
    <rect x="33" y="13" width="4.6" height="1.2" rx=".6" fill="#FFF" opacity=".3"/>
    {/* 마구리 — 세로 판자를 캐스크 수만큼 나눠 칠한다(왼쪽부터) */}
    <g clipPath={url('head')}>
      {v.woods.map((c, i) => <rect key={i} x={cx - rx + i * board} y={cy - ry} width={board + .05} height={2 * ry} fill={c}/>)}
      <rect x={cx - rx} y={cy - ry} width={2 * rx} height={2 * ry} fill={url('face')}/>
      {[-2, -1, 0, 1, 2].map((i) => <path key={i} d={`M${cx + i * 5.6} ${cy - ry} V${cy + ry}`} stroke="#2A1A10" strokeWidth=".5" opacity=".2"/>)}
    </g>
    <ellipse cx={cx} cy={cy} rx={rx - 2.6} ry={ry - 3.4} fill="none" stroke="#2A1A10" strokeWidth=".6" opacity=".3"/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#4D535A" strokeWidth="2"/>
    {/* 앞면 — 라벨 표시 연수, 캐스크 스트렝스 */}
    {text && (v.age !== null || v.caskStrength) &&
      <g textAnchor="middle" fontWeight="800" fill="#F6E9CC" stroke="#2A1A10" strokeWidth="1.3" paintOrder="stroke" style={{ fontFamily: 'inherit' }}>
        {v.age !== null && <text x={cx} y={v.caskStrength ? 45 : 49.5} fontSize="14">{v.age}</text>}
        {v.caskStrength && <text x={cx} y={v.age !== null ? 55 : 48.5} fontSize={v.age !== null ? 7.5 : 11} letterSpacing=".6">CS</text>}
      </g>}
  </svg>;
}
