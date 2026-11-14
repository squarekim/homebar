/**
 * addEnglishNames.mjs — 레시피마다 영문명(en)을 붙인다.
 * IBA 등재 칵테일은 IBA 공식 표기, 그 외 클래식은 Difford's Guide·Punch 등 통용 표기를 따른다.
 * 국내 창작·하우스 레시피(동해·도화·옥보단 등)는 통용 영문명이 없어 로마자로 적는다.
 * 원본 seed.ts 는 손으로 고치지 않는다. 사용: node scripts/addEnglishNames.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

export const EN = {
  '올드 패션드': 'Old Fashioned', '위스키 사워': 'Whiskey Sour', '러스티 네일': 'Rusty Nail', '갓파더': 'Godfather',
  '위스키 하이볼': 'Whisky Highball', '위스키 콜린스': 'Whiskey Collins', '뉴욕': 'New York',
  '글렌알라키 CS 하이볼': 'GlenAllachie Cask Strength Highball', '기원 하이볼': 'Ki One Highball',
  '싱글몰트 사워': 'Single Malt Sour', '몬테 카를로': 'Monte Carlo', '팬시 프리': 'Fancy Free',
  '버번 리뉴얼': 'Bourbon Renewal', '시나몬 올드 패션드': 'Cinnamon Old Fashioned',
  '피넛버터 올드 패션드': 'Peanut Butter Old Fashioned', '피넛버터 & 아마레토': 'Peanut Butter & Amaretto',
  '피넛버터 카카오': 'Peanut Butter Cacao', '린치버그 레모네이드': 'Lynchburg Lemonade', '테네시 사워': 'Tennessee Sour',
  '기원 올드 패션드': 'Ki One Old Fashioned', '기원 사워': 'Ki One Sour', '맨해튼': 'Manhattan', '불바디에': 'Boulevardier',
  '위스키 애플': 'Whisky Apple', '롭 로이': 'Rob Roy', '민트 줄립': 'Mint Julep', '페니실린': 'Penicillin',
  '뉴욕 사워': 'New York Sour', '페이퍼 플레인': 'Paper Plane', '리멤버 더 메인': 'Remember the Maine',
  '비외 카레': 'Vieux Carré', '트리니다드 사워': 'Trinidad Sour', '버번 피치 티': 'Bourbon Peach Tea',
  '위스키 스매시': 'Whiskey Smash', '김렛': 'Gimlet', '존 콜린스': 'John Collins', '화이트 레이디': 'White Lady',
  '핑크 레이디': 'Pink Lady', '진 벅': 'Gin Buck', '진 리키': 'Gin Rickey', '진 피즈': 'Gin Fizz', '플로라도라': 'Floradora',
  '오렌지 블로섬': 'Orange Blossom', '블루버드': 'Bluebird', '프렌치 김렛': 'French Gimlet',
  '블루 마르가리타 (진 버전)': 'Blue Margarita (Gin)', '네그로니': 'Negroni', '마티니 (드라이 마티니)': 'Dry Martini',
  '톰 콜린스': 'Tom Collins', '브롱스': 'Bronx', '프렌치 75': 'French 75', '파라다이스': 'Paradise',
  '애비 칵테일': 'Abbey Cocktail', '비쥬': 'Bijou', '카지노': 'Casino', '브램블': 'Bramble', '앤젤 페이스': 'Angel Face',
  '애비에이션': 'Aviation', '비즈 니즈': "Bee's Knees", '카디날레': 'Cardinale', '클로버 클럽': 'Clover Club',
  '콥스 리바이버 #2': 'Corpse Reviver #2', '진 바질 스매시': 'Gin Basil Smash', '행키 팽키': 'Hanky Panky',
  '라스트 워드': 'Last Word', '마르티네즈': 'Martinez', '몽키 글랜드': 'Monkey Gland', '라모스 피즈': 'Ramos Gin Fizz',
  '싱가포르 슬링': 'Singapore Sling', '사우스 사이드': 'Southside', '턱시도': 'Tuxedo', '베스퍼': 'Vesper',
  '깁슨': 'Gibson', '아쿠아 벨바': 'Aqua Velva', '스크류드라이버': 'Screwdriver', '보드카 콜린스': 'Vodka Collins',
  '카미카제': 'Kamikaze', '갓마더': 'Godmother', '블루 라군': 'Blue Lagoon', '레몬 드롭 마티니': 'Lemon Drop Martini',
  '멜론 볼': 'Melon Ball', '우우': 'Woo Woo', '섹스 온 더 비치': 'Sex on the Beach', '보드카 선라이즈': 'Vodka Sunrise',
  '매드래스': 'Madras', '보드카 하이볼': 'Vodka Highball', '치치': 'Chi-Chi', '엘더플라워 사워': 'Elderflower Sour',
  '초콜릿 러시안': 'Chocolate Russian', '페퍼민트 패티': 'Peppermint Patty', '윈덱스 마티니': 'Windex Martini',
  '머디 슬라이드': 'Mudslide', '마인드 이레이저': 'Mind Eraser', '딥 블루 씨': 'Deep Blue Sea',
  '헤어리 네이블': 'Hairy Navel', '코스모폴리탄': 'Cosmopolitan', '모스코 뮬': 'Moscow Mule', '블랙 러시안': 'Black Russian',
  '씨 브리즈': 'Sea Breeze', '에스프레소 마티니': 'Espresso Martini', '블러디 메리': 'Bloody Mary',
  '하비 월뱅어': 'Harvey Wallbanger', '러시안 스프링 펀치': 'Russian Spring Punch', '더티 마티니': 'Dirty Martini',
  '화이트 러시안': 'White Russian', '에스프레소 마티니 (라이트)': 'Espresso Martini (Light)', '동해': 'Donghae',
  '아쿠아 마린': 'Aquamarine', '전기 레모네이드': 'Electric Lemonade', '쿠바 리브레': 'Cuba Libre',
  '럼 콜린스': 'Rum Collins', '바카디 칵테일': 'Bacardi Cocktail', '네이비 그로그': 'Navy Grog',
  '럼 선라이즈': 'Rum Sunrise', '다이키리': 'Daiquiri', '비트윈 더 시츠': 'Between the Sheets',
  '엘 프레지덴테': 'El Presidente', '메리 픽포드': 'Mary Pickford', '모히토': 'Mojito', '피나 콜라다': 'Piña Colada',
  '마이 타이': 'Mai Tai', '좀비': 'Zombie', '헤밍웨이 스페셜': 'Hemingway Special', '플랜터즈 펀치': "Planter's Punch",
  '카이피리냐': 'Caipirinha', '다크 앤 스토미': "Dark 'n' Stormy", '정글 버드': 'Jungle Bird', '올드 쿠반': 'Old Cuban',
  '미셔너리스 다운폴': "Missionary's Downfall", '돈스 스페셜 다이키리': "Don's Special Daiquiri",
  '블루 하와이': 'Blue Hawaii', '블루 하와이안': 'Blue Hawaiian', '테킬라 선라이즈': 'Tequila Sunrise',
  '블루 마르가리타': 'Blue Margarita', '엘 디아블로': 'El Diablo', '아마레토 마르가리타': 'Amaretto Margarita',
  '마르가리타': 'Margarita', '그랜드 마르가리타': 'Grand Margarita', '로시타': 'Rosita', '팔로마': 'Paloma',
  '토미스 마르가리타': "Tommy's Margarita", '뱀파이로': 'Vampiro', '일리걸': 'Illegal', '브랜디 사워': 'Brandy Sour',
  '스팅어': 'Stinger', '사이드카': 'Sidecar', '브랜디 크러스타': 'Brandy Crusta', '프렌치 커넥션': 'French Connection',
  '사제락': 'Sazerac', '알렉산더': 'Alexander', '포르토 플립': 'Porto Flip', '피스코 사워': 'Pisco Sour',
  '베.엔.토': 'VE.N.TO', '아마레또 사워': 'Amaretto Sour', '가리발디': 'Garibaldi', '미도리 사워': 'Midori Sour',
  '피치 크러시': 'Peach Crush', '아마레토 스톤 사워': 'Amaretto Stone Sour',
  '카시스 오렌지': 'Cassis Orange', '엔조니': 'Enzoni', '비터 하이볼': 'Bitter Highball',
  '재패니즈 슬리퍼': 'Japanese Slipper', 'B&B': 'B&B', '생제르맹 하이볼': 'St-Germain Highball',
  '퍼지 네이블': 'Fuzzy Navel', '아마레토 콜린스': 'Amaretto Collins', '밀라노 토닉': 'Milano Tonic',
  '캄파리 오렌지': 'Campari Orange', '드람부이 콜린스': 'Drambuie Collins', '오르가즘': 'Orgasm',
  '스크리밍 오르가즘': 'Screaming Orgasm', '젤리피시': 'Jellyfish', 'B-52 (트리플섹 버전)': 'B-52 (Triple Sec)',
  '피치 밀크': 'Peach Milk', 'B-52': 'B-52', '아메리카노': 'Americano', '미모사': 'Mimosa', '벨리니': 'Bellini',
  '키르': 'Kir', '아이리시 커피': 'Irish Coffee', '그래스호퍼': 'Grasshopper', '로즈': 'Rose', '스프리츠': 'Spritz',
  '골든 드림': 'Golden Dream', '프렌치 마르티니': 'French Martini', '스파이시 피프티': 'Spicy Fifty',
  '페르난디토': 'Fernandito', '라보 데 갈로': 'Rabo de Galo', '칸찬차라': 'Canchánchara',
  '샤르트뢰즈 스위즐': 'Chartreuse Swizzle', 'IBA 티키': 'IBA Tiki', '샴페인 칵테일': 'Champagne Cocktail',
  '미도리 일루젼': 'Midori Illusion', '준벅': 'June Bug', '토스티드 아몬드': 'Toasted Almond',
  '캄파리 자몽 토닉': 'Campari Grapefruit Tonic', '미도리 스플래시': 'Midori Splash', '도화': 'Dohwa',
  '옥보단': 'Okbodan', '롱 아일랜드 아이스티': 'Long Island Iced Tea', '호스스 넥': "Horse's Neck",
  '네이키드 앤 페이머스': 'Naked and Famous', '피스코 펀치': 'Pisco Punch', '포른 스타 마티니': 'Porn Star Martini',
  '셰리 코블러': 'Sherry Cobbler', '서퍼링 바스터드': 'Suffering Bastard', '스리 도츠 앤 어 대시': 'Three Dots and a Dash',
  '티퍼레리': 'Tipperary', '버번 콕': 'Bourbon & Coke', '잭콕': 'Jack & Coke', '진 토닉': 'Gin & Tonic',
  '진 소다': 'Gin & Soda', '보드카 토닉': 'Vodka Tonic', '럼 콕': 'Rum & Coke', '말리부 오렌지': 'Malibu Orange',
  '테킬라 오렌지': 'Tequila Orange', '미도리 소다': 'Midori Soda', '카시스 소다': 'Cassis Soda',
  '엘더플라워 소다': 'Elderflower Soda', '아마레토 콕': 'Amaretto & Coke',
};

export function addEnglishNames({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const missing = [];
  let changed = 0;
  for (const r of data.recipes) {
    const en = EN[r.n];
    if (!en) { missing.push(r.n); continue; }
    if (r.en !== en) { r.en = en; changed++; }
  }
  if (!dry && changed) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return { changed, missing };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(addEnglishNames({ dry: process.argv.includes('--dry') }));
}
