/**
 * liquorSearchService — 주류 마스터 DB 검색.
 * 단계: 1) 완전일치 → 2) 별칭 → 3) 부분일치(접두/포함/토큰) → 4) 퍼지(초성·부분열·편집거리).
 * UI 는 이 서비스만 호출하고 데이터 구조를 직접 뒤지지 않는다. 외부 라이브러리 없음.
 */
import { type LiquorCategory, type LiquorMasterItem, type LiquorSearchHit } from '../models/types';
import { LIQUOR_MASTER } from '../data/liquorMaster';
import { normalizeQuery, tokenize, initials, isSubsequence, subsequenceDensity, similarity } from '../data/textMatch';

interface Indexed {
  item: LiquorMasterItem;
  ko: string;      // 정규화 한글명
  en: string;      // 정규화 영문명
  brand: string;
  aliases: string[];
  cho: string;     // 한글명 초성
  all: string[];   // 매칭 대상 전체
}

const INDEX: Indexed[] = LIQUOR_MASTER.map((item) => {
  const ko = normalizeQuery(item.nameKo);
  const en = normalizeQuery(item.nameEn);
  const brand = normalizeQuery(item.brand);
  const aliases = item.aliases.map(normalizeQuery).filter(Boolean);
  return { item, ko, en, brand, aliases, cho: initials(ko), all: [ko, en, brand, ...aliases] };
});

/** 한 제품에 대한 점수. 0 이면 매칭 실패 */
function scoreOne(x: Indexed, q: string, qCho: string, tokens: string[]): { score: number; matched: LiquorSearchHit['matched'] } {
  // 1) 완전 일치
  if (x.ko === q || x.en === q) return { score: 1000, matched: 'exact' };
  if (x.aliases.includes(q)) return { score: 960, matched: 'alias' };

  // 2) 접두 일치
  if (x.ko.startsWith(q) || x.en.startsWith(q)) return { score: 900 - Math.min(60, x.ko.length - q.length), matched: 'partial' };
  if (x.aliases.some((a) => a.startsWith(q))) return { score: 860, matched: 'alias' };

  // 3) 부분 포함
  const koIdx = x.ko.indexOf(q);
  if (koIdx >= 0) return { score: 800 - Math.min(60, koIdx * 4), matched: 'partial' };
  const enIdx = x.en.indexOf(q);
  if (enIdx >= 0) return { score: 780 - Math.min(60, enIdx * 4), matched: 'partial' };
  if (x.aliases.some((a) => a.includes(q))) return { score: 760, matched: 'alias' };
  if (x.brand.includes(q)) return { score: 730, matched: 'partial' };

  // 4) 토큰 AND ("발베니 12" → 발베니 + 12 가 모두 들어 있으면 히트)
  if (tokens.length > 1) {
    const hay = x.all.join('|');
    if (tokens.every((t) => hay.includes(t))) return { score: 700, matched: 'token' };
  }

  // 5) 초성 ("ㅂㅂㄴ" → 발베니)
  if (qCho.length >= 2 && x.cho.includes(qCho) && /[ㄱ-ㅎ]/.test(qCho)) return { score: 620, matched: 'fuzzy' };

  // 6) 부분열 ("조니블랙" → 조니워커블랙라벨)
  if (q.length >= 3) {
    for (const target of x.all) {
      if (!target || !isSubsequence(q, target)) continue;
      const density = subsequenceDensity(q, target);
      if (density >= 0.4) return { score: 400 + Math.round(density * 180), matched: 'fuzzy' };
    }
  }

  // 7) 편집거리 (오타 흡수)
  if (q.length >= 3) {
    let best = 0;
    for (const target of x.all) {
      if (!target) continue;
      const sim = similarity(q, target.slice(0, Math.max(q.length, 3)));
      if (sim > best) best = sim;
    }
    if (best >= 0.6) return { score: Math.round(best * 500), matched: 'fuzzy' };
  }

  return { score: 0, matched: 'fuzzy' };
}

export interface SearchOptions {
  limit?: number;
  category?: LiquorCategory | 'all';
}

/** 제품명 검색. 상위 limit(기본 8)건만 반환한다. */
export function searchLiquor(query: string, opts: SearchOptions = {}): LiquorSearchHit[] {
  const limit = opts.limit ?? 8;
  const q = normalizeQuery(query);
  if (!q) return [];
  const qCho = initials(q);
  const tokens = tokenize(query);

  const hits: LiquorSearchHit[] = [];
  for (const x of INDEX) {
    if (opts.category && opts.category !== 'all' && x.item.category !== opts.category) continue;
    const { score, matched } = scoreOne(x, q, qCho, tokens);
    if (score > 0) hits.push({ item: x.item, score, matched });
  }
  hits.sort((a, b) => b.score - a.score || a.item.nameKo.localeCompare(b.item.nameKo, 'ko'));
  return hits.slice(0, limit);
}

/** 카테고리별 인기/대표 제품 (검색어 없이 화면을 채울 때) */
export function browseLiquor(category: LiquorCategory | 'all', limit = 12): LiquorMasterItem[] {
  const rows = category === 'all' ? LIQUOR_MASTER : LIQUOR_MASTER.filter((i) => i.category === category);
  return rows.slice(0, limit);
}

/** 마스터에 없는 이름으로 직접 추가할 때, 이름만 보고 카테고리를 추정한다. */
const CATEGORY_HINTS: Array<[RegExp, LiquorCategory]> = [
  [/위스키|whisky|whiskey|버번|bourbon|스카치|scotch|몰트|malt|라이 위스키/i, 'whisky'],
  [/\b진\b|gin|드라이 진/i, 'gin'],
  [/보드카|vodka/i, 'vodka'],
  [/데킬라|테킬라|tequila|블랑코|레포사도|아녜호/i, 'tequila'],
  [/메즈칼|mezcal|mescal/i, 'mezcal'],
  [/럼|rum|카샤사|cachaca/i, 'rum'],
  [/코냑|cognac|브랜디|brandy|칼바도스|그라파|피스코|아르마냑/i, 'brandy'],
  [/베르무트|vermouth|마티니 로쏘|노일리/i, 'vermouth'],
  [/리큐르|liqueur|큐라소|슈납스|아마레토|캄파리|아페롤|비터|bitters|크렘 드|아마로/i, 'liqueur'],
  [/와인|wine|샴페인|champagne|프로세코|셰리|포트|sherry|port/i, 'wine'],
  [/맥주|beer|라거|에일|ale|스타우트|ipa/i, 'beer'],
  [/사케|sake|준마이|다이긴조|소주|soju|shochu|막걸리|탁주|약주/i, 'sake'],
  [/하이볼\s*캔|캔\s*하이볼|츄하이|chuhai|호로요이|스트롱\s*제로|rtd|칵테일\s*캔/i, 'rtd'],
  [/토닉|tonic|진저에일|콜라|시럽|syrup|탄산|소다/i, 'mixer'],
];

export function guessCategory(name: string): LiquorCategory {
  // 마스터에 유사 제품이 있으면 그 카테고리를 그대로 쓴다 (가장 신뢰도 높은 추정)
  const hit = searchLiquor(name, { limit: 1 })[0];
  if (hit && hit.score >= 700) return hit.item.category;
  for (const [re, cat] of CATEGORY_HINTS) if (re.test(name)) return cat;
  if (hit && hit.score >= 500) return hit.item.category;
  return 'spirit';
}

/** 이름에서 위스키 세부 분류를 추정 (마스터 미등록 위스키를 직접 추가할 때 최소 입력용) */
export function guessWhiskySubcategory(name: string): string | undefined {
  const n = name.toLowerCase();
  if (/싱글\s*몰트|single\s*malt/.test(n)) return '싱글몰트 스카치';
  if (/블렌디드|blended/.test(n)) return '블렌디드 스카치';
  if (/버번|bourbon/.test(n)) return '스트레이트 버번';
  if (/라이|rye/.test(n)) return '스트레이트 라이';
  if (/아이리시|irish/.test(n)) return '블렌디드 아이리시';
  return undefined;
}
