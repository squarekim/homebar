/**
 * bottleIngredients.ts — 보유 병(제품) ↔ 표준 재료 연결.
 *
 * 재고는 "데킬라" 같은 표준 재료 단위로 관리하지만, 사람이 궁금한 건 "그래서 그게 어떤 술인데?"다.
 * 시드 병은 분류 경로(node)가 재료와 일대일에 가까워 그 매핑을 여기 한곳에 둔다.
 * 사용자가 추가한 병은 등록할 때 이미 표준 재료를 고르므로 그 값을 그대로 쓴다.
 */

/** 시드 병의 node → 이 병으로 충당되는 표준 재료명(재료 마스터 128종 기준) */
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
