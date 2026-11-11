/**
 * liquorAliases.ts — 마스터 제품의 추가 별칭(줄임말·오타·통칭).
 * 제품 행과 분리해 두어, 검색이 안 될 때 여기만 늘리면 된다.
 */
export const LIQUOR_ALIASES: Record<string, string[]> = {
  m_jw_black: ['조니워커블랙라벨', 'johnniewalkerblack', 'jwbl', '조니워커12'],
  m_jw_blue: ['johnniewalkerblue'],
  m_balvenie12dw: ['발베니12년', '발베니더블우드', 'balveniedoublewood'],
  m_makers: ['메이커스마크', 'makers'],
  m_macallan12dc: ['맥캘란12년', 'macallan'],
  m_chivas12: ['시바스리갈'],
  m_jackdaniels: ['잭다니엘스', '잭콕용'],
  m_tanqueray10: ['탱커레이no10', 'tanquerayten'],
  m_bombay_sapphire: ['봄베이진'],
  m_cuervo_gold: ['쿠엘보골드'],
  m_hennessy_vs: ['헤네시브이에스'],
  m_kahlua: ['깔루아밀크'],
  m_baileys: ['베일리즈'],
  m_campari: ['깜빠리'],
  m_absolut: ['앱솔룻'],
  m_kakubin: ['산토리각', '가꾸빈', '가쿠', '각병', '산토리위스키'],
  m_yamazaki12: ['야마자키12년'],
  m_lagavulin16: ['라가불린'],
  m_ardbeg10: ['아드백'],
  m_glenfiddich12: ['글렌피딕'],
  m_hibiki_harmony: ['히비키하모니'],
  m_jw_red: ['조니레드', '레드라벨'],
  m_jw_double: ['조니더블블랙', '더블블랙'],
  m_jw_gold: ['조니골드', '골드라벨'],
  m_jw_green: ['조니그린', '그린라벨'],
  m_ballantine_f: ['발렌'],
  m_chivas18: ['시바스18'],
  m_royalsalute21: ['로얄살루트', '로살'],
  m_monkeyshoulder: ['몽키'],
  m_jameson: ['jameson'],
  m_jagermeister: ['예거'],
  m_bacardi_blanca: ['바카디', 'bacardi', '바카디화이트'],
  m_greygoose: ['그레이구스', 'greygoose'],
  m_titos: ['티토스'],
  m_hendricks: ['hendricks'],
  m_beefeater: ['비피터'],
  m_patron_silver: ['패트론'],
  m_donjulio_blanco: ['돈훌리오'],
  m_wildturkey101: ['와일드터키', '와터'],
  m_jimbeam_white: ['짐빔'],
  m_buffalotrace: ['버팔로'],
  m_chamisul: ['이슬', '참이슬'],
  m_jinro_isback: ['진로', '두꺼비'],
};

/**
 * 커뮤니티에서 쓰는 브랜드·제품 별명. 한국어 이름이 이 패턴으로 시작하는 제품 모두에 붙는다.
 * 출처: 디시인사이드 위스키 마이너 갤러리 "[지식] 위갤 입문 용어 사전"
 *       (https://gall.dcinside.com/mgallery/board/view/?id=whiskey&no=487602), 2026-11-11 확인.
 * 비속어와 게시판·매장 은어는 넣지 않았다.
 */
export const COMMUNITY_NICKNAMES: Array<[RegExp, string[]]> = [
  [/^메이커스 마크/, ['메막', '메맠', '장인의표식']],
  [/^글렌고인/, ['기러기', '글렌기러기']],
  [/^글렌드로낙/, ['드로낙', '드로냑', '드로나치']],
  [/^라프로익/, ['라프']],
  [/^라프로익 쿼터 캐스크/, ['라프쿼캐', '라프 쿼캐']],
  [/^라가불린/, ['라가']],
  [/^몽키 숄더/, ['몽숄', '원숭이어깨']],
  [/^버팔로 트레이스/, ['물소추적', '물추']],
  [/^맥캘란 더블캐스크/, ['맥덥캐', '맥 덥캐']],
  [/^발베니 더블우드 12/, ['발12덥', '발12덮', '발12덥우']],
  [/^발베니 싱글배럴/, ['발싱배', '발싱베', '발싱']],
  [/^부나하벤/, ['부나', '번너햅행', '선장']],
  [/^글렌피딕/, ['사슴', '사슴계곡', '끠딕']],
  [/^블랑톤스/, ['수류탄']],
  [/^스프링뱅크/, ['스뱅', '봄은행']],
  [/^아벨라워/, ['아벨']],
  [/^글렌알라키/, ['알낳기']],
  [/^와일드 터키/, ['야생칠면조', '야칠', '와턱']],
  [/^이글 레어/, ['희귀독수리']],
  [/^우드포드 리저브/, ['우포리']],
  [/^페이머스 그라우스/, ['유명뇌조', '뇌조']],
  [/^제임슨/, ['자메손', '자매손', '재머슨', '제머슨']],
  [/^잭 다니엘스|^젠틀맨 잭/, ['잭', '잭다', '젝다']],
  [/^잭 다니엘스 싱글 배럴/, ['잭싱', '잭싱배', '잭다싱배']],
  [/^조니워커/, ['조니', '죠니']],
  [/^김창수/, ['창스키', 'kcs']],
  [/^커클랜드 프렌치 보드카/, ['커빠따']],
  [/^탈리스커/, ['탈리']],
  [/^포트 샬롯/, ['포샬']],
  [/^포 로지스/, ['포로', '사장미']],
  [/^하이랜드 파크/, ['하팍', '윗동네박씨']],
  [/^아드벡 우거다일/, ['우가달', '우거달', '우가다일', '우거데일']],
  [/^엘라이자 크레이그 스몰배치/, ['ecsb']],
  [/^싱글톤/, ['싱글벙글', '벙글톤', '밍밍톤']],
  [/^앙고스투라/, ['비터']],
];

/** 이름으로 커뮤니티 별명을 찾는다 */
export function communityNicknames(nameKo: string): string[] {
  return COMMUNITY_NICKNAMES.filter(([re]) => re.test(nameKo)).flatMap(([, a]) => a);
}
