/**
 * whiskyDiversityService — 보유 위스키 분류에서 축별 커버리지/결손을 자동 계산하고,
 * 후보 위스키를 넣었을 때 겹치는 축과 새로 채우는 축을 시뮬레이션한다.
 * 정적 표가 아니라 컬렉션(분류) 변화에 실시간 반응한다.
 */
import { type Bottle, type WhiskyClass } from '../models/types';

export interface AxisFamily {
  key: string;
  label: string;
  universe: string[];
  pick: (c: WhiskyClass) => string[];
}

/** 축 값과 병의 분류 값이 매칭되는지 (셰리는 PX/올로로소 포함, 지역/캐스크는 부분일치) */
function match(axisValue: string, picked: string): boolean {
  if (!picked) return false;
  if (axisValue === '셰리') return ['셰리', 'PX', '올로로소'].some((s) => picked.includes(s));
  return picked.includes(axisValue) || axisValue.includes(picked);
}

export const AXIS_FAMILIES: AxisFamily[] = [
  { key: 'origin', label: '원산지', universe: ['스카치', '버번', '테네시', '아이리시', '재패니즈', '코리안'], pick: (c) => [c.origin] },
  { key: 'type', label: '타입', universe: ['싱글몰트', '블렌디드', '블렌디드 몰트', '스트레이트 버번', '휘티드 버번', '테네시 위스키'], pick: (c) => [c.type] },
  { key: 'region', label: '지역(스카치)', universe: ['스페이사이드', '하이랜드', '아일라', '아일랜드', '캠벨타운', '로우랜드'], pick: (c) => [c.region ?? ''] },
  { key: 'cask', label: '캐스크', universe: ['셰리', '버번', '와인', '프렌치오크', '버진오크', '뉴 차드 오크'], pick: (c) => c.cask },
  { key: 'character', label: '캐릭터', universe: ['피티드', '논피트', '스모키', '왁시', '캐스크 스트렝스', '휘티드'], pick: (c) => c.character },
];

export interface AxisCell { value: string; count: number; bottles: string[]; gap: boolean; }
export interface FamilyCoverage { key: string; label: string; cells: AxisCell[]; gapCount: number; }

export function computeCoverage(whiskies: Bottle[]): FamilyCoverage[] {
  const classed = whiskies.filter((w) => w.whiskyClass);
  return AXIS_FAMILIES.map((fam) => {
    const cells: AxisCell[] = fam.universe.map((value) => {
      const bottles = classed
        .filter((w) => fam.pick(w.whiskyClass!).some((p) => match(value, p)))
        .map((w) => w.name);
      return { value, count: bottles.length, bottles, gap: bottles.length === 0 };
    });
    return { key: fam.key, label: fam.label, cells, gapCount: cells.filter((c) => c.gap).length };
  });
}

export interface SimHit { family: string; value: string; count?: number; }
export interface SimResult { newlyFilled: SimHit[]; overlaps: SimHit[]; gain: number; }

/* ── 지역 × 숙성 매트릭스 (원본 시음 매트릭스를 현재 컬렉션으로 실시간 계산) ── */
export const MATRIX_REGIONS = ['스페이사이드', '하이랜드', '아일라', '아일랜드', '캠벨타운', '로우랜드'];
export const MATRIX_TIERS = ['엔트리', '스탠다드', '고숙성(18+)'] as const;
export type MatrixTier = (typeof MATRIX_TIERS)[number];

/** 병 이름에서 숙성 연수 추출 (예: "맥캘란 더블 캐스크 12년" → 12, NAS → null) */
export function parseAge(name: string): number | null {
  const m = name.match(/(\d{1,2})\s*(?:년|yo|year)/i);
  if (m) { const a = Number(m[1]); if (a >= 2 && a <= 40) return a; }
  return null;
}
function tierOf(age: number | null): MatrixTier | null {
  if (age == null) return null;
  if (age <= 11) return '엔트리';
  if (age <= 17) return '스탠다드';
  return '고숙성(18+)';
}

export interface MatrixRow { region: string; cells: Record<MatrixTier, string[]>; }

/** 보유 스카치 싱글몰트를 지역×숙성 칸에 배치. 빈 칸 = 결손(다음 구매 후보). */
export function computeRegionMaturityMatrix(whiskies: Bottle[]): MatrixRow[] {
  const stripParen = (s: string) => s.replace(/\s*\(.*?\)\s*$/, '');
  const sm = whiskies.filter((w) => w.whiskyClass?.origin === '스카치' && w.whiskyClass?.type === '싱글몰트');
  return MATRIX_REGIONS.map((region) => {
    const cells = { 엔트리: [], 스탠다드: [], '고숙성(18+)': [] } as Record<MatrixTier, string[]>;
    for (const w of sm) {
      const r = stripParen(w.whiskyClass!.region ?? '');
      if (!r || !(r.includes(region) || region.includes(r))) continue;
      const tier = tierOf(parseAge(w.name));
      if (tier) cells[tier].push(w.name);
    }
    return { region, cells };
  });
}

/** 후보 위스키(분류)를 추가하면 어떤 축을 새로 채우고 어떤 축과 겹치는지 */
export function simulateAdd(candidate: WhiskyClass, whiskies: Bottle[]): SimResult {
  const cov = computeCoverage(whiskies);
  const covByKey = new Map(cov.map((f) => [f.key, f]));
  const newlyFilled: SimHit[] = [];
  const overlaps: SimHit[] = [];

  for (const fam of AXIS_FAMILIES) {
    const picked = fam.pick(candidate).filter(Boolean);
    const famCov = covByKey.get(fam.key)!;
    for (const value of fam.universe) {
      const candidateCovers = picked.some((p) => match(value, p));
      if (!candidateCovers) continue;
      const cell = famCov.cells.find((c) => c.value === value)!;
      if (cell.gap) newlyFilled.push({ family: fam.label, value });
      else overlaps.push({ family: fam.label, value, count: cell.count });
    }
  }
  return { newlyFilled, overlaps, gain: newlyFilled.length };
}
