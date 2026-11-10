/**
 * beginnerGuide.ts — 입문 안내 팝업에 넣는 카드.
 *
 * 내용은 드라이브 '03 입문 페이지 자료'의 검토본에서 그대로 옮겼다. 새로 지어낸 문장은 없다.
 *  - 마시는 법 · 첫 병 · 도구 · 보관: '첫 단계_GPT.docx'(2026-10-30 조사)와
 *    '첫 단계 가이드 검토 2차 v2'(2026-11-02)의 "앱에 들어갈 최종 목록".
 *    검토에서 근거가 부족하다고 정한 것(도수 범위, 니트 분량, "먼저 갖출 도구 3개")은 넣지 않았다.
 *  - '물 몇 방울'은 2026-11-10 에 따로 찾아 넣었다(Douglas Laing 원문 확인. 논문은 오해 10번 검토본의 인용을 따랐다).
 *  - 오해 12선: '위스키·칵테일 입문자가 자주 믿는 오해 12선 (검토 반영 v2)'.
 * 건강 안내는 설정의 '건강한 음주 안내'에 따로 있어 여기에는 두지 않는다.
 */
export interface GuideSource { label: string; url: string; }
export interface GuideCard {
  title: string;
  /** 오해 카드에서만: 흔히 믿는 말. 있으면 title 대신 "오해"로 보여 주고 body 를 "실제"로 보여 준다 */
  myth?: string;
  body: string[];
  sources: GuideSource[];
}
export type GuideId = 'drink' | 'firstbottle' | 'tools' | 'storage' | 'myths-whisky' | 'myths-cocktail';
export type GuideGroup = 'whisky' | 'cocktail';
export const GUIDE_GROUPS: ReadonlyArray<{ key: GuideGroup; title: string }> = [
  { key: 'whisky', title: '위스키 안내서' },
  { key: 'cocktail', title: '칵테일 안내서' },
];
export interface GuideChapter { id: GuideId; group: GuideGroup; title: string; intro: string; cards: GuideCard[]; }

const SUNTORY_FAQ: GuideSource = { label: 'Suntory 위스키 음용 FAQ', url: 'https://www.suntory.co.jp/customer/faq/005510.html' };
const THE_BAR: GuideSource = { label: 'The Bar(디아지오) 도구 대체 안내', url: 'https://www.thebar.com/en-in/articles/creative-bar-tools-alternatives-to-save-the-day' };
const SWR: GuideSource = { label: 'Scotch Whisky Regulations 2009', url: 'https://www.legislation.gov.uk/uksi/2009/2890' };
const CFR: GuideSource = { label: '미국 연방규정 27 CFR 5.143', url: 'https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-5/subpart-I/section-5.143' };
const SW_MATURITY: GuideSource = { label: 'ScotchWhisky.com', url: 'https://scotchwhisky.com/magazine/features/17433/how-do-you-define-maturity-in-whisky/' };
const iba = (name: string, slug: string): GuideSource => ({ label: `IBA ${name}`, url: `https://iba-world.com/iba-cocktail/${slug}/` });

export const GUIDE_CHAPTERS: readonly GuideChapter[] = [
  {
    id: 'drink', group: 'whisky', title: '위스키 마시는 법',
    intro: '같은 위스키도 마시는 방법에 따라 느낌이 달라요. 많이 쓰는 다섯 가지예요.',
    cards: [
      { title: '니트 (스트레이트)', body: ['잔에 위스키만 따라요. 물과 얼음을 섞지 않아요.', '위스키 자체의 향과 여운을 살펴보는 방법이에요. 마실 물을 옆에 따로 준비해요.'],
        sources: [SUNTORY_FAQ, { label: 'Suntory 스트레이트 안내', url: 'https://www.suntory.co.jp/whisky/beginner/drink/straight.html?fromid=faq_thumb' }] },
      { title: '워터 드롭', body: ['니트로 따른 위스키에 물을 조금 떨어뜨려요.', '알코올 자극이 부드러워지고 숨어 있던 향과 맛이 드러나요. 도수 46% 이상이거나 캐스크 스트렝스인 위스키에서 차이가 커요.'],
        sources: [{ label: 'Douglas Laing, Should You Add Water to Whisky?', url: 'https://www.douglaslaing.com/blogs/news/should-you-add-water-to-whisky-a-beginner-s-guide-to-tasting-water-and-glassware' },
          { label: 'Karlsson & Friedman, Scientific Reports 7, 6489 (2017)', url: 'https://www.nature.com/articles/s41598-017-06423-5' }] },
      { title: '온더록', body: ['잔에 큰 얼음 하나를 넣고 위스키를 따른 뒤 바 스푼으로 가볍게 저어요.', '차갑게 마시는 방법이에요. 얼음이 녹으면서 조금씩 묽어져요.'],
        sources: [SUNTORY_FAQ, { label: 'Suntory 온더록 안내', url: 'https://www.suntory.co.jp/whisky/beginner/drink/rocks.html?fromid=faq_thumb' }] },
      { title: '미즈와리 (물 타기)', body: ['위스키 1에 물 2~2.5를 섞어요.'],
        sources: [{ label: 'House of Suntory (Whisky and Water)', url: 'https://house.suntory.com/' }] },
      { title: '하이볼', body: ['얼음을 넣은 잔에 위스키 1, 차가운 탄산수 3~4를 넣어요.', '위스키 30ml에 탄산수 90~120ml면 이 비율이에요. 도수 40% 위스키라면 얼음이 녹기 전 계산으로 약 8~10%가 돼요.'],
        sources: [SUNTORY_FAQ, { label: 'House of Suntory 하이볼', url: 'https://house.suntory.com/cocktails/kaku-highball' }] },
    ],
  },
  {
    id: 'firstbottle', group: 'cocktail', title: '첫 병 고르기',
    intro: '칵테일을 만들어 보려면 베이스가 되는 술이 한 병 필요해요. 국제바텐더협회(IBA) 공식 칵테일에 쓰이는 다섯 가지예요. 주스나 시럽 같은 다른 재료도 함께 필요해요.',
    cards: [
      { title: '드라이 진', body: ['드라이 마티니, 네그로니, 비즈 니즈에 써요.', '베르무트, 쓴맛 나는 술, 감귤 주스와 잘 섞여요.'], sources: [iba('Dry Martini', 'dry-martini'), iba('Negroni', 'negroni'), iba("Bee's Knees", 'bees-knees')] },
      { title: '보드카', body: ['블랙 러시안, 블러디 메리, 에스프레소 마티니에 써요.', '커피 리큐르나 토마토 주스와 섞어요.'], sources: [iba('Black Russian', 'black-russian'), iba('Bloody Mary', 'bloody-mary'), iba('Espresso Martini', 'espresso-martini')] },
      { title: '화이트 럼', body: ['다이키리, 메리 픽포드, 비트윈 더 시츠에 써요.', '라임, 파인애플과 잘 섞여요.'], sources: [iba('Daiquiri', 'daiquiri'), iba('Mary Pickford', 'mary-pickford'), iba('Between the Sheets', 'between-the-sheets')] },
      { title: '데킬라', body: ['마르가리타, 팔로마, 데킬라 선라이즈에 써요.', '라임, 자몽 소다, 오렌지 주스와 섞어요.'], sources: [iba('Margarita', 'margarita'), iba('Paloma', 'paloma'), iba('Tequila Sunrise', 'tequila-sunrise')] },
      { title: '버번 위스키', body: ['올드 패션드, 위스키 사워, 불바디에에 써요.', '설탕, 비터, 레몬, 베르무트와 섞어요.'], sources: [iba('Old Fashioned', 'old-fashioned'), iba('Whiskey Sour', 'whiskey-sour'), iba('Boulevardier', 'boulevardier')] },
    ],
  },
  {
    id: 'tools', group: 'cocktail', title: '도구가 없을 때',
    intro: '바 도구를 사기 전에 집에 있는 물건으로 먼저 해 볼 수 있어요.',
    cards: [
      { title: '셰이커 대신', body: ['뚜껑이 단단히 잠기는 유리병(메이슨 자)이나 뚜껑 있는 텀블러를 써요.', '뚜껑이 새지 않는지 먼저 확인하고, 얼음과 액체가 움직일 공간을 남겨요.'], sources: [THE_BAR] },
      { title: '지거(계량컵) 대신', body: ['용량을 아는 계량스푼이나 샷잔을 써요.', '일반 숟가락이나 국자는 용량이 일정하지 않아요.'], sources: [THE_BAR] },
      { title: '바 스푼 대신', body: ['깨끗한 젓가락이나 길고 가는 스푼으로 저어요.'], sources: [THE_BAR] },
      { title: '스트레이너(거름망) 대신', body: ['주방의 고운 체나 차 거름망을 대고 따라요.'], sources: [THE_BAR] },
      { title: '머들러(으깨는 막대) 대신', body: ['깨끗한 밀대나 숟가락 뒷면으로 눌러요.'], sources: [THE_BAR] },
      { title: '믹싱 글라스 대신', body: ['파인트 잔처럼 튼튼하고 안쪽이 곧은 잔을 써요.', '얼음과 재료를 저을 공간이 있어야 해요.'], sources: [{ label: 'Candra 믹싱 용기 안내', url: 'https://candradrinks.com/cocktail-bar-skills-guides/cocktail-equipment/mixing-vessels/' }] },
    ],
  },
  {
    id: 'storage', group: 'cocktail', title: '개봉한 술 보관',
    intro: '종류에 따라 보관하는 곳과 기간이 달라요. 병에 적힌 표시가 있으면 그것을 먼저 따라요.',
    cards: [
      { title: '위스키, 진, 보드카 같은 증류주', body: ['실온의 서늘한 곳에 세워 둬요.', '직사광선, 더운 곳, 냄새가 강한 곳을 피해요. 냉장고에 넣지 않아도 돼요.'], sources: [{ label: 'Suntory 주류 보관 FAQ', url: 'https://www.suntory.co.jp/customer/faq/005587.html' }] },
      { title: '베르무트', body: ['개봉한 뒤에는 냉장고에 넣어요. 스위트와 드라이 모두 같아요.', '냉장해도 약 한 달이 지나면 산화해서 맛이 떨어져요.'], sources: [{ label: 'MARTINI 베르무트 안내', url: 'https://www.martini.com/a-guide-to-vermouth/' }] },
      { title: '크림 리큐르', body: ['0~25°C에서 직사광선을 피해 둬요.', '기간은 병입일부터 2년이에요. 개봉한 날부터 세지 않아요.'], sources: [{ label: 'Baileys FAQ', url: 'https://www.baileys.com/en/frequently-asked-questions' }] },
      { title: '시판 시럽', body: ['건조하고 깨끗한 실온에 둬요.', '뚜껑으로 닫아 쓰면 개봉 후 90~180일, 펌프를 꽂아 쓰면 30~60일이에요.'], sources: [{ label: 'MONIN 보관 FAQ', url: 'https://monin.us/pages/monin-faq' }] },
      { title: '과일 주스', body: ['제품 라벨에 적힌 냉장 조건과 기간을 따라요.'], sources: [{ label: 'Tropicana FAQ', url: 'https://www.tropicana.com/faqs/' }] },
    ],
  },
  {
    id: 'myths-whisky', group: 'whisky', title: '위스키에 대한 오해 10가지',
    intro: '위스키를 처음 볼 때 흔히 듣는 말 가운데 사실과 다른 것들이에요.',
    cards: [
      { title: '블렌디드', myth: '블렌디드는 저급 위스키예요', body: ['블렌디드는 원액을 어떻게 구성했는지 나타내는 이름이에요. 스카치 법령은 싱글몰트와 블렌디드를 같은 무게의 법적 분류로 정해요. 품질 등급을 뜻하지 않아요.'],
        sources: [SWR, { label: 'Scotch Whisky Association FAQs', url: 'https://www.scotch-whisky.org.uk/discover-scotch/faqs/' }] },
      { title: '숙성 연수', myth: '오래 숙성할수록 무조건 좋아요', body: ['맛은 원액과 오크통의 균형에 달려 있어요. 너무 오래 숙성하면 나무의 떫은맛이 증류소의 개성을 덮을 수 있어요. 증류소는 원액의 특징이 가장 잘 드러나는 때에 병입해요.'], sources: [SW_MATURITY] },
      { title: '색', myth: '색이 진하면 오래 숙성한 거예요', body: ['색은 숙성 연수와 비례하지 않아요. 스카치와 유럽연합 법령은 색을 고르게 맞추려고 캐러멜 색소(E150a)를 넣는 것을 허용해요. 미국 스트레이트 위스키에는 색소를 넣을 수 없어요.'],
        sources: [SWR, { label: 'EU Regulation 2019/787', url: 'https://eur-lex.europa.eu/eli/reg/2019/787' }, CFR] },
      { title: '아일라', myth: '아일라 위스키는 모두 피트 향이 나요', body: ['스카치의 지역 이름은 만든 곳을 뜻하고, 맛을 정해 주지 않아요. 아일라에서도 브룩라디 클래식 라디, 부나하벤 12년처럼 피트를 쓰지 않은 위스키를 만들어요. 같은 브룩라디 증류소도 피트를 쓴 포트 샬롯을 따로 만들어요.'],
        sources: [SWR, { label: 'Bruichladdich', url: 'https://www.bruichladdich.com/collections/bruichladdich' }, { label: 'Bunnahabhain 12 Year Old', url: 'https://bunnahabhain.com/en-us/products/12-year-old' }] },
      { title: '연수 표시가 없는 위스키', myth: '숙성 연수가 없는 위스키(NAS)는 어린 저품질 원액이에요', body: ['숙성 연수는 섞인 원액 가운데 가장 어린 것을 기준으로 적어요. NAS는 연수를 적지 않았다는 뜻일 뿐이에요. 여러 숙성도의 원액을 섞어 원하는 맛을 만들 수 있어요.'], sources: [SWR, SW_MATURITY] },
      { title: '싱글몰트', myth: "싱글몰트의 '싱글'은 오크통 하나를 뜻해요", body: ["'싱글'은 한 증류소에서 만들었다는 뜻이에요. 한 증류소 안의 여러 통을 섞어도 싱글몰트예요. 통 하나에서 나온 원액만 담으면 싱글 캐스크라고 불러요."], sources: [SWR] },
      { title: '버번', myth: '버번은 켄터키에서만 만들어요', body: ['미국 연방 규정은 버번을 미국에서 만든 위스키로 정해요. 옥수수 51% 이상, 안쪽을 태운 새 오크통 숙성 같은 요건을 지키면 미국 어느 주에서나 만들 수 있어요.'], sources: [CFR] },
      { title: '재패니즈 위스키', myth: '일본 회사가 파는 위스키는 모두 재패니즈 위스키예요', body: ['재패니즈 위스키라고 표시하려면 일본양주주조조합 기준을 지켜야 해요. 일본에서 당화, 발효, 증류하고 일본에서 3년 이상 숙성하고 일본에서 도수 40% 이상으로 병입해야 해요. 해외 원액을 섞은 제품은 일본 회사가 팔아도 이 이름을 쓸 수 없어요.'],
        sources: [{ label: '일본양주주조조합 표시 기준', url: 'https://www.yoshu.or.jp/files/libs/1527/202303291555304944.pdf' }] },
      { title: '스모키한 향', myth: '스모키한 향이 나면 모두 피트 위스키예요', body: ['연기 향이 모두 피트에서 오지는 않아요. 오크통 안쪽을 불로 강하게 가열하면 나무 성분이 분해되면서 연기 향을 내는 성분이 생겨요. 그래서 피트를 쓰지 않아도 통에서 연기 향이 날 수 있어요. 버번은 법으로 안쪽을 태운 새 오크통에서 숙성해요.'],
        sources: [{ label: 'Zoecklein, Barrels (Virginia Tech)', url: 'https://enology.fst.vt.edu/downloads/wm_issues/Barrels/Barrels%20-%20Section%202.pdf' }, CFR] },
      { title: '물 타기', myth: '위스키는 무조건 스트레이트로 마셔야 해요', body: ['물을 몇 방울 넣으면 알코올 자극이 줄어요. 물을 넣어 도수가 낮아지면 스모키한 향을 내는 성분이 액체 표면 쪽으로 더 많이 모인다는 연구가 있어요. 테이스팅할 때도 그대로 먼저 맛본 뒤 물을 조금 넣어 보는 방법을 써요.'],
        sources: [{ label: 'Karlsson & Friedman, Scientific Reports 7, 6489 (2017)', url: 'https://www.nature.com/articles/s41598-017-06423-5' }, { label: 'Whisky Advocate', url: 'https://whiskyadvocate.com/how-to-enjoy-whisky' }] },
    ],
  },
  {
    id: 'myths-cocktail', group: 'cocktail', title: '칵테일에 대한 오해 2가지',
    intro: '칵테일을 처음 만들 때 놓치기 쉬운 두 가지예요.',
    cards: [
      { title: '셰이크와 스터', myth: '셰이크와 스터는 결과가 같아요', body: ['셰이크는 얼음과 재료를 세게 흔들어 공기를 넣어요. 빨리 차가워지고 질감이 가벼워지며 색이 흐려져요. 스터는 베이스 술과 베르무트처럼 맑은 재료를 투명하고 매끄럽게 섞을 때 써요.'],
        sources: [{ label: "Difford's Guide (Dry Martini)", url: 'https://www.diffordsguide.com/g/1121/martini/how-to-make-a-dry-martini' }, { label: "Difford's Guide (Basic Techniques)", url: 'https://www.diffordsguide.com/g/1150/how-to-make-cocktails/basic-techniques' }] },
      { title: '얼음', myth: '칵테일 얼음은 차갑기만 하면 아무거나 써도 돼요', body: ['얼음의 크기와 모양에 따라 녹는 물의 양이 달라져요. 큰 얼음은 표면적이 작아 천천히 녹고 차가운 온도를 오래 유지해요. 물이 알맞게 섞이면 알코올 자극이 줄고 맛이 어우러져요.'],
        sources: [{ label: "Difford's Guide (Added Water & Ice)", url: 'https://www.diffordsguide.com/encyclopedia/3711/cocktails/some-cocktails-benefit-from-added-water' }] },
    ],
  },
];

export const guideById = (id: GuideId): GuideChapter => GUIDE_CHAPTERS.find((c) => c.id === id)!;

/** 탭에 처음 들어갔을 때 한 번 띄울 안내 */
export const GUIDE_FOR_TAB: Partial<Record<string, GuideId>> = {
  whisky: 'drink',
  cocktails: 'firstbottle',
  cellar: 'storage',
};
