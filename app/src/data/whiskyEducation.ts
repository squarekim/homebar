/**
 * whiskyEducation.ts — 캐스크 해설 콘텐츠(출처 포함).
 * 사실 기준으로 정리했고 각 항목에 출처 URL 을 둔다.
 */
export interface CaskExplainer {
  title: string;
  rows: { label: string; text: string }[];
  key: string;       // 핵심 차이 한 줄
  sources: { name: string; url: string }[];
}

export const CASK_SHERRY_VS_WINE: CaskExplainer = {
  title: '기원 호랑이의 와인 캐스크 vs 맥캘란의 셰리 캐스크',
  rows: [
    {
      label: '맥캘란 — 셰리(시즈닝) 캐스크',
      text: '위스키 숙성용으로 새로 만든 유럽/미국 오크통에 올로로소 셰리를 12~18개월 시즈닝한 뒤 비우고 채운다. 셰리는 주정강화(약 18~20%) + 산화(oxidative) 숙성 와인이라, 오크에 밴 성분이 건포도·무화과 등 말린 과일, 견과, 스파이스, 초콜릿과 진한 색을 낸다. 셰리를 담아 운송하던 전통 “엑스-셰리 통”과 달리 처음부터 위스키용으로 제작·시즈닝한 통이다.',
    },
    {
      label: '기원 호랑이 — 셰리 + 와인 캐스크',
      text: '기원 호랑이(Ki One Tiger)는 셰리 캐스크와 함께 일반(비강화) 와인 캐스크를 쓴다. 주정강화가 아닌 테이블/레드 와인 통은 산화적 견과·묵은 건과일보다 신선한 붉은 과일·베리·자두, 탄닌과 화사한 과일감·색조를 준다. 언피티드 몰트라 스모크는 없고, 셰리의 무게감에 와인의 밝은 과일이 겹쳐진 프로파일이 된다.',
    },
  ],
  key: '셰리 캐스크 = 주정강화·산화 숙성 → 묵직한 말린 과일·견과·스파이스. 와인(레드) 캐스크 = 비강화·저산화 → 신선한 붉은 과일·베리·탄닌. 같은 “과일”이라도 셰리는 건과일 계열, 와인은 생과일 계열로 방향이 다르다.',
  sources: [
    { name: 'The Macallan 공식 — Sherry Oak', url: 'https://www.themacallan.com/en/single-malt-scotch-whisky/sherry-oak' },
    { name: 'SevenFifty Daily — Macallan 우드/셰리 시즈닝', url: 'https://daily.sevenfifty.com/with-the-macallan-its-the-wood-that-makes-the-malt/' },
    { name: 'K&L Wines — Ki One Tiger Edition(셰리+와인 캐스크)', url: 'https://shop.klwines.com/products/details/1933379' },
  ],
};
