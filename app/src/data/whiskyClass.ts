/**
 * whiskyClass.ts — 보유 위스키의 분류 체계.
 * 원본 seed 의 matrix/cask 축과 통용되는 위스키 분류(원산지·타입·지역·캐스크·캐릭터)를
 * 병(bottle) id 별로 정립한 파생 레이어. 원본 데이터는 변경하지 않는다.
 * 값은 검증 가능한 사실(라벨·증류소 공개 정보) 기준.
 */
import { WhiskyClass } from '../models/types';

export { WHISKY_CLASS } from './whiskyClassSeed';

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
