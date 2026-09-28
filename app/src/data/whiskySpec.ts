/**
 * whiskySpec.ts — WhiskyClass 를 3층 분류(WhiskySpec)로 나눈다.
 *
 * WhiskyClass 는 한 필드에 여러 기준이 섞여 있다. origin 에 나라와 법적 명칭('버번')이,
 * character 에 피트·향미·병입·공정이 함께 들어 있다. 여기서 축별로 나눈다.
 *
 *  - 저장하지 않고 매번 계산한다. 사용자가 추가한 병(IndexedDB)도 스키마 변경 없이 같은 결과를 얻는다.
 *  - 원본에 없는 사실은 만들지 않는다. 모르면 null, 피트는 '미상'.
 *  - 스카치 지역은 Scotch Whisky Regulations 2009 의 5개(하이랜드·로우랜드·스페이사이드·아일라·캠벨타운)만 법적 지역으로 쓴다.
 *    섬 지역은 법적으로 하이랜드이므로 legalRegion 하이랜드 + subRegion '섬 · 스카이' 로 둔다.
 */
import { type WhiskyBase, type WhiskyClass, type WhiskySpec } from '../models/types';

export const SCOTCH_REGIONS = ['하이랜드', '로우랜드', '스페이사이드', '아일라', '캠벨타운'] as const;

const COUNTRY: Record<string, string> = {
  스카치: '스코틀랜드', 아이리시: '아일랜드', 버번: '미국', 테네시: '미국', 아메리칸: '미국',
  캐나디안: '캐나다', 재패니즈: '일본', 코리안: '한국',
};

/**
 * 법적 명칭. 재패니즈는 일본주류주조조합 표시 기준 충족 여부를 확인하지 않았으므로 null.
 * 한국은 별도 법적 명칭이 없어 '기타 위스키'.
 */
function legalOf(c: WhiskyClass): string | null {
  switch (c.origin) {
    case '스카치': return '스카치 위스키';
    case '아이리시': return '아이리시 위스키';
    case '버번': return '버번 위스키';
    case '테네시': return '테네시 위스키';
    case '아메리칸': return c.type.includes('라이') ? '라이 위스키' : null;
    case '캐나디안': return '캐나디안 위스키';
    case '코리안': return '기타 위스키';
    default: return null;
  }
}

function compositionOf(c: WhiskyClass): Pick<WhiskySpec, 'composition' | 'base'> {
  const t = c.type;
  if (t === '싱글몰트') return { composition: 'single', base: '몰트' };
  if (t === '싱글 그레인') return { composition: 'single', base: '그레인' };
  if (t === '싱글 팟 스틸') return { composition: 'single', base: '팟 스틸' };
  if (t === '블렌디드 몰트') return { composition: 'blended', base: '몰트' };
  // 블렌디드 스카치는 법적으로 몰트+그레인이다. 다른 나라의 블렌디드는 구성 원액이 제각각이라 비운다.
  if (t === '블렌디드') return { composition: 'blended', base: c.origin === '스카치' ? '몰트+그레인' : null };
  const base: WhiskyBase | null = t.includes('버번') ? '버번' : t.includes('라이') ? '라이' : null;
  return { composition: null, base };
}

function regionOf(c: WhiskyClass): Pick<WhiskySpec, 'legalRegion' | 'subRegion'> {
  if (c.origin === '테네시') return { legalRegion: '테네시', subRegion: null };
  const r = c.region;
  if (!r) return { legalRegion: null, subRegion: null };
  const m = /^(.+?)\((.+)\)$/.exec(r);
  const head = m?.[1] ?? r;
  const paren = m?.[2] ?? null;
  if (c.origin === '스카치') {
    if (head === '아일랜드') return { legalRegion: '하이랜드', subRegion: paren ? `섬 · ${paren}` : '섬' };
    return { legalRegion: head, subRegion: paren };
  }
  // 아이리시의 '아일랜드'는 지역이 아니라 나라 이름이다.
  if (c.origin === '아이리시') return { legalRegion: null, subRegion: null };
  return { legalRegion: head, subRegion: paren };
}

export const CASK_LABEL: Record<string, string> = {
  버번: '버번 캐스크', 셰리: '셰리', PX: 'PX 셰리', 올로로소: '올로로소 셰리', 와인: '와인',
  버진오크: '버진 오크', 프렌치오크: '프렌치 오크', '뉴 차드 오크': '새 오크(내부 태움)', 럼: '럼', 미즈나라: '미즈나라',
};

type Axis = 'peat' | 'flavor' | 'strength' | 'bib' | 'caskMethod' | 'mashbill' | 'process';

/** character 토큰 → 들어갈 축과 표시값. 새 토큰이 생기면 여기에 먼저 넣는다(테스트가 누락을 잡는다). */
export const CHARACTER_AXIS: Record<string, [Axis, string]> = {
  피티드: ['peat', '피티드'],
  '라이트 피티드': ['peat', '피티드'],
  논피트: ['peat', '논피트'],
  스모키: ['flavor', '스모키'],
  해양성: ['flavor', '해양성'],
  왁시: ['flavor', '왁시'],
  '캐스크 스트렝스': ['strength', '캐스크 스트렝스'],
  하이프루프: ['strength', '하이 프루프'],
  '보틀드 인 본드': ['bib', '보틀드 인 본드'],
  솔레라: ['caskMethod', '솔레라'],
  '더블 에이징': ['caskMethod', '더블 에이징'],
  '프렌치오크 스테이브': ['caskMethod', '프렌치 오크 스테이브'],
  휘티드: ['mashbill', '휘티드'],
  하이라이: ['mashbill', '하이 라이'],
  '차콜 멜로잉': ['process', '차콜 멜로잉'],
  삼중증류: ['process', '3회 증류'],
};

/** 라벨 표시 연수. 제품명의 'N년'만 읽는다. 없으면 NAS 인지 미확인인지 구분할 수 없어 null. */
export function ageFromName(name: string | undefined): number | null {
  const m = name ? /(\d{1,2})\s*년/.exec(name) : null;
  return m?.[1] ? Number(m[1]) : null;
}

export function specOf(c: WhiskyClass, name?: string): WhiskySpec {
  const s: WhiskySpec = {
    country: COUNTRY[c.origin] ?? '기타',
    legal: legalOf(c),
    ...compositionOf(c),
    straight: c.type.startsWith('스트레이트') ? true : null,
    mashbill: null,
    ...regionOf(c),
    age: ageFromName(name),
    casks: c.cask.map((k) => CASK_LABEL[k] ?? k),
    caskMethod: [],
    strength: null,
    bottledInBond: false,
    singleBarrel: c.type.startsWith('싱글 배럴'),
    peat: '미상',
    peatNote: null,
    flavorNotes: [],
    process: [],
  };
  for (const token of c.character) {
    const hit = CHARACTER_AXIS[token];
    if (!hit) continue;
    const [axis, v] = hit;
    if (axis === 'peat') {
      s.peat = v === '피티드' ? '피티드' : '논피트';
      if (token !== v) s.peatNote = token;
    } else if (axis === 'flavor') s.flavorNotes.push(v);
    else if (axis === 'strength') s.strength = v === '캐스크 스트렝스' ? '캐스크 스트렝스' : '하이 프루프';
    else if (axis === 'bib') s.bottledInBond = true;
    else if (axis === 'caskMethod') s.caskMethod.push(v);
    else if (axis === 'mashbill') s.mashbill = v;
    else s.process.push(v);
  }
  return s;
}

const SUFFIX: Record<string, string> = { 스코틀랜드: '스카치', 아일랜드: '아이리시', 캐나다: '캐나디안' };

/** 목록·배지에 쓰는 짧은 이름. 싱글몰트 스카치, 블렌디드 몰트 스카치, 스트레이트 버번, 일본 싱글몰트 … */
export function specTitle(s: WhiskySpec): string {
  if (s.country === '미국') {
    if (s.legal === '테네시 위스키') return '테네시 위스키';
    const kind = s.base === '라이' ? '라이' : '버번';
    return s.straight ? `스트레이트 ${kind}` : kind;
  }
  const comp = s.composition === 'single'
    ? ({ 몰트: '싱글몰트', 그레인: '싱글 그레인', '팟 스틸': '싱글 팟 스틸' } as Record<string, string>)[s.base ?? ''] ?? '싱글'
    : s.composition === 'blended'
      ? s.base === '몰트' ? '블렌디드 몰트' : s.base === '그레인' ? '블렌디드 그레인' : '블렌디드'
      : '';
  const suffix = SUFFIX[s.country];
  return suffix ? `${comp} ${suffix}`.trim() : `${s.country} ${comp}`.trim();
}

/** CLASS_FILTERS 용어를 새 분류로 판정한다. classMatchesTerm 과 다른 결과는 테스트에 이유와 함께 적어 둔다. */
export function specMatchesTerm(s: WhiskySpec, term: string): boolean {
  switch (term) {
    case '스카치': return s.legal === '스카치 위스키';
    case '버번': return s.base === '버번';
    case '테네시': return s.legal === '테네시 위스키';
    case '재패니즈': return s.country === '일본';
    case '코리안': return s.country === '한국';
    case '싱글몰트': return s.composition === 'single' && s.base === '몰트';
    case '블렌디드': return s.composition === 'blended';
    case '피티드': return s.peat === '피티드';
    case '셰리': return s.casks.some((k) => k.includes('셰리'));
    case '캐스크 스트렝스': return s.strength === '캐스크 스트렝스';
    default: return false;
  }
}
