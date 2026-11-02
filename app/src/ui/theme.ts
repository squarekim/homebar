/**
 * theme — 화면 테마. 다크가 기본이고 라이트는 설정에서 고른다.
 * 기기 설정(prefers-color-scheme)은 따르지 않는다. 바 조명 아래 잔처럼 보이는 다크가 이 앱의 기본 얼굴이다.
 * 고른 값은 이 브라우저에만 둔다(저장이 막혀 있으면 매번 다크로 시작).
 */
export type Theme = 'dark' | 'light';
const KEY = 'homebar.theme';
const BAR: Record<Theme, string> = { dark: '#1B2427', light: '#F3F5F3' };

export function savedTheme(): Theme {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function applyTheme(t: Theme, save = false): void {
  document.documentElement.dataset['theme'] = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
  if (save) { try { localStorage.setItem(KEY, t); } catch { /* 저장이 막혀도 이번 화면에는 적용된다 */ } }
}
