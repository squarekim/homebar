/** Whisky-derived oak cask SVG artwork; visual rules live in caskVisual.ts. */
import { useId } from 'react';
import { type Bottle } from '../../models/types';
import { caskVisualOf } from '../../data/caskVisual';

// 세워 둔 통 — 양 끝 반폭 15, 배 반폭 20
const TOP = 24, BOTTOM = 71, MID = (TOP + BOTTOM) / 2;
const BODY = `M25 ${TOP} C17.5 34 17.5 61 25 ${BOTTOM} Q40 74.6 55 ${BOTTOM} C62.5 61 62.5 34 55 ${TOP} Z`;
const HOOPS = [30, 65];
/** 판자 이음선. 끝(x0)에서 배로 갈수록 바깥으로 벌어진다 */
const STAVES = [-3, -2, -1, 0, 1, 2, 3].map((i) => {
  const x0 = 40 + i * 5, c = 40 + i * 8.33;
  return `M${x0} ${TOP} Q${c.toFixed(2)} ${MID} ${x0} ${BOTTOM}`;
});
/** 앞면 글자는 이 크기부터 쓴다. 목록 썸네일(44px)에서는 색과 연기만 남긴다 */
const TEXT_MIN = 56;

export function CaskArt({ bottle, size = 56 }: { bottle: Bottle; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `cask-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const v = caskVisualOf(bottle);
  const w = 40 / v.woods.length;
  const text = size >= TEXT_MIN;
  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <clipPath id={id('body')}><path d={BODY}/></clipPath>
      <linearGradient id={id('round')} x1="20" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E120A" stopOpacity=".42"/><stop offset=".3" stopColor="#FFF" stopOpacity=".2"/>
        <stop offset=".62" stopColor="#FFF" stopOpacity="0"/><stop offset="1" stopColor="#1E120A" stopOpacity=".46"/>
      </linearGradient>
      <linearGradient id={id('smoke')} x1="0" y1="22" x2="0" y2="2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6F757C" stopOpacity=".95"/><stop offset="1" stopColor="#6F757C" stopOpacity=".1"/>
      </linearGradient>
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    </defs>
    <ellipse cx="40" cy="75" rx="19" ry="2" fill="#263440" opacity=".22" filter={url('shadow')}/>
    {/* 피티드 — 통 위로 오르는 연기 두 줄 */}
    {v.smoke && <g fill="none" stroke={url('smoke')} strokeWidth="2.6" strokeLinecap="round">
      <path d="M35 21 C30.5 16 39 13.5 35 8.5 C33 6 35 3.5 37 2"/>
      <path d="M45.5 21 C50 16.5 41.5 12.5 46 7.5 C47.5 5.5 46.5 4 45 3"/>
    </g>}
    <g clipPath={url('body')}>
      {/* 판자 색 — 캐스크가 여럿이면 왼쪽부터 칸을 나눠 칠한다 */}
      {v.woods.map((c, i) => <rect key={i} x={20 + i * w} y="0" width={w + .05} height="80" fill={c}/>)}
      <rect x="0" y="0" width="80" height="80" fill={url('round')}/>
      {STAVES.map((d) => <path key={d} d={d} fill="none" stroke="#2A1A10" strokeWidth=".7" opacity=".3"/>)}
      {HOOPS.map((y) => <g key={y}>
        <path d={`M0 ${y} Q40 ${y + 3.2} 80 ${y}`} fill="none" stroke="#4D535A" strokeWidth="3.2"/>
        <path d={`M0 ${y - 1} Q40 ${y + 2.2} 80 ${y - 1}`} fill="none" stroke="#C9CED4" strokeWidth=".8" opacity=".55"/>
      </g>)}
    </g>
    <path d={BODY} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity=".6"/>
    {/* 통 머리 — 첫 칸 나무색에 테 한 줄 */}
    <ellipse cx="40" cy={TOP} rx="15" ry="3.4" fill={v.woods[0]}/>
    <ellipse cx="40" cy={TOP} rx="15" ry="3.4" fill="#FFF" opacity=".16"/>
    <ellipse cx="40" cy={TOP + .3} rx="11.5" ry="2.3" fill="none" stroke="#2A1A10" strokeWidth=".6" opacity=".35"/>
    <ellipse cx="40" cy={TOP} rx="15" ry="3.4" fill="none" stroke="#4D535A" strokeWidth="1.6"/>
    {/* 앞면 — 라벨 표시 연수, 캐스크 스트렝스 */}
    {text && (v.age !== null || v.caskStrength) &&
      <g textAnchor="middle" fontWeight="800" fill="#F6E9CC" stroke="#2A1A10" strokeWidth="1.3" paintOrder="stroke" style={{ fontFamily: 'inherit' }}>
        {v.age !== null && <text x="40" y={v.caskStrength ? 50 : 52.5} fontSize="13">{v.age}</text>}
        {v.caskStrength && <text x="40" y={v.age !== null ? 59.5 : 52} fontSize={v.age !== null ? 7 : 11} letterSpacing=".6">CS</text>}
      </g>}
  </svg>;
}
