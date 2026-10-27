/**
 * distilleries.ts — 싱글몰트 증류소 목록(위치 판의 점).
 *
 * 범위: 기준 DB 의 싱글몰트(구성 single + 원료 몰트)를 만드는 증류소만. 블렌디드·싱글 그레인·싱글 팟 스틸은 넣지 않는다.
 * 지역: 스카치는 해당 증류소 제품의 분류(whiskySpec)에서 가져오고, 테스트가 둘이 같은지 확인한다.
 * 좌표·방문 정보: 공식 출처를 확인한 것만 넣는다. 확인 전에는 null 이고 sources 가 비어 있다.
 * 설립·소유·위치·투어: 2026-10-27 GPT·제미나이 조사를 병합했다(드라이브 '증류소 소개_gpt', '증류소 소개_gemini').
 *   두 조사가 같은 값만 그대로 쓰고, 설립 연도의 기준이 갈린 곳은 foundedNote 로 밝혔다.
 */
import { type Distillery, type DistilleryTour, type LiquorMasterItem } from '../models/types';
import { LIQUOR_MASTER, liquorMasterById } from './liquorMaster';
import { specOf, displayRegion } from './whiskySpec';

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

/** 좌표 — Wikidata 항목(P625). 2026-09-28 조회, 쿨리는 2026-10-27 두 조사가 같은 항목을 찾았다 */
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
  cooley: ['Q502578', 53.997269, -6.2059],
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

type Info = {
  founded: number | null; foundedNote?: string; owner: string | null; place: string;
  /** null = 두 조사 모두 공식 투어 안내를 찾지 못함 */
  tour: DistilleryTour | null; tourUrl?: string; web?: string; sources: string[];
};

/**
 * 설립·소유·위치·투어 — 2026-10-27 조사 병합.
 * 더프타운 설립 연도는 1895·1896 으로 갈려 비운다. 기원 소유 법인은 이름이 바뀌었는지 확인 전이라 비운다.
 */
const INFO_CHECKED = '2026-10-27';
const INFO: Record<string, Info> = {
  macallan: { founded: 1824, owner: 'Edrington', place: '모레이 크레이겔라키', tour: '운영', tourUrl: 'https://www.themacallan.com/en-us/experience-the-macallan/distillery', web: 'https://www.themacallan.com/', sources: ['https://www.themacallan.com/en/about', 'https://www.edrington.com/en/brands', 'https://www.themacallan.com/en-us/experience-the-macallan/distillery'] },
  glenfiddich: { founded: 1887, owner: 'William Grant & Sons', place: '모레이 더프타운', tour: '운영', tourUrl: 'https://www.glenfiddich.com/en-gb/book-tour/', web: 'https://www.glenfiddich.com/', sources: ['https://www.glenfiddich.com/assets/Uploads/Shared/News-Releases/Goodwood-1979/Glenfiddich-Goodwood-1979-Press-ReleaseFINAL.pdf', 'https://www.williamgrant.com/gb/we', 'https://www.glenfiddich.com/assets/AiR/CANADIAN-AiR-WEB-COPY-2024.pdf', 'https://www.glenfiddich.com/themes/gf-main-v2/terms/Online_booking_TCs.pdf', 'https://www.spiritofspeyside.com/visit/distilleries/glenfiddich-distillery'] },
  glenlivet: { founded: 1824, owner: 'Chivas Brothers', place: '모레이 발린달로크', tour: '운영', tourUrl: 'https://www.maltwhiskydistilleries.com/theglenlivet/', web: 'https://www.theglenlivet.com/', sources: ['https://www.theglenlivet.com/en/our-history/', 'https://www.chivasbrothers.com/our-brands/brand-homes/', 'https://www.theglenlivet.com/en-us/faqs/'] },
  balvenie: { founded: 1892, owner: 'William Grant & Sons', place: '모레이 더프타운', tour: '운영', tourUrl: 'https://www.thebalvenie.com/welcome-to-the-distillery/', web: 'https://www.thebalvenie.com/', sources: ['https://www.spiritofspeyside.com/about/partners/balvenie', 'https://www.thebalvenie.com/en-gb/terms-and-conditions/', 'https://www.williamgrant.com/gb/stories/the-balvenie-the-most-handcrafted-of-single-malts', 'https://www.distillerytours.scot/distilleries/balvenie-distillery-visitor-centre', 'https://www.thebalvenie.com/welcome-to-the-distillery/'] },
  aberlour: { founded: 1879, owner: 'Chivas Brothers', place: '모레이 아벨라워', tour: '운영', tourUrl: 'https://www.aberlour.com/en/our-distillery/', web: 'https://www.aberlour.com/', sources: ['https://www.aberlour.com/en/our-whisky/', 'https://www.chivasbrothers.com/our-brands/brand-homes/', 'https://www.aberlour.com/en/our-distillery/'] },
  glenallachie: { founded: 1967, owner: 'The GlenAllachie Distillers Co. Limited', place: '모레이 아벨라워', tour: '운영', tourUrl: 'https://theglenallachie.com/visit-us/', web: 'https://theglenallachie.com/', sources: ['https://theglenallachie.com/our-story/our-history/', 'https://theglenallachie.com/contact/', 'https://theglenallachie.com/visit-us/'] },
  tamdhu: { founded: 1897, owner: 'Ian Macleod Distillers', place: '모레이 노칸도', tour: '없음', tourUrl: 'https://www.tamdhu.com/website-faqs', web: 'https://www.tamdhu.com/', sources: ['https://www.tamdhu.com/website-faqs', 'https://www.tamdhu.com/'] },
  cragganmore: { founded: 1869, owner: 'Diageo', place: '모레이 발린달로크', tour: '중단', tourUrl: 'https://www.malts.com/en/cragganmore/visit', web: 'https://www.malts.com/en/cragganmore', sources: ['https://www.malts.com/en/cragganmore', 'https://www.scotch-whisky.org.uk/join-us/members-directory/', 'https://morayspeyside.com/inspiration/whisky-country/speyside-distillery-guide/', 'https://www.malts.com/en/cragganmore/visit'] },
  benriach: { founded: 1898, owner: 'Brown-Forman', place: '모레이 엘긴', tour: '운영', tourUrl: 'https://www.benriachdistillery.com/en-us/distillery-tours/', web: 'https://www.benriachdistillery.com/', sources: ['https://www.benriachdistillery.com/our-history/', 'https://www.scotch-whisky.org.uk/join-us/members-directory/', 'https://www.benriachdistillery.com/contact-us/', 'https://www.benriachdistillery.com/en-us/distillery-tours/'] },
  dufftown: { founded: null, owner: 'Diageo', place: '모레이 더프타운', tour: null, sources: ['https://en.wikipedia.org/wiki/Dufftown_distillery', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  cardhu: { founded: 1824, owner: 'Diageo', place: '모레이 노칸도', tour: '운영', tourUrl: 'https://www.malts.com/en/cardhu/visit', web: 'https://www.malts.com/en/cardhu/visit', sources: ['https://www.malts.com/en/cardhu/visit', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  glenburgie: { founded: 1829, owner: 'Chivas Brothers', place: '모레이 포레스', tour: null, web: 'https://history.chivasbrothersarchive.com/timeline/', sources: ['https://history.chivasbrothersarchive.com/timeline/', 'https://www.scotch-whisky.org.uk/join-us/members-directory/', 'https://en.wikipedia.org/wiki/Glenburgie_distillery'] },
  glenmorangie: { founded: 1843, owner: 'The Glenmorangie Company (LVMH 그룹)', place: '하이랜드 테인', tour: '운영', tourUrl: 'https://www.glenmorangie.com/pages/visit-us', web: 'https://www.glenmorangie.com/', sources: ['https://www.glenmorangie.com/pages/about-us', 'https://www.scotch-whisky.org.uk/join-us/members-directory/', 'https://www.lvmh.com/en/our-maisons/wines-spirits/glenmorangie', 'https://www.moethennessyjapan.com/en/brands/glenmorangie/history', 'https://www.glenmorangie.com/pages/visit-us'] },
  glendronach: { founded: 1826, owner: 'Brown-Forman', place: '애버딘셔 헌틀리 포그', tour: '운영', tourUrl: 'https://www.glendronachdistillery.com/our-distillery/', web: 'https://www.glendronachdistillery.com/', sources: ['https://www.glendronachdistillery.com/our-story/', 'https://www.glendronachdistillery.com/our-distillery/'] },
  dalmore: { founded: 1839, owner: 'Whyte & Mackay', place: '하이랜드 알네스', tour: '운영', tourUrl: 'https://www.thedalmore.com/en-gb/our-home/', web: 'https://www.thedalmore.com/', sources: ['https://www.thedalmore.com/en-us/our-world/history-of-the-dalmore/', 'https://www.whyteandmackayltd.com/our-locations/the-dalmore/', 'https://www.thedalmore.com/en-gb/our-home/'] },
  glengoyne: { founded: 1833, owner: 'Ian Macleod Distillers', place: '스털링 킬런 덤고인', tour: '운영', tourUrl: 'https://www.glengoyne.com/visit-us', web: 'https://www.glengoyne.com/', sources: ['https://www.glengoyne.com/', 'https://www.tamdhu.com/website-faqs', 'https://www.glengoyne.com/visit-us'] },
  oban: { founded: 1794, owner: 'Diageo', place: '아가일 뷰트 오반', tour: '운영', tourUrl: 'https://www.malts.com/en/oban/visit', web: 'https://www.malts.com/en/oban/visit', sources: ['https://www.malts.com/en/oban/visit', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  clynelish: { founded: 1819, foundedNote: '지금 증류소는 1967년에 지었어요', owner: 'Diageo', place: '하이랜드 서덜랜드 브로라', tour: '중단', tourUrl: 'https://www.malts.com/en/clynelish/visit', web: 'https://www.malts.com/en/clynelish/visit', sources: ['https://scotchwhisky.com/whiskypedia/1831/clynelish/', 'https://www.malts.com/en/clynelish/visit'] },
  pulteney: { founded: 1826, owner: 'International Beverage (그룹)', place: '하이랜드 케이스네스 위크', tour: '운영', tourUrl: 'https://oldpulteney.com/pages/visit-us', web: 'https://oldpulteney.com/', sources: ['https://oldpulteney.com/pages/faqs', 'https://www.interbevgroup.com/our-brands/78-old-pulteney', 'https://oldpulteney.com/pages/visit-us'] },
  talisker: { founded: 1830, owner: 'Diageo', place: '하이랜드 스카이섬 카보스트', tour: '운영', tourUrl: 'https://www.malts.com/en-gb/distilleries/talisker', web: 'https://www.diageo.com/en/our-brands/scotch-whisky/talisker', sources: ['https://www.malts.com/en-gb/distilleries/talisker?type=redirect', 'https://www.scotch-whisky.org.uk/join-us/members-directory/', 'https://www.malts.com/en-gb/distilleries/talisker'] },
  highlandpark: { founded: 1798, owner: 'Edrington', place: '오크니 제도 커크월', tour: '운영', tourUrl: 'https://www.highlandparkwhisky.com/en/distillery-experiences', web: 'https://www.highlandparkwhisky.com/', sources: ['https://www.highlandparkwhisky.com/en/brand-story/distillery', 'https://www.edrington.com/en/brands', 'https://www.highlandparkwhisky.com/en/distillery-experiences'] },
  lochranza: { founded: 1995, owner: 'Isle of Arran Distillers Ltd', place: '노스에어셔 아란섬 로크란자', tour: '운영', tourUrl: 'https://www.arranwhisky.com/our-distillery/tours', web: 'https://www.arranwhisky.com/', sources: ['https://www.arranwhisky.com/', 'https://www.arranwhisky.com/assets/000/001/533/IOAD_Cask_Purchase_2026_original.pdf?1769598630=', 'https://www.arranwhisky.com/our-distillery/visit-us', 'https://www.arranwhisky.com/our-distillery/tours'] },
  lagavulin: { founded: 1816, owner: 'Diageo', place: '아가일 뷰트 아일라섬 포트 엘렌', tour: '운영', tourUrl: 'https://www.malts.com/en/lagavulin/visit', web: 'https://www.malts.com/en/lagavulin/visit', sources: ['https://www.malts.com/en/lagavulin/visit', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  laphroaig: { founded: 1815, owner: 'Suntory Global Spirits', place: '아가일 뷰트 아일라섬 포트 엘렌', tour: '운영', tourUrl: 'https://www.laphroaig.com/distillery', web: 'https://www.laphroaig.com/', sources: ['https://www.laphroaig.com/distillery', 'https://www.suntoryglobalspirits.com/about-us/our-locations'] },
  ardbeg: { founded: 1815, owner: 'The Glenmorangie Company (LVMH 그룹)', place: '아가일 뷰트 아일라섬 포트 엘렌', tour: '운영', tourUrl: 'https://www.ardbeg.com/en-gb/pages/visit-ardbeg-distillery', web: 'https://www.ardbeg.com/', sources: ['https://www.ardbeg.com/en-gb/pages/history', 'https://www.lvmh.com/our-maisons/wines-spirits/ardbeg', 'https://www.ardbeg.com/en-gb/pages/visit-ardbeg-distillery'] },
  bowmore: { founded: 1779, owner: 'Suntory Global Spirits', place: '아가일 뷰트 아일라섬 보모어', tour: '운영', tourUrl: 'https://www.bowmore.com/distillery-tours-and-experiences', web: 'https://www.bowmore.com/', sources: ['https://www.bowmore.com/about-us', 'https://www.suntoryglobalspirits.com/about-us/our-locations', 'https://www.bowmore.com/distillery-tours-and-experiences'] },
  caolila: { founded: 1846, owner: 'Diageo', place: '아가일 뷰트 아일라섬 포트 아스케이그', tour: '운영', tourUrl: 'https://www.malts.com/en/caol-ila/visit', web: 'https://www.malts.com/en/caol-ila/visit', sources: ['https://www.malts.com/en/caol-ila/visit', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  bunnahabhain: { founded: 1881, owner: 'CVH Spirits Limited', place: '아가일 뷰트 아일라섬 포트 아스케이그', tour: '운영', tourUrl: 'https://bunnahabhain.com/pages/plan-your-visit', web: 'https://bunnahabhain.com/', sources: ['https://bunnahabhain.com/pages/about-us', 'https://bunnahabhain.com/pages/terms-conditions', 'https://bunnahabhain.com/pages/plan-your-visit'] },
  bruichladdich: { founded: 1881, owner: 'Rémy Cointreau (그룹)', place: '아가일 뷰트 아일라섬 브룩라디', tour: '운영', tourUrl: 'https://uk.bruichladdich.com/pages/tours', web: 'https://www.bruichladdich.com/', sources: ['https://uk.bruichladdich.com/pages/faqs', 'https://www.bruichladdich.com/pages/faqs', 'https://uk.bruichladdich.com/pages/tours'] },
  springbank: { founded: 1828, owner: 'J&A Mitchell and Co.', place: '아가일 뷰트 캠벨타운', tour: '운영', tourUrl: 'https://www.springbank.scot/product/springbank-tour/', web: 'https://www.springbank.scot/', sources: ['https://www.springbank.scot/about/introduction/', 'https://www.springbank.scot/about/place/', 'https://www.springbank.scot/product/springbank-tour/'] },
  glengyle: { founded: 1872, foundedNote: '2004년에 다시 가동했어요', owner: 'Mitchell’s Glengyle Ltd (J&A Mitchell 계열)', place: '아가일 뷰트 캠벨타운', tour: '운영', tourUrl: 'https://kilkerran.scot/product/kilkerran-tour/', web: 'https://kilkerran.scot/', sources: ['https://kilkerran.scot/the-glengyle-distillery/', 'https://www.springbank.scot/about/place/', 'https://kilkerran.scot/product/kilkerran-tour/'] },
  glenkinchie: { founded: 1825, foundedNote: '1837년에 글렌킨치로 이름을 바꿨어요', owner: 'Diageo', place: '이스트로디언 펜케이틀랜드', tour: '운영', tourUrl: 'https://www.malts.com/en-us/glenkinchie/visit', web: 'https://www.malts.com/en-us/glenkinchie/visit', sources: ['https://www.malts.com/en-us/glenkinchie/visit', 'https://www.scotch-whisky.org.uk/join-us/members-directory/'] },
  auchentoshan: { founded: 1823, owner: 'Suntory Global Spirits', place: '웨스트던바턴셔 클라이드뱅크 달뮤어', tour: '운영', tourUrl: 'https://www.auchentoshan.com/visit-our-distillery', web: 'https://www.auchentoshan.com/', sources: ['https://www.auchentoshan.com/our-history', 'https://www.suntoryglobalspirits.com/about-us/our-locations', 'https://www.auchentoshan.com/visit-our-distillery'] },
  bushmills: { founded: 1784, foundedNote: '1608년은 이 지역의 증류 면허 연도예요', owner: 'Proximo Spirits', place: '앤트림주 부시밀즈', tour: '운영', tourUrl: 'https://www.bushmills.eu/distillery/', web: 'https://www.bushmills.eu/', sources: ['https://www.asahibeer.co.jp/brand/bushmills/', 'https://proximospirits.com/brands/bushmills/', 'https://www.bushmills.eu/distillery/'] },
  cooley: { founded: 1987, owner: 'Suntory Global Spirits', place: '라우스주 쿨리반도 리버스타운', tour: null, web: 'https://www.suntoryglobalspirits.com/about-us/our-locations', sources: ['https://www.wikidata.org/wiki/Q502578', 'https://www.suntoryglobalspirits.com/about-us/our-locations'] },
  yamazaki: { founded: 1923, owner: 'Suntory', place: '오사카부 미시마군 시마모토초', tour: '운영', tourUrl: 'https://house.suntory.com/yamazaki-whisky/yamazaki-distillery', web: 'https://www.suntory.com/factory/yamazaki/', sources: ['https://house.suntory.com/yamazaki-whisky/yamazaki-distillery', 'https://www.suntoryglobalspirits.com/about-us/our-locations', 'https://www.suntory.com/factory/yamazaki/'] },
  hakushu: { founded: 1973, owner: 'Suntory', place: '야마나시현 호쿠토시 하쿠슈초', tour: '운영', tourUrl: 'https://house.suntory.com/hakushu-whisky/hakushu-distillery', web: 'https://www.suntory.com/factory/hakushu/', sources: ['https://house.suntory.com/hakushu-whisky/hakushu-distillery', 'https://www.suntoryglobalspirits.com/about-us/our-locations', 'https://www.suntory.com/factory/hakushu/'] },
  yoichi: { founded: 1934, owner: 'Nikka Whisky', place: '홋카이도 요이치군 요이치정', tour: '운영', tourUrl: 'https://www.nikka.com/en/distilleries/yoichi/visit/', web: 'https://www.nikka.com/en/distilleries/yoichi/', sources: ['https://www.nikka.com/en/distilleries/yoichi/', 'https://www.nikka.com/en/about/', 'https://www.nikka.com/en/distilleries/yoichi/visit/'] },
  miyagikyo: { founded: 1969, owner: 'Nikka Whisky', place: '미야기현 센다이시 아오바구', tour: '운영', tourUrl: 'https://www.nikka.com/en/distilleries/miyagikyo/visit/', web: 'https://www.nikka.com/en/distilleries/miyagikyo/visit/', sources: ['https://www.nikka.com/en/story/founder/', 'https://www.nikka.com/en/about/', 'https://www.nikka.com/en/distilleries/miyagikyo/visit/'] },
  threesocieties: { founded: 2020, owner: null, place: '경기도 남양주시 화도읍', tour: '운영', tourUrl: 'https://threesocieties.co.kr/tours.html', web: 'https://threesocieties.co.kr/kor', sources: ['https://threesocieties.co.kr/kor', 'https://threesocieties.co.kr/tours.html'] },
};

export const DISTILLERIES: Distillery[] = ROWS.map(([id, nameKo, nameEn, country, legalRegion, subRegion, note]) => {
  const c = COORDS[id];
  const i = INFO[id];
  return {
    id, nameKo, nameEn, country, legalRegion, subRegion,
    lat: c ? c[1] : null, lng: c ? c[2] : null,
    visit: i?.tour ? { status: i.tour, url: i.tourUrl, checked: INFO_CHECKED } : null,
    note, web: WEB[id] ?? i?.web,
    founded: i?.founded ?? undefined, foundedNote: i?.foundedNote, owner: i?.owner ?? undefined, place: i?.place,
    sources: [...new Set([...(c ? [`https://www.wikidata.org/wiki/${c[0]}`] : []), ...(WEB[id] ? [SWA_MAP] : []), ...(i?.sources ?? [])])],
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

/** 지도에서 묶는 이름. 스코틀랜드는 화면용 지역(섬 포함), 그 밖은 나라 이름(부시밀즈의 북아일랜드도 아일랜드섬으로 묶는다) */
export function mapGroupOf(d: Distillery): string {
  if (d.country !== '스코틀랜드') return d.country;
  return displayRegion(d.legalRegion, d.subRegion).group ?? '스코틀랜드';
}

/** 이 증류소에서 만든 기준 DB 싱글몰트 */
export function productsOfDistillery(id: string): LiquorMasterItem[] {
  return LIQUOR_MASTER.filter((m) => distilleryOfProduct(m.id)?.id === id);
}
