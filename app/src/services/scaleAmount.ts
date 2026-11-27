/** 잔 수와 단위에 맞춘 용량 표기. ml 로 환산되지 않는 재료(dash·적당량)는 null — 원문을 그대로 쓴다. */
export type AmountUnit = 'ml' | 'oz';

/** 내 비율 — 칵테일별로 재료 순번 → 1잔 기준 ml 가감. localStorage 에 두고 백업 파일에도 넣는다. */
type MyRatio = Record<string, number>;
const RATIO_KEY = 'homebar.myRatio';
export function readAll(): Record<string, MyRatio> {
  try { return JSON.parse(localStorage.getItem(RATIO_KEY) || '{}'); } catch { return {}; }
}
export function writeAll(all: Record<string, MyRatio>): void {
  try { localStorage.setItem(RATIO_KEY, JSON.stringify(all)); } catch { /* 저장소가 막힌 브라우저 */ }
}
export function myRatio(cocktailId: string): MyRatio { return readAll()[cocktailId] ?? {}; }
export function saveMyRatio(cocktailId: string, r: MyRatio): void {
  const all = readAll();
  if (Object.values(r).some((v) => v !== 0)) all[cocktailId] = r; else delete all[cocktailId];
  writeAll(all);
}

export function scaledAmount(amountMl: number | null, servings: number, unit: AmountUnit): string | null {
  if (amountMl == null) return null;
  const ml = amountMl * servings;
  if (unit === 'oz') return `${+(Math.round((ml / 30) * 4) / 4).toFixed(2)} oz`; // 1 oz = 30ml, 1/4 단위
  return `${+ml.toFixed(1)}ml`;
}
