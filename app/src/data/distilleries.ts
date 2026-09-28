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

/** 좌표 — Wikidata 항목(P625), 2026-09-28 조회. 쿨리는 좌표가 등록돼 있지 않아 비운다 */
const COORDS: Record<string, [qid: string, lat: number, lng: number]> = {
  ardbeg: ['Q274', 55.6405, -6.10833],
  talisker: ['Q278', 57.302778, -6.356111],
  bushmills: ['Q268267', 55.201919, -6.519647],
  glenlivet: ['Q301412', 57.3477, -3.33655],
  aberlour: ['Q319639', 57.467222, -3.23],
  lagavulin: ['Q280', 55.635489, -6.126169],
  lochranza: ['Q699163', 55.699478, -5.280175],
  laphroaig: ['Q51888', 55.629455, -6.151988],
  bowmore: ['Q51905', 55.757139, -6.289844],
  springbank: ['Q982719', 55.425, -5.609],
  glenkinchie: ['Q982834', 55.8912, -2.89106],
  highlandpark: ['Q982844', 58.968603, -2.95545],
  glengoyne: ['Q982852', 56.014031, -4.363781],
  macallan: ['Q982891', 57.484372, -3.207578],
  auchentoshan: ['Q758604', 55.922, -4.439],
  glenburgie: ['Q771766', 57.623829, -3.518213],
  balvenie: ['Q805853', 57.457231, -3.129094],
  threesocieties: ['Q131361534', 37.636938, 127.279517],
  benriach: ['Q818147', 57.611944, -3.292778],
  glengyle: ['Q827815', 55.4272, -5.61095],
  pulteney: ['Q845140', 58.434444, -3.084722],
  dalmore: ['Q893151', 57.688411, -4.239481],
  cragganmore: ['Q893266', 57.410278, -3.395],
  dufftown: ['Q1263993', 57.4364, -3.1301],
  yamazaki: ['Q1417541', 34.893194, 135.674556],
  hakushu: ['Q3125870', 35.826639, 138.300333],
  cardhu: ['Q893272', 57.470828, -3.356925],
  glenfiddich: ['Q911587', 57.455139, -3.130833],
  yoichi: ['Q3572452', 43.1875, 140.791667],
  miyagikyo: ['Q14338929', 38.308056, 140.650556],
  bruichladdich: ['Q51908', 55.766358, -6.3625],
  bunnahabhain: ['Q51910', 55.882682, -6.126079],
  caolila: ['Q51913', 55.8544, -6.1093],
  tamdhu: ['Q982676', 57.459, -3.35361],
  clynelish: ['Q124932', 58.023919, -3.870622],
  glenmorangie: ['Q157974', 57.825, -4.075],
  glenallachie: ['Q185904', 57.455931, -3.227531],
  glendronach: ['Q240163', 57.4849, -2.62527],
  oban: ['Q982708', 56.4147, -5.4728],
};

/** 공식 사이트 — SWA 증류소 지도(scotch-whisky.org.uk/discover-scotch/distillery-map) 등재 URL, 2026-09-28 조회 */
const SWA_MAP = 'https://www.scotch-whisky.org.uk/discover-scotch/distillery-map/';
const WEB: Record<string, string> = {
  macallan: 'https://www.themacallan.com/en/distillery',
  glenfiddich: 'https://www.glenfiddich.com/',
  glenlivet: 'https://www.theglenlivet.com/en-UK',
  balvenie: 'https://www.thebalvenie.com/',
  glenallachie: 'https://www.theglenallachie.com/',
  tamdhu: 'https://www.tamdhu.com/',
  cragganmore: 'https://www.malts.com/en-gb/distilleries/cragganmore',
  benriach: 'https://www.benriachdistillery.com/en-gb/',
  cardhu: 'https://www.malts.com/en-gb/distilleries/cardhu',
  glenmorangie: 'https://www.glenmorangie.com/en-us',
  glendronach: 'https://www.glendronachdistillery.com/en-gb/',
  glengoyne: 'https://www.glengoyne.com/',
  oban: 'https://www.malts.com/en-row/distilleries/oban/',
  clynelish: 'https://www.malts.com/en-gb/distilleries/clynelish/',
  pulteney: 'https://www.oldpulteney.com/',
  talisker: 'https://www.malts.com/en-row/distilleries/talisker/',
  highlandpark: 'https://www.highlandparkwhisky.com/distillery/',
  lagavulin: 'https://www.malts.com/en-row/distilleries/lagavulin/',
  laphroaig: 'https://www.laphroaig.com/',
  ardbeg: 'https://www.ardbeg.com/en-gb',
  bowmore: 'https://www.bowmore.com/',
  caolila: 'https://www.malts.com/en-row/distilleries/caol-ila/',
  bunnahabhain: 'https://bunnahabhain.com/',
  bruichladdich: 'https://www.bruichladdich.com/',
  springbank: 'http://springbank.scot/',
  glengyle: 'https://kilkerran.scot/',
  glenkinchie: 'https://www.malts.com/en-gb/distilleries/glenkinchie/',
  auchentoshan: 'https://www.auchentoshan.com/where-we-make-it',
};

export const DISTILLERIES: Distillery[] = ROWS.map(([id, nameKo, nameEn, country, legalRegion, subRegion, note]) => {
  const c = COORDS[id];
  return {
    id, nameKo, nameEn, country, legalRegion, subRegion,
    lat: c ? c[1] : null, lng: c ? c[2] : null, visit: null, note, web: WEB[id],
    sources: [...(c ? [`https://www.wikidata.org/wiki/${c[0]}`] : []), ...(WEB[id] ? [SWA_MAP] : [])],
  };
});

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
