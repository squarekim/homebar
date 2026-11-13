/**
 * bottleIngredients.ts — 보유 병(제품) ↔ 표준 재료 연결.
 *
 * 재고는 "데킬라" 같은 표준 재료 단위로 관리하지만, 사람이 궁금한 건 "그래서 그게 어떤 술인데?"다.
 * 시드 병은 분류 경로(node)가 재료와 일대일에 가까워 그 매핑을 여기 한곳에 둔다.
 * 사용자가 추가한 병은 등록할 때 이미 표준 재료를 고르므로 그 값을 그대로 쓴다.
 */
import { liquorMasterById } from './liquorMaster';

/** 시드 병의 node → 이 병으로 충당되는 표준 재료명(재료 마스터 130종 기준) */
export const NODE_TO_INGREDIENTS: Record<string, string[]> = {
  // 위스키
  'w.scotch.malt': ['싱글몰트 스카치', '스카치'],
  'w.scotch.bm': ['블렌디드 스카치', '스카치'],
  'w.scotch.bl': ['블렌디드 스카치', '스카치'],
  'w.bourbon': ['버번', '버번 또는 라이'],
  'w.tenn': ['테네시'],
  'w.kr': ['한국 싱글몰트'],
  'w.jp': [],                       // 재패니즈에 대응하는 표준 재료가 없다
  'lq.flav': ['플레이버드 위스키'],
  // 화이트 스피릿
  'g.ld': ['런던 드라이 진'],
  'v.plain': ['플레인 보드카'],
  'r.wh.gen': ['화이트 럼'],        // 바카디는 푸에르토리코산이라 '쿠바산 화이트 럼'에는 넣지 않는다
  'r.coco': ['코코넛 럼'],
  't.mixto': ['데킬라'],            // 믹스토라 '100% 아가베 데킬라'는 아니다
  'b.xo': ['XO 브랜디(코냑 외)'],
  // 리큐르
  'lq.coffee.kah': ['깔루아(커피 리큐르)'],
  'lq.elderflower': ['엘더플라워 코디얼', '기타 리큐르'],
  'lq.midori': ['미도리'],
  'lq.amaretto': ['아마레토'],
  'lq.drambuie': ['드람부이'],
  'lq.benedictine': ['베네딕틴'],
  'lq.maraschino': ['마라스키노'],
  'lq.orange.tri': ['트리플 섹'],
  'lq.peach': ['피치 슈납스'],
  'lq.orange.blue': ['블루 큐라소'],
  'lq.cacao': ['크렘 드 카카오'],
  'lq.mint.unk': ['크렘 드 멘트'],
  'lq.berry.cassis': ['크렘 드 카시스'],
  'lq.campari': ['캄파리'],
  'lq.irishcream': ['아이리시 크림(베일리스)'],
  'lq.cinnamon': ['시나몬 리큐르(시에가)'],
  'lq.greentea': ['기타 리큐르'],
  'lq.etc': ['기타 리큐르'],
  // 주스·상비품
  'j.lemon': ['레몬즙'], 'j.lime': ['라임즙'], 'j.orange': ['오렌지 주스'],
  'j.cranberry': ['크랜베리 주스'], 'j.grapefruit': ['자몽 주스'],
  'j.pineapple': ['파인애플 주스'], 'j.tomato': ['토마토 주스'],
  'sd.cola': ['콜라'], 'sd.tonic': ['토닉워터'], 'sd.ginger': ['진저에일'], 'sd.soda': ['탄산수'],
  'sy.cane': ['설탕시럽'], 'sy.grenadine': ['그레나딘'],
  'bt.aromatic': ['앙고스투라 비터'], 'bt.orange': ['오렌지 비터'],
  'pt.cream': ['생크림'], 'pt.milk': ['우유'], 'pt.water': ['물'],
  'pt.sugarcube': ['각설탕'], 'pt.sugar': ['정제 설탕'],
};

/** 칵테일에 쓰지 않는 병(소주·맥주·사케 등)은 빈 배열이 된다 */
export function ingredientNamesForNode(node: string): string[] {
  return NODE_TO_INGREDIENTS[node] ?? [];
}


/* ── 병의 대분류 ── */

/** 시드 병은 분류 경로, 사용자 추가 병은 master.<category> 로 대분류를 판별한다 */
export function bottleKind(b: { node: string; group: string }): string {
  if (b.node.startsWith('master.')) return b.node.slice('master.'.length);
  if (b.group === '위스키') return 'whisky';
  if (b.group === '진') return 'gin';
  if (b.group === '보드카') return 'vodka';
  if (b.group === '리큐르') return 'liqueur';
  if (b.node.startsWith('r.')) return 'rum';
  if (b.node.startsWith('t.')) return 'tequila';
  if (b.node.startsWith('b.')) return 'brandy';
  return 'other';
}

const KIND_LABELS: Record<string, string> = {
  whisky: '위스키', gin: '진', vodka: '보드카', rum: '럼', tequila: '데킬라',
  mezcal: '메즈칼', brandy: '브랜디', liqueur: '리큐르', vermouth: '베르무트',
  wine: '와인', beer: '맥주', trad: '우리술', soju: '소주', sake: '사케·일본 소주', rtd: 'RTD', spirit: '증류주', mixer: '부재료',
};

/** 카드 우측에 적는 술 종류 (럼·데킬라·브랜디 묶음 대신 '데킬라'처럼 실제 종류로) */
/** 중국 백주는 우리말로 흔히 부르는 '고량주'로 적는다(병 모양·색 규칙은 bottleKind 그대로) */
function isBaijiu(b: { node: string; name?: string; productId?: string | undefined }): boolean {
  return b.node === 'cn.baijiu'
    || !!(b.productId && liquorMasterById.get(b.productId)?.subcategory.includes('백주'))
    || /고량주|백주|baijiu/i.test(b.name ?? '');
}

export function bottleKindLabel(b: { node: string; group: string; name?: string; productId?: string | undefined }): string {
  if (isBaijiu(b)) return '고량주';
  return groupLabel(KIND_LABELS[bottleKind(b)] ?? b.group);
}

/** 데이터의 묶음 이름을 화면에 적는 말로 — 칵테일에 안 쓰는 술 묶음은 '그 밖의 술' */
export function groupLabel(group: string): string {
  if (group === '기타 (칵테일 미활용)') return '그 밖의 술';
  // 저장된 값은 그대로 두고 보이는 이름만 바꾼다('상비품'은 처음 만든 사람의 말이었다)
  if (group === '음료·믹서·시럽·비터·상비품') return '음료·믹서·시럽·비터';
  return group;
}
