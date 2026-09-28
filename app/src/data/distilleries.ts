/**
 * distilleries.ts — 싱글몰트 증류소 목록(위치 판의 점).
 *
 * 범위: 기준 DB 의 싱글몰트(구성 single + 원료 몰트)를 만드는 증류소만. 블렌디드·싱글 그레인·싱글 팟 스틸은 넣지 않는다.
 * 지역: 스카치는 해당 증류소 제품의 분류(whiskySpec)에서 가져오고, 테스트가 둘이 같은지 확인한다.
 * 좌표·방문 정보: 공식 출처를 확인한 것만 넣는다. 확인 전에는 null 이고 sources 가 비어 있다.
 */
import { type Distillery } from '../models/types';
import { liquorMasterById } from './liquorMaster';
import { specOf } from './whiskySpec';

type Row = [id: string, nameKo: string, nameEn: string, country: string, legalRegion: string | null, subRegion: string | null, note?: string];

const ROWS: Row[] = [
  // ── 스페이사이드 ──
  ['macallan', '맥캘란', 'The Macallan', '스코틀랜드', '스페이사이드', null],
  ['glenfiddich', '글렌피딕', 'Glenfiddich', '스코틀랜드', '스페이사이드', null],
  ['glenlivet', '글렌리벳', 'The Glenlivet', '스코틀랜드', '스페이사이드', null],
  ['balvenie', '발베니', 'The Balvenie', '스코틀랜드', '스페이사이드', null],
  ['aberlour', '아벨라워', 'Aberlour', '스코틀랜드', '스페이사이드', null],
  ['glenallachie', '글렌알라키', 'The GlenAllachie', '스코틀랜드', '스페이사이드', null],
  ['tamdhu', '탐듀', 'Tamdhu', '스코틀랜드', '스페이사이드', null],
  ['cragganmore', '크라간모어', 'Cragganmore', '스코틀랜드', '스페이사이드', null],
  ['benriach', '벤리악', 'The BenRiach', '스코틀랜드', '스페이사이드', null],
  ['dufftown', '더프타운', 'Dufftown', '스코틀랜드', '스페이사이드', null,
    '싱글톤은 판매 지역마다 원액 증류소가 다르다. 기준 DB 제품은 이름에 더프타운이 적힌 것'],
  ['cardhu', '카듀', 'Cardhu', '스코틀랜드', '스페이사이드', null],
  ['glenburgie', '글렌버기', 'Glenburgie', '스코틀랜드', '스페이사이드', null, '발렌타인 싱글몰트 시리즈의 원액 증류소'],
  // ── 하이랜드 ──
  ['glenmorangie', '글렌모렌지', 'Glenmorangie', '스코틀랜드', '하이랜드', null],
  ['glendronach', '글렌드로낙', 'The GlenDronach', '스코틀랜드', '하이랜드', null],
  ['dalmore', '달모어', 'The Dalmore', '스코틀랜드', '하이랜드', null],
  ['glengoyne', '글렌고인', 'Glengoyne', '스코틀랜드', '하이랜드', null],
  ['oban', '오반', 'Oban', '스코틀랜드', '하이랜드', '해안'],
  ['clynelish', '클라이넬리쉬', 'Clynelish', '스코틀랜드', '하이랜드', '해안'],
  ['pulteney', '올드 풀트니', 'Pulteney', '스코틀랜드', '하이랜드', '해안', '증류소 이름은 풀트니, 제품 이름은 올드 풀트니'],
  ['talisker', '탈리스커', 'Talisker', '스코틀랜드', '하이랜드', '섬 · 스카이'],
  ['highlandpark', '하이랜드 파크', 'Highland Park', '스코틀랜드', '하이랜드', '섬 · 오크니'],
  ['lochranza', '아란 로크란자', 'Lochranza (Isle of Arran)', '스코틀랜드', '하이랜드', '섬 · 아란',
    '아란은 증류소가 둘(로크란자·라그)이다. 아란 10년은 로크란자 원액'],
  // ── 아일라 ──
  ['lagavulin', '라가불린', 'Lagavulin', '스코틀랜드', '아일라', null],
  ['laphroaig', '라프로익', 'Laphroaig', '스코틀랜드', '아일라', null],
  ['ardbeg', '아드벡', 'Ardbeg', '스코틀랜드', '아일라', null],
  ['bowmore', '보모어', 'Bowmore', '스코틀랜드', '아일라', null],
  ['caolila', '카올 일라', 'Caol Ila', '스코틀랜드', '아일라', null],
  ['bunnahabhain', '부나하벤', 'Bunnahabhain', '스코틀랜드', '아일라', null],
  ['bruichladdich', '브룩라디', 'Bruichladdich', '스코틀랜드', '아일라', null, '포트 샬롯(피티드)도 여기서 만든다'],
  // ── 캠벨타운 ──
  ['springbank', '스프링뱅크', 'Springbank', '스코틀랜드', '캠벨타운', null],
  ['glengyle', '글렌가일', 'Glengyle', '스코틀랜드', '캠벨타운', null, '제품 이름은 킬커란'],
  // ── 로우랜드 ──
  ['glenkinchie', '글렌킨치', 'Glenkinchie', '스코틀랜드', '로우랜드', null],
  ['auchentoshan', '오켄토션', 'Auchentoshan', '스코틀랜드', '로우랜드', null],
  // ── 아일랜드 · 일본 · 한국 (세부 위치는 출처 확인 후) ──
  ['bushmills', '부시밀즈', 'Old Bushmills', '아일랜드', null, null],
  ['cooley', '쿨리', 'Cooley', '아일랜드', null, null, '제품 이름은 코네마라'],
  ['yamazaki', '야마자키', 'Yamazaki', '일본', null, null],
  ['hakushu', '하쿠슈', 'Hakushu', '일본', null, null],
  ['yoichi', '요이치', 'Yoichi', '일본', null, null],
  ['miyagikyo', '미야기쿄', 'Miyagikyo', '일본', null, null],
  ['threesocieties', '쓰리소사이어티스', 'Three Societies', '한국', null, null, '제품 이름은 기원'],
];

export const DISTILLERIES: Distillery[] = ROWS.map(([id, nameKo, nameEn, country, legalRegion, subRegion, note]) => ({
  id, nameKo, nameEn, country, legalRegion, subRegion,
  lat: null, lng: null, visit: null, note, sources: [],
}));

export const distilleryById = new Map<string, Distillery>(DISTILLERIES.map((d) => [d.id, d]));

/** 기준 DB 브랜드 → 증류소. 브랜드 하나가 증류소 하나일 때만 쓴다 */
const BY_BRAND: Record<string, string> = {
  맥캘란: 'macallan', 글렌피딕: 'glenfiddich', 글렌리벳: 'glenlivet', 발베니: 'balvenie', 아벨라워: 'aberlour',
  글렌알라키: 'glenallachie', 탐듀: 'tamdhu', 크라간모어: 'cragganmore', 벤리악: 'benriach', 카듀: 'cardhu',
  글렌모렌지: 'glenmorangie', 글렌드로낙: 'glendronach', 달모어: 'dalmore', 글렌고인: 'glengoyne', 오반: 'oban',
  클라이넬리쉬: 'clynelish', 올드풀트니: 'pulteney', 탈리스커: 'talisker', 하이랜드파크: 'highlandpark',
  라가불린: 'lagavulin', 라프로익: 'laphroaig', 아드벡: 'ardbeg', 보모어: 'bowmore', 카올일라: 'caolila',
  부나하벤: 'bunnahabhain', 브룩라디: 'bruichladdich', 스프링뱅크: 'springbank', 글렌가일: 'glengyle',
  글렌킨치: 'glenkinchie', 오켄토션: 'auchentoshan', 부시밀즈: 'bushmills', 코네마라: 'cooley', 쓰리소사이어티스: 'threesocieties',
};

/** 브랜드만으로 증류소가 정해지지 않는 제품 — 제품명·라벨 기준 */
const BY_PRODUCT: Record<string, string> = {
  m_singleton12: 'dufftown',
  m_ballantine_glenburgie12: 'glenburgie',
  m_arran10: 'lochranza',
  m_yamazaki12: 'yamazaki',
  m_hakushu12: 'hakushu',
  m_yoichi: 'yoichi',
  m_miyagikyo: 'miyagikyo',
};

/** 기준 DB 제품이 싱글몰트면 그 증류소. 아니면 null */
export function distilleryOfProduct(productId: string | undefined): Distillery | null {
  const item = productId ? liquorMasterById.get(productId) : undefined;
  if (!item?.whiskyClass) return null;
  const s = specOf(item.whiskyClass);
  if (s.composition !== 'single' || s.base !== '몰트') return null;
  const id = BY_PRODUCT[item.id] ?? BY_BRAND[item.brand];
  return id ? distilleryById.get(id) ?? null : null;
}
