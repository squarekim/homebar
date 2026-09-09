/**
 * whiskyClass.ts — 보유 위스키의 분류 체계.
 * 원본 seed 의 matrix/cask 축과 통용되는 위스키 분류(원산지·타입·지역·캐스크·캐릭터)를
 * 병(bottle) id 별로 정립한 파생 레이어. 원본 데이터는 변경하지 않는다.
 * 값은 검증 가능한 사실(라벨·증류소 공개 정보) 기준.
 */
import { WhiskyClass } from '../models/types';

export const WHISKY_CLASS: Record<string, WhiskyClass> = {
  // ── 스카치 싱글몰트 ──
  macallan:     { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['셰리', '버번'], character: ['논피트'] },
  glenallachie: { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['PX', '올로로소', '와인', '버진오크'], character: ['캐스크 스트렝스', '논피트'] },
  glenmorangie: { origin: '스카치', type: '싱글몰트', region: '하이랜드', cask: ['버번'], character: ['논피트'] },
  glenfiddich:  { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['셰리', '버번', '버진오크'], character: ['논피트', '솔레라'] },
  glenlivet:    { origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: ['프렌치오크'], character: ['논피트'] },
  ballantine_sm:{ origin: '스카치', type: '싱글몰트', region: '스페이사이드', cask: [], character: ['논피트'] },
  talisker10:   { origin: '스카치', type: '싱글몰트', region: '아일랜드(스카이)', cask: [], character: ['피티드', '해양성'] },
  clynelish14:  { origin: '스카치', type: '싱글몰트', region: '하이랜드(해안)', cask: ['버번'], character: ['논피트', '왁시'] },
  kiwon_tiger:  { origin: '코리안', type: '싱글몰트', cask: ['셰리', '와인'], character: ['논피트'] },
  kiwon_eagle:  { origin: '코리안', type: '싱글몰트', cask: ['버번', '버진오크'], character: ['논피트'] },

  // ── 스카치 블렌디드 / 블렌디드 몰트 ──
  jw_green:     { origin: '스카치', type: '블렌디드 몰트', cask: [], character: ['피티드', '스모키'] },
  jw_black:     { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  jw_ruby:      { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  jw_blue:      { origin: '스카치', type: '블렌디드', cask: [], character: ['스모키'] },
  ballantine12: { origin: '스카치', type: '블렌디드', cask: [], character: [] },
  ballantine_f: { origin: '스카치', type: '블렌디드', cask: [], character: [] },
  dewars12:     { origin: '스카치', type: '블렌디드', cask: [], character: ['더블 에이징'] },
  kakubin:      { origin: '재패니즈', type: '블렌디드', cask: [], character: [] },

  // ── 아메리칸 ──
  wildturkey8:  { origin: '버번', type: '스트레이트 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['하이프루프'] },
  buffalo:      { origin: '버번', type: '스트레이트 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: [] },
  weller:       { origin: '버번', type: '휘티드 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['휘티드'] },
  makers:       { origin: '버번', type: '휘티드 버번', region: '켄터키', cask: ['뉴 차드 오크'], character: ['휘티드'] },
  jack:         { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] },
  // 올레 스모키 피넛버터: 리큐르로 재분류(제조사 인지 기준) → 위스키 분류에서 제외
};

/** 분류 필터에 노출할 대표 축(사용자가 말한 스카치/버번/싱글몰트/블렌디드/셰리/피트 등) */
export const CLASS_FILTERS = [
  '스카치', '버번', '테네시', '재패니즈', '코리안',
  '싱글몰트', '블렌디드', '피티드', '셰리', '캐스크 스트렝스',
] as const;

/** 한 위스키가 특정 분류 용어에 해당하는지 (origin/type/region/cask/character/피트 특례를 OR 로 매칭) */
export function classMatchesTerm(cls: WhiskyClass | undefined, term: string): boolean {
  if (!cls) return false;
  if (term === '피티드') return cls.character.includes('피티드');
  const hay = [cls.origin, cls.type, cls.region ?? '', ...cls.cask, ...cls.character];
  if (term === '블렌디드') return cls.type.includes('블렌디드'); // 블렌디드 + 블렌디드 몰트 포함
  if (term === '셰리') return cls.cask.some((c) => c === '셰리' || c === 'PX' || c === '올로로소');
  return hay.some((h) => h.includes(term));
}

/** 배지로 보여줄 분류 태그 배열 */
export function classTags(cls: WhiskyClass): string[] {
  return [cls.origin, cls.type, cls.region, ...cls.cask.map((c) => `${c} 캐스크`), ...cls.character]
    .filter((x): x is string => !!x);
}
