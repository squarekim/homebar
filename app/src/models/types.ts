/**
 * 도메인 모델. 요구된 Entity: Spirit, Whisky, Cocktail, Ingredient, Mixer, Bottle,
 * Inventory, DrinkLog, TasteProfile, IngredientSubstitution, MixerPairing, PurchaseCandidate.
 *
 * 기존 원본(seed.ts)의 이름/ID를 훼손하지 않고 참조·확장만 한다.
 * 용량 내부 기준은 ml. 취향/향미는 14축 0~10.
 */

/** 향미 14축 (요구 스펙 그대로) */
export const FLAVOR_AXES = [
  'sweet', 'smoke', 'peat', 'fruit', 'vanilla', 'caramel', 'oak',
  'spice', 'floral', 'herbal', 'citrus', 'nutty', 'chocolate', 'body',
] as const;
export type FlavorAxis = (typeof FLAVOR_AXES)[number];
export type FlavorVector = Record<FlavorAxis, number>;

export const FLAVOR_LABELS_KO: Record<FlavorAxis, string> = {
  sweet: '단맛', smoke: '스모크', peat: '피트', fruit: '과일', vanilla: '바닐라',
  caramel: '카라멜', oak: '오크', spice: '스파이스', floral: '플로럴', herbal: '허브',
  citrus: '시트러스', nutty: '견과', chocolate: '초콜릿', body: '바디',
};

export function zeroVector(): FlavorVector {
  return FLAVOR_AXES.reduce((v, a) => { v[a] = 0; return v; }, {} as FlavorVector);
}

/** 재료 마스터 (기존 ings). id 는 이름에서 파생, name/category 원본 유지 */
export interface Ingredient {
  id: string;
  name: string;        // 원본 n
  category: string;    // 원본 c
  usageCount: number;  // 원본 q (레시피 사용 빈도)
  seedOwned: boolean;  // 원본 own
}

/** 칵테일 재료 참조 — 문자열이 아니라 ID 참조 방식 유지 */
export interface CocktailIngredient {
  ingredientId: string;
  ingredientName: string; // 원본 표기 보존
  raw: string;            // 원문 "버번 45ml"
  amount: number | null;  // 파싱된 수량
  unit: string | null;    // 파싱된 단위 (ml 기준으로 정규화 시도)
  amountMl: number | null; // ml 로 환산 가능한 경우
  optional: boolean;      // (선택)
  substitute: boolean;    // 대체 조주 마커
}

/** 조주법 — 이름 옆 아이콘과 필터에 쓰는 정규화 키 */
export type MethodKey = 'build' | 'shake' | 'stir' | 'muddle' | 'blend' | 'layer' | 'swizzle' | 'float';

export const METHOD_LABELS_KO: Record<MethodKey, string> = {
  build: '빌드', shake: '셰이크', stir: '스터', muddle: '머들',
  blend: '블렌드', layer: '레이어', swizzle: '스위즐', float: '플로트',
};

/** 칵테일 (기존 recipes) */
export interface Cocktail {
  id: string;
  name: string;      // 원본 n
  base: string;      // 원본 b (기주)
  iba: string;       // 원본 iba
  method: string;    // 원본 m ("Shake + Build" 등 원문 유지)
  methodKeys: MethodKey[]; // 원문에서 파생한 정규화 키 (첫 번째가 주 기법)
  ingredients: CocktailIngredient[];
  url?: string | undefined;
  note?: string | undefined;      // 코멘터리 한 문장 (없을 수도 있다)
  sourceName?: string | undefined; // 출처 표기 — URL 이 없을 때도 근거를 밝힌다
  garnish?: string | undefined;  // 원본 note 끝에 붙어 있던 가니시 표기를 분리한 값
  /** 이 레시피의 원형 (변형인 경우) */
  variantOf?: string | undefined;      // 원형 칵테일 id
  variantNote?: string | undefined;    // 무엇을 바꾼 변형인지 한 문장
  /** 이 레시피를 원형으로 삼는 변형들 (adapters 에서 역인덱스로 채운다) */
  variants: string[];
  flavor: FlavorVector; // 파생 향미 벡터
}

/** 제조사/공식 테이스팅 노트 (파생 레이어, 출처 포함) */
export interface MakerNote {
  nose?: string | undefined;
  palate?: string | undefined;
  finish?: string | undefined;
  text?: string | undefined;      // nose/palate/finish 로 나누지 않은 통짜 노트
  source: string;     // 출처 URL
  sourceName?: string | undefined; // 출처 표기명
}

/** 위스키 분류 체계 (원본 매트릭스/캐스크 축을 구조화한 파생 레이어) */
export interface WhiskyClass {
  origin: string;       // 스카치 / 버번 / 테네시 / 아이리시 / 재패니즈 / 코리안 / 기타
  type: string;         // 싱글몰트 / 블렌디드 / 블렌디드 몰트 / 스트레이트 버번 / 휘티드 버번 / 테네시 / 플레이버드
  region?: string | undefined;      // 스페이사이드 / 하이랜드 / 아일라 / 아일랜드 / 캠벨타운 / 로우랜드 / 켄터키
  cask: string[];       // 셰리 / 버번 / 프렌치오크 / 버진오크 / 와인 / PX / 올로로소 / 뉴 차드 오크
  character: string[];  // 피티드 / 논피트 / 스모키 / 왁시 / 캐스크 스트렝스 / 휘티드 / 차콜 멜로잉 등
}

/** 실물 보유병 (기존 bottles). id 원본 그대로 재사용 */
export interface Bottle {
  id: string;
  group: string;   // 원본 g
  name: string;    // 원본 ko
  node: string;    // 원본 node (분류 경로)
  abv: string;     // 원본 abv
  abvNum: number | null; // 파싱된 도수
  qty: number;     // 원본 qty
  use: string;     // 원본 use
  note?: string | undefined;
  isSpirit: boolean;
  isWhisky: boolean;
  /** 이 병으로 충당되는 표준 재료 ID들 (재고 화면에서 "그래서 어떤 술?"을 되짚는 데 쓴다) */
  ingredientIds: string[];
  flavor: FlavorVector;
  makerNote?: MakerNote | undefined;
  whiskyClass?: WhiskyClass | undefined;
}

/** Spirit / Whisky 는 Bottle 위의 뷰 타입 */
export type Spirit = Bottle;
export type Whisky = Bottle;

/** 믹서 재료 (ings 중 탄산·음료 등) */
export interface Mixer {
  id: string;
  name: string;
  category: string;
}

/** 믹서 궁합 (기존 mixers) */
export interface MixerPairing {
  id: string;
  group: string;   // 원본 g
  base: string;    // 기주
  mixer: string;   // 믹서
  ratio: string;
  name: string;    // 원본 ko
  glass: string;
  note?: string | undefined;
}

/** 재고 (기존 held Set 를 레코드화). key = ingredientId */
export interface InventoryItem {
  ingredientId: string;
  ingredientName: string;
  owned: boolean;
  remaining: number;   // 잔량 0~100 (%)
  note?: string | undefined;
  updatedAt: number;
}

export type ServingStyle = 'neat' | 'rocks' | 'highball' | 'cocktail' | 'shot' | 'other';
export const SERVING_STYLES: ServingStyle[] = ['neat', 'rocks', 'highball', 'cocktail', 'shot', 'other'];
export const SERVING_LABELS_KO: Record<ServingStyle, string> = {
  neat: '니트', rocks: '온더락', highball: '하이볼', cocktail: '칵테일', shot: '샷', other: '기타',
};

export type DrinkType = 'cocktail' | 'whisky' | 'spirit' | 'other';

/** 음용 기록 */
export interface DrinkLog {
  id: string;
  drinkId: string;      // cocktail.id / bottle.id / ingredient.id
  drinkType: DrinkType;
  drinkName: string;
  date: string;         // ISO
  servingStyle: ServingStyle;
  rating: number;       // 0~5
  retryIntent: boolean; // 재음용 의향
  flavorRatings: Partial<FlavorVector>; // 이 잔에서 느낀 향미 (0~10)
  memo?: string | undefined;
}

/** 취향 프로필 (여러 사용자 지원 → 그룹 추천용) */
export interface TasteProfile {
  id: string;         // 'me' 또는 사용자 식별자
  name: string;
  vector: FlavorVector;
  updatedAt: number;
  source: 'manual' | 'derived' | 'mixed';
}

/** 대체재 매핑 (X 대신 Y 사용 가능) */
export interface IngredientSubstitution {
  id: string;
  ingredientId: string;    // 원 재료
  substituteId: string;    // 대체 재료
  note?: string | undefined;
}

/** 폐기·구매우선순위 시드 (기존 archive) */
export interface PurchaseSeed {
  id: string;
  name: string;    // 원본 ko
  why: string;
  again: string;
  unlockLabel: string; // 원본 unlock "+14종"
  note?: string | undefined;
}

/* ── 서비스 결과 타입 ── */

/** 칵테일 제조 가능 판정 */
export type AvailabilityStatus = 'READY' | 'SUBSTITUTE' | 'MISSING' | 'UNAVAILABLE';

export interface AvailabilityResult {
  status: AvailabilityStatus;
  lack: string[];        // 부족한 필수 재료명
  sub: string[];         // 대체로 충당되는 재료명
  missingCore: string[]; // 기주 등 핵심 부족
}

/** 추천 결과 */
export interface RecommendationResult {
  kind: 'whisky' | 'cocktail';
  id: string;
  name: string;
  score: number;
  tasteScore: number;
  inventoryScore: number;
  availabilityScore: number;
  noveltyScore: number;
  status?: AvailabilityStatus | undefined;
  reason: string;
}

/** 구매 추천 결과 */
export interface PurchaseSuggestion {
  ingredientId: string;
  name: string;
  category: string;
  addedRecipes: number;      // 이 재료 하나로 추가 제조 가능 레시피 수
  beforeCount: number;
  afterCount: number;
  blockedCount: number;      // 이 재료가 막고 있는 레시피 수
  unlockedRecipeNames: string[];
  tasteScore: number;
  totalScore: number;
  reason: string;
}

/** 백업 스냅샷 */
export interface BackupSnapshot {
  schema: 'homebar-platform';
  version: number;
  exportedAt: string;
  inventory: InventoryItem[];
  drinkLogs: DrinkLog[];
  tasteProfiles: TasteProfile[];
  substitutions: IngredientSubstitution[];
  bottleNotes?: { bottleId: string; text: string; updatedAt: number }[];
  userBottles?: UserBottle[] | undefined;
}

/** 사용자가 직접 추가한 보유 술 (시드 bottles 와 병합되어 컬렉션·분류·결손 계산에 반영) */
export interface UserBottle {
  id: string;            // 'ub_...'
  name: string;
  group: string;         // 위스키 / 진 / 보드카 / 럼·데킬라·브랜디 / 리큐르 / 기타 (레거시 컬렉션 그룹)
  abv?: string | undefined;          // '46%'
  qty: number;
  use: string;           // 시음-축 / 겸용 / 조주 / 미활용
  note?: string | undefined;
  whiskyClass?: WhiskyClass | undefined; // group 이 위스키일 때 분류
  createdAt: number;
  /* 마스터 DB 연동으로 자동 채워지는 필드 (직접 추가 시에는 비어 있을 수 있다) */
  masterId?: string | undefined;
  nameEn?: string | undefined;
  brand?: string | undefined;
  category?: LiquorCategory | undefined;
  subcategory?: string | undefined;
  volumeMl?: number | undefined;
  country?: string | undefined;
  /** 칵테일 레시피가 참조하는 표준 재료 ID (제품 → 표준 재료 → 레시피) */
  ingredientId?: string | undefined;
  ingredientName?: string | undefined;
  /** master: 기준 DB에서 선택 / user: 사용자가 직접 입력 */
  source?: 'master' | 'user';
}

/* ── 주류 마스터 DB (제품 검색 → 자동 분류) ── */

/** 대분류. 세부분류(subcategory)는 마스터 DB 내부에서 관리하며 사용자가 고르지 않는다. */
export type LiquorCategory =
  | 'whisky' | 'gin' | 'vodka' | 'rum' | 'tequila' | 'mezcal' | 'brandy'
  | 'liqueur' | 'vermouth' | 'wine' | 'beer' | 'sake' | 'spirit' | 'mixer';

/** 기준 제품 1건. 사용자는 이름만 검색해 고르고, 나머지는 여기서 자동 채워진다. */
export interface LiquorMasterItem {
  id: string;
  nameKo: string;
  nameEn: string;
  brand: string;
  category: LiquorCategory;
  subcategory: string;
  abv?: number | undefined;
  volumeMl?: number | undefined;
  country: string;
  /** 기존 재료 마스터(128종)의 표준 재료명 — 칵테일 레시피와 연결되는 canonical 키 */
  ingredientName?: string | undefined;
  aliases: string[];
  searchKeywords: string[];
  whiskyClass?: WhiskyClass | undefined;
  source: 'master';
}

/** 검색 결과 1건 */
export interface LiquorSearchHit {
  item: LiquorMasterItem;
  score: number;
  matched: 'exact' | 'alias' | 'partial' | 'token' | 'fuzzy';
}

/**
 * 판정을 하는 서비스들이 공통으로 받는 입력.
 * (추천 · 구매 · 그룹 서비스가 같은 모양을 각자 선언하고 있었다)
 */
export interface StockContext {
  heldIds: Set<string>;
  subMap: Map<string, string[]>;
  logs: DrinkLog[];
}
