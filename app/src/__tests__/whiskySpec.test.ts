import { describe, it, expect } from 'vitest';
import { WHISKY_CLASS, CLASS_FILTERS, classMatchesTerm } from '../data/whiskyClass';
import { LIQUOR_MASTER } from '../data/liquorMaster';
import { CANDIDATE_WHISKIES } from '../data/candidateWhiskies';
import { whiskies } from '../data/adapters';
import { specOf, specTitle, specMatchesTerm, CHARACTER_AXIS, CASK_LABEL, SCOTCH_REGIONS, ageFromName } from '../data/whiskySpec';

const records = [
  ...Object.entries(WHISKY_CLASS).map(([id, c]) => ({ id: `seed:${id}`, c })),
  ...LIQUOR_MASTER.filter((i) => i.whiskyClass).map((i) => ({ id: i.id, c: i.whiskyClass! })),
  ...CANDIDATE_WHISKIES.map((w) => ({ id: `cand:${w.id}`, c: w.cls })),
];
const seedSpec = (id: string) => specOf(WHISKY_CLASS[id]!, whiskies.find((w) => w.id === id)?.name);

describe('위스키 3층 분류', () => {
  it('원본의 모든 character·cask 값이 정확히 한 축으로 들어간다', () => {
    const unmapped = new Set<string>();
    for (const { c } of records) {
      c.character.forEach((t) => { if (!CHARACTER_AXIS[t]) unmapped.add(t); });
      c.cask.forEach((t) => { if (!CASK_LABEL[t]) unmapped.add(`cask:${t}`); });
    }
    expect([...unmapped]).toEqual([]);
  });

  it('스카치 법적 지역은 5개 중 하나이고, 섬 지역은 하이랜드의 세부 지역이다', () => {
    for (const { id, c } of records) {
      const s = specOf(c);
      if (s.legal === '스카치 위스키' && s.legalRegion) expect(SCOTCH_REGIONS, id).toContain(s.legalRegion);
      expect(s.legalRegion ?? '', id).not.toContain('아일랜드');
    }
    expect(seedSpec('talisker10')).toMatchObject({ legalRegion: '하이랜드', subRegion: '섬 · 스카이', peat: '피티드' });
    expect(seedSpec('clynelish14')).toMatchObject({ legalRegion: '하이랜드', subRegion: '해안', flavorNotes: ['왁시'] });
  });

  it('나라와 법적 명칭을 분리한다 — 버번은 나라가 아니다', () => {
    expect(seedSpec('buffalo')).toMatchObject({ country: '미국', legal: '버번 위스키', base: '버번', straight: true, legalRegion: '켄터키' });
    expect(seedSpec('jack')).toMatchObject({ country: '미국', legal: '테네시 위스키', legalRegion: '테네시', process: ['차콜 멜로잉'] });
    expect(seedSpec('weller')).toMatchObject({ base: '버번', mashbill: '휘티드', straight: null });
    // 재패니즈 위스키 표시 기준 충족 여부는 확인하지 않았다
    expect(seedSpec('kakubin')).toMatchObject({ country: '일본', legal: null, composition: 'blended', base: null });
  });

  it('구성은 single/blended 두 값, 원료가 이름을 가른다', () => {
    expect(specTitle(seedSpec('macallan'))).toBe('싱글몰트 스카치');
    expect(specTitle(seedSpec('jw_green'))).toBe('블렌디드 몰트 스카치');
    expect(specTitle(seedSpec('jw_black'))).toBe('블렌디드 스카치');
    expect(specTitle(seedSpec('wildturkey8'))).toBe('스트레이트 버번');
    expect(specTitle(seedSpec('kiwon_tiger'))).toBe('한국 싱글몰트');
    expect(specTitle(specOf(LIQUOR_MASTER.find((i) => i.id === 'm_redbreast12')!.whiskyClass!))).toBe('싱글 팟 스틸 아이리시');
  });

  it('피트는 피티드·논피트·미상 세 값. 스모키 향은 피트 여부로 치지 않는다', () => {
    expect(seedSpec('jw_black')).toMatchObject({ peat: '미상', flavorNotes: ['스모키'] });
    expect(specOf(LIQUOR_MASTER.find((i) => i.id === 'm_springbank10')!.whiskyClass!))
      .toMatchObject({ peat: '피티드', peatNote: '라이트 피티드' });
  });

  it('연수는 제품명의 N년만 읽는다', () => {
    expect(ageFromName('와일드 터키 8년')).toBe(8);
    expect(ageFromName('와일드 터키 101')).toBeNull();
    expect(ageFromName('탈리스커 스톰')).toBeNull();
    expect(seedSpec('wildturkey8').age).toBe(8);
  });
});

describe('분류 필터 — 옛 판정과 비교', () => {
  const diff = (term: string) => records
    .filter(({ c }) => classMatchesTerm(c, term) !== specMatchesTerm(specOf(c), term))
    .map(({ id, c }) => `${id}${classMatchesTerm(c, term) ? '-' : '+'}`);

  it('8개 필터는 결과가 같다', () => {
    for (const term of CLASS_FILTERS.filter((t) => t !== '버번' && t !== '피티드')) expect(diff(term), term).toEqual([]);
  });

  it('버번: 옛 판정은 버번 캐스크 숙성 스카치까지 버번으로 잡았다(69건). 새 판정은 원료가 버번인 것만', () => {
    const d = diff('버번');
    expect(d).toHaveLength(69);
    expect(d.every((x) => x.endsWith('-'))).toBe(true);
    expect(d).toContain('seed:macallan-');
  });

  it('피티드: 제조사가 라이트 피티드라고 밝힌 3건이 새로 들어온다', () => {
    expect(diff('피티드').sort()).toEqual(['m_hakushu12+', 'm_kilkerran12+', 'm_springbank10+']);
  });
});

describe('싱글몰트 증류소', async () => {
  const { DISTILLERIES, distilleryOfProduct } = await import('../data/distilleries');
  const singleMalts = LIQUOR_MASTER.filter((i) => {
    const s = i.whiskyClass && specOf(i.whiskyClass);
    return s && s.composition === 'single' && s.base === '몰트';
  });

  it('기준 DB 싱글몰트는 전부 증류소가 정해진다', () => {
    expect(singleMalts.filter((i) => !distilleryOfProduct(i.id)).map((i) => i.id)).toEqual([]);
  });

  it('증류소마다 제품이 하나 이상 있고, 지역이 제품 분류와 같다', () => {
    for (const d of DISTILLERIES) {
      const items = singleMalts.filter((i) => distilleryOfProduct(i.id)?.id === d.id);
      expect(items.length, d.id).toBeGreaterThan(0);
      for (const i of items) {
        const s = specOf(i.whiskyClass!);
        expect(s.country, i.id).toBe(d.country);
        if (d.country === '스코틀랜드') expect([s.legalRegion, s.subRegion], i.id).toEqual([d.legalRegion, d.subRegion]);
      }
    }
  });

  it('보유 싱글몰트 병도 증류소로 이어지고, 블렌디드·싱글 팟 스틸은 이어지지 않는다', () => {
    const own = whiskies.filter((w) => w.whiskyClass?.type === '싱글몰트');
    expect(own.map((w) => distilleryOfProduct(w.productId)?.id)).not.toContain(undefined);
    expect(distilleryOfProduct(whiskies.find((w) => w.id === 'ballantine_sm')!.productId)?.id).toBe('glenburgie');
    expect(distilleryOfProduct('m_jw_black')).toBeNull();
    expect(distilleryOfProduct('m_redbreast12')).toBeNull();
  });

  it('좌표·방문 정보는 출처가 있을 때만 들어간다', () => {
    for (const d of DISTILLERIES) {
      if (d.lat !== null || d.lng !== null || d.visit) expect(d.sources.length, d.id).toBeGreaterThan(0);
    }
  });
});

describe('증류소 좌표', async () => {
  const { DISTILLERIES } = await import('../data/distilleries');
  it('스코틀랜드 증류소는 스코틀랜드 범위 안에 있다', () => {
    for (const d of DISTILLERIES.filter((x) => x.country === '스코틀랜드')) {
      expect(d.lat, d.id).toBeGreaterThan(54.6); expect(d.lat!, d.id).toBeLessThan(60.9);
      expect(d.lng, d.id).toBeGreaterThan(-7.7); expect(d.lng!, d.id).toBeLessThan(-0.7);
    }
  });
  it('아일라 증류소는 아일라 섬 안에 있다', () => {
    for (const d of DISTILLERIES.filter((x) => x.legalRegion === '아일라')) {
      expect(d.lat!, d.id).toBeGreaterThan(55.55); expect(d.lat!, d.id).toBeLessThan(55.95);
      expect(d.lng!, d.id).toBeLessThan(-6.0);
    }
  });
});
