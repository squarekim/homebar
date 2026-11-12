/**
 * theme — 화면 테마. 종이 지면(라이트)이 기본이고 다크는 설정에서 고른다(2026-11-12 에디토리얼 개편).
 * 기기 설정(prefers-color-scheme)은 따르지 않는다.
 * 고른 값은 이 브라우저에만 둔다(저장이 막혀 있으면 매번 라이트로 시작).
 */
export type Theme = 'dark' | 'light';
const KEY = 'homebar.theme';
const BAR: Record<Theme, string> = { dark: '#151413', light: '#F6F4EF' };

export function savedTheme(): Theme {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(t: Theme, save = false): void {
  document.documentElement.dataset['theme'] = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
  if (save) { try { localStorage.setItem(KEY, t); } catch { /* 저장이 막혀도 이번 화면에는 적용된다 */ } }
}
