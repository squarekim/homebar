import { type Cocktail } from '../models/types';
import { garnishParts, type GarnishKind, type GarnishPart } from '../data/drinkVisual';
import { ingredientIdOf } from '../data/adapters';

/**
 * 가니시 재고 — 만들 수 있는지 판정과는 따로 간다.
 * 가니시가 없어도 음료는 만들 수 있으니, 여기서는 '가니시까지 있는지'만 본다.
 * 체크는 재료 재고와 같은 표(db.inventory)에 gn_ 아이디로 저장한다. 레시피 재료가 아니라서 판정에 섞이지 않는다.
 * 민트·바질·칵테일 어니언은 이미 재료로 있어서 그 체크를 같이 쓴다.
 */
export interface GarnishStockItem {
  id: string;
  name: string;
  /** 이 항목이 채우는 가니시 종류 */
  kinds: GarnishKind[];
  /** 한 줄 설명(있을 때만) */
  hint?: string;
}

export const DRIED_ID = 'gn_dried';

export const GARNISH_STOCK: GarnishStockItem[] = [
  { id: 'gn_lemon', name: '레몬', kinds: ['lemon'] },
  { id: 'gn_lime', name: '라임', kinds: ['lime'] },
  { id: 'gn_orange', name: '오렌지', kinds: ['orange'] },
  { id: DRIED_ID, name: '말린 레몬·라임·오렌지 칩', kinds: ['lemon', 'lime', 'orange'],
    hint: '슬라이스만 대신해요.' },
  { id: 'gn_cherry', name: '칵테일 체리', kinds: ['cherry'] },
  { id: 'gn_pineapple', name: '파인애플', kinds: ['pineapple'] },
  { id: 'gn_olive', name: '올리브', kinds: ['olive'] },
  { id: 'gn_berry', name: '베리·포도', kinds: ['berry'] },
  { id: 'gn_celery', name: '셀러리', kinds: ['celery'] },
  { id: 'gn_ginger', name: '캔디드 진저', kinds: ['ginger'] },
  { id: 'gn_dust', name: '넛맥·시나몬', kinds: ['dust'] },
  { id: 'gn_rim', name: '림용 소금·설탕', kinds: ['rim'] },
];

/** 재료 목록에 이미 있는 가니시 — 재료 체크를 그대로 쓴다 */
export const SHARED_GARNISH: Array<{ name: string; kind: GarnishKind; test?: RegExp }> = [
  { name: '민트 잎', kind: 'mint', test: /민트/ },
  { name: '바질 잎', kind: 'mint', test: /바질/ },
  { name: '칵테일 어니언', kind: 'onion' },
];

/** 이 조각을 채울 수 있는 재고 아이디들 — 하나라도 있으면 된다. 못 알아본 조각은 빈 배열. */
export function idsForPart(p: GarnishPart): string[] {
  if (!p.kind) return [];
  const shared = SHARED_GARNISH.filter((s) => s.kind === p.kind && (!s.test || s.test.test(p.text)));
  if (shared.length) return shared.map((s) => ingredientIdOf(s.name));
  return GARNISH_STOCK
    .filter((g) => g.kinds.includes(p.kind!))
    // 말린 칩은 둥근 조각(슬라이스·휠)만 대신한다 — 껍질을 짜서 향을 내거나 즙을 짜는 웨지는 생과일이 필요하다
    .filter((g) => g.id !== DRIED_ID || p.form === 'wheel')
    .map((g) => g.id);
}

export type GarnishState = 'none' | 'all' | 'missing';

/**
 * 가니시까지 있는지.
 *   none     레시피에 가니시가 없다
 *   all      꼭 필요한 조각이 모두 있고, 하나 이상 있다('(선택)' 조각은 없어도 된다)
 *   missing  그 밖(못 알아본 조각이 꼭 필요한 자리에 있어도 여기에 든다)
 */
export function garnishState(ck: Cocktail, held: ReadonlySet<string>): GarnishState {
  const parts = garnishParts(ck.garnish);
  if (!parts.length) return 'none';
  const has = (p: GarnishPart) => idsForPart(p).some((id) => held.has(id));
  const required = parts.filter((p) => !p.optional);
  if (!required.every(has)) return 'missing';
  return parts.some(has) ? 'all' : 'missing';
}

/** 재고 항목마다 그 가니시를 쓰는 레시피 수 */
export function garnishUsage(all: readonly Cocktail[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const ck of all) {
    const ids = new Set(garnishParts(ck.garnish).flatMap(idsForPart));
    for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  }
  return m;
}
