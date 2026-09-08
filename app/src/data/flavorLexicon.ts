/**
 * flavorLexicon.ts — 재료·주류 이름/분류로부터 14축 향미 벡터를 파생하는 규칙.
 *
 * 원본 데이터(seed.ts)를 전혀 변형하지 않고, 이름/카테고리를 입력으로 향미를 "계산"한다.
 * 외부 AI 없이 추천 엔진(cosine similarity / weighted distance)을 구동하기 위한 근거 레이어.
 * 값은 0~10 기여도. 규칙 매칭 결과를 합산 후 0~10 로 클램프한다.
 */
import { FlavorVector, FlavorAxis, zeroVector } from '../models/types';

type Partial14 = Partial<Record<FlavorAxis, number>>;

/** 재료 카테고리(ings.c) 별 기본 향미 */
const CATEGORY_BASE: Record<string, Partial14> = {
  '위스키': { oak: 6, vanilla: 5, caramel: 5, spice: 3, body: 5, smoke: 2 },
  '진': { herbal: 6, floral: 4, citrus: 3, spice: 3, body: 3 },
  '보드카': { body: 2 },
  '럼': { sweet: 5, caramel: 4, vanilla: 3, body: 4, spice: 2, fruit: 2 },
  '데킬라·아가베': { herbal: 4, citrus: 3, spice: 3, floral: 2, body: 3 },
  '브랜디': { fruit: 6, oak: 4, sweet: 3, caramel: 3, body: 4, vanilla: 2 },
  '리큐르': { sweet: 6 },
  '비터·아페리티프': { herbal: 6, spice: 5, citrus: 2 },
  '베르무트·와인': { herbal: 4, fruit: 4, floral: 3, sweet: 3, body: 2 },
  '주스·과즙': { fruit: 6, citrus: 4, sweet: 2 },
  '탄산·음료': {},
  '시럽·감미': { sweet: 9 },
  '신선·허브': { herbal: 5, citrus: 3, floral: 2, fruit: 2 },
  '유제품·기타': { body: 6, sweet: 2 },
};

/** 이름 부분문자열 → 향미 기여. 재료·주류 공통 */
const NAME_RULES: Array<[RegExp, Partial14]> = [
  // 위스키 세부
  [/피트|peat|아일라|라프로익|아드벡|라가불린|아일러/i, { peat: 9, smoke: 8 }],
  [/스모크|스모키|smoke/i, { smoke: 6 }],
  [/메즈칼|mezcal/i, { smoke: 7, peat: 2, herbal: 3 }],
  [/버번|bourbon/i, { vanilla: 3, caramel: 3, oak: 2, sweet: 2 }],
  [/라이 위스키|rye/i, { spice: 5, oak: 3 }],
  [/테네시/i, { vanilla: 2, sweet: 2 }],
  [/셰리|sherry|px|올로로소|피엑스/i, { fruit: 5, sweet: 3, caramel: 3, spice: 2 }],
  [/클라이넬리쉬|클라이넬리시|clynelish/i, { fruit: 4, floral: 3, citrus: 3, spice: 3, oak: 2, smoke: 1 }],
  // 오렌지·시트러스 리큐르
  [/트리플\s*섹|코앵트로|큐라소|cointreau|오렌지 리큐르|그랑 마니에|그랑마니에/i, { citrus: 8, sweet: 6, fruit: 2 }],
  [/블루 큐라소/i, { citrus: 7, sweet: 6 }],
  // 과일 리큐르/주스
  [/미도리|멜론/i, { fruit: 8, sweet: 6 }],
  [/마라스키노|체리|cherry/i, { fruit: 7, sweet: 5 }],
  [/카시스|cassis|블랙커런트/i, { fruit: 8, sweet: 6 }],
  [/피치|복숭아|슈납스|애프리콧|살구|apricot/i, { fruit: 8, sweet: 5 }],
  [/라즈베리|산딸기|딸기|베리|블루베리/i, { fruit: 7, sweet: 4 }],
  [/파인애플/i, { fruit: 7, sweet: 3, citrus: 1 }],
  [/크랜베리/i, { fruit: 6, citrus: 3 }],
  [/사과|애플|calvados|칼바도스/i, { fruit: 7, sweet: 3 }],
  [/포도|grape/i, { fruit: 6, sweet: 3 }],
  [/토마토/i, { body: 3, herbal: 2 }],
  // 견과·초콜릿·커피·크림
  [/아마레토|amaretto|아몬드/i, { nutty: 8, sweet: 5, caramel: 2 }],
  [/카카오|카오|초코|chocolate/i, { chocolate: 9, sweet: 6 }],
  [/깔루아|커피|coffee|에스프레소/i, { chocolate: 5, sweet: 5, body: 2 }],
  [/베일리스|아이리시 크림|크림 리큐르/i, { chocolate: 4, vanilla: 4, body: 6, sweet: 5 }],
  [/코코넛|말리부|coconut/i, { fruit: 5, sweet: 6, nutty: 3, body: 2 }],
  [/헤이즐넛|프란젤리코|호두|피칸|넛/i, { nutty: 7, sweet: 4 }],
  // 허브·아니스·약초
  [/샤르트뢰즈|chartreuse/i, { herbal: 9, spice: 5 }],
  [/베네딕틴|benedictine/i, { herbal: 7, spice: 4, sweet: 4, floral: 2 }],
  [/드람부이|drambuie/i, { herbal: 5, sweet: 5, spice: 3, oak: 2 }],
  [/삼부카|아니스|압생트|파스티스|absinthe|아니제트/i, { herbal: 8, spice: 4 }],
  [/민트|망트|mint|페퍼민트/i, { herbal: 8, floral: 2, sweet: 3 }],
  [/엘더플라워|세인트제르맹|elderflower|생제르맹/i, { floral: 8, sweet: 4, fruit: 2 }],
  [/바질|로즈메리|타임|세이지|허브/i, { herbal: 6, floral: 2 }],
  // 시트러스 생과
  [/레몬|lemon/i, { citrus: 9 }],
  [/라임|lime/i, { citrus: 9 }],
  [/자몽|그레이프프루트|grapefruit/i, { citrus: 8, fruit: 2 }],
  [/오렌지|orange/i, { citrus: 6, fruit: 4, sweet: 2 }],
  [/유자/i, { citrus: 8, floral: 2 }],
  // 스파이스
  [/진저|생강|ginger/i, { spice: 6 }],
  [/시나몬|계피|넛맥|육두구|정향|클로브|후추|페퍼/i, { spice: 7, nutty: 2 }],
  [/앙고스투라|비터스|bitters|앙고|페이쇼드/i, { spice: 7, herbal: 5, oak: 2 }],
  [/캄파리|아페롤|campari|aperol/i, { herbal: 6, citrus: 4, fruit: 3, sweet: 3 }],
  [/베르무트|vermouth/i, { herbal: 5, fruit: 3, floral: 3, sweet: 3 }],
  // 감미
  [/설탕|시럽|심플|각설탕|슈가|sugar|simple/i, { sweet: 9 }],
  [/그레나딘|grenadine|석류/i, { sweet: 7, fruit: 5 }],
  [/꿀|허니|honey/i, { sweet: 7, floral: 3 }],
  [/메이플/i, { sweet: 7, caramel: 4 }],
  [/아가베 시럽|아가베시럽/i, { sweet: 7 }],
  [/팔레르넘|오르쟈|오르지트|orgeat/i, { sweet: 6, nutty: 5 }],
  // 유제품·계란
  [/계란|에그|egg|우유|밀크|생크림|크림|요거트/i, { body: 6, sweet: 2 }],
  // 탄산·소프트드링크
  [/콜라|cola/i, { sweet: 5, caramel: 3, spice: 2 }],
  [/진저에일|진저비어|ginger ale/i, { spice: 5, sweet: 4 }],
  [/토닉|tonic/i, { herbal: 2, citrus: 1 }],
];

function addInto(v: FlavorVector, part: Partial14, weight = 1): void {
  for (const k in part) {
    const axis = k as FlavorAxis;
    v[axis] += (part[axis] ?? 0) * weight;
  }
}

function clampVec(v: FlavorVector): FlavorVector {
  for (const k in v) {
    const axis = k as FlavorAxis;
    v[axis] = Math.max(0, Math.min(10, v[axis]));
  }
  return v;
}

/** 재료 단품 향미 */
export function flavorForIngredient(name: string, category: string): FlavorVector {
  const v = zeroVector();
  addInto(v, CATEGORY_BASE[category] ?? {});
  for (const [re, part] of NAME_RULES) {
    if (re.test(name)) addInto(v, part);
  }
  return clampVec(v);
}

/** 보유병 향미 (그룹/노드/이름 기반) */
export function flavorForBottle(name: string, group: string, node: string, isWhisky: boolean): FlavorVector {
  const v = zeroVector();
  if (isWhisky) addInto(v, CATEGORY_BASE['위스키']);
  else if (/진/.test(group)) addInto(v, CATEGORY_BASE['진']);
  else if (/보드카/.test(group)) addInto(v, CATEGORY_BASE['보드카']);
  else if (/럼|데킬라|브랜디/.test(group)) addInto(v, CATEGORY_BASE['브랜디']);
  else if (/리큐르/.test(group)) addInto(v, CATEGORY_BASE['리큐르']);
  const hay = `${name} ${node}`;
  for (const [re, part] of NAME_RULES) {
    if (re.test(hay)) addInto(v, part);
  }
  return clampVec(v);
}

/**
 * 칵테일 향미 = 구성 재료 향미의 용량(ml) 가중 합.
 * 절대 크기보다 프로파일 형태가 중요하므로 상위 축을 0~10 로 재정규화한다.
 */
export function combineCocktailFlavor(parts: Array<{ flavor: FlavorVector; weight: number }>): FlavorVector {
  const v = zeroVector();
  let total = 0;
  for (const p of parts) {
    const w = p.weight > 0 ? p.weight : 1;
    addInto(v, p.flavor as Partial14, w);
    total += w;
  }
  if (total > 0) for (const k in v) (v as FlavorVector)[k as FlavorAxis] /= total;
  // 최대축 기준 재정규화 (형태 보존, 최대 8~10 로 끌어올림)
  let max = 0;
  for (const k in v) max = Math.max(max, v[k as FlavorAxis]);
  if (max > 0) {
    const scale = Math.min(2.2, 8.5 / max);
    for (const k in v) v[k as FlavorAxis] *= scale;
  }
  return clampVec(v);
}
