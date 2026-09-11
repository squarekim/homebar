/**
 * collectionBadges — 업적 뱃지 계산.
 *
 *  ① 마일스톤 — 내 컬렉션에서 처음인 축(위스키 → 스카치 → 싱글몰트 → 피티드)을 찾아 "첫 ○○"
 *  ② 재구매   — 같은 제품을 또 들인 횟수. 1회 "마셔보니 좋더라" → 3회 "없으니 못 살겠다"
 *
 * 메모에 손으로 적던 말을 사람이 쓰지 않아도 되게 하는 게 목적이다.
 *
 * 규칙
 *  - 판정은 추가 시각(addedAt)과 분류 필드로만 한다. 메모 텍스트는 보지 않는다.
 *  - 앱 사용 이전부터 있던 시드 병(addedAt 없음)은 이미 그 축을 차지한 것으로 본다 —
 *    스카치를 20병 갖고 있는데 21번째가 "첫 스카치"가 될 수는 없다.
 *  - 병 하나에 하나만. 넓은 축부터 본다(첫 위스키 > 첫 스카치 위스키 > 첫 싱글몰트 > 첫 피티드 위스키).
 */
import { type Bottle, type BottleBadge } from '../models/types';
import { bottleKindLabel } from '../data/bottleIngredients';

/** 믹서·부재료는 마일스톤을 세지 않는다 (첫 토닉워터는 기념할 일이 아니다) */
const SKIP = new Set(['부재료']);

/** 이 병이 속한 축들 — 넓은 것부터 */
function axesOf(b: Bottle): string[] {
  const kind = bottleKindLabel(b);
  if (SKIP.has(kind)) return [];
  const axes = [kind];
  const w = b.whiskyClass;
  if (w) {
    if (w.origin) axes.push(`${w.origin} 위스키`);
    if (w.type) axes.push(w.type);
    if (w.character.includes('피티드')) axes.push('피티드 위스키');
  }
  return axes;
}

/**
 * 사용자가 추가한 병들에 마일스톤 뱃지를 매긴다.
 * 반환: 병 id → 뱃지 (해당 없으면 키 없음)
 */
export function milestoneBadges(bottles: readonly Bottle[]): Map<string, BottleBadge> {
  const claimed = new Set<string>();
  for (const b of bottles) {
    if (b.addedAt) continue;                    // 시드 병만 먼저 축을 차지한다
    for (const a of axesOf(b)) claimed.add(a);
  }

  const added = bottles.filter((b) => !!b.addedAt).sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0));
  const out = new Map<string, BottleBadge>();
  for (const b of added) {
    const axes = axesOf(b);
    const fresh = axes.find((a) => !claimed.has(a));
    for (const a of axes) claimed.add(a);
    if (fresh) out.set(b.id, { kind: 'first', label: `첫 ${fresh}` });
  }
  return out;
}

/**
 * 재구매 업적 — 같은 제품을 몇 번 더 들였는지.
 * 세는 단위는 병 수(qty)다. 선물로 한 병 더 들어온 것도 "또 생긴 것"이라 같이 센다.
 * 제품 동일성은 기준 DB 제품 id 로 본다(없으면 이름). 이름 표기가 조금 달라도
 * 같은 제품을 고르면 같은 것으로 세진다.
 */
const REPEAT_TIERS: Array<[min: number, label: string]> = [
  [3, '없으니 못 살겠다'],
  [2, '이제 상비품'],
  [1, '마셔보니 좋더라'],
];

function productKey(b: Bottle): string {
  return b.productId ?? b.name.replace(/\s+/g, '').toLowerCase();
}

export function repeatBadges(bottles: readonly Bottle[]): Map<string, BottleBadge> {
  const byProduct = new Map<string, { bottles: number; latest: Bottle }>();
  for (const b of bottles) {
    if (SKIP.has(bottleKindLabel(b))) continue;          // 믹서는 재구매를 세지 않는다
    const key = productKey(b);
    const cur = byProduct.get(key);
    if (!cur) byProduct.set(key, { bottles: b.qty, latest: b });
    else {
      cur.bottles += b.qty;
      if ((b.addedAt ?? 0) >= (cur.latest.addedAt ?? 0)) cur.latest = b;   // 뱃지는 가장 최근 것에 단다
    }
  }

  const out = new Map<string, BottleBadge>();
  for (const { bottles: count, latest } of byProduct.values()) {
    const repeats = count - 1;
    const tier = REPEAT_TIERS.find(([min]) => repeats >= min);
    if (tier) out.set(latest.id, { kind: 'repeat', label: tier[1], detail: `재구매 ${repeats}회` });
  }
  return out;
}

/** 컬렉션 전체에 계산된 뱃지를 얹어 돌려준다 (데이터에 적힌 뱃지는 그대로 둔다) */
export function withMilestones(bottles: Bottle[]): Bottle[] {
  const first = milestoneBadges(bottles);
  const repeat = repeatBadges(bottles);
  return bottles.map((b) => {
    const add = [first.get(b.id), repeat.get(b.id)].filter((x): x is BottleBadge => !!x);
    return add.length ? { ...b, badges: [...b.badges, ...add] } : b;
  });
}
