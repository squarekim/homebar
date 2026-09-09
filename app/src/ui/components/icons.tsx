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
