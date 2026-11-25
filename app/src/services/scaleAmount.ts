/** 잔 수와 단위에 맞춘 용량 표기. ml 로 환산되지 않는 재료(dash·적당량)는 null — 원문을 그대로 쓴다. */
export type AmountUnit = 'ml' | 'oz';

export function scaledAmount(amountMl: number | null, servings: number, unit: AmountUnit): string | null {
  if (amountMl == null) return null;
  const ml = amountMl * servings;
  if (unit === 'oz') return `${+(Math.round((ml / 30) * 4) / 4).toFixed(2)} oz`; // 1 oz = 30ml, 1/4 단위
  return `${+ml.toFixed(1)}ml`;
}
