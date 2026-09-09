/**
 * icons.tsx — 하단 네비용 2D 선형(라인아트) 아이콘.
 * 전부 24 뷰박스, fill 없음, stroke=currentColor 로 통일 → 활성 탭 색을 따라간다.
 */
import { ReactNode } from 'react';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function svg(children: ReactNode) {
  return <svg className="svgic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}>{children}</svg>;
}

/** 홈 — 집 */
export function IconHome() {
  return svg(<><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.5" /><path d="M10 20v-5h4v5" /></>);
}

/** 홈바 — 칵테일 쉐이커 */
export function IconShaker() {
  return svg(<><path d="M9 3h6l-.6 2.2H9.6z" /><path d="M8.6 5.2h6.8l.9 1.9H7.7z" /><path d="M7.9 7.1h8.2l-.9 11.2a2 2 0 0 1-2 1.8h-2.4a2 2 0 0 1-2-1.8z" /><path d="M8.4 12h7.2" /></>);
}

/** 위스키 — 온더락 텀블러 (술 레벨 + 얼음) */
export function IconWhisky() {
  return svg(<><path d="M7 5h10l-.7 12.6a2 2 0 0 1-2 1.9H9.7a2 2 0 0 1-2-1.9z" /><path d="M7.35 11.5h9.3" /><path d="M10.2 12.6h3.1v3.1h-3.1z" /></>);
}

/** 추천 — 스파클(반짝임) */
export function IconSparkle() {
  return svg(<><path d="M12 3.5c.4 3.4 1.6 4.6 5 5-3.4.4-4.6 1.6-5 5-.4-3.4-1.6-4.6-5-5 3.4-.4 4.6-1.6 5-5z" /><path d="M18 14.5c.2 1.5.8 2.1 2.3 2.3-1.5.2-2.1.8-2.3 2.3-.2-1.5-.8-2.1-2.3-2.3 1.5-.2 2.1-.8 2.3-2.3z" /></>);
}

/** 프로필 — 사람 */
export function IconProfile() {
  return svg(<><circle cx="12" cy="8" r="3.3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>);
}
