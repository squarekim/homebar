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
  m_kakubin: ['산토리각', '가꾸빈'],
  m_yamazaki12: ['야마자키12년'],
  m_lagavulin16: ['라가불린'],
  m_ardbeg10: ['아드백'],
  m_glenfiddich12: ['글렌피딕'],
  m_hibiki_harmony: ['히비키하모니'],
};
