/**
 * icons.tsx — 하단 네비용 2D 선형(라인아트) 아이콘.
 * 전부 24 뷰박스, fill 없음, stroke=currentColor 로 통일 → 활성 탭 색을 따라간다.
 */
import { ReactNode } from 'react';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function svg(children: ReactNode) {
  return <svg className="svgic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>{children}</svg>;
}

/** 홈 — 집 */
export function IconHome() {
  return svg(<><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" /><path d="M10 20v-5h4v5" /></>);
}

/** 홈바 — 마티니 글라스 */
export function IconMartini() {
  return svg(<><path d="M4.5 5h15l-7.5 8.5z" /><path d="M12 13.5V20" /><path d="M8 20h8" /></>);
}

/** 상단 브랜드 로고 마크 — 마티니 글라스(가니시 포함), 더 크게 */
export function IconLogo() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16l-8 9z" />
      <path d="M12 14v6" />
      <path d="M7.5 20.5h9" />
      <path d="M16.5 4.2l2-1.6" />
      <circle cx="19" cy="2.2" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** 위스키 — 온더락 (락글라스 + 얼음 두 조각) */
export function IconWhisky() {
  return svg(<>
    <path d="M6.8 5h10.4l-.7 12.4a1.6 1.6 0 0 1-1.6 1.5H9.1a1.6 1.6 0 0 1-1.6-1.5z" />
    <rect x="8.6" y="8.7" width="3.5" height="3.5" rx="0.4" />
    <rect x="12" y="11" width="3" height="3" rx="0.4" />
  </>);
}

/** 추천 — 스파클(반짝임) */
export function IconSparkle() {
  return svg(<><path d="M12 3.5c.4 3.4 1.6 4.6 5 5-3.4.4-4.6 1.6-5 5-.4-3.4-1.6-4.6-5-5 3.4-.4 4.6-1.6 5-5z" /><path d="M18 14.5c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3z" /></>);
}

/** 프로필 — 사람 */
export function IconProfile() {
  return svg(<><circle cx="12" cy="8" r="3.3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>);
}

/* ── 조주법 2D 라인 아이콘 ── */
/* 칵테일 이름 옆에 붙어 "이건 흔들어 만드는 술"을 글자 없이 알려준다. 전부 24 뷰박스·stroke=currentColor. */

const M = { width: 21, height: 21, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

/** 빌드 — 잔에 바로 붓기 */
export const IconBuild = () => (
  <svg {...M}><path d="M7.4 11h9.2l-1 9.2H8.4L7.4 11Z" /><path d="M12 2.2v6.4" /><path d="M9.6 6.2 12 8.8l2.4-2.6" /></svg>
);
/** 셰이크 — 셰이커 흔들기 */
export const IconShake = () => (
  <svg {...M}><path d="M9.4 8h5.2l1 12.2H8.4L9.4 8Z" /><path d="M9.8 8V5.6h4.4V8" /><path d="M9.8 5.6h4.4" /><path d="M4.6 6.6 3.2 5.2M19.4 6.6l1.4-1.4" /></svg>
);
/** 스터 — 믹싱글라스에 바스푼 저어주기 */
export const IconStir = () => (
  <svg {...M}><path d="M6.6 8.4h10.8v9.4a2.4 2.4 0 0 1-2.4 2.4H9a2.4 2.4 0 0 1-2.4-2.4V8.4Z" /><path d="M14.4 10.6 10.2 3.4" /><circle cx="9.6" cy="2.9" r="1.3" /></svg>
);
/** 머들 — 머들러로 으깨기 */
export const IconMuddle = () => (
  <svg {...M}><path d="M6.4 12h11.2v6a2.4 2.4 0 0 1-2.4 2.4H8.8A2.4 2.4 0 0 1 6.4 18v-6Z" /><path d="M13.6 2.4v6.8" /><path d="M11.4 9.2h4.4v3.4h-4.4z" /></svg>
);
/** 블렌드 — 블렌더로 갈기 */
export const IconBlend = () => (
  <svg {...M}><path d="M7.6 4h8.8l-1.2 12H8.8L7.6 4Z" /><path d="M9.6 20h4.8" /><path d="M12 16v4" /><path d="M9.8 9.4 12 11.6l2.2-2.2" /></svg>
);
/** 레이어 — 밀도 차로 층 쌓기 */
export const IconLayer = () => (
  <svg {...M}><path d="M7.2 3.6h9.6l-1.1 16.8H8.3L7.2 3.6Z" /><path d="M7.9 9.2h8.2M8.3 14.4h7.4" /></svg>
);
/** 스위즐 — 스위즐 스틱으로 크러시드 아이스 섞기 */
export const IconSwizzle = () => (
  <svg {...M}><path d="M7.4 8.6h9.2l-1 11.6H8.4L7.4 8.6Z" /><path d="M12 2.6v6" /><path d="M9.8 4.4 12 6.2l2.2-1.8" /></svg>
);
/** 플로트 — 마지막에 얇게 띄우기 */
export const IconFloat = () => (
  <svg {...M}><path d="M6.6 9h10.8l-1.3 11.2H7.9L6.6 9Z" /><path d="M7.2 12.6h9.6" /><path d="M12 2.4v4.2" /><path d="M14.4 4.6 12 2.4 9.6 4.6" /></svg>
);
