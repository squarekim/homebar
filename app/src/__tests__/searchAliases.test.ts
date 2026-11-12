import { describe, expect, it } from 'vitest';
import { cocktails } from '../data/adapters';
import { simpleBuilds } from '../services/simpleBuildService';
import { searchLiquor } from '../services/liquorSearchService';
import { LIQUOR_ALIASES } from '../data/liquorAliases';
import { liquorMasterById } from '../data/liquorMaster';
import { COCKTAIL_ALIASES, INGREDIENT_ALIASES, SIMPLE_ALIASES } from '../data/searchAliases';
import { hits, normalize, hitsKey, cocktailKey, simpleKey } from '../ui/listUtils';
import { ingredients } from '../data/adapters';

const ck = (q: string) => cocktails.filter((c) => hitsKey(normalize(q), cocktailKey(c))).map((c) => c.name);
const sb = (q: string) => simpleBuilds().filter((b) => hitsKey(normalize(q), simpleKey(b))).map((b) => b.name);
const top = (q: string, n = 3) => searchLiquor(q, { limit: n }).map((h) => h.item.nameKo);

describe('칵테일을 다른 이름으로 찾는다', () => {
  const cases: Array<[string, string]> = [
    ['모히또', '모히토'], ['mojito', '모히토'], ['마가리타', '마르가리타'], ['margarita', '마르가리타'],
    ['맨하탄', '맨해튼'], ['올드패션', '올드 패션드'], ['old fashioned', '올드 패션드'], ['대부', '갓파더'],
    ['김릿', '김렛'], ['기믈렛', '김렛'], ['코스모', '코스모폴리탄'], ['롱티', '롱 아일랜드 아이스티'],
    ['모스크바 뮬', '모스코 뮬'], ['moscow mule', '모스코 뮬'], ['블러디 마리', '블러디 메리'], ['섹온비', '섹스 온 더 비치'],
    ['피냐콜라다', '피나 콜라다'], ['다이커리', '다이키리'], ['위스키 샤워', '위스키 사워'], ['아마레또 사워', '아마레또 사워'],
    ['아페롤 스프리츠', '스프리츠'], ['스프리처', '스프리츠'], ['민트 쥴렙', '민트 줄립'], ['사즈락', '사제락'],
    ['카시오렌', '카시스 오렌지'], ['럼콕', '쿠바 리브레'], ['드라이 마티니', '마티니 (드라이 마티니)'], ['last word', '라스트 워드'],
    ['corpse reviver', '콥스 리바이버 #2'], ['아이리쉬 커피', '아이리시 커피'], ['그라스호퍼', '그래스호퍼'], ['데킬라 선라이즈', '테킬라 선라이즈'],
    ['스크루드라이버', '스크류드라이버'], ['가미카제', '카미카제'], ['b52', 'B-52'],
  ];
  it.each(cases)('%s → %s', (q, name) => expect(ck(q)).toContain(name));
});

describe('재료를 다른 이름으로 찾는다', () => {
  const cases: Array<[string, string]> = [
    ['쿠앵트로', '사이드카'], ['베일리즈', 'B-52'], ['칼루아', '블랙 러시안'], ['소다수', '진 리키'], ['사이다', '전기 레모네이드'],
    ['석류 시럽', '테킬라 선라이즈'], ['심플 시럽', '위스키 사워'], ['달걀흰자', '클로버 클럽'], ['스위트 버무스', '맨해튼'], ['박하', '모히토'],
  ];
  it.each(cases)('%s → %s', (q, name) => expect(ck(q)).toContain(name));
});

describe('간단 조합', () => {
  it.each([['진토닉', '진 토닉'], ['g&t', '진 토닉'], ['잭앤콕', '잭콕'], ['가쿠빈 하이볼', '가쿠 하이볼'], ['보드카 오렌지', '스크류드라이버']])(
    '%s → %s', (q, name) => expect(sb(q)).toContain(name));
});

describe('술 추가 검색', () => {
  const cases: Array<[string, string]> = [
    ['맥켈란', '맥캘란'], ['글렌피디치', '글렌피딕'], ['밸런타인', '발렌타인'], ['잭다니엘', '잭 다니엘스'], ['죠니워커', '조니워커'],
    ['탠커레이', '탱커레이'], ['헨드릭', '헨드릭스'], ['앱솔룻', '앱솔루트'], ['쿠앵트로', '코앵트로'], ['라프로악', '라프로익'],
    ['예거', '예거마이스터'], ['가쿠', '산토리 가쿠빈'], ['사케', '준마이'], ['니혼슈', '준마이'], ['탁주', '막걸리'], ['쇼추', '이이치코'],
    ['캄빠리', '캄파리'], ['조니레드', '조니워커 레드라벨'], ['두꺼비', '진로 이즈백'],
  ];
  it.each(cases)('%s → %s', (q, part) => expect(top(q).some((n) => n.includes(part))).toBe(true));
  it('이름으로 맞은 결과가 있으면 글자만 겹친 결과는 빠진다', () => {
    expect(searchLiquor('참이슬', { limit: 8 }).map((h) => h.item.nameKo)).not.toContain('베이슬 헤이든');
  });
});

describe('별칭 표의 이름이 실제로 있다', () => {
  it('칵테일·조합·재료·제품', () => {
    const names = new Set(cocktails.map((c) => c.name));
    expect(Object.keys(COCKTAIL_ALIASES).filter((n) => !names.has(n))).toEqual([]);
    const sbn = new Set(simpleBuilds().map((b) => b.name));
    expect(Object.keys(SIMPLE_ALIASES).filter((n) => !sbn.has(n))).toEqual([]);
    const ings = new Set(ingredients.map((i) => i.name));
    expect(Object.keys(INGREDIENT_ALIASES).filter((n) => !ings.has(n))).toEqual([]);
    expect(Object.keys(LIQUOR_ALIASES).filter((id) => !liquorMasterById.has(id))).toEqual([]);
  });
});

describe('초성 검색', () => {
  it('자음만 치면 초성으로 찾는다', () => {
    expect(top('ㅂㅂㄴ').some((n) => n.startsWith('발베니'))).toBe(true);
  });
  it('완성된 글자를 치면 초성으로 바꿔 대조하지 않는다', () => {
    expect(searchLiquor('사케', { limit: 8 }).every((h) => h.item.category === 'sake')).toBe(true);
  });
});

describe('커뮤니티 용어 (위갤 입문 용어 사전·클리앙 위스키 잡학사전)', () => {
  const cases: Array<[string, string]> = [
    ['메막', '메이커스 마크'], ['물추', '버팔로 트레이스'], ['몽숄', '몽키 숄더'], ['하팍', '하이랜드 파크'], ['스뱅', '스프링뱅크'],
    ['우포리', '우드포드 리저브'], ['야칠', '와일드 터키'], ['와턱', '와일드 터키'], ['라프', '라프로익'], ['라가', '라가불린'],
    ['사슴', '글렌피딕'], ['수류탄', '블랑톤스'], ['드로낙', '글렌드로낙'], ['탈리', '탈리스커'], ['포샬', '포트 샬롯'],
    ['포로', '포 로지스'], ['자메손', '제임슨'], ['잭다', '잭 다니엘스'], ['창스키', '김창수'], ['우거달', '아드벡 우거다일'],
    ['발12덥', '발베니 더블우드'], ['맥덥캐', '맥캘란 더블캐스크'], ['킬달튼', '라가불린'], ['맥발', '발베니'], ['싱몰', '싱글몰트'],
  ];
  it.each(cases)('술 추가: %s → %s', (q, part) =>
    expect(searchLiquor(q, { limit: 8 }).some((h) => h.item.nameKo.includes(part))).toBe(true));

  it('킬달튼은 아드벡·라가불린·라프로익을 모두 찾는다', () => {
    const names = searchLiquor('킬달튼', { limit: 20 }).map((h) => h.item.nameKo).join(' ');
    for (const n of ['아드벡', '라가불린', '라프로익']) expect(names).toContain(n);
  });
  it('목록 검색: CS·싱몰은 정식 이름으로 펼친다', () => {
    expect(hits(normalize('CS'), '글렌알라키 10년 캐스크 스트렝스')).toBe(true);
    expect(hits(normalize('싱몰'), '싱글몰트 스카치')).toBe(true);
    expect(hits(normalize('높은공'), '위스키 하이볼')).toBe(true);
    expect(ck('올패')).toContain('올드 패션드');
  });
});
