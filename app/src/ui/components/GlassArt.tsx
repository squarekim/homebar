/**
 * 잔 그림 — 앱에 넣은 일러스트(GPT로 그린 원본을 scripts/glass_assets.py 로 나눈 것) 위에
 * 레시피에서 나온 색과 효과를 얹는다. 해석 규칙은 drinkVisual.ts 에 있다.
 *
 * 겹치는 순서(아래→위)
 *   그림자 → 액체(레시피 색, 층이 있으면 위아래 색) → 술 속 슬라이스 → 기포·거품·가루 → 픽·민트·셀러리
 *   → 유리·얼음·액체 명암 → 가장자리 과일 → 소금·설탕 림
 * 픽과 줄기는 유리 뒤에 둬서 잔 안에 꽂힌 것처럼 보이게 한다.
 */
import { useId } from 'react';
import { type Cocktail } from '../../models/types';
import {
  drinkColor, glassOf, garnishItems, liquidLayers, visualEffectOf,
  type GlassKind, type GarnishItem, type LiquidStop, type VisualEffect,
} from '../../data/drinkVisual';
import { GLASS_SPRITES, GARNISH_SPRITES, type GarnishSprite, type GlassSprite } from './glassAssets';

/** 가니시 한 조각의 그림 */
function spriteOf(g: GarnishItem): GarnishSprite | null {
  switch (g.place) {
    case 'pick': return `pick-${g.kind}` as GarnishSprite;
    case 'top': return g.kind === 'celery' ? 'celery' : 'mint';
    case 'inside': return `in-${g.kind}` as GarnishSprite;
    case 'edge': {
      const form = g.kind === 'pineapple' && g.form === 'peel' ? 'wedge' : g.form ?? 'wedge';
      const name = `${g.kind}-${form}`;
      return name in GARNISH_SPRITES ? name as GarnishSprite : null;
    }
    default: return null;
  }
}

interface Placed {
  name: GarnishSprite; x: number; y: number; w: number; h: number; layer: 'under' | 'over' | 'inside';
  /** 꼬치 — 열매 가운데(cx, cy), 세로에서 기운 각도(°, +는 위쪽이 오른쪽), 꼬치 끝이 닿을 높이 */
  pick?: { cx: number; cy: number; angle: number; tipY: number };
}

/** 꼬치 그림 안의 자리(그림 폭·높이에 대한 비율) — 열매 가운데와 꼬치 아래 끝 */
const PICK_MID = { x: .5, y: .5 };
const PICK_END = { x: .04, y: .95 };
/** 꼬치 그림에서 열매 한 알의 지름이 그림 폭에서 차지하는 몫 */
const PICK_FRUIT: Partial<Record<GarnishSprite, number>> = { 'pick-cherry': .4 };
const PICK_FRUIT_DEFAULT = .3;

/**
 * 가니시 크기 — 잔 입구 폭(rim.rx × 2)에 대한 몫. IBA 레시피 사진에서 잰 값을 잔을 덜 가리게 조금 줄였다.
 * (올드 패션드: 오렌지 조각 0.62 · 체리 0.32, 드라이 마티니: 올리브 0.28 · 레몬 껍질 0.87, 위스키 사워: 껍질 0.66)
 */
const SIZE = { wheel: .6, wedge: .45, peel: .7, cherry: .3, fruit: .27 };
/** 꼬치만 있을 때 테두리에 걸쳐 눕는 각도, 과일과 함께 꿸 때의 최대 각도(세로 기준) */
const PICK_REST = 38;

/** 가니시마다 자리를 잡는다 — 같은 입력이면 항상 같은 자리 */
/** 작은 그림(목록 44px)에서는 가니시가 점처럼 보인다 — 크기에 따라 키운다(잔 폭에 맞춘 조각은 제외) */
const smallBoost = (size: number) => size <= 48 ? 1.4 : size <= 64 ? 1.2 : 1;
/** 좁은 잔(플루트·샷)에서는 민트·셀러리를 줄인다 */
const garnishScale = (s: GlassSprite) => Math.min(1, Math.max(.62, s.rim.rx / 12));

/** 잔 폭에 맞춘 크기 — 가로세로 비율은 그림 그대로 */
function fitToRim(name: GarnishSprite, form: GarnishItem['form'], rimW: number): { w: number; h: number } {
  const sp = GARNISH_SPRITES[name];
  if (name.startsWith('pick-')) {
    const want = (name === 'pick-cherry' ? SIZE.cherry : SIZE.fruit) * rimW;
    const w = want / (PICK_FRUIT[name] ?? PICK_FRUIT_DEFAULT);
    return { w, h: sp.h * w / sp.w };
  }
  if (form === 'peel') { const h = SIZE.peel * rimW; return { w: sp.w * h / sp.h, h }; }
  const w = (form === 'wheel' ? SIZE.wheel : SIZE.wedge) * rimW;
  return { w, h: sp.h * w / sp.w };
}

function place(items: GarnishItem[], s: GlassSprite, size: number): Placed[] {
  const k = garnishScale(s) * smallBoost(size);
  const { rim, surface } = s;
  const rimW = rim.rx * 2;
  const out: Placed[] = [];
  // 가장자리 과일을 먼저 놓는다 — 꼬치가 그 과일을 함께 꿰기 때문
  let edges = 0;
  let flag: { x: number; y: number } | null = null;
  for (const g of items) {
    if (g.place !== 'edge') continue;
    const name = spriteOf(g);
    if (!name) continue;
    const { w, h } = fitToRim(name, g.form, rimW);
    // 첫 조각은 오른쪽, 둘째는 왼쪽 가장자리. 칼집이 테두리에 걸리게 중심을 테두리 높이에 둔다.
    // 둥근 조각은 칼집이 테두리에 끼워져 안쪽으로 조금 들어와 앉는다 — 잔 밖에 떠 보이지 않게
    const side = edges++ % 2 === 0 ? 1 : -1;
    const lift = g.form === 'peel' ? .3 : g.form === 'wheel' ? .05 : .2;
    const inset = g.form === 'wheel' ? .3 : g.form === 'wedge' ? .15 : 0;
    const cx = rim.cx + side * (rim.rx - w * inset);
    const cy = rim.cy - h * lift;
    if (!flag && g.form !== 'peel') flag = { x: cx, y: cy };
    out.push({ name, w, h, x: cx - w / 2, y: cy - h / 2, layer: 'over' });
  }
  const tipY = Math.min(s.bottom - 4, surface.cy + Math.max(4, (s.bottom - surface.cy) * .35));
  for (const g of items) {
    const name = spriteOf(g);
    if (!name || g.place === 'edge') continue;
    const sp = GARNISH_SPRITES[name];
    let w = sp.w * k;
    let h = sp.h * k;
    switch (g.place) {
      case 'pick': {
        ({ w, h } = fitToRim(name, g.form, rimW));
        const fruit = w * (PICK_FRUIT[name] ?? PICK_FRUIT_DEFAULT);
        let cx: number; let cy: number; let angle: number;
        if (flag) {
          // 깃발 — 과일 조각과 열매를 한 꼬치에 꿴다. 열매는 잔 입구 안쪽, 꼬치는 과일 조각 가운데를 지나 위로 나온다.
          cx = rim.cx + rim.rx * .05;
          cy = rim.cy + fruit * .2;
          angle = Math.atan2(flag.x - cx, cy - flag.y) * 180 / Math.PI;
          angle = Math.max(-PICK_REST, Math.min(PICK_REST, angle));
        } else {
          // 꼬치만 — 테두리에 비스듬히 걸쳐 열매는 잔 안쪽에, 손잡이 쪽은 왼쪽 위로 나온다
          cx = rim.cx - rim.rx * .22;
          cy = rim.cy + fruit * .35;
          angle = -PICK_REST;
        }
        // 꼬치 끝은 잔 안에 머문다 — 기운 만큼 옆으로 가므로, 그 높이의 잔 폭을 넘기 전에 멈춘다
        const slope = Math.tan(Math.abs(angle) * Math.PI / 180) * (angle < 0 ? 1 : -1);
        let end = cy;
        for (let y = cy; y <= tipY; y += .5) {
          const wa = widthAt(s, y);
          if (Math.abs(cx + slope * (y - cy) - wa.cx) > wa.rx * .85) break;
          end = y;
        }
        out.push({ name, w, h, x: cx - w / 2, y: cy - h / 2, layer: 'under', pick: { cx, cy, angle, tipY: end } });
        break;
      }
      case 'top':
        // 줄기 아래쪽이 술에 잠기고 잎은 잔 위로 솟는다
        out.push({ name, w, h, x: rim.cx - rim.rx * .35 - w / 2, y: surface.cy + h * .3 - h, layer: 'under' });
        break;
      case 'inside': {
        // 하이볼 안쪽 벽에 붙은 둥근 조각 — 잔 폭에 맞춘다
        const fit = Math.min(w, surface.rx * 1.15);
        h = h * fit / w;
        w = fit;
        const mid = surface.cy + (s.bottom - surface.cy) * .42;
        out.push({ name, w, h, x: surface.cx - surface.rx * .9, y: mid - h / 2, layer: 'inside' });
        break;
      }
    }
  }
  return out;
}

/** 경계가 또렷한 곳(같은 위치에 색 두 개)에서 층을 나눈다. 번지는 구간은 한 층 안의 그라데이션으로 남는다. */
function splitLayers(stops: LiquidStop[]): Array<{ from: number; stops: LiquidStop[] }> {
  const out: Array<{ from: number; stops: LiquidStop[] }> = [{ from: 0, stops: [] }];
  stops.forEach((st, i) => {
    const prev = stops[i - 1];
    if (prev && Math.abs(prev.at - st.at) < 1e-3 && prev.color !== st.color) out.push({ from: st.at, stops: [] });
    out[out.length - 1]!.stops.push(st);
  });
  return out;
}

/** 높이 y 에서 액체의 가운데와 반폭 */
function widthAt(s: GlassSprite, y: number): { cx: number; rx: number } {
  const p = s.profile;
  const first = p[0]!;
  const last = p[p.length - 1]!;
  if (y <= first[0]) return { cx: first[1], rx: first[2] };
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    if (y <= b[0]) {
      const t = (y - a[0]) / Math.max(1e-6, b[0] - a[0]);
      return { cx: a[1] + (b[1] - a[1]) * t, rx: a[2] + (b[2] - a[2]) * t };
    }
  }
  return { cx: last[1], rx: last[2] };
}

/** 잔 한 잔 — 칵테일이든 위스키든 색·효과만 받아 같은 그림을 그린다. */
function Drink({ kind, fill, alpha, layers, effects, garnish, size }: {
  kind: GlassKind; fill: string; alpha: number; layers?: LiquidStop[] | null;
  effects: VisualEffect; garnish: GarnishItem[]; size: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); // useId 의 콜론은 url(#…) 참조에서 안전하지 않다
  const id = (name: string) => `glass-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const s = GLASS_SPRITES[kind];
  const { box, surface, rim } = s;
  // 키운 가니시가 그림 밖으로 잘리지 않게 80×80 안에 붙잡는다
  const placed = place(garnish, s, size).map((p) => p.pick ? p : ({ ...p, x: Math.min(80 - p.w, Math.max(0, p.x)), y: Math.max(0, p.y) }));
  const rimCrust = garnish.some((g) => g.place === 'rim');
  const dust = garnish.some((g) => g.place === 'dust');
  const depth = Math.max(4, s.bottom - surface.cy);
  const bubbles = effects.bubbles
    ? Array.from({ length: 14 }, (_, i) => ({
      cx: surface.cx + ((i * 7) % 13 - 6) * surface.rx / 7.5,
      cy: surface.cy + 3 + ((i * 11) % 23) / 23 * (depth - 5),
      r: .55 + (i % 3) * .3,
    }))
    : [];
  const img = (p: Placed) => {
    const sp = GARNISH_SPRITES[p.name];
    return <image key={p.name} href={sp.src} x={p.x.toFixed(2)} y={p.y.toFixed(2)} width={p.w.toFixed(2)} height={p.h.toFixed(2)} preserveAspectRatio="none"/>;
  };
  // 꼬치 — 그림을 세워 열매를 테두리 위에 두고, 그림의 꼬치 끝에서 술 속까지 같은 방향으로 이어 그린다.
  // 유리 그림 아래에 깔리므로 잔 속 부분은 유리를 통해 비쳐 보인다.
  const pickArt = (p: Placed, part: 'stick' | 'fruit') => {
    const sp = GARNISH_SPRITES[p.name];
    const pk = p.pick!;
    // 그림의 꼬치는 위쪽이 오른쪽으로 45° 누워 있다 — 왼쪽으로 기울일 때는 뒤집고, 남는 각도만큼 돌린다
    const mirror = pk.angle < 0 ? -1 : 1;
    const rot = (Math.abs(pk.angle) - 45) * mirror;
    // 그림 좌표에서 열매 가운데 → 꼬치 끝 방향
    const ex = (PICK_END.x - PICK_MID.x) * p.w;
    const ey = (PICK_END.y - PICK_MID.y) * p.h;
    const len = Math.hypot(ex, ey);
    // 꼬치 끝이 tipY 에 닿는 길이(세로에서 angle 만큼 기운다)
    const need = (pk.tipY - pk.cy) / Math.cos(Math.abs(pk.angle) * Math.PI / 180);
    const t = Math.max(1, need / len);
    const sw = Math.max(.7, p.w * .055);
    return (
      <g key={p.name + part} transform={`translate(${pk.cx.toFixed(2)} ${pk.cy.toFixed(2)}) rotate(${rot}) scale(${mirror} 1)`}>
        {part === 'stick'
          ? <line x1={(ex * .9).toFixed(2)} y1={(ey * .9).toFixed(2)} x2={(ex * t).toFixed(2)} y2={(ey * t).toFixed(2)}
            stroke="#D9A566" strokeWidth={sw.toFixed(2)} strokeLinecap="round"/>
          : <image href={sp.src} x={(-p.w * PICK_MID.x).toFixed(2)} y={(-p.h * PICK_MID.y).toFixed(2)}
            width={p.w.toFixed(2)} height={p.h.toFixed(2)} preserveAspectRatio="none"/>}
      </g>
    );
  };
  // 어두운 바탕에서 옅은 술이 비어 보이지 않게 충분히 칠한다(밀도 차이는 위쪽에 남는다)
  const top = Math.min(1, .62 + alpha * .35);
  // 층 — 또렷한 경계마다 아래층을 따로 칠하고, 그 윗변을 잔 입구와 같은 원근의 곡선(앞쪽 호)으로 깎는다
  const bands = splitLayers(layers ?? [{ at: 0, color: fill }, { at: 1, color: fill }]);
  const yAt = (at: number) => surface.cy + at * (s.bottom - surface.cy);
  const flat = surface.ry / Math.max(1, surface.rx);
  const bandPath = (from: number) => {
    const y = yAt(from);
    const { cx, rx } = widthAt(s, y);
    const ry = rx * flat;
    const l = box.x - 2, r = box.x + box.w + 2, b = box.y + box.h + 2;
    return `M${l} ${y.toFixed(2)} H${(cx - rx).toFixed(2)} A${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(cx + rx).toFixed(2)} ${y.toFixed(2)} H${r} V${b} H${l}Z`;
  };

  return <svg className="glassart" viewBox="0 0 80 80" width={size} height={size} aria-hidden="true">
    <defs>
      <mask id={id('liquid')} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <image href={s.liquid} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="none"/>
      </mask>
      {/* 층마다 그라데이션 하나 — 불투명도는 위가 옅고 아래로 짙어지는 규칙을 그대로 따른다 */}
      {bands.map((band, k) => <linearGradient key={k} id={id(`liquid-${k}`)} x1="0" y1={surface.cy} x2="0" y2={s.bottom} gradientUnits="userSpaceOnUse">
        {band.stops.map((st, i) =>
          <stop key={i} offset={st.at.toFixed(3)} stopColor={st.color} stopOpacity={(top + (1 - top) * st.at).toFixed(3)}/>)}
      </linearGradient>)}
      <filter id={id('shadow')} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="1.8"/></filter>
    </defs>
    <ellipse cx="40" cy={box.y + box.h + 1} rx={Math.min(24, box.w * .42)} ry="2.2" fill="#0E1416" opacity=".3" filter={url('shadow')}/>
    <g mask={url('liquid')}>
      {bands.map((band, k) => k === 0
        ? <rect key={k} x={box.x} y={box.y} width={box.w} height={box.h} fill={url(`liquid-${k}`)}/>
        : <path key={k} d={bandPath(band.from)} fill={url(`liquid-${k}`)}/>)}
      {placed.filter((p) => p.layer === 'inside').map((p) => <g key={p.name} opacity=".88">{img(p)}</g>)}
      {effects.bubbles && <g fill="none">
        {/* 옅은 음료 위에서는 흰 기포가 사라진다 — 어두운 밑테를 한 겹 깔아 형태를 남긴다. */}
        <g stroke="#46565F" strokeOpacity=".22" strokeWidth=".9">{bubbles.map((b, i) => <circle key={i} {...b}/>)}</g>
        <g stroke="#FFF" strokeOpacity=".8" strokeWidth=".55">{bubbles.map((b, i) => <circle key={i} {...b}/>)}</g>
      </g>}
      {effects.foam && <g fill="#FFF4DC">
        <rect x={surface.cx - surface.rx - 2} y={surface.cy - surface.ry - 2} width={surface.rx * 2 + 4} height={surface.ry + 5}/>
        {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={surface.cx + (i - 4) * surface.rx / 5} cy={surface.cy + 2.4 + (i % 2) * .5} r=".7" fill="#E4D6BB" opacity=".6"/>)}
      </g>}
    </g>
    {/* 넛맥·시나몬: 진한 음료 위에서도 남도록 옅은 테를 두른다. */}
    {dust && <g fill="#8A542D" stroke="#FFF1D8" strokeOpacity=".5" strokeWidth=".3">
      {Array.from({ length: 11 }, (_, i) => <circle key={i} cx={surface.cx + ((i * 7) % 17 - 8) * surface.rx / 11} cy={surface.cy + (i % 3 - 1) * surface.ry * .45} r={i % 2 ? .65 : .45}/>)}
    </g>}
    {placed.filter((p) => p.layer === 'under').map((p) => p.pick ? pickArt(p, 'stick') : img(p))}
    <image href={s.glass} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="none"/>
    {/* 꼬치 열매는 유리 위에 — 얼음·유리에 가려 사라지지 않게. 술 속 꼬치 대만 유리 아래에 깐다 */}
    {placed.filter((p) => p.pick).map((p) => pickArt(p, 'fruit'))}
    {placed.filter((p) => p.layer === 'over').map(img)}
    {/* 소금·설탕 림: 좁은 잔에서 굵은 대시는 빗살처럼 보인다 — 굵기를 잔 너비에 맞춘다. */}
    {rimCrust && (() => {
      const w = Math.min(2.2, Math.max(1.2, rim.rx / 8));
      return <ellipse {...rim} fill="none" stroke="#F1E4C8" strokeWidth={w} strokeLinecap="round"
        strokeDasharray={`${(w * .34).toFixed(2)} ${(w * .9).toFixed(2)}`}/>;
    })()}
  </svg>;
}

export function GlassArt({ cocktail, size = 56 }: { cocktail: Cocktail; size?: number }) {
  const { fill, alpha } = drinkColor(cocktail);
  return <Drink kind={glassOf(cocktail)} fill={fill} alpha={alpha} layers={liquidLayers(cocktail)}
    effects={visualEffectOf(cocktail)} garnish={garnishItems(cocktail)} size={size}/>;
}

/**
 * 위스키 한 잔 — 레시피가 아니라 병에서 색을 받는다(규칙은 bottleVisual.ts).
 * 잔 모양은 잔대로 여기 한 곳에만 둔다.
 */
export function NeatPour({ fill, alpha, size = 56 }: { fill: string; alpha: number; size?: number }) {
  return <Drink kind="rocks" fill={fill} alpha={alpha}
    effects={{ bubbles: false, foam: false }} garnish={[]} size={size}/>;
}
