/** alignIbaGlassGarnish.mjs 의 타입 선언. */
export const GLASS: Record<string, string[]>;
export const GARNISH: Record<string, string>;
export function alignGlassGarnish(options?: { dry?: boolean }): { glass: number; garnish: number; retired: number };
