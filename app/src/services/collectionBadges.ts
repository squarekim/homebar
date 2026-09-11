/**
 * collectionBadges — "첫 ○○" 마일스톤 계산.
 *
 * 술장에 새 병이 들어올 때 그 병이 내 컬렉션에서 처음인 축(위스키 → 스카치 → 싱글몰트 → 피티드)을 찾아
 * 뱃지 하나를 준다. 메모에 손으로 적던 "첫 피트 싱글몰트"를 사람이 쓰지 않아도 되게 하는 게 목적이다.
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

/** 컬렉션 전체에 계산된 뱃지를 얹어 돌려준다 (데이터에 적힌 뱃지는 그대로 둔다) */
export function withMilestones(bottles: Bottle[]): Bottle[] {
  const found = milestoneBadges(bottles);
  return bottles.map((b) => {
    const m = found.get(b.id);
    return m ? { ...b, badges: [...b.badges, m] } : b;
  });
}
