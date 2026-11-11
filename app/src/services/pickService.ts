/**
 * pickService — '오늘의 잔' 뽑기.
 * 후보는 추천 순서대로 들어온다. 앞에 있을수록 뽑힐 확률이 높고(가중치 n, n-1, …, 1),
 * 바로 전에 나온 잔은 후보가 둘 이상일 때 뺀다.
 * 그림 규칙(데이터에서 결정적으로 그린다)과는 별개다. 무작위는 '어느 잔을 고르나'에만 쓴다.
 */
export function weightedPick(count: number, last: number | null, rand: () => number = Math.random): number {
  if (count <= 0) return -1;
  const idx: number[] = [];
  for (let i = 0; i < count; i++) if (count < 2 || i !== last) idx.push(i);
  const weights = idx.map((i) => count - i);
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let k = 0; k < idx.length; k++) {
    r -= weights[k]!;
    if (r < 0) return idx[k]!;
  }
  return idx[idx.length - 1]!;
}
