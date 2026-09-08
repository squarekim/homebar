/**
 * makerNotes.ts — 병(bottle) id 별 제조사/공식 테이스팅 노트.
 * 각 항목은 공식 브랜드/증류소 페이지 또는 신뢰 가능한 출처에서 수집했고 source(URL)를 함께 둔다.
 * 접근 불가하거나 공식 노트가 확인되지 않은 병은 여기 없으며 UI 에서 "공식 노트 미확보"로 표시된다.
 * 원본 seed 는 변경하지 않고 파생 레이어로만 부착한다.
 */
import { MakerNote } from '../models/types';

export const MAKER_NOTES: Record<string, MakerNote> = {
  "clynelish12": {
    "nose": "크리미한 탑노트 뒤로 가볍고 복합적인 과일·허브 향 — 과일 민스미트, 통조림 배, 헤더 꿀, 그리고 스파이시한 오크",
    "palate": "매우 매끄럽고 입안을 채우는 질감에 리치하고 와인 같은 단맛, 후추·오크 스파이스가 균형을 잡음. 물을 더하면 단맛이 살아나고 특유의 왁시함이 도드라짐",
    "finish": "길고 칠리처럼 스파이시하며 식욕을 돋우듯 드라이하게, 후추 여운",
    "source": "https://www.malts.com/en-us/products/clynelish-12-year-old-special-releases-2022-single-malt-scotch-whisky-750ml",
    "sourceName": "Clynelish/Diageo 공식(Malts.com, Special Releases 2022 58.5%)"
  },
  "macallan": {
    "nose": "퍼지, 설탕에 절인 오렌지와 레몬, 바닐라, 부드러운 스파이스",
    "palate": "밀크초콜릿 건포도와 크리미한 토피, 오렌지 껍질과 은은한 스파이스",
    "finish": "미디엄, 달콤한 오크",
    "source": "https://www.themacallan.com/en-us/single-malt-scotch-whisky/double-cask-12-years-old",
    "sourceName": "The Macallan 공식"
  },
  "talisker10": {
    "nose": "강렬한 피트 스모크에 신선한 굴의 바닷물 소금기, 시트러스 단맛",
    "palate": "풍부한 건과일 단맛, 스모크, 강한 몰트, 입 뒤쪽의 후추감",
    "finish": "길고 따뜻하며 후추향, 식욕을 돋우는 단맛",
    "source": "https://www.malts.com/en-us/products/talisker-10-year-old-single-malt-scotch-whisky-750ml",
    "sourceName": "Talisker/Diageo 공식(Malts.com)"
  },
  "glenmorangie": {
    "nose": "오렌지 마멀레이드·자파케이크의 시트러스, 복숭아·살구 등 스톤프루트, 크렘 브륄레·꿀·바닐라 커스터드",
    "palate": "글렌모렌지 특유의 오렌지 노트, 몰트감, 꿀에 적신 쇼트브레드, 리치·파인애플의 열대 과일, 은은한 오크와 생강",
    "finish": "미디엄, 깔끔하고 점점 드라이",
    "source": "https://whiskymag.com/tastings/glenmorangie-the-original-12-years-old/",
    "sourceName": "Whisky Magazine (The Original 12)"
  },
  "glenfiddich": {
    "nose": "꿀과 바닐라 퍼지, 다크프룻, 골든 건포도, 살구, 레몬 껍질, 마지팬",
    "palate": "풀바디 실키, 마지팬·시나몬·생강, 캐러멜과 토피, 다크프룻, 토스티드 오크, 아몬드",
    "finish": "길고 오일리하며 풍부한 오크·캐러멜·다크프룻, 견과 스파이스",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/1285/glenfiddich-15-year-old-solera-reserve",
    "sourceName": "Difford's Guide (Glenfiddich 15 Solera)"
  },
  "glenlivet": {
    "nose": "수지향 오크, 퍼지와 마데이라, 애플 크럼블, 건과일, 장미 꽃잎, 풋사과, 시나몬",
    "palate": "풀·리치, 겨울 스파이스(시나몬·클로브), 두꺼운 오크, 오키한 애플 크럼블, 드라이 아몬드",
    "finish": "길고 드라이하며 후추향, 드라이 애플",
    "source": "https://www.masterofmalt.com/whiskies/the-glenlivet-15-year-old-french-oak-reserve-whisky/",
    "sourceName": "Master of Malt (Glenlivet 15 French Oak)"
  },
  "glenallachie": {
    "nose": "모카, 무화과 시럽, 토스티드 헤이즐넛, 허니콤, 말린 붉은 베리, 몰라세스",
    "palate": "베이킹 스파이스, 브랜디드 체리, 토피 소스, 블랙포레스트 가토, 모카, 구운 허니콤",
    "finish": "몰라세스와 댐슨 자두",
    "source": "https://theglenallachie.com/whisky/glenallachie-10-year-old/",
    "sourceName": "The GlenAllachie 공식"
  },
  "ballantine_sm": {
    "nose": "구운 브리오슈, 아몬드 가루, 초콜릿, 마지팬",
    "palate": "토피 애플의 단맛과 바닐라 크리미함, 파인애플·시럽 복숭아, 흑후추·생강의 스파이스, 긴 여운",
    "finish": "부드럽고 리치한 바닐라, 뒤끝의 은은한 스파이스",
    "source": "https://www.ballantines.com/en/range/glenburgie-12-years-old/",
    "sourceName": "Ballantine's 공식"
  },
  "jw_green": {
    "nose": "모카치노·에스프레소, 우드 스모크와 벽난로, 비터 초콜릿과 오크",
    "palate": "미디엄 바디, 곡물·커피콩·초콜릿, 대추야자와 호두",
    "finish": "길고 스파이시하며 꿀 같은 단맛과 오크",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/1086/johnnie-walker-green-label-15yo",
    "sourceName": "Difford's Guide (JW Green 15)"
  },
  "jw_blue": {
    "nose": "부드럽고 둥근 드라이 스모크와 건포도 단맛, 건과일·시트러스·바닐라, 은은한 스모크",
    "palate": "벨벳 같은 바닐라·꿀·장미 꽃잎, 상큼한 오렌지, 헤이즐넛·셰리·다크초콜릿",
    "finish": "풍부하고 길며 조니워커 특유의 세련된 스모크, 매끄러운 단맛",
    "source": "https://thewhiskeywash.com/whiskey-styles/scotch-whiskey/whisky-review-johnnie-walker-blue-label/",
    "sourceName": "The Whiskey Wash (JW Blue)"
  },
  "dewars12": {
    "nose": "꿀, 망고·파인애플·복숭아의 건과일, 오렌지와 구운 사과, 바닐라·넛맥·버터스카치, 옅은 스모크",
    "palate": "둥글고 약간 오일리, 배·복숭아·사과의 과일, 넛맥과 후추",
    "finish": "중간 길이로 두툼하며 애플소스·셰리드 다크프룻·꿀",
    "source": "https://thewhiskeyjug.com/scotch-whisky/dewars-12-years-review/",
    "sourceName": "The Whiskey Jug (Dewar's 12)"
  },
  "wildturkey8": {
    "nose": "캐러멜, 구운 견과, 시트러스 껍질, 달콤한 오크",
    "palate": "풀바디, 바닐라·클로브·토피와 차링 오크, 레몬 제스트, 은은한 블랙체리",
    "finish": "길고 따뜻하며 흑설탕·건과일·바닐라·올스파이스",
    "source": "https://www.wildturkeybourbon.com/en-us/products/wild-turkey-101-8-year-old-bourbon/",
    "sourceName": "Wild Turkey 공식(101 8yo)"
  },
  "buffalo": {
    "nose": "꿀, 바닐라, 오크, 토피, 은은한 고수, 딸기크림 뉘앙스",
    "palate": "캐러멜·흑설탕·바닐라·꿀에 여름 과일, 가죽·오크·담배의 복합적 스파이스",
    "finish": "미디엄, 캐러멜·꿀의 단맛에 바닐라와 드라이 가죽",
    "source": "https://www.buffalotrace.com/mobile/expert-reviews.html",
    "sourceName": "Buffalo Trace 공식"
  },
  "weller": {
    "nose": "캐러멜 중심의 단 향, 꿀·버터스카치·부드러운 우디함",
    "palate": "꿀·버터스카치·부드러운 오크, 매끄럽고 섬세",
    "finish": "부드럽고 달콤한 허니서클",
    "source": "https://www.buffalotracedistillery.com/our-brands/w-l-weller/w-l-weller-special-reserve/",
    "sourceName": "Buffalo Trace Distillery 공식(Weller)"
  },
  "makers": {
    "nose": "강렬하게 달고 부드러움 — 바닐라 크림·퍼지·흑설탕, 아몬드 케이크와 캐러멜라이즈드 애플, 꿀",
    "palate": "달고 크리미(45%) — 꿀에 절인 밀, 블랙체리, 넛맥·시나몬과 차링 오크의 후추감, 버터스카치·토피",
    "finish": "짧은~미디엄, 우드 차와 은은한 후추 온기로 드라이하게 마무리",
    "source": "https://www.breakingbourbon.com/review/makers-mark-bourbon",
    "sourceName": "Breaking Bourbon (Maker's Mark)"
  },
  "jack": {
    "nose": "바나나, 바닐라 크림, 옥수수, 체리의 비교적 가벼운 향",
    "palate": "앞맛은 달고 중간은 부드러운 오크, 바나나·옥수수·배럴 차, 80프루프에도 약간의 열감",
    "finish": "길고 캔디콘·열대과일에 차 유래의 살짝 쓴맛",
    "source": "https://thewhiskeywash.com/whiskey-styles/american-whiskey/whiskey-review-jack-daniels-old-no-7/",
    "sourceName": "The Whiskey Wash (Old No.7)"
  },
  "kakubin": {
    "nose": "꿀·바닐라·신선한 시트러스, 은은한 아몬드와 흰 꽃",
    "palate": "부드럽고 균형 잡힌 캐러멜·달콤한 오크, 은은한 넛맥과 꿀, 옅은 스모크",
    "finish": "부드럽고 우아하며 약간의 단맛과 은은한 스파이스",
    "source": "https://house.suntory.com/kakubin-whisky/kakubin",
    "sourceName": "House of Suntory 공식(가쿠빈)"
  },
  "kiwon_tiger": {
    "nose": "잘 익은 망고, 구운 시나몬, 그릴드 감, 대추·무화과·건포도, 호두, 토피 애플, 가죽",
    "palate": "둥글고 농밀 — 피치 코블러·크렘 브륄레·정향 박은 오렌지 껍질, 버터스카치·캐러멜·건포도·넛맥, 열대 과일과 은은한 스파이스",
    "finish": "브리오슈와 카야(코코넛·판단 잼), 화이트 오크와 몰트 와인의 뉘앙스",
    "source": "https://www.thewhiskyexchange.com/p/84218/ki-one-tiger-edition-korean-single-malt",
    "sourceName": "The Whisky Exchange (Ki One Tiger, 셰리·와인캐스크 3년 46%)"
  },
  "kiwon_eagle": {
    "nose": "풍부한 오크와 달콤한 캐러멜",
    "palate": "바닐라·넛맥·바나나·건포도",
    "finish": "길게 이어지는 오크에 화이트페퍼와 시나몬 스파이스",
    "source": "https://www.thewhiskyexchange.com/p/84219/ki-one-eagle-edition-korean-single-malt",
    "sourceName": "The Whisky Exchange (Ki One Eagle, 언피티드·버번/버진오크)"
  },
  "jw_black": {
    "nose": "달고 오키하며 스모키 — 옅은 스모크, 붉은 베리, 크리스마스 푸딩, 토피와 겨울 스파이스(정향·후추·시나몬), 바닐라",
    "palate": "매끄럽고 리치 — 스모크와 피트가 과일·시트러스 꽃·오크·몰트와 어우러지고 토피 단맛, 바닐라·사과·보리 사탕",
    "finish": "과일 단맛·시트러스 껍질·벨벳 바닐라와 은은한 후추 스파이스, 우드스모크",
    "source": "https://thewhiskeywash.com/reviews/whisky-review-johnnie-walker-black-label-12-year/",
    "sourceName": "The Whiskey Wash (JW Black 12)"
  },
  "ballantine_f": {
    "nose": "부드럽고 우아한 헤더 꿀 향에 은은한 스파이스",
    "palate": "균형 잡힌 섬세한 풍미 — 밀크초콜릿·붉은 사과·바닐라",
    "finish": "세련된 여운에 상쾌한 플로럴과 둥근 광택",
    "source": "https://whiskyoftheweek.co.uk/ballantines-finest/",
    "sourceName": "Ballantine's Finest (Whisky of the Week 정리 공식 노트)"
  },
  "ballantine12": {
    "nose": "코코넛·바닐라(녹는 바닐라 아이스크림)·시트러스 탑노트, 너티 누가, 물 추가 시 복숭아·바나나의 부드러움",
    "palate": "달콤한 과일과 약간의 너티 쌉쌀함, 은은한 스모크, 균형감; 꿀 단맛·리치 몰트·사과·배",
    "finish": "너티함에 옅은 스모크, 솔티 토피와 바닐라 퍼지의 여운",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/675/ballantines-12-year-old",
    "sourceName": "Difford's Guide (Ballantine's 12)"
  },
  "drambuie": {
    "nose": "헤더 꿀이 먼저, 이어 캐러멜·몰트·말린 허브, 오렌지 껍질·레몬 제스트의 상쾌함, 아니스·정향·시나몬",
    "palate": "헤더 꿀 중심, 골든 건포도·살구 등 건과일, 스카치 베이스의 온기와 오크·바닐라, 넛맥·정향",
    "finish": "오키하며 아니스·오렌지 껍질의 여운(스카치+꿀 조합)",
    "source": "https://drambuie.com/en/",
    "sourceName": "Drambuie 공식 + Difford's/Tasting Table 정리"
  },
  "benedictine": {
    "nose": "신선한 시트러스 껍질, 카다몬, 시더우드, 넛맥, 세이지, 메이스",
    "palate": "실키·허니, 사프란·생강·카다몬·정향과 시트러스 제스트의 가벼운 스파이스(27종 허브)",
    "finish": "모카 커피·퍼지·바닐라·소나무 수액의 온기, 사프란·진저브레드 여운",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/1634/benedictine-dom",
    "sourceName": "Difford's Guide (Bénédictine D.O.M.)"
  },
  "disaronno": {
    "nose": "아몬드와 살구, 마지팬과 꿀 복숭아의 진한 향",
    "palate": "달고 약간 쌉쌀, 코코아와 아몬드, 마지팬·바닐라·약간의 스파이스(살구씨유 유래의 아몬드풍)",
    "finish": "실키한 마우스필이 다음 한 모금까지 이어짐",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/1209/disaronno-originale-amaretto",
    "sourceName": "Difford's Guide (Disaronno Originale)"
  },
  "midori": {
    "nose": "밝은 캔디풍 단맛 — 잘 익은 허니듀 멜론과 풋사과, 바나나·열대 과일의 은은함",
    "palate": "농축된 허니듀 멜론에 키위·풋사과·청포도, 약간 시럽 같은 질감(20%)",
    "finish": "달콤한 멜론의 여운",
    "source": "https://www.midori-world.com/",
    "sourceName": "MIDORI 공식 + 리뷰 정리"
  },
  "baileys": {
    "nose": "캐러멜이 지배적, 크림/유제품과 견과",
    "palate": "크림·캐러멜·아이리시 위스키·바닐라에 은은한 커피·초콜릿(코코아), 가벼운 스파이스",
    "finish": "매끄럽고 새틴 같은 크리미함, 캐러멜보다 스파이스가 살짝 더 부각",
    "source": "https://distiller.com/spirits/baileys-original-irish-cream",
    "sourceName": "Distiller (Baileys Original)"
  },
  "campari": {
    "nose": "복합적이며 허브·오렌지·플로럴 노트",
    "palate": "강렬한 쓴맛에 비터 오렌지 껍질의 시트러스 단맛, 루바브·정향·키노토의 허브 언더톤",
    "finish": "기분 좋은 쓴맛과 벨벳 같은 여운",
    "source": "https://www.campari.com/our-products/campari/",
    "sourceName": "Campari 공식"
  },
  "stgermain": {
    "nose": "깨끗하고 섬세한 향 — 복숭아·배·자몽·리치의 통합된 과일",
    "palate": "가볍게 시럽 같은 엘더플라워 플로럴에 또렷한 시트러스 산미, 레몬 머랭·배·패션프루트",
    "finish": "엘더플라워의 긴 여운에 구스베리와 시트러스 산미",
    "source": "https://www.stgermainliqueur.com/us/en/st-germain-elderflower-liqueur/",
    "sourceName": "St-Germain 공식 + Difford's"
  },
  "luxardo": {
    "nose": "마라스카 체리 증류액 특유의 향, 강한 알코올과 로스티드 너티함, 체리 블라섬·아몬드",
    "palate": "부드러우면서 날카롭고, 다크초콜릿·바닐라·오렌지 마멀레이드, 드라이 체리·마지팬",
    "finish": "깔끔하고 살짝 쌉쌀하며 아몬드·체리씨의 우아한 여운",
    "source": "https://www.luxardo.it/liqueurs-and-distillates/maraschino-originale/",
    "sourceName": "Luxardo 공식"
  },
  "kahlua": {
    "nose": "비터스위트 커피콩과 구운 밤의 향",
    "palate": "진한 블랙커피에 바닐라·초콜릿·달콤한 버터와 이국적 스파이스(아라비카+럼, 20%)",
    "finish": "부드럽고 균형 잡힌 커피 단맛",
    "source": "https://www.kahlua.com/en-us/products/original-coffee-liqueur/",
    "sourceName": "Kahlúa 공식"
  },
  "bombay": {
    "nose": "밝은 레몬 제스트와 시트러스, 클래식 주니퍼, 부드러운 아몬드, 인디언 스파이스와 흑후추",
    "palate": "처음엔 가볍고 섬세하다 중반에 스파이시 — 고수·큐베브 후추·그레인 오브 파라다이스의 온기, 소나무 주니퍼와 크리미 시트러스(10가지 보태니컬)",
    "finish": "길고 만족스러우며 리코리스·아몬드에 후추 스파이스와 상쾌한 파인",
    "source": "https://www.diffordsguide.com/beer-wine-spirits/1113/bombay-sapphire-40",
    "sourceName": "Difford's Guide (Bombay Sapphire)"
  },
  "bacardi": {
    "nose": "아몬드와 과일, 오렌지 블라섬·라벤더·장미, 살구·라임·옅은 코코넛·잘 익은 바나나",
    "palate": "부드럽고 크리미하며 바닐라·아몬드·열대 과일",
    "finish": "드라이하고 깨끗하며 상쾌",
    "source": "https://www.bacardi.com/our-rums/carta-blanca-rum/",
    "sourceName": "BACARDÍ 공식(Carta Blanca)"
  },
  "malibu": {
    "nose": "가볍게 구운 코코넛 향에 바닐라와 휘핑크림의 뉘앙스",
    "palate": "또렷한 크리미 코코넛에 바닐라 커스터드, 달콤하고 깨끗함(21%)",
    "finish": "깨끗하고 가벼운 단맛, 코코넛·바닐라의 짧은 여운",
    "source": "https://www.malibudrinks.com/en/products/malibu-original/",
    "sourceName": "Malibu 공식"
  },
  "cuervo": {
    "nose": "달콤한 향에 기분 좋은 아가베 노트",
    "palate": "달고 은은한 아가베에 오크·바닐라, 구운 아가베·꿀, 스파이스와 허브",
    "finish": "균형 잡히고 짧고 매끄러우며 약간 오키·스파이시(레포사도+블랑코 블렌드)",
    "source": "https://www.masterofmalt.com/tequila/jose-cuervo/jose-cuervo-especial-gold-tequila/",
    "sourceName": "Master of Malt (Cuervo Especial Gold)"
  },
  "gordons": {
    "nose": "클래식 주니퍼 중심에 신선한 시트러스와 은은한 스파이스",
    "palate": "크리스프하고 깨끗하며 주니퍼가 지배적, 레몬 껍질·고수·안젤리카의 균형",
    "finish": "주니퍼와 시트러스가 남고 절제된 허브·후추 노트",
    "source": "https://www.gordonsgin.com/en-gb/the-collection/gordons-london-dry-gin/",
    "sourceName": "Gordon's 공식"
  },
  "hwayo41": {
    "nose": "막걸리 같은 달달한 쌀 향이 첫인상(감압증류·옹기 3개월 숙성)",
    "palate": "41도지만 부담 없이 부드럽고 정돈된 맛, 향이 강하지 않아 입문용으로 적합",
    "finish": "깔끔; 스트레이트로 향을 즐기거나 온더락으로 더 부드럽게",
    "source": "https://namu.wiki/w/%ED%99%94%EC%9A%94",
    "sourceName": "참고: 나무위키(화요) — 제조 광주요, 공식 영문 노트 부재"
  }
};
