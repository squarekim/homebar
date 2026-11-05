/**
 * 오크통 그림 — 앱에 넣은 일러스트(Gemini로 그린 원본을 scripts/cask_assets.py 로 나눈 것) 위에
 * 위스키 데이터에서 나온 나무색·연수·연기를 얹는다. 해석 규칙은 caskVisual.ts 에 있다.
 *
 * 겹치는 순서(아래→위): 그림자 → 몸통(첫 캐스크 색) → 마구리(캐스크 수만큼 세로로 나눔)
 *   → 쇠테·마개·나무 명암 → 연기 → 연수·CS 글자
 */
import { useId } from 'react';
import { type Bottle } from '../../models/types';
import { caskVisualOf } from '../../data/caskVisual';
import { CASK_SPRITE } from './caskAssets';

/** 앞면 글자는 이 크기부터 쓴다. 목록 썸네일(44px)에서는 색과 연기만 남긴다 */
const TEXT_MIN = 56;

export function CaskArt({ bottle, size = 56 }: { bottle: Bottle; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `cask-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const v = caskVisualOf(bottle);
  const { box, headBox: h, plug } = CASK_SPRITE;
  const board = (h.x1 - h.x0) / v.woods.length;
  const cx = (h.x0 + h.x1) / 2;
  const cy = (h.y0 + h.y1) / 2;
  const hw = h.x1 - h.x0;
  const text = size >= TEXT_MIN;
  const img = (href: string) => <image href={href} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="none"/>;
  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <mask id={id('body')} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">{img(CASK_SPRITE.body)}</mask>
      <mask id={id('head')} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">{img(CASK_SPRITE.head)}</mask>
      <linearGradient id={id('smoke')} x1="0" y1={plug.y} x2="0" y2={plug.y - 13} gradientUnits="userSpaceOnUse">
        <stop stopColor="#6F757C" stopOpacity=".95"/><stop offset="1" stopColor="#6F757C" stopOpacity=".1"/>
      </linearGradient>
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    </defs>
    <ellipse cx="40" cy={box.y + box.h} rx={box.w * .42} ry="2.2" fill="#0E1416" opacity=".28" filter={url('shadow')}/>
    {/* 몸통 — 주 캐스크(첫째) 나무색 */}
    <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={v.woods[0]} mask={url('body')}/>
    {/* 마구리 — 세로 판자를 캐스크 수만큼 나눠 칠한다(왼쪽부터) */}
    <g mask={url('head')}>
      {v.woods.map((c, i) => <rect key={i} x={h.x0 + i * board} y={h.y0} width={board + .05} height={h.y1 - h.y0} fill={c}/>)}
    </g>
    {img(CASK_SPRITE.shade)}
    {/* 피티드 — 마개에서 오르는 연기 두 줄 */}
    {v.smoke && <g fill="none" stroke={url('smoke')} strokeWidth="2.4" strokeLinecap="round"
      transform={`translate(${(plug.x - 35).toFixed(2)} ${(plug.y - 13).toFixed(2)})`}>
      <path d="M33 13 C29 9.5 36 7.5 32.5 4 C31.5 3 32 2 33 1.2"/>
      <path d="M37.5 13 C41 10 35.5 7 39 3.5"/>
    </g>}
    {/* 앞면 — 라벨 표시 연수, 캐스크 스트렝스 */}
    {text && (v.age !== null || v.caskStrength) &&
      <g textAnchor="middle" fontWeight="800" fill="#F6E9CC" stroke="#2A1A10" strokeWidth="1.3" paintOrder="stroke" style={{ fontFamily: 'inherit' }}>
        {v.age !== null && <text x={cx} y={cy + (v.caskStrength ? 1 : 5)} fontSize={Math.min(16, hw * .5)}>{v.age}</text>}
        {v.caskStrength && <text x={cx} y={cy + (v.age !== null ? 11 : 4)} fontSize={v.age !== null ? 7.5 : 11} letterSpacing=".6">CS</text>}
      </g>}
  </svg>;
}
