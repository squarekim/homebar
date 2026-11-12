/**
 * rewordRecipeText.mjs — 레시피 설명·변형·출처와 간단 조합 메모의 문구 교정 (정제 10단계, 2026-11-12).
 *
 * 재료·분량·조주법·출처 URL 은 건드리지 않는다. 바꾸는 것은 화면에 그대로 나오는 글뿐이다.
 *  1. note: 바로 위 재료 칸을 문장으로 다시 읽은 메모와, 재료 이름만 되풀이한 맛 설명을 지운다.
 *     남길 사실이 있는 것은 그 사실만 남겨 고쳐 쓴다(NOTES 표: null = 삭제, 문자열 = 교체).
 *  2. v: '치환형·대입·파생형·등량' 같은 개조식을 "무엇을 무엇으로 바꿨는지" 풀어 쓴 해요체로(VARIANTS 표, 42종 전부).
 *  3. s: 출처가 아닌 '클래식 레시피' 표기와 커뮤니티 출처 표기(루리웹·디시·마실랭·나무위키·만개의레시피·'커뮤니티 표준')를 지운다.
 *     출처 URL(u)은 그대로 둔다.
 *  4. 똑같은 레시피가 두 이름으로 들어 있던 '블루 마르가리타 (진)'을 지운다('블루 마르가리타 (진 버전)'이 남는다).
 *  5. mixers: 메모를 해요체로 고치고, 원래 주인의 재고 메모("1L 보유", "★… 상시 확보로 가능")를 지운다.
 *     '스크루드라이버'는 레시피 이름과 같은 표기('스크류드라이버')로 맞춰 간단 조합에 두 번 나오지 않게 한다.
 * 끝으로 재료별 사용 레시피 수(q)를 다시 센다.
 *
 * 원본 seed.ts 는 손으로 고치지 않는다. 이 스크립트로만 변환한다. 여러 번 돌려도 결과가 같다.
 * 사용: node scripts/rewordRecipeText.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/seed.ts');

/** 레시피 이름 → 새 메모. null 은 삭제 */
export const NOTES = {
  // 재료 칸과 같은 내용
  '페이퍼 플레인': null, '비외 카레': null, '버번 피치 티': null, '블루버드': null, '네그로니': null,
  '콥스 리바이버 #2': null, '행키 팽키': null, '라스트 워드': null, '몽키 글랜드': null, '아쿠아 벨바': null,
  '윈덱스 마티니': null, '머디 슬라이드': null, '블러디 메리': null, '러시안 스프링 펀치': null,
  '비트윈 더 시츠': null, '마이 타이': null, '좀비': null, '미셔너리스 다운폴': null, '돈스 스페셜 다이키리': null,
  '엘 디아블로': null, '토미스 마르가리타': null, '일리걸': null, '사이드카': null, '알렉산더': null,
  '포르토 플립': null, '재패니즈 슬리퍼': null, 'B&B': null, '퍼지 네이블': null, '오르가즘': null,
  '미모사': null, '아이리시 커피': null, '그래스호퍼': null, '로즈': null, '골든 드림': null,
  '스파이시 피프티': null, '롱 아일랜드 아이스티': null, '캄파리 자몽 토닉': null, '미도리 스플래시': null,
  '준벅': null, 'B-52': null, '화이트 러시안': null, '비터 하이볼': null, '아마레토 마르가리타': null,
  // 재료 이름만 되풀이한 맛 설명
  '시나몬 올드 패션드': null, '피넛버터 & 아마레토': null, '테네시 사워': null, '기원 올드 패션드': null,
  '기원 사워': null, '프렌치 김렛': null, '블루 마르가리타 (진 버전)': null, '브랜디 사워': null,
  '엔조니': null, '생제르맹 하이볼': null, '밀라노 토닉': null, '드람부이 콜린스': null,
  '토스티드 아몬드': null, '뱀파이로': null,
  // 사실만 남겨 고쳐 씀
  '페니실린': '아일라 싱글몰트는 섞지 않고 마지막에 위에 띄워요.',
  '피넛버터 카카오': '땅콩버터 초콜릿 과자 같은 맛이 나요.',
  '키르': '원래는 부르고뉴의 알리고테 화이트 와인으로 만들어요.',
  '스프리츠': '베네치아에서 식사 전에 마시는 잔이에요.',
  '더티 마티니': '2020년에 IBA 목록에서 빠진 예전 레시피예요.',
  '페르난디토': '아르헨티나에서 널리 마시는 잔이에요.',
  '카시스 오렌지': '일본 이자카야에서 흔히 내는 방식이에요.',
  '가리발디': '갓 짠 오렌지 주스를 거품이 일 만큼 가볍게 만들어 써요.',
  '클로버 클럽': '라즈베리 시럽 대신 석류로 만든 그레나딘을 쓰면 같은 맛이 나지 않아요.',
  '마르가리타': 'IBA는 100% 아가베 데킬라로 정해 두었고, 같은 상표라도 등급에 따라 다른 원료를 섞은 제품이 있으니 라벨을 확인하세요.',
  '피치 크러시': '크랜베리 주스의 양은 입맛에 맞게 조절하세요.',
  '갓파더 (아마레토)': '아마레토와 위스키의 비율은 1:3에서 1:2 사이로 입맛에 맞게 조절하세요.',
};

/** 변형 설명 — v 가 있는 레시피는 모두 여기 있어야 한다(빠지면 오류) */
export const VARIANTS = {
  '위스키 콜린스': '존 콜린스의 진을 버번으로 바꿨어요. IBA 목록에는 없어요.',
  '싱글몰트 사워': '위스키 사워를 싱글몰트로 만들었어요.',
  '몬테 카를로': '올드 패션드의 설탕을 베네딕틴으로 바꿨어요.',
  '팬시 프리': '올드 패션드의 설탕을 마라스키노로 바꿨어요.',
  '시나몬 올드 패션드': '올드 패션드에 시나몬 리큐르를 넣었어요.',
  '피넛버터 올드 패션드': '올드 패션드를 피넛버터 위스키로 만들었어요.',
  '테네시 사워': '위스키 사워와 비율이 같고, 테네시 위스키(잭 다니엘스)로 만들어요.',
  '기원 올드 패션드': '올드 패션드와 비율이 같고, 한국 싱글몰트로 만들어요.',
  '기원 사워': '위스키 사워와 비율이 같고, 한국 싱글몰트로 만들어요.',
  '불바디에': '네그로니와 달리 세 재료의 양이 같지 않아요.',
  '뉴욕 사워': '위스키 사워 위에 드라이 레드 와인(시라즈나 말벡)을 띄웠어요.',
  '페이퍼 플레인': '라스트 워드에서 갈라져 나온 칵테일이에요.',
  '블루버드': '진 벅, 진 리키와 같은 계열이고 블루 큐라소로 파란색을 내요.',
  '프렌치 김렛': '김렛의 시럽을 엘더플라워 리큐르(생제르맹)로 바꿨어요.',
  '블루 마르가리타 (진 버전)': '블루 마르가리타의 데킬라를 진으로 바꿨어요.',
  '톰 콜린스': '존 콜린스와 비율이 같고 진 종류만 달라요.',
  '보드카 콜린스': '존 콜린스와 비율이 같아요.',
  '갓마더': '갓파더의 위스키를 보드카로 바꿨어요. 두 재료를 같은 양으로 넣어요.',
  '우우': '섹스 온 더 비치에서 오렌지 주스를 뺐어요.',
  '보드카 선라이즈': '테킬라 선라이즈의 데킬라를 보드카로 바꿨어요.',
  '초콜릿 러시안': '블랙 러시안의 커피 리큐르를 크렘 드 카카오로 바꿨어요.',
  '머디 슬라이드': 'B-52의 그랑 마르니에를 보드카로 바꿨어요.',
  '화이트 러시안': '블랙 러시안 위에 생크림을 띄웠어요.',
  '럼 콜린스': '존 콜린스와 비율이 같아요.',
  '바카디 칵테일': '다이키리와 거의 같고, 설탕시럽 대신 그레나딘을 써요.',
  '럼 선라이즈': '테킬라 선라이즈의 데킬라를 럼으로 바꿨어요.',
  '블루 하와이안': '블루 하와이와 달리 코코넛 크림을 넣고 얼음과 함께 갈아요. 파란색 피나 콜라다에 가까워요.',
  '블루 마르가리타': '마르가리타의 트리플 섹을 블루 큐라소로 바꿔 파란색을 냈어요.',
  '아마레토 마르가리타': '마르가리타의 트리플 섹을 아마레토(디사론노)로 바꿨어요.',
  '그랜드 마르가리타': '마르가리타의 트리플 섹을 그랑 마르니에로 바꿨어요.',
  '토미스 마르가리타': '마르가리타의 트리플 섹을 아가베 시럽으로 바꿨어요.',
  '브랜디 사워': '위스키 사워와 비율이 같고, 브랜디로 만들어요.',
  '사이드카': '화이트 레이디의 진을 코냑으로 바꾼 것과 같아요.',
  '프렌치 커넥션': '갓파더의 위스키를 코냑으로 바꿨어요. 코냑과 아마레토를 같은 양으로 넣어요.',
  '갓파더 (아마레토)': '예전 IBA 갓파더는 두 재료를 35ml씩 넣었어요. 이 레시피는 위스키를 3배 넣어요.',
  '엔조니': '네그로니의 베르무트를 레몬즙과 시럽으로 바꿨어요.',
  '아마레토 콜린스': '존 콜린스와 비율이 같아요.',
  '캄파리 오렌지': '가리발디를 간단하게 만든 잔이에요.',
  '드람부이 콜린스': '존 콜린스와 비율이 같아요.',
  '스크리밍 오르가즘': '오르가즘에 보드카를 더했어요.',
  'B-52 (트리플섹 버전)': 'B-52의 그랑 마르니에를 트리플 섹으로 바꿨어요.',
};

/** 같은 레시피가 두 이름으로 들어 있던 것 */
const DUPLICATES = ['블루 마르가리타 (진)'];
/** 출처가 아닌 표기 */
const EMPTY_SOURCES = ['클래식 레시피'];
/** 커뮤니티 출처 표기 — 표기 전체를 지운다. 다른 출처와 함께 적힌 것은 SOURCE_REWRITES 로 그 부분만 뺀다 */
const COMMUNITY = /루리웹|디시|마실랭|나무위키|만개의레시피|커뮤니티/;
const SOURCE_REWRITES = { '린치버그 레모네이드': "Jack Daniel's 시그니처 칵테일 (린치버그=증류소 소재지)" };

/** 간단 조합 메모 — 키는 '이름|기주'. null 은 삭제(원래 주인의 재고 메모) */
export const MIXER_NOTES = {
  '위스키 하이볼|스카치 블렌디드': '토닉워터로도 만들 수 있어요.',
  '진저 하이볼|스카치 블렌디드': '진저에일의 단맛이 더해져요. 피트가 약한 블렌디드에 잘 맞아요.',
  '가쿠 하이볼|산토리 가쿠빈': '제조사가 권하는 비율이에요.',
  '버번 콕|버번': '웰러, 메이커스 마크 같은 밀 버번이 콜라와 잘 맞아요.',
  '잭콕|잭 다니엘스': '가장 널리 쓰는 조합이에요.',
  'CS 하이볼|글렌알라키 CS': '도수가 58.6%라서 위스키를 30ml로 줄이고 비율은 그대로 맞춰요.',
  '피넛버터 밀크|올레 스모키 피넛버터': '도수 30%인 가향 위스키라 디저트처럼 마셔요.',
  '진 소다|봄베이/고든스/부자 진': '라임 웨지를 더하면 진 리키가 돼요.',
  '진 그레이프프루트|봄베이/고든스/부자 진': '진과 자몽의 쓴맛이 서로 잘 맞아요.',
  '스크류드라이버|커클랜드 보드카': 'IBA 공식 레시피가 따로 있어요.',
  '그레이하운드|커클랜드 보드카': '잔 테두리에 소금을 묻히면 솔티 독이 돼요.',
  '보드카 애플|커클랜드 보드카': null,
  '럼 콕|바카디 카르타 블랑카': '라임즙을 더하면 쿠바 리브레가 돼요.',
  '말리부 파인애플|말리부': null,
  '말리부 오렌지|말리부': '말리부가 21%로 도수가 낮아서 길게 마시기 좋아요.',
  '테킬라 오렌지|호세 쿠엘보 골드': '그레나딘을 가라앉히면 테킬라 선라이즈가 돼요.',
  '팔로마 근사|호세 쿠엘보 골드': '원래 팔로마는 자몽 소다를 써요. 자몽 주스에 탄산수를 섞으면 비슷해져요.',
  '브랜디 진저|디어골드/리처드 XO': 'XO의 오크 향과 생강이 잘 맞아요.',
  '깔루아 밀크|깔루아': null,
  '베일리스 밀크|베일리스': '베일리스가 이미 크림 리큐르라서 우유는 조금만 넣어요.',
  '가리발디|캄파리': '오렌지 주스를 세게 휘저어 거품을 내면 질감이 살아나요.',
  '미도리 파인|미도리': null,
  '퍼지 네이블|드 카이퍼 피치트리': '피치 슈납스가 15%라서 도수가 낮아요.',
  '카시스 소다|드 카이퍼 크렘 드 카시스': '크렘 드 카시스가 15%라서 가장 가벼운 조합이에요.',
  '엘더플라워 소다|생제르맹': '화이트 와인을 더하면 생제르맹 스프리츠가 돼요.',
  '그린티 밀크|산토리 그린티': '말차 라떼 같은 맛이에요.',
  '아마레토 콕|디사론노': '아몬드 향과 콜라의 바닐라 향이 겹쳐요.',
};
const MIXER_RENAMES = { '스크루드라이버': '스크류드라이버' };

function setOrDelete(obj, key, value) {
  if (value === null || value === '') { if (key in obj) { delete obj[key]; return true; } return false; }
  if (obj[key] === value) return false;
  obj[key] = value; return true;
}

export function reword({ dry = false } = {}) {
  const text = readFileSync(SEED, 'utf8');
  const marker = 'export const SEED: RawData = ';
  const start = text.indexOf(marker) + marker.length;
  const head = text.slice(0, start);
  const tail = text.slice(start).match(/(\s*as\s+RawData\s*;?\s*)$/)?.[1] ?? ' as RawData;\n';
  const data = JSON.parse(text.slice(start).replace(/\s*as\s+RawData\s*;?\s*$/, ''));
  const changed = { notes: 0, variants: 0, sources: 0, removed: 0, mixers: 0 };

  const before = data.recipes.length;
  data.recipes = data.recipes.filter((r) => !DUPLICATES.includes(r.n));
  changed.removed = before - data.recipes.length;

  const names = new Set(data.recipes.map((r) => r.n));
  const unknown = [...Object.keys(NOTES), ...Object.keys(VARIANTS)].filter((n) => !names.has(n));
  if (unknown.length) throw new Error(`표에 있는데 seed 에 없는 레시피: ${unknown.join(', ')}`);

  for (const r of data.recipes) {
    if (r.n in NOTES && setOrDelete(r, 'note', NOTES[r.n])) changed.notes++;
    if (r.v) {
      const next = VARIANTS[r.n];
      if (!next) throw new Error(`변형 설명이 표에 없음: ${r.n}`);
      if (r.v[1] !== next) { r.v = [r.v[0], next]; changed.variants++; }
    }
    if (r.s && SOURCE_REWRITES[r.n] && r.s !== SOURCE_REWRITES[r.n]) { r.s = SOURCE_REWRITES[r.n]; changed.sources++; }
    else if (r.s && (EMPTY_SOURCES.includes(r.s) || COMMUNITY.test(r.s))) { delete r.s; changed.sources++; }
  }

  for (const m of data.mixers) {
    let touched = false;
    if (MIXER_RENAMES[m.ko]) { m.ko = MIXER_RENAMES[m.ko]; touched = true; }
    const key = `${m.ko}|${m.base}`;
    if (key in MIXER_NOTES) {
      const next = MIXER_NOTES[key] ?? '';
      if ((m.note ?? '') !== next) { m.note = next; touched = true; }
    } else if (m.note) throw new Error(`간단 조합 메모가 표에 없음: ${key}`);
    if (touched) changed.mixers++;
  }

  const count = new Map();
  for (const r of data.recipes) for (const n of new Set(r.i.map(([x]) => x))) count.set(n, (count.get(n) ?? 0) + 1);
  for (const ing of data.ings) ing.q = count.get(ing.n) ?? 0;

  const total = Object.values(changed).reduce((a, b) => a + b, 0);
  if (!dry && total) writeFileSync(SEED, `${head}${JSON.stringify(data)}${tail}`);
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(reword({ dry: process.argv.includes('--dry') }));
}
