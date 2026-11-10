/**
 * beginnerGuide.ts — 입문 안내 팝업에 넣는 카드.
 *
 * 내용은 드라이브 '03 입문 페이지 자료'의 검토본에서 그대로 옮겼다. 새로 지어낸 문장은 없다.
 *  - 마시는 법 · 첫 병 · 도구 · 보관: '첫 단계_GPT.docx'(2026-10-30 조사)와
 *    '첫 단계 가이드 검토 2차 v2'(2026-11-02)의 "앱에 들어갈 최종 목록".
 *    검토에서 근거가 부족하다고 정한 것(도수 범위, 니트 분량, "먼저 갖출 도구 3개")은 넣지 않았다.
 *  - '물 몇 방울'은 2026-11-10 에 따로 찾아 넣었다(Douglas Laing 원문 확인. 논문은 오해 10번 검토본의 인용을 따랐다).
 *  - 오해 12선: '위스키·칵테일 입문자가 자주 믿는 오해 12선 (검토 반영 v2)'.
 *  - 칵테일 만들기(방법·단위·잔·얼음·가니시·설탕시럽·날계란·기본 구조)와 칵테일 오해 3~10번:
 *    '칵테일 입문_GPT', '칵테일 입문_Gemini'(2026-11-10)를 대조하고 원문을 열어 확인한 것만 옮겼다.
 *    결정과 보류 항목은 드라이브 '칵테일 입문 안내서 (검토 반영)'에 적었다.
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
export type GuideId = 'drink' | 'firstbottle' | 'tools' | 'storage' | 'myths-whisky' | 'myths-cocktail'
  | 'methods' | 'units' | 'glasses' | 'ice' | 'garnish' | 'syrup' | 'egg' | 'families';
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

const D = (label: string, path: string): GuideSource => ({ label: `Difford's Guide, ${label}`, url: `https://www.diffordsguide.com/${path}` });
const D_STIR = D('How to stir', 'g/1150/how-to-make-cocktails/how-to-stir-a-cocktail');
const D_SHAKER = D('Cocktail shakers', 'g/1150/how-to-make-cocktails/cocktail-shakers');
const D_SHAKETIPS = D('Shaking tips and myths', 'g/1150/how-to-make-cocktails/shaking-tips-and-myths');
const D_DRY = D('How to dry shake', 'g/1150/how-to-make-cocktails/how-to-dry-shake');
const D_LAYER = D('How to layer', 'g/1150/how-to-make-cocktails/how-to-layer');
const D_BLEND = D('How to blend', 'g/1150/how-to-make-cocktails/how-to-blend');
const D_SWIZZLE = D('How to swizzle', 'g/1150/how-to-make-cocktails/swizzles-how-to-swizzle');
const D_MEASURE = D('Measures and measuring', 'encyclopedia/1177/cocktails/measures-and-measuring');
const D_GLASS = D('Cocktail glassware', 'g/1150/how-to-make-cocktails/cocktail-glassware');
const D_ICE = D('Ice', 'g/1150/how-to-make-cocktails/ice');
const D_ZEST = D('Citrus zest twists', 'g/1269/cocktail-garnishes/citrus-zest-twists');
const D_RIM = D('Margarita ingredients', 'g/1138/margarita-cocktail/ingredients');
const D_EGG = D('Egg dos and don\'ts', 'encyclopedia/509/cocktails/egg-dos-and-donts-and-using-eggs-in-cocktails');
const D_SYRUP = D('How to make sugar syrup', 'encyclopedia/3596/cocktails/how-to-make-sugar-syrup');
const D_MARTINI = D('How to make a Dry Martini', 'g/1121/martini/how-to-make-a-dry-martini');
const FDA_EGG: GuideSource = { label: '미국 FDA, Egg Safety', url: 'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety' };
const MFDS_EGG: GuideSource = { label: '식품의약품안전처, 살모넬라 식중독 예방 가이드', url: 'https://www.mfds.go.kr/brd/m_768/view.do?seq=3684' };
const I_CUBA = iba('Cuba Libre', 'cuba-libre'), I_COLLINS = iba('John Collins', 'john-collins'), I_FIZZ = iba('Gin Fizz', 'gin-fizz');
const I_OF = iba('Old Fashioned', 'old-fashioned'), I_MARTINI = iba('Dry Martini', 'dry-martini'), I_SOUR = iba('Whiskey Sour', 'whiskey-sour');
const I_NEGRONI = iba('Negroni', 'negroni');

export const GUIDE_CHAPTERS: readonly GuideChapter[] = [
  {
    id: 'drink', group: 'whisky', title: '위스키 마시는 법',
    intro: '같은 위스키도 마시는 방법에 따라 느낌이 달라요. 많이 쓰는 다섯 가지예요.',
    cards: [
      { title: '니트 (스트레이트)', body: ['잔에 위스키만 따라요. 물과 얼음을 섞지 않아요.', '위스키 자체의 향과 여운을 살펴보는 방법이에요. 마실 물을 옆에 따로 준비해요.'],
        sources: [SUNTORY_FAQ, { label: 'Suntory 스트레이트 안내', url: 'https://www.suntory.co.jp/whisky/beginner/drink/straight.html?fromid=faq_thumb' }] },
      { title: '워터드롭', body: ['니트로 따른 위스키에 물을 조금 떨어뜨려요.', '알코올 자극이 부드러워지고 숨어 있던 향과 맛이 드러나요. 도수 46% 이상이거나 캐스크 스트렝스인 위스키에서 차이가 커요.'],
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
    id: 'methods', group: 'cocktail', title: '만드는 방법 9가지',
    intro: '레시피의 "만드는 법"에 적힌 말이 무엇을 하라는 뜻인지, 순서대로 알려 드려요.',
    cards: [
      { title: '빌드: 잔에 바로 붓기', body: ['1. 마실 잔에 얼음을 가득 채워요.', '2. 재료를 잔에 바로 부어요.', '3. 가볍게 저어요.', '쿠바 리브레와 존 콜린스가 이렇게 만들어요.'], sources: [I_CUBA, I_COLLINS, D_ICE] },
      { title: '스터: 저어서 섞기', body: ['1. 믹싱 글라스에 재료를 넣고 얼음을 3분의 2까지 채워요.', '2. 잔 벽을 따라 30~45초, 50바퀴 넘게 저어요.', '3. 얼음을 걸러 내고 마실 잔에 따라요.', '저을 때 쓴 얼음은 마실 잔에 넣지 않아요.'], sources: [D_STIR, I_MARTINI] },
      { title: '셰이크: 흔들어 섞기', body: ['1. 셰이커에 재료를 넣고 얼음을 3분의 2까지 채워요.', '2. 뚜껑을 닫고 12초쯤 흔들어요.', '3. 얼음을 걸러 내고 마실 잔에 따라요.', '탄산이 든 재료는 셰이커에 넣지 않고, 잔에 따른 뒤에 부어요.'], sources: [D_SHAKER, I_FIZZ] },
      { title: '드라이 셰이크: 얼음 없이 먼저 흔들기', body: ['계란 흰자가 들어가는 잔에서 거품을 낼 때 써요.', '1. 재료를 얼음 없이 먼저 흔들어요.', '2. 얼음을 넣고 한 번 더 흔들어요.', '3. 걸러서 잔에 따라요.'], sources: [D_DRY, D_EGG] },
      { title: '머들: 눌러서 녹이거나 으깨기', body: ['올드 패션드는 이렇게 해요.', '1. 잔에 각설탕을 넣고 비터와 물을 조금 적셔요.', '2. 설탕이 녹을 때까지 눌러요.', '3. 얼음을 채우고 위스키를 부은 뒤 가볍게 저어요.', '허브는 지나치게 으깨면 쓴맛이 날 수 있어요.'], sources: [I_OF] },
      { title: '플로트: 위에 띄우기', body: ['1. 아래에 깔릴 음료를 먼저 만들어요.', '2. 숟가락의 둥근 쪽을 잔 안쪽 벽에 대요.', '3. 띄울 재료를 숟가락 위로 천천히 부어요.'], sources: [D_LAYER] },
      { title: '레이어: 층층이 쌓기', body: ['1. 가장 무거운 재료를 먼저 부어요. 보통 시럽이 가장 무겁고 리큐르가 그다음이에요.', '2. 다음 재료를 잔 벽에 댄 숟가락 위로 천천히 부어요.', '3. 가장 가벼운 재료를 마지막에 올리고 젓지 않아요.'], sources: [D_LAYER] },
      { title: '블렌드: 갈아서 섞기', body: ['블렌더에 재료와 부순 얼음을 넣고 고른 질감이 될 때까지 갈아요.'], sources: [D_BLEND] },
      { title: '스위즐: 막대를 돌려 섞기', body: ['부순 얼음을 쓰는 잔에서만 해요.', '1. 잔에 재료와 부순 얼음을 넣어요.', '2. 막대를 두 손바닥 사이에 끼우고 비벼서 빠르게 돌려요.', '3. 잔 바깥에 성에가 낄 때까지 돌려요.'], sources: [D_SWIZZLE] },
    ],
  },
  {
    id: 'units', group: 'cocktail', title: '레시피 단위 읽기',
    intro: '레시피 재료 옆에 적힌 단위를 집에 있는 도구로 재는 방법이에요.',
    cards: [
      { title: 'ml, cl, oz', body: ['1cl는 10ml예요. 3cl라고 적혀 있으면 30ml예요.', '1oz(온스)는 30ml로 맞춰 재요. 정확히는 미국식이 29.57ml, 영국식이 28.41ml예요.', '국제바텐더협회(IBA) 레시피는 ml로 적어요.'], sources: [D_MEASURE, I_OF] },
      { title: 'tsp, bsp (티스푼, 바 스푼)', body: ['둘 다 5ml로 재요.', '집에 있는 찻숟가락은 2.5ml에서 7.3ml까지 크기가 제각각이에요. 5ml 계량스푼으로 재요.'], sources: [D_MEASURE] },
      { title: 'dash (대시)', body: ['비터 병을 기울여 한 번 털어 넣는 양이에요.', '병마다 달라서 1ml가 3~6대시예요. Difford\'s Guide는 4대시를 1.25ml로 정해 써요.', '"few dashes"는 몇 번 털어 넣으라는 뜻이고 정해진 횟수는 없어요.'], sources: [D_MEASURE, I_OF] },
      { title: 'Top, Full, splash', body: ['정해진 분량이 없는 표시예요.', 'Top과 Full은 다른 재료를 넣은 뒤 그 재료로 잔을 채우라는 뜻이에요.', 'splash는 조금만 부으라는 뜻이에요. IBA 진 피즈는 탄산수를 splash로 적어요.'], sources: [I_FIZZ] },
      { title: '1 part (비율)', body: ['정해 둔 한 단위예요. ml가 정해져 있지 않아요.', '소주잔이든 계량컵이든 하나를 기준으로 정하고, 모든 재료를 그 잔의 배수로 재요.'], sources: [D_MEASURE] },
    ],
  },
  {
    id: 'glasses', group: 'cocktail', title: '잔 8가지',
    intro: '레시피에 나오는 잔의 모양과 크기, 집에 없을 때 대신 쓸 잔이에요. 용량은 가득 채웠을 때 기준이에요.',
    cards: [
      { title: '쿠프', body: ['긴 다리 위에 낮고 둥근 볼이 달린 잔이에요. 약 200ml(7oz)예요.', '다이키리처럼 얼음을 걸러 내고 따르는 잔에 써요. 다리를 잡으면 손의 온기가 덜 전해져요.', '없으면 작은 와인잔을 써요.'], sources: [D_GLASS] },
      { title: '마티니 (칵테일 글라스)', body: ['긴 다리 위에 V자 모양 볼이 달린 잔이에요. 200ml(7oz)를 넘지 않는 크기를 써요.', '드라이 마티니, 맨해튼을 담아요.', '없으면 쿠프나 작은 와인잔을 써요.'], sources: [D_GLASS, I_MARTINI] },
      { title: '하이볼', body: ['키가 크고 곧은 원통 모양 잔이에요. 180~300ml(6~10oz)예요.', '얼음과 탄산음료를 함께 담는 잔에 써요.', '없으면 길쭉한 물컵을 써요.'], sources: [D_GLASS, I_COLLINS] },
      { title: '록스 (올드 패션드 글라스)', body: ['키가 낮고 바닥이 두꺼운 잔이에요. 270~320ml(9~11oz)예요.', '올드 패션드, 네그로니를 담아요. 큰 얼음을 넣기 좋아요.', '없으면 낮고 튼튼한 물컵을 써요.'], sources: [D_GLASS, I_OF] },
      { title: '샴페인 플루트', body: ['다리가 있고 볼이 가늘고 긴 잔이에요. 약 170ml(6oz)예요.', '스파클링 와인이 들어가는 잔에 써요.', '없으면 화이트 와인잔을 써요.'], sources: [D_GLASS] },
      { title: '허리케인', body: ['짧은 다리 위에 굴곡진 큰 볼이 달린 잔이에요. 약 600ml(20oz)예요.', '피냐 콜라다처럼 얼음과 주스가 많이 들어가는 잔에 써요.', '없으면 큰 물컵을 써요.'], sources: [D_GLASS] },
      { title: '샷', body: ['아주 작은 잔이에요. 약 60ml(2oz)예요.', '층을 쌓는 잔이나 적은 양을 낼 때 써요.', '없으면 소주잔을 써요.'], sources: [D_GLASS] },
      { title: '머그', body: ['손잡이가 달린 잔이에요. 구리 머그, 도자기 머그, 내열 유리 머그가 있어요.', '모스코 뮬이나 따뜻한 칵테일에 써요.', '없으면 집에 있는 머그컵을 써요.'], sources: [D_GLASS] },
    ],
  },
  {
    id: 'ice', group: 'cocktail', title: '얼음',
    intro: '얼음은 칵테일을 차갑게 하고, 녹으면서 물을 섞어 줘요. 다섯 가지만 알아 두면 돼요.',
    cards: [
      { title: '잔에는 얼음을 가득', body: ['얼음을 넣어 마시는 잔에는 몇 조각만 넣지 말고 가득 채워요.'], sources: [D_ICE] },
      { title: '단단한 각얼음', body: ['한 변이 2.5cm쯤 되는 단단한 각얼음을 써요. 셰이커와 믹싱 글라스, 마실 잔에 모두 써요.'], sources: [D_ICE] },
      { title: '섞을 때 쓴 얼음은 다시 쓰지 않기', body: ['셰이커나 믹싱 글라스에서 쓴 얼음은 걸러 내요.', '얼음을 넣어 마시는 잔에는 새 얼음을 넣어요.'], sources: [D_ICE, D_STIR] },
      { title: '잔을 미리 차갑게', body: ['마실 잔을 냉동실에 20~30분 넣어 둬요.', '냉동실을 쓸 수 없으면 잔에 얼음과 물을 채워 뒀다가 따르기 직전에 비워요.'], sources: [D_GLASS] },
      { title: '얼음 얼릴 물', body: ['수돗물의 염소 맛이 걸리면 정수한 물이나 생수로 얼려요.'], sources: [D_ICE] },
    ],
  },
  {
    id: 'garnish', group: 'cocktail', title: '가니시 준비',
    intro: '레시피 맨 아래 "가니시"에 적힌 말과 준비하는 방법이에요.',
    cards: [
      { title: '필, 제스트, 트위스트 (껍질)', body: ['모두 레몬이나 오렌지의 겉껍질 조각을 가리켜요. 레시피마다 섞어 써요.', '1. 껍질을 폭 1.2cm쯤으로 얇게 벗겨요. 흰 속껍질은 적게 남겨요.', '2. 색 있는 면이 음료를 향하게 잡고 잔 위에서 비틀어요.', '껍질에서 나오는 기름이 향을 더해요.'], sources: [D_ZEST, I_MARTINI] },
      { title: '웨지', body: ['과일을 반으로 자른 뒤 쐐기 모양으로 나눈 조각이에요.', '잔 가장자리에 꽂거나, 즙을 짜서 잔에 넣어요.'], sources: [I_CUBA] },
      { title: '슬라이스, 휠', body: ['과일을 가로로 얇게 썬 둥근 조각이에요.', '잔에 걸 때는 가운데에서 껍질 쪽으로 칼집을 내요.'], sources: [I_COLLINS, I_NEGRONI] },
      { title: '민트 스프링', body: ['잎이 붙어 있는 민트 줄기 끝이에요.', '손바닥에 올려 가볍게 친 뒤 잔에 꽂아요.'], sources: [iba('Mojito', 'mojito')] },
      { title: '소금 림, 설탕 림', body: ['1. 라임이나 오렌지 조각으로 잔 테두리의 바깥쪽만 적셔요.', '2. 접시에 편 소금이나 설탕에 테두리를 굴려요.', '잔 안쪽까지 묻히면 음료에 씻겨 들어가 짜져요.'], sources: [D_RIM, iba('Margarita', 'margarita')] },
      { title: '체리, 올리브, 칵테일 어니언', body: ['병에서 꺼내 픽에 꽂아 잔에 걸치거나 잔에 넣어요.'], sources: [iba('Manhattan', 'manhattan'), I_MARTINI] },
      { title: '넛맥', body: ['통 넛맥(육두구)을 강판에 갈아 완성한 음료 위에 뿌려요.'], sources: [iba('Alexander', 'alexander')] },
    ],
  },
  {
    id: 'syrup', group: 'cocktail', title: '시럽과 과즙 준비',
    intro: '설탕시럽은 레시피 44종에 들어가요. 시럽은 집에서 만들 수 있고, 레몬과 라임은 짜서 써요.',
    cards: [
      { title: '진한 시럽 (설탕 2 : 물 1)', body: ['1. 냄비에 물 1컵을 넣고 설탕 2컵을 넣어요. 컵으로 재는 부피 기준이에요.', '2. 약한 불에서 설탕이 다 녹을 때까지 저어요.', '3. 식힌 뒤 깨끗한 병에 담아 냉장고에 넣어요.', '냉장하면 6개월 동안 쓸 수 있어요.'], sources: [D_SYRUP] },
      { title: '기본 시럽 (설탕 1 : 물 1)', body: ['설탕과 물을 같은 부피로 넣고 설탕이 다 녹을 때까지 저어요.', '레시피에 적힌 "설탕시럽"이 어느 쪽인지 정해져 있지 않으면 이 비율로 만들어요. 진한 시럽은 더 달아서 양을 줄여 써요.'], sources: [D_SYRUP] },
      { title: '허니 시럽 (꿀 3 : 물 1)', body: ['꿀은 그대로 넣으면 잘 섞이지 않아서 물에 풀어 써요.', '1. 꿀을 담고, 꿀 무게의 3분의 1만큼 물을 넣어요.', '2. 따뜻한 물에 그릇째 담가 저어요. 40°C를 넘기지 않아요.', '3. 냉장고에 넣어요.', '며칠 안에 쓸 만큼만 만들어요.'], sources: [D('Honey & honey syrup', 'g/1109/honey-and-honey-syrup'), iba("Bee's Knees", 'bees-knees')] },
      { title: '그레나딘 (석류 시럽)', body: ['1. 냄비에 석류 주스 1컵을 넣고 설탕 2컵을 조금씩 넣으며 저어요.', '2. 끓지 않게 약한 불에서 설탕이 녹을 때까지 데워요.', '3. 식힌 뒤 걸러서 병에 담아 냉장고에 넣어요.', '냉장해도 1주일쯤 가요. 쓴 석류 주스의 기한도 확인해요.'], sources: [D('Pomegranate / Grenadine syrup', 'encyclopedia/29/cocktails/pomegranate-grenadine-syrup')] },
      { title: '레몬즙, 라임즙', body: ['과일을 흐르는 물에 씻은 뒤 반으로 잘라 짜요.', "America's Test Kitchen의 시음에서는 짜서 냉장고에 4시간 둔 즙을 넣은 잔을 더 좋아했어요. 6시간이 넘으면 쓴맛이 강해졌어요.", '그래서 마시기 직전에 짜도 되고, 몇 시간 전에 짜서 냉장고에 넣어 둬도 돼요. 6시간을 넘기지는 않아요.'], sources: [{ label: "America's Test Kitchen, When Fresh-Squeezed Isn't Best", url: 'https://www.americastestkitchen.com/how_tos/6429-when-fresh-squeezed-isnt-best' }, { label: '미국 FDA, Juice Safety', url: 'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-juice-safety' }] },
    ],
  },
  {
    id: 'egg', group: 'cocktail', title: '계란 흰자를 쓰는 잔',
    intro: '위스키 사워처럼 계란 흰자로 거품을 내는 잔이 있어요. 익히지 않고 쓰기 때문에 알아 둘 것이 있어요.',
    cards: [
      { title: '살균한 제품을 써요', body: ['익히지 않고 먹는 음식에는 살균 처리한 달걀이나 살균 난백 제품을 쓰라고 미국 FDA가 안내해요.', '한 잔에는 살균 난백 15ml면 충분해요.'], sources: [FDA_EGG, D_EGG] },
      { title: '피해야 하는 사람', body: ['어린이, 고령자, 임신부, 면역력이 약한 사람은 살모넬라에 감염되면 더 심하게 앓을 수 있어요.', '이런 경우에는 날계란이 든 잔을 피해요.'], sources: [FDA_EGG] },
      { title: '술이 균을 죽이지는 않아요', body: ['칵테일에 들어가는 술의 도수로는 살모넬라를 죽이지 못해요.'], sources: [D_EGG] },
      { title: '달걀을 만진 뒤', body: ['식품의약품안전처는 달걀을 살 때부터 조리할 때까지 단계마다 위생 수칙을 지키라고 안내해요.'], sources: [MFDS_EGG] },
      { title: '흰자는 빼도 돼요', body: ['국제바텐더협회(IBA) 위스키 사워는 계란 흰자를 "선택"으로 적어요. 넣지 않아도 위스키 사워예요.'], sources: [I_SOUR] },
    ],
  },
  {
    id: 'families', group: 'cocktail', title: '칵테일의 기본 구조 6가지',
    intro: '칵테일 대부분은 몇 가지 뼈대에서 재료를 바꾼 것이에요. 비율은 국제바텐더협회(IBA) 공식 레시피의 값이에요.',
    cards: [
      { title: '사워', body: ['술 + 신맛(레몬·라임즙) + 단맛이에요.', '위스키 사워는 버번 45ml, 레몬즙 25ml, 설탕시럽 20ml예요.', '다이키리, 마르가리타도 같은 구조예요.'], sources: [I_SOUR, iba('Daiquiri', 'daiquiri'), iba('Margarita', 'margarita')] },
      { title: '하이볼', body: ['술에 탄산음료를 길게 부은 잔이에요.', '호스 넥은 코냑 40ml에 진저에일 120ml예요.', '쿠바 리브레도 같은 구조예요.'], sources: [iba("Horse's Neck", 'horses-neck'), I_CUBA] },
      { title: '올드 패션드', body: ['술 + 설탕 + 비터예요.', '위스키 45ml에 각설탕 1개, 비터와 물을 조금 넣어요.'], sources: [I_OF] },
      { title: '마티니, 맨해튼', body: ['술 + 베르무트예요.', '드라이 마티니는 진 60ml에 드라이 베르무트 10ml예요.', '맨해튼은 라이 위스키 50ml에 스위트 베르무트 20ml예요.'], sources: [I_MARTINI, iba('Manhattan', 'manhattan')] },
      { title: '콜린스, 피즈', body: ['사워에 탄산수를 더한 잔이에요.', '존 콜린스는 진 45ml, 레몬즙 30ml, 설탕시럽 15ml, 탄산수 60ml예요.'], sources: [I_COLLINS, I_FIZZ] },
      { title: '네그로니', body: ['술 + 쓴맛 나는 술 + 스위트 베르무트예요.', '네그로니는 진, 캄파리, 스위트 베르무트를 30ml씩 같은 양으로 넣어요.'], sources: [I_NEGRONI] },
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
    id: 'myths-cocktail', group: 'cocktail', title: '칵테일에 대한 오해 10가지',
    intro: '칵테일을 처음 만들 때 흔히 듣는 말 가운데 사실과 다른 것들이에요.',
    cards: [
      { title: '셰이크와 스터', myth: '셰이크와 스터는 결과가 같아요', body: ['셰이크는 얼음과 재료를 세게 흔들어 공기를 넣어요. 빨리 차가워지고 질감이 가벼워지며 색이 흐려져요. 스터는 베이스 술과 베르무트처럼 맑은 재료를 투명하고 매끄럽게 섞을 때 써요.'],
        sources: [{ label: "Difford's Guide (Dry Martini)", url: 'https://www.diffordsguide.com/g/1121/martini/how-to-make-a-dry-martini' }, { label: "Difford's Guide (Basic Techniques)", url: 'https://www.diffordsguide.com/g/1150/how-to-make-cocktails/basic-techniques' }] },
      { title: '얼음', myth: '칵테일 얼음은 차갑기만 하면 아무거나 써도 돼요', body: ['얼음의 크기와 모양에 따라 녹는 물의 양이 달라져요. 큰 얼음은 표면적이 작아 천천히 녹고 차가운 온도를 오래 유지해요. 물이 알맞게 섞이면 알코올 자극이 줄고 맛이 어우러져요.'],
        sources: [{ label: "Difford's Guide (Added Water & Ice)", url: 'https://www.diffordsguide.com/encyclopedia/3711/cocktails/some-cocktails-benefit-from-added-water' }] },
      { title: '셰이커', myth: '셰이커가 없으면 칵테일을 못 만들어요', body: ['쿠바 리브레는 얼음을 채운 잔에 재료를 바로 부어서 만들어요. 존 콜린스도 잔에 바로 붓고 가볍게 저어요.'], sources: [I_CUBA, I_COLLINS] },
      { title: '흔드는 시간', myth: '오래 흔들수록 더 차가워져요', body: ['12초쯤 흔들면 얼음과 음료의 온도가 더 내려가지 않는 상태가 돼요. 그 뒤로는 더 흔들어도 거의 달라지지 않아요.'], sources: [D_SHAKETIPS] },
      { title: '얼음의 양', myth: '얼음을 조금만 넣어야 싱거워지지 않아요', body: ['얼음을 넣어 마시는 잔에는 몇 조각만 넣지 말고 가득 채워요.'], sources: [D_ICE] },
      { title: '쓴 얼음', myth: '셰이커에 넣었던 얼음을 잔에 그대로 따라도 돼요', body: ['섞을 때 쓴 얼음은 걸러 내요. 얼음을 넣어 마시는 잔에는 새 얼음을 넣어요.'], sources: [D_ICE, D_STIR] },
      { title: '마티니', myth: '마티니는 흔들어서 만들어야 해요', body: ['영화 대사로 유명해졌지만 바텐더들은 마티니를 저어서 만들어요. 국제바텐더협회(IBA) 레시피도 믹싱 글라스에서 저으라고 적어요.'], sources: [D_MARTINI, I_MARTINI] },
      { title: '탄산', myth: '탄산수도 셰이커에 같이 넣고 흔들어요', body: ['진 피즈는 탄산수를 뺀 재료만 얼음과 흔들어요. 잔에 따른 뒤에 탄산수를 부어요.'], sources: [I_FIZZ] },
      { title: '날계란', myth: '술의 알코올이 날계란의 균을 죽여 줘요', body: ['칵테일에 들어가는 술의 도수로는 살모넬라를 죽이지 못해요. 익히지 않고 쓸 때는 살균한 달걀이나 살균 난백을 써요.'], sources: [D_EGG, FDA_EGG] },
      { title: '레몬 껍질', myth: '레몬 껍질은 보기 좋으라고 올려요', body: ['껍질을 비틀면 향이 나는 기름이 나와요. 드라이 마티니 레시피는 레몬 껍질의 기름을 음료 위에 짜라고 적어요.'], sources: [I_MARTINI, D_ZEST] },
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

/** 레시피 상세의 "만드는 법"에 보여 줄 순서 — '만드는 방법' 장의 같은 내용을 방법 키로 찾는다 */
const METHOD_CARD: Record<string, string> = {
  build: '빌드', stir: '스터', shake: '셰이크', muddle: '머들', float: '플로트', layer: '레이어', blend: '블렌드', swizzle: '스위즐',
};
export function methodSteps(key: string): string[] {
  const word = METHOD_CARD[key];
  const card = word ? guideById('methods').cards.find((c) => c.title.startsWith(word)) : undefined;
  return card ? card.body.filter((t) => /^\d\./.test(t)) : [];
}
