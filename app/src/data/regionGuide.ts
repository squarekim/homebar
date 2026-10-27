/**
 * regionGuide.ts — 증류소 지도의 지역 소개.
 *
 * 묶음은 화면용이다(whiskySpec.displayRegion). 섬은 법정 지역이 아니라 하이랜드에서 떼어 보여 주는 묶음이다.
 * facts: 2026-10-27 GPT 조사의 사실 문장을 출처째 옮겼다.
 * style: 스카치 5개 지역은 SWA 지역 소개 페이지의 설명을 옮겼다(2026-10-27 확인). 그 밖의 지역은
 *   공식 출처를 찾지 못해 비운다. 화면은 이 문장과 함께 기준 DB 제품의 피트 비율 같은 실제 수치를 보여 준다.
 */

export interface RegionGuide {
  /** displayRegion 의 group, 또는 스코틀랜드 밖의 나라 이름 */
  id: string;
  country: string;
  /** 법적 지위 한 줄 */
  legal: string;
  facts: string[];
  /** 공식 출처가 있는 맛 경향. 없으면 undefined */
  style?: string | undefined;
  sources: string[];
}

const SWR = 'https://www.legislation.gov.uk/uksi/2009/2890/pdfs/uksi_20092890_en.pdf';
const SWA_REGIONS = 'https://www.scotch-whisky.org.uk/discover-scotch/enjoying-scotch/scotch-whisky-regions/';

export const REGION_GUIDES: readonly RegionGuide[] = [
  {
    id: '스페이사이드', country: '스코틀랜드',
    legal: '스카치 위스키 법령이 정한 보호 지역(region)이에요.',
    facts: [
      '스페이강이 흐르는 모레이 일대예요.',
      'SWA는 세계에서 위스키 증류소가 가장 빽빽하게 모인 지역이라고 소개해요.',
    ],
    style: '피트를 적게 쓰고 과일 향이 풍부한 편이에요. 사과, 배, 꿀, 바닐라, 향신료 향이 자주 나고, 셰리 캐스크에서 숙성하는 경우가 많아요.',
    sources: [SWR, SWA_REGIONS],
  },
  {
    id: '하이랜드', country: '스코틀랜드',
    legal: '스카치 위스키 법령이 정한 보호 지역(region)이에요. 법령의 하이랜드·로우랜드 경계선 북쪽이에요.',
    facts: ['SWA는 섬 지역도 하이랜드에 넣어 소개해요.', '글렌모렌지가 있는 테인도 하이랜드예요.'],
    style: '아주 넓은 지역이라 맛이 다양해요. 가벼운 위스키부터 짠맛이 도는 해안가 몰트까지 있어요.',
    sources: [SWR, SWA_REGIONS, 'https://www.moethennessyjapan.com/en/brands/glenmorangie/history'],
  },
  {
    id: '섬', country: '스코틀랜드',
    legal: '법정 지역은 하이랜드예요. 법령의 보호 지역 목록에 섬은 따로 없어서, 앱에서 보기 쉽게 묶었어요.',
    facts: [
      '스카이(탈리스커), 오크니(하이랜드 파크), 아란(로크란자)을 묶었어요. 아일라는 따로 보여 줘요.',
      '아란에는 로크란자와 라그, 증류소가 두 곳 있어요.',
    ],
    style: 'SWA는 섬을 하이랜드에 넣어 소개해요. 섬마다 스타일이 달라서 지역 하나로 맛을 묶기 어려워요.',
    sources: [SWR, SWA_REGIONS, 'https://www.arranwhisky.com/'],
  },
  {
    id: '아일라', country: '스코틀랜드',
    legal: '스카치 위스키 법령이 정한 보호 지방(locality)이에요. 법령에서 지역(region)과 구분하는 이름이에요.',
    facts: [
      '스코틀랜드 서쪽 아가일의 섬이에요.',
      '카올 일라처럼 피트를 쓴 위스키와 쓰지 않은 위스키를 모두 만드는 곳도 있어요.',
    ],
    style: 'SWA는 피트를 강하게 쓴 스모키한 위스키로 유명한 섬이라고 소개해요. 다만 피트를 쓰지 않은 아일라 위스키도 있어요.',
    sources: [SWR, SWA_REGIONS, 'https://www.malts.com/en/caol-ila/visit'],
  },
  {
    id: '캠벨타운', country: '스코틀랜드',
    legal: '스카치 위스키 법령이 정한 보호 지방(locality)이에요.',
    facts: ['킨타이어반도 남쪽 끝의 도시예요.', '스프링뱅크는 지금 운영 중인 캠벨타운 증류소를 3곳으로 소개해요.'],
    style: '짠맛, 스모크, 과일, 바닐라, 토피 향이 어우러진 묵직하고 풍부한 위스키가 많아요.',
    sources: [SWR, SWA_REGIONS, 'https://www.springbank.scot/about/place/'],
  },
  {
    id: '로우랜드', country: '스코틀랜드',
    legal: '스카치 위스키 법령이 정한 보호 지역(region)이에요. 하이랜드·로우랜드 경계선 남쪽이에요.',
    facts: ['던디와 그리녹을 잇는 선의 남쪽이에요.', '글렌킨치는 이스트로디언의 펜케이틀랜드에 있어요.'],
    style: '스타일이 다양하고, 최근 새 증류소가 많이 늘었어요.',
    sources: [SWR, SWA_REGIONS, 'https://www.malts.com/en-us/glenkinchie/visit'],
  },
  {
    id: '아일랜드', country: '아일랜드',
    legal: '아이리시 위스키는 별도의 지리적 표시(GI)예요.',
    facts: [
      '생산 범위는 북아일랜드를 포함한 아일랜드섬 전체예요.',
      '아일랜드섬의 창고에서 최소 3년 숙성해야 해요.',
    ],
    sources: [
      'https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/geographical-indications-spirit-drinks/',
      'https://agriculture.ec.europa.eu/farming/geographical-indications-and-quality-schemes/geographical-indications-food-and-drink/irish-whiskey-gi_en',
      'https://www.ibec.ie/drinksireland/news-insights-and-events/news/2023/04/11/irish-whiskey-working-across-our-shared-island',
    ],
  },
  {
    id: '일본', country: '일본',
    legal: '일본양주주조조합이 2021년 2월에 재패니즈 위스키 표시 자율 기준을 만들었어요.',
    facts: ['증류소가 여러 현에 흩어져 있어요. 야마자키는 오사카부, 하쿠슈는 야마나시현에 있어요.'],
    sources: ['https://www.yoshu.or.jp/en/pages/150/', 'https://www.suntory.com/factory/yamazaki/', 'https://www.suntory.com/factory/hakushu/'],
  },
  {
    id: '한국', country: '한국',
    legal: '위스키 생산 지역을 정한 기준은 이번 조사에서 확인하지 못했어요.',
    facts: ['기원 증류소는 경기도 남양주시 화도읍에 있고, 2020년에 세워졌어요.'],
    sources: ['https://threesocieties.co.kr/kor'],
  },
];

export const regionGuideById = new Map(REGION_GUIDES.map((g) => [g.id, g]));
