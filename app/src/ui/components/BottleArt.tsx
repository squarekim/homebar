/** Bottle-derived SVG artwork; visual rules live in bottleVisual.ts. */
import { useId } from 'react';
import { type Bottle } from '../../models/types';
import { bottleColor, bottleShapeOf, type BottleShapeKind } from '../../data/bottleVisual';

interface Shape {
  outline: string;   // 실루엣 (선)
  inner: string;     // 유리 안쪽 — 술·라벨을 가두는 클립
  liquidTop: number; // 술 수면 y
  label: { x: number; y: number; width: number; height: number };
  cap: { x: number; y: number; width: number; height: number };
  shadowRx: number;
}

const BOTTLE: Record<BottleShapeKind, Shape> = {
  // 버번 — 어깨가 넓고 각지며 목이 짧다
  bourbon: {
    outline: 'M35 17 V23 L27.5 31 Q26 33 26 36.5 V67 Q26 71.5 30.5 71.5 H49.5 Q54 71.5 54 67 V36.5 Q54 33 52.5 31 L45 23 V17',
    inner: 'M36.2 18.5 V23.6 L28.6 31.6 Q27.3 33.4 27.3 36.8 V67 Q27.3 70.3 30.9 70.3 H49.1 Q52.7 70.3 52.7 67 V36.8 Q52.7 33.4 51.4 31.6 L43.8 23.6 V18.5Z',
    liquidTop: 28, label: { x:27.3, y:44, width:25.4, height:17 }, cap: { x:33.6, y:11, width:12.8, height:7 }, shadowRx: 15,
  },
  // 스카치 싱글몰트 — 완만한 어깨에 목이 길다
  scotch: {
    outline: 'M35.5 15 V25 C35.5 29.5 28 30.5 28 38 V67 Q28 71.5 32.5 71.5 H47.5 Q52 71.5 52 67 V38 C52 30.5 44.5 29.5 44.5 25 V15',
    inner: 'M36.7 16.5 V25.3 C36.7 30.4 29.3 31.3 29.3 38.3 V67 Q29.3 70.3 32.9 70.3 H47.1 Q50.7 70.3 50.7 67 V38.3 C50.7 31.3 43.3 30.4 43.3 25.3 V16.5Z',
    liquidTop: 30, label: { x:29.3, y:46, width:21.4, height:16 }, cap: { x:34.2, y:9.5, width:11.6, height:6.6 }, shadowRx: 13.5,
  },
  // 재패니즈·진·보드카 — 좁고 곧다
  slim: {
    outline: 'M36 15 V24 C36 28 30.5 29 30.5 34.5 V68 Q30.5 71.5 34 71.5 H46 Q49.5 71.5 49.5 68 V34.5 C49.5 29 44 28 44 24 V15',
    inner: 'M37.1 16.4 V24.3 C37.1 29 31.8 29.9 31.8 34.8 V68 Q31.8 70.3 34.5 70.3 H45.5 Q48.2 70.3 48.2 68 V34.8 C48.2 29.9 42.9 29 42.9 24.3 V16.4Z',
    liquidTop: 27, label: { x:31.8, y:44, width:16.4, height:15 }, cap: { x:34.7, y:9.5, width:10.6, height:6.4 }, shadowRx: 12,
  },
  // 그 밖의 술 — 둥근 어깨의 표준형
  generic: {
    outline: 'M35.5 16 V26 C35.5 30 28.5 31.5 28.5 39 V67 Q28.5 71.5 33 71.5 H47 Q51.5 71.5 51.5 67 V39 C51.5 31.5 44.5 30 44.5 26 V16',
    inner: 'M36.7 17.4 V26.3 C36.7 31 29.8 32.4 29.8 39.3 V67 Q29.8 70.3 33.4 70.3 H46.6 Q50.2 70.3 50.2 67 V39.3 C50.2 32.4 43.3 31 43.3 26.3 V17.4Z',
    liquidTop: 31, label: { x:29.8, y:47, width:20.4, height:15 }, cap: { x:34.2, y:10.5, width:11.6, height:6.6 }, shadowRx: 13,
  },
};

export function BottleArt({ bottle, size = 56 }: { bottle: Bottle; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `bottle-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const b = BOTTLE[bottleShapeOf(bottle)];
  const { fill, alpha } = bottleColor(bottle);
  const lb = b.label;
  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <clipPath id={id('inner')}><path d={b.inner}/></clipPath>
      <linearGradient id={id('liquid-color')} x1="0" y1="0" x2=".9" y2="0">
        <stop stopColor={fill} stopOpacity={alpha}/><stop offset=".45" stopColor={fill} stopOpacity={Math.min(1, alpha*1.25)}/><stop offset="1" stopColor={fill} stopOpacity={alpha*.7}/>
      </linearGradient>
      <linearGradient id={id('glass')}><stop stopColor="#FFF" stopOpacity=".5"/><stop offset=".4" stopColor="#FFF" stopOpacity=".04"/><stop offset="1" stopColor="#CCE5EC" stopOpacity=".22"/></linearGradient>
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.5"/></filter>
    </defs>
    <ellipse cx="40" cy="74" rx={b.shadowRx} ry="2" fill="#263440" opacity=".2" filter={url('shadow')}/>
    <path d={b.inner} fill={url('glass')}/>
    <g clipPath={url('inner')}>
      <rect x="0" y={b.liquidTop} width="80" height={80 - b.liquidTop} fill={url('liquid-color')}/>
      {/* 유리 어깨를 타고 내려오는 빛 한 줄 */}
      <path d={`M${lb.x+3} ${b.liquidTop+3} Q${lb.x+2} ${lb.y-6} ${lb.x+3.5} ${lb.y-1}`} fill="none" stroke="#FFF" strokeWidth="1.6" strokeLinecap="round" opacity=".45"/>
      {/* 라벨 — 글자를 흉내 내지 않고 띠와 선으로만 둔다 */}
      <rect {...lb} rx="1" fill="#F7F0DE" opacity=".94"/>
      <rect x={lb.x} y={lb.y} width={lb.width} height="3.4" fill="currentColor" opacity=".5"/>
      <path d={`M${lb.x+3} ${lb.y+8} H${lb.x+lb.width-3} M${lb.x+5} ${lb.y+11.5} H${lb.x+lb.width-5}`}
        stroke="currentColor" strokeWidth="1.1" opacity=".38" strokeLinecap="round"/>
    </g>
    <path d={b.outline} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    <path d={b.outline} fill="none" stroke="#FFFFFF" strokeWidth=".55" strokeLinecap="round" strokeLinejoin="round" opacity=".45"/>
    {/* 캡 — 병목을 덮어 실루엣을 닫는다 */}
    <rect {...b.cap} rx="1.2" fill="currentColor" opacity=".72"/>
    <rect x={b.cap.x} y={b.cap.y} width={b.cap.width} height="2" rx="1" fill="#FFF" opacity=".3"/>
  </svg>;
}
