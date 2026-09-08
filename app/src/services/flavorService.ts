/**
 * flavorService — 향미 벡터 수학 및 취향 파생.
 * 추천 엔진의 유사도 계산(cosine / weighted distance)을 제공한다.
 */
import { FlavorVector, FlavorAxis, FLAVOR_AXES, zeroVector, DrinkLog } from '../models/types';

export function cosineSimilarity(a: FlavorVector, b: FlavorVector): number {
  let dot = 0, na = 0, nb = 0;
  for (const axis of FLAVOR_AXES) {
    dot += a[axis] * b[axis];
    na += a[axis] * a[axis];
    nb += b[axis] * b[axis];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 취향 가중 거리 점수 (1 = 근접, 0 = 원거리). 선호 높은 축의 불일치에 더 민감. */
export function weightedDistanceScore(taste: FlavorVector, flavor: FlavorVector): number {
  let num = 0, den = 0;
  for (const axis of FLAVOR_AXES) {
    const w = 0.3 + taste[axis] / 10; // 선호 높을수록 가중
    const diff = (taste[axis] - flavor[axis]) / 10;
    num += w * diff * diff;
    den += w;
  }
  if (den === 0) return 0;
  return 1 - Math.sqrt(num / den);
}

/** 개인 취향 적합도 0~100 (cosine 기반) */
export function tasteMatch(taste: FlavorVector, flavor: FlavorVector): number {
  return Math.round(cosineSimilarity(taste, flavor) * 100);
}

/** 그룹 취향 적합도 0~100.
 * 평균이 아니라, 특정 사용자가 매우 싫어하는(선호 낮은) 축이 강한 술에 패널티를 준다. */
export function groupTasteMatch(profiles: FlavorVector[], flavor: FlavorVector): { score: number; penalty: number } {
  if (profiles.length === 0) return { score: 0, penalty: 0 };
  const avg = averageVectors(profiles);
  const base = cosineSimilarity(avg, flavor) * 100;

  // 패널티: 어떤 사용자의 선호가 매우 낮은(<=2) 축을 술이 강하게(>=6) 가지면 감점
  let penalty = 0;
  for (const axis of FLAVOR_AXES) {
    if (flavor[axis] >= 6) {
      for (const p of profiles) {
        if (p[axis] <= 2) penalty += (flavor[axis] - 5) * (3 - p[axis]) * 1.4;
      }
    }
  }
  const score = Math.max(0, Math.round(base - penalty));
  return { score, penalty: Math.round(penalty) };
}

export function averageVectors(vectors: FlavorVector[]): FlavorVector {
  const v = zeroVector();
  if (vectors.length === 0) return v;
  for (const vec of vectors) for (const axis of FLAVOR_AXES) v[axis] += vec[axis];
  for (const axis of FLAVOR_AXES) v[axis] /= vectors.length;
  return v;
}

/** 음용 기록으로부터 취향 벡터 파생.
 * 각 로그의 flavorRatings 를 rating(0~5)·retryIntent 가중으로 누적 평균. */
export function deriveTasteFromLogs(logs: DrinkLog[]): FlavorVector | null {
  const sum = zeroVector();
  const cnt = zeroVector();
  let used = 0;
  for (const log of logs) {
    const fr = log.flavorRatings;
    const hasAny = Object.keys(fr).length > 0;
    if (!hasAny) continue;
    const w = (0.4 + log.rating / 5) * (log.retryIntent ? 1.3 : 1);
    for (const axis of FLAVOR_AXES) {
      const val = fr[axis];
      if (val == null) continue;
      sum[axis] += val * w;
      cnt[axis] += w;
    }
    used++;
  }
  if (used === 0) return null;
  const out = zeroVector();
  for (const axis of FLAVOR_AXES) out[axis] = cnt[axis] > 0 ? sum[axis] / cnt[axis] : 5;
  return out;
}

/** 두 벡터를 가중 혼합(취향 점진 업데이트) */
export function blendVectors(current: FlavorVector, incoming: FlavorVector, alpha: number): FlavorVector {
  const out = zeroVector();
  for (const axis of FLAVOR_AXES) out[axis] = current[axis] * (1 - alpha) + incoming[axis] * alpha;
  return out;
}

export function topAxes(v: FlavorVector, n = 3): FlavorAxis[] {
  return [...FLAVOR_AXES].sort((a, b) => v[b] - v[a]).slice(0, n).filter((a) => v[a] > 0);
}
