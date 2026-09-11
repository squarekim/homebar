/**
 * liquorMaster.ts — 주류 기준 DB(liquor_master).
 * 한국에서 일반 소비자가 실제로 구입하는 제품(대형마트·주류샵·데일리샷 유통 중심) 위주.
 * 사용자는 제품명만 검색해 고르고, 대분류·세부분류·도수·용량·원산지·표준 재료는 여기서 자동 채워진다.
 *
 * 원칙
 *  - 도수는 공식 라벨 기준으로 확인 가능한 값만 넣는다. 배치별로 달라지는 캐스크 스트렝스 등은 0(미상)으로 둔다.
 *  - 용량은 국내 유통 대표 용량이며 사용자가 수정할 수 있다.
 *  - ing 는 기존 재료 마스터(128종)의 "표준 재료명"이다. 제품 → 표준 재료 → 칵테일 레시피로 연결된다.
 *  - 기존 seed 데이터는 손대지 않는다. 이 파일은 순수 추가 레이어다.
 */
import { type LiquorCategory, type LiquorMasterItem, type WhiskyClass } from '../models/types';
import { normalizeQuery, initials } from './textMatch';
import { LIQUOR_ALIASES } from './liquorAliases';

/** [id, 한글명, 영문명, 브랜드, 세부분류, 도수(0=미상), 용량ml(0=미상), 원산지, 표준재료명(''=없음), 별칭(공백구분)] */
type Row = [string, string, string, string, string, number, number, string, string, string, WhiskyClass?];

const sm = (region: string, cask: string[], character: string[] = ['논피트']): WhiskyClass =>
  ({ origin: '스카치', type: '싱글몰트', region, cask, character });
const sb = (character: string[] = []): WhiskyClass =>
  ({ origin: '스카치', type: '블렌디드', cask: [], character });
const bm = (character: string[] = []): WhiskyClass =>
  ({ origin: '스카치', type: '블렌디드 몰트', cask: [], character });
const bb = (type: string, character: string[] = []): WhiskyClass =>
  ({ origin: '버번', type, region: '켄터키', cask: ['뉴 차드 오크'], character });
const ir = (type: string, cask: string[] = [], character: string[] = ['논피트']): WhiskyClass =>
  ({ origin: '아이리시', type, region: '아일랜드', cask, character });
const jp = (type: string, cask: string[] = [], character: string[] = []): WhiskyClass =>
  ({ origin: '재패니즈', type, cask, character });

/* ── 위스키: 스카치 싱글몰트 ── */
const WHISKY_SCOTCH_MALT: Row[] = [
  ['m_macallan12dc', '맥캘란 더블캐스크 12년', 'The Macallan Double Cask 12 Years Old', '맥캘란', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '맥캘란12 맥켈란 macallan12', sm('스페이사이드', ['셰리', '버번'])],
  ['m_macallan12sh', '맥캘란 셰리오크 12년', 'The Macallan Sherry Oak 12 Years Old', '맥캘란', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '맥캘란셰리 맥캘란12셰리', sm('스페이사이드', ['셰리', '올로로소'])],
  ['m_macallan15', '맥캘란 더블캐스크 15년', 'The Macallan Double Cask 15 Years Old', '맥캘란', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '맥캘란15', sm('스페이사이드', ['셰리', '버번'])],
  ['m_macallan18', '맥캘란 셰리오크 18년', 'The Macallan Sherry Oak 18 Years Old', '맥캘란', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '맥캘란18', sm('스페이사이드', ['셰리', '올로로소'])],
  ['m_glenfiddich12', '글렌피딕 12년', 'Glenfiddich 12 Year Old', '글렌피딕', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글피12 glenfiddich12', sm('스페이사이드', ['셰리', '버번'])],
  ['m_glenfiddich15', '글렌피딕 15년 솔레라', 'Glenfiddich 15 Year Old Solera', '글렌피딕', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글피15 솔레라', sm('스페이사이드', ['셰리', '버번', '버진오크'], ['논피트', '솔레라'])],
  ['m_glenfiddich18', '글렌피딕 18년', 'Glenfiddich 18 Year Old', '글렌피딕', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글피18', sm('스페이사이드', ['셰리', '버번'])],
  ['m_glenlivet12', '글렌리벳 12년', 'The Glenlivet 12 Year Old', '글렌리벳', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌리벳12 glenlivet', sm('스페이사이드', ['버번'])],
  ['m_glenlivet15', '글렌리벳 15년 프렌치오크', 'The Glenlivet 15 Year Old French Oak Reserve', '글렌리벳', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌리벳15', sm('스페이사이드', ['프렌치오크'])],
  ['m_glenlivet18', '글렌리벳 18년', 'The Glenlivet 18 Year Old', '글렌리벳', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '글렌리벳18', sm('스페이사이드', ['셰리', '버번'])],
  ['m_balvenie12dw', '발베니 더블우드 12년', 'The Balvenie DoubleWood 12 Year Old', '발베니', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '발베니12 발배니 balvenie12 더블우드', sm('스페이사이드', ['버번', '셰리'])],
  ['m_balvenie14cc', '발베니 캐리비안 캐스크 14년', 'The Balvenie Caribbean Cask 14 Year Old', '발베니', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '발베니14 캐리비안', sm('스페이사이드', ['버번', '럼'])],
  ['m_balvenie21', '발베니 포트우드 21년', 'The Balvenie PortWood 21 Year Old', '발베니', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '발베니21 포트우드', sm('스페이사이드', ['버번', '와인'])],
  ['m_glenmorangie10', '글렌모렌지 오리지널 10년', 'Glenmorangie The Original 10 Year Old', '글렌모렌지', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌모렌지10 오리지널 glenmorangie', sm('하이랜드', ['버번'])],
  ['m_glenmorangie_lasanta', '글렌모렌지 라산타 12년', 'Glenmorangie Lasanta 12 Year Old', '글렌모렌지', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '라산타', sm('하이랜드', ['버번', '셰리', 'PX'])],
  ['m_glenmorangie_nectar', '글렌모렌지 넥타 도르', "Glenmorangie Nectar d'Or", '글렌모렌지', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '넥타도르', sm('하이랜드', ['버번', '와인'])],
  ['m_aberlour12', '아벨라워 12년 더블캐스크', 'Aberlour 12 Year Old Double Cask Matured', '아벨라워', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '아벨라워12 aberlour', sm('스페이사이드', ['셰리', '버번'])],
  ['m_aberlour_abunadh', "아벨라워 아부나흐", "Aberlour A'bunadh", '아벨라워', '싱글몰트 스카치', 0, 700, '스코틀랜드', '싱글몰트 스카치', '아부나흐 abunadh', sm('스페이사이드', ['올로로소', '셰리'], ['캐스크 스트렝스', '논피트'])],
  ['m_glenallachie12', '글렌알라키 12년', 'The GlenAllachie 12 Year Old', '글렌알라키', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '글렌알라키12 glenallachie', sm('스페이사이드', ['PX', '올로로소', '와인'])],
  ['m_glenallachie15', '글렌알라키 15년', 'The GlenAllachie 15 Year Old', '글렌알라키', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '글렌알라키15', sm('스페이사이드', ['PX', '올로로소'])],
  ['m_glendronach12', '글렌드로낙 12년', 'The GlenDronach Original 12 Year Old', '글렌드로낙', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '글렌드로낙12 glendronach', sm('하이랜드', ['PX', '올로로소'])],
  ['m_glendronach15', '글렌드로낙 리바이벌 15년', 'The GlenDronach Revival 15 Year Old', '글렌드로낙', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '리바이벌 글렌드로낙15', sm('하이랜드', ['PX', '올로로소'])],
  ['m_glendronach18', '글렌드로낙 알라다이스 18년', 'The GlenDronach Allardice 18 Year Old', '글렌드로낙', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '알라다이스 글렌드로낙18', sm('하이랜드', ['올로로소'])],
  ['m_talisker10', '탈리스커 10년', 'Talisker 10 Year Old', '탈리스커', '싱글몰트 스카치', 45.8, 700, '스코틀랜드', '싱글몰트 스카치', '탈리스커10 talisker', sm('아일랜드(스카이)', ['버번'], ['피티드', '해양성'])],
  ['m_talisker_storm', '탈리스커 스톰', 'Talisker Storm', '탈리스커', '싱글몰트 스카치', 45.8, 700, '스코틀랜드', '싱글몰트 스카치', '스톰', sm('아일랜드(스카이)', ['버번'], ['피티드', '해양성'])],
  ['m_lagavulin16', '라가불린 16년', 'Lagavulin 16 Year Old', '라가불린', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '라가불린16 lagavulin', sm('아일라', ['셰리', '버번'], ['피티드', '스모키'])],
  ['m_laphroaig10', '라프로익 10년', 'Laphroaig 10 Year Old', '라프로익', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '라프로익10 laphroaig', sm('아일라', ['버번'], ['피티드', '스모키'])],
  ['m_laphroaig_qc', '라프로익 쿼터 캐스크', 'Laphroaig Quarter Cask', '라프로익', '싱글몰트 스카치', 48, 700, '스코틀랜드', '싱글몰트 스카치', '쿼터캐스크', sm('아일라', ['버번'], ['피티드', '스모키'])],
  ['m_ardbeg10', '아드벡 10년', 'Ardbeg 10 Year Old', '아드벡', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '아드벡10 ardbeg', sm('아일라', ['버번'], ['피티드', '스모키'])],
  ['m_ardbeg_uigeadail', '아드벡 우거다일', 'Ardbeg Uigeadail', '아드벡', '싱글몰트 스카치', 54.2, 700, '스코틀랜드', '싱글몰트 스카치', '우가달 우거달', sm('아일라', ['셰리', '버번'], ['피티드', '캐스크 스트렝스'])],
  ['m_ardbeg_corry', '아드벡 코리브레칸', 'Ardbeg Corryvreckan', '아드벡', '싱글몰트 스카치', 57.1, 700, '스코틀랜드', '싱글몰트 스카치', '코리브레칸', sm('아일라', ['프렌치오크', '버번'], ['피티드', '캐스크 스트렝스'])],
  ['m_bowmore12', '보모어 12년', 'Bowmore 12 Year Old', '보모어', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '보모어12 bowmore', sm('아일라', ['셰리', '버번'], ['피티드'])],
  ['m_bowmore15', '보모어 15년', 'Bowmore 15 Year Old', '보모어', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '보모어15', sm('아일라', ['셰리', '버번'], ['피티드'])],
  ['m_caolila12', '카올 일라 12년', 'Caol Ila 12 Year Old', '카올일라', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '카올일라 caolila', sm('아일라', ['버번'], ['피티드', '스모키'])],
  ['m_bunnahabhain12', '부나하벤 12년', 'Bunnahabhain 12 Year Old', '부나하벤', '싱글몰트 스카치', 46.3, 700, '스코틀랜드', '싱글몰트 스카치', '부나하벤12', sm('아일라', ['셰리'], ['논피트', '해양성'])],
  ['m_bruichladdich_cl', '브룩라디 클래식 라디', 'Bruichladdich The Classic Laddie', '브룩라디', '싱글몰트 스카치', 50, 700, '스코틀랜드', '싱글몰트 스카치', '클래식라디 브룩라디', sm('아일라', ['버번'], ['논피트'])],
  ['m_portcharlotte10', '포트 샬롯 10년', 'Port Charlotte 10 Year Old', '브룩라디', '싱글몰트 스카치', 50, 700, '스코틀랜드', '싱글몰트 스카치', '포트샬롯', sm('아일라', ['버번', '와인'], ['피티드', '스모키'])],
  ['m_highlandpark12', '하이랜드 파크 12년', 'Highland Park 12 Year Old Viking Honour', '하이랜드파크', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '하이랜드파크12 highlandpark', sm('아일랜드(오크니)', ['셰리'], ['피티드'])],
  ['m_highlandpark18', '하이랜드 파크 18년', 'Highland Park 18 Year Old', '하이랜드파크', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '하이랜드파크18', sm('아일랜드(오크니)', ['셰리'], ['피티드'])],
  ['m_springbank10', '스프링뱅크 10년', 'Springbank 10 Year Old', '스프링뱅크', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '스프링뱅크10 springbank', sm('캠벨타운', ['셰리', '버번'], ['라이트 피티드'])],
  ['m_kilkerran12', '킬커란 12년', 'Kilkerran 12 Year Old', '글렌가일', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '킬커란', sm('캠벨타운', ['셰리', '버번'], ['라이트 피티드'])],
  ['m_oban14', '오반 14년', 'Oban 14 Year Old', '오반', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '오반14 oban', sm('하이랜드(해안)', ['버번'], ['논피트', '해양성'])],
  ['m_dalmore12', '달모어 12년', 'The Dalmore 12 Year Old', '달모어', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '달모어12 dalmore', sm('하이랜드', ['셰리', '버번'])],
  ['m_dalmore15', '달모어 15년', 'The Dalmore 15 Year Old', '달모어', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '달모어15', sm('하이랜드', ['셰리'])],
  ['m_glengoyne10', '글렌고인 10년', 'Glengoyne 10 Year Old', '글렌고인', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌고인 glengoyne', sm('하이랜드', ['셰리', '버번'])],
  ['m_clynelish14', '클라이넬리쉬 14년', 'Clynelish 14 Year Old', '클라이넬리쉬', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '클라이넬리시 clynelish', sm('하이랜드(해안)', ['버번'], ['논피트', '왁시'])],
  ['m_oldpulteney12', '올드 풀트니 12년', 'Old Pulteney 12 Year Old', '올드풀트니', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '올드풀트니', sm('하이랜드(해안)', ['버번'], ['논피트', '해양성'])],
  ['m_arran10', '아란 10년', 'Arran 10 Year Old', '아란', '싱글몰트 스카치', 46, 700, '스코틀랜드', '싱글몰트 스카치', '아란10 arran', sm('아일랜드(아란)', ['버번'])],
  ['m_tamdhu12', '탐듀 12년', 'Tamdhu 12 Year Old', '탐듀', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '탐듀', sm('스페이사이드', ['셰리', '올로로소'])],
  ['m_cragganmore12', '크라간모어 12년', 'Cragganmore 12 Year Old', '크라간모어', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '크라간모어', sm('스페이사이드', ['셰리', '버번'])],
  ['m_glenkinchie12', '글렌킨치 12년', 'Glenkinchie 12 Year Old', '글렌킨치', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '글렌킨치', sm('로우랜드', ['버번'])],
  ['m_auchentoshan12', '오켄토션 12년', 'Auchentoshan 12 Year Old', '오켄토션', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '오헨토션 auchentoshan', sm('로우랜드', ['셰리', '버번'], ['논피트', '삼중증류'])],
  ['m_benriach10', '벤리악 10년', 'The BenRiach The Original Ten', '벤리악', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '벤리악', sm('스페이사이드', ['셰리', '버번', '버진오크'])],
  ['m_singleton12', '싱글톤 더프타운 12년', 'The Singleton of Dufftown 12 Year Old', '싱글톤', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '싱글톤 singleton', sm('스페이사이드', ['셰리', '버번'])],
  ['m_cardhu12', '카듀 12년', 'Cardhu 12 Year Old', '카듀', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '카듀', sm('스페이사이드', ['버번'])],
  ['m_glenmorangie12', '글렌모렌지 디 오리지널 12년', 'Glenmorangie The Original 12 Year Old', '글렌모렌지', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌모렌지12 오리지널12', sm('하이랜드', ['버번'])],
  ['m_glenallachie10cs', '글렌알라키 10년 캐스크 스트렝스', 'The GlenAllachie 10 Year Old Cask Strength', '글렌알라키', '싱글몰트 스카치', 0, 700, '스코틀랜드', '싱글몰트 스카치', '글렌알라키10 캐스크스트렝스 cs', sm('스페이사이드', ['PX', '올로로소', '와인', '버진오크'], ['캐스크 스트렝스', '논피트'])],
  ['m_ballantine_glenburgie12', '발렌타인 싱글몰트 글렌버기 12년', "Ballantine's Single Malt Glenburgie 12 Year Old", '발렌타인', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '글렌버기 발렌타인싱글몰트', sm('스페이사이드', [])],
  ['m_glenfiddich14', '글렌피딕 14년 버번배럴', 'Glenfiddich 14 Year Old Bourbon Barrel Reserve', '글렌피딕', '싱글몰트 스카치', 43, 700, '스코틀랜드', '싱글몰트 스카치', '글피14 버번배럴', sm('스페이사이드', ['버번'])],
  ['m_macallan12tc', '맥캘란 트리플 캐스크 12년', 'The Macallan Triple Cask Matured 12 Years Old', '맥캘란', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '트리플캐스크 맥캘란트리플', sm('스페이사이드', ['셰리', '버번'])],
  ['m_balvenie12sb', '발베니 싱글배럴 12년', 'The Balvenie Single Barrel 12 Year Old First Fill', '발베니', '싱글몰트 스카치', 47.8, 700, '스코틀랜드', '싱글몰트 스카치', '발베니싱글배럴', sm('스페이사이드', ['버번'])],
  ['m_laphroaig_select', '라프로익 셀렉트', 'Laphroaig Select', '라프로익', '싱글몰트 스카치', 40, 700, '스코틀랜드', '싱글몰트 스카치', '라프로익셀렉트 select', sm('아일라', ['셰리', '버번', '버진오크'], ['피티드', '스모키'])],
  ['m_talisker_skye', '탈리스커 스카이', 'Talisker Skye', '탈리스커', '싱글몰트 스카치', 45.8, 700, '스코틀랜드', '싱글몰트 스카치', '탈리스커스카이 skye', sm('아일랜드(스카이)', ['버번'], ['피티드', '해양성'])],
];

/* ── 위스키: 블렌디드 스카치 ── */
const WHISKY_SCOTCH_BLEND: Row[] = [
  ['m_jw_red', '조니워커 레드라벨', 'Johnnie Walker Red Label', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '조니레드 조니워커레드 jwred', sb()],
  ['m_jw_black', '조니워커 블랙라벨 12년', 'Johnnie Walker Black Label 12 Year Old', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '조니블랙 조니워커블랙 jwblack johnnieblack 블랙라벨', sb(['스모키'])],
  ['m_jw_double', '조니워커 더블블랙', 'Johnnie Walker Double Black', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '더블블랙 조니더블블랙', sb(['스모키', '피티드'])],
  ['m_jw_green', '조니워커 그린라벨 15년', 'Johnnie Walker Green Label 15 Year Old', '조니워커', '블렌디드 몰트 스카치', 43, 700, '스코틀랜드', '블렌디드 스카치', '조니그린 그린라벨 jwgreen', bm(['스모키', '피티드'])],
  ['m_jw_gold', '조니워커 골드라벨 리저브', 'Johnnie Walker Gold Label Reserve', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '조니골드 골드라벨', sb(['스모키'])],
  ['m_jw_blue', '조니워커 블루라벨', 'Johnnie Walker Blue Label', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '조니블루 블루라벨 jwblue', sb(['스모키'])],
  ['m_ballantine_f', '발렌타인 파이니스트', "Ballantine's Finest", '발렌타인', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '발렌타인 파이니스트 ballantines', sb()],
  ['m_ballantine12', '발렌타인 12년', "Ballantine's 12 Year Old", '발렌타인', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '발렌타인12', sb()],
  ['m_ballantine17', '발렌타인 17년', "Ballantine's 17 Year Old", '발렌타인', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '발렌타인17', sb()],
  ['m_ballantine21', '발렌타인 21년', "Ballantine's 21 Year Old", '발렌타인', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '발렌타인21', sb()],
  ['m_ballantine30', '발렌타인 30년', "Ballantine's 30 Year Old", '발렌타인', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '발렌타인30', sb()],
  ['m_chivas12', '시바스 리갈 12년', 'Chivas Regal 12 Year Old', '시바스리갈', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '시바스12 chivas12', sb()],
  ['m_chivas18', '시바스 리갈 18년', 'Chivas Regal 18 Year Old', '시바스리갈', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '시바스18', sb()],
  ['m_royalsalute21', '로얄 살루트 21년', 'Royal Salute 21 Year Old', '로얄살루트', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '로얄살루트 royalsalute', sb()],
  ['m_dewars_white', '듀어스 화이트라벨', "Dewar's White Label", '듀어스', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '듀어스 dewars', sb()],
  ['m_dewars12', '듀어스 12년', "Dewar's 12 Year Old", '듀어스', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '듀어스12', sb(['더블 에이징'])],
  ['m_dewars15', '듀어스 15년', "Dewar's 15 Year Old", '듀어스', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '듀어스15', sb(['더블 에이징'])],
  ['m_monkeyshoulder', '몽키 숄더', 'Monkey Shoulder', '몽키숄더', '블렌디드 몰트 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '몽키숄더 monkeyshoulder', bm()],
  ['m_famousgrouse', '페이머스 그라우스', 'The Famous Grouse', '페이머스그라우스', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '그라우스 famousgrouse', sb()],
  ['m_cuttysark', '커티 삭', 'Cutty Sark', '커티삭', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '커티삭 cuttysark', sb()],
  ['m_jnb', 'J&B 레어', 'J&B Rare', 'J&B', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '제이앤비 jb', sb()],
  ['m_grants', '그란츠 트리플우드', "Grant's Triple Wood", '그란츠', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '그란츠 grants', sb()],
  ['m_whitehorse', '화이트 호스', 'White Horse', '화이트호스', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '화이트호스 whitehorse', sb(['스모키'])],
  ['m_oldparr12', '올드 파 12년', 'Old Parr 12 Year Old', '올드파', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '올드파 oldparr', sb()],
  ['m_windsor12', '윈저 12년', 'Windsor 12 Year Old', '윈저', '블렌디드 스카치', 40, 500, '스코틀랜드', '블렌디드 스카치', '윈저 windsor', sb()],
  ['m_imperial17', '임페리얼 17년', 'Imperial 17 Year Old', '임페리얼', '블렌디드 스카치', 40, 500, '스코틀랜드', '블렌디드 스카치', '임페리얼 imperial', sb()],
  ['m_jw_ruby', '조니워커 블랙 루비', 'Johnnie Walker Black Ruby', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '블랙루비 조니루비 jwruby', { origin: '스카치', type: '블렌디드', cask: ['PX', '올로로소', '와인', '버번'], character: [] }],
  ['m_jw_blonde', '조니워커 블론드', 'Johnnie Walker Blonde', '조니워커', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '블론드 조니블론드', sb()],
  ['m_chivas_mizunara', '시바스 리갈 미즈나라 12년', 'Chivas Regal Mizunara 12 Year Old', '시바스리갈', '블렌디드 스카치', 40, 700, '스코틀랜드', '블렌디드 스카치', '미즈나라 시바스미즈나라', { origin: '스카치', type: '블렌디드', cask: ['미즈나라'], character: [] }],
  ['m_goldenblue_sapphire', '골든블루 사파이어', 'Golden Blue Sapphire', '골든블루', '블렌디드 위스키', 0, 450, '한국', '블렌디드 스카치', '골든블루 사파이어', { origin: '코리안', type: '블렌디드', cask: [], character: [] }],
  ['m_scotchblue17', '스카치블루 인터내셔널 17년', 'Scotch Blue International 17', '스카치블루', '블렌디드 위스키', 0, 450, '한국', '블렌디드 스카치', '스카치블루 scotchblue', { origin: '코리안', type: '블렌디드', cask: [], character: [] }],
];

/* ── 위스키: 아메리칸 ── */
const WHISKY_AMERICAN: Row[] = [
  ['m_jimbeam_white', '짐빔 화이트', 'Jim Beam White Label', '짐빔', '스트레이트 버번', 40, 700, '미국', '버번', '짐빔 jimbeam', bb('스트레이트 버번')],
  ['m_jimbeam_black', '짐빔 블랙', 'Jim Beam Black Extra Aged', '짐빔', '스트레이트 버번', 43, 700, '미국', '버번', '짐빔블랙', bb('스트레이트 버번')],
  ['m_jimbeam_devils', '짐빔 데블스컷', "Jim Beam Devil's Cut", '짐빔', '스트레이트 버번', 45, 700, '미국', '버번', '데블스컷', bb('스트레이트 버번')],
  ['m_makers', '메이커스 마크', "Maker's Mark", '메이커스마크', '휘티드 버번', 45, 700, '미국', '버번', '메이커스 makersmark 메이커스마크', bb('휘티드 버번', ['휘티드'])],
  ['m_makers46', '메이커스 마크 46', "Maker's Mark 46", '메이커스마크', '휘티드 버번', 47, 700, '미국', '버번', '메이커스46', bb('휘티드 버번', ['휘티드', '프렌치오크 스테이브'])],
  ['m_buffalotrace', '버팔로 트레이스', 'Buffalo Trace', '버팔로트레이스', '스트레이트 버번', 45, 750, '미국', '버번', '버팔로 buffalotrace', bb('스트레이트 버번')],
  ['m_eaglerare10', '이글 레어 10년', 'Eagle Rare 10 Year Old', '이글레어', '스트레이트 버번', 45, 750, '미국', '버번', '이글레어 eaglerare', bb('스트레이트 버번')],
  ['m_blantons', '블랑톤스 오리지널', 'Blanton’s Original Single Barrel', '블랑톤스', '싱글 배럴 버번', 46.5, 750, '미국', '버번', '블랑톤 blantons', bb('싱글 배럴 버번')],
  ['m_weller_special', '웰러 스페셜 리저브', 'W.L. Weller Special Reserve', '웰러', '휘티드 버번', 45, 750, '미국', '버번', '웰러 weller', bb('휘티드 버번', ['휘티드'])],
  ['m_weller107', '웰러 앤티크 107', 'W.L. Weller Antique 107', '웰러', '휘티드 버번', 53.5, 750, '미국', '버번', '웰러107 앤티크107', bb('휘티드 버번', ['휘티드', '하이프루프'])],
  ['m_woodford', '우드포드 리저브', 'Woodford Reserve Distiller’s Select', '우드포드리저브', '스트레이트 버번', 43.2, 700, '미국', '버번', '우드포드 woodford', bb('스트레이트 버번')],
  ['m_wildturkey81', '와일드 터키 81', 'Wild Turkey 81', '와일드터키', '스트레이트 버번', 40.5, 700, '미국', '버번', '와일드터키81', bb('스트레이트 버번')],
  ['m_wildturkey101', '와일드 터키 101', 'Wild Turkey 101', '와일드터키', '스트레이트 버번', 50.5, 700, '미국', '버번', '와일드터키101 wildturkey', bb('스트레이트 버번', ['하이프루프'])],
  ['m_russell10', '러셀 리저브 10년', "Russell's Reserve 10 Year Old", '러셀리저브', '스트레이트 버번', 45, 750, '미국', '버번', '러셀리저브', bb('스트레이트 버번')],
  ['m_knobcreek9', '놉 크릭 9년', 'Knob Creek 9 Year Old', '놉크릭', '스트레이트 버번', 50, 750, '미국', '버번', '놉크릭 knobcreek', bb('스트레이트 버번', ['하이프루프'])],
  ['m_bakers', '베이커스 7년', "Baker's 7 Year Old", '베이커스', '싱글 배럴 버번', 53.5, 750, '미국', '버번', '베이커스', bb('싱글 배럴 버번')],
  ['m_basilhayden', '베이슬 헤이든', "Basil Hayden's", '베이슬헤이든', '스트레이트 버번', 40, 750, '미국', '버번', '베이슬헤이든 바질헤이든', bb('스트레이트 버번')],
  ['m_bulleit', '불릿 버번', 'Bulleit Bourbon', '불릿', '스트레이트 버번', 45, 750, '미국', '버번', '불렛 bulleit', bb('스트레이트 버번', ['하이라이'])],
  ['m_bulleit_rye', '불릿 라이', 'Bulleit Rye', '불릿', '스트레이트 라이', 45, 750, '미국', '라이 위스키', '불렛라이', { origin: '아메리칸', type: '스트레이트 라이', region: '켄터키', cask: ['뉴 차드 오크'], character: [] }],
  ['m_fourroses', '포 로지스', 'Four Roses', '포로지스', '스트레이트 버번', 40, 700, '미국', '버번', '포로즈 fourroses', bb('스트레이트 버번')],
  ['m_fourroses_sb', '포 로지스 스몰배치', 'Four Roses Small Batch', '포로지스', '스트레이트 버번', 45, 700, '미국', '버번', '포로지스스몰배치', bb('스트레이트 버번')],
  ['m_elijah_sb', '엘라이자 크레이그 스몰배치', 'Elijah Craig Small Batch', '엘라이자크레이그', '스트레이트 버번', 47, 750, '미국', '버번', '엘리자크레이그 elijahcraig', bb('스트레이트 버번')],
  ['m_rittenhouse', '리튼하우스 라이', 'Rittenhouse Rye Bottled-in-Bond', '리튼하우스', '스트레이트 라이', 50, 750, '미국', '라이 위스키', '리튼하우스', { origin: '아메리칸', type: '스트레이트 라이', region: '켄터키', cask: ['뉴 차드 오크'], character: ['보틀드 인 본드'] }],
  ['m_sazerac_rye', '사제락 라이', 'Sazerac Rye', '사제락', '스트레이트 라이', 45, 750, '미국', '라이 위스키', '사제락', { origin: '아메리칸', type: '스트레이트 라이', region: '켄터키', cask: ['뉴 차드 오크'], character: [] }],
  ['m_jackdaniels', '잭 다니엘스 올드 No.7', "Jack Daniel's Old No.7", '잭다니엘스', '테네시 위스키', 40, 700, '미국', '테네시', '잭다니엘 잭콕 jackdaniels jd', { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] }],
  ['m_gentlemanjack', '젠틀맨 잭', 'Gentleman Jack', '잭다니엘스', '테네시 위스키', 40, 700, '미국', '테네시', '젠틀맨잭', { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] }],
  ['m_jd_singlebarrel', '잭 다니엘스 싱글 배럴', "Jack Daniel's Single Barrel Select", '잭다니엘스', '테네시 위스키', 45, 700, '미국', '테네시', '잭다니엘싱글배럴', { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] }],
  ['m_georgedickel12', '조지 디켈 12년', 'George Dickel No.12', '조지디켈', '테네시 위스키', 45, 750, '미국', '테네시', '조지디켈', { origin: '테네시', type: '테네시 위스키', cask: ['뉴 차드 오크'], character: ['차콜 멜로잉'] }],
  ['m_wildturkey8', '와일드 터키 8년', 'Wild Turkey 8 Year Old 101 Proof', '와일드터키', '스트레이트 버번', 50.5, 700, '미국', '버번', '와일드터키8 101프루프', bb('스트레이트 버번', ['하이프루프'])],
  ['m_canadian_club', '캐나디안 클럽', 'Canadian Club', '캐나디안클럽', '캐나디안 위스키', 40, 700, '캐나다', '버번 또는 라이', '캐나디안클럽 canadianclub', { origin: '캐나디안', type: '블렌디드', cask: [], character: [] }],
  ['m_crown_royal', '크라운 로얄', 'Crown Royal', '크라운로얄', '캐나디안 위스키', 40, 750, '캐나다', '버번 또는 라이', '크라운로얄 crownroyal', { origin: '캐나디안', type: '블렌디드', cask: [], character: [] }],
];

/* ── 위스키: 아이리시 · 재패니즈 · 코리안 · 월드 ── */
const WHISKY_WORLD: Row[] = [
  ['m_jameson', '제임슨', 'Jameson Irish Whiskey', '제임슨', '블렌디드 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '제임슨 jameson', ir('블렌디드', ['버번', '셰리'], ['논피트', '삼중증류'])],
  ['m_jameson_bb', '제임슨 블랙 배럴', 'Jameson Black Barrel', '제임슨', '블렌디드 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '블랙배럴', ir('블렌디드', ['버번', '셰리'], ['논피트', '삼중증류'])],
  ['m_bushmills', '부시밀즈 오리지널', 'Bushmills Original', '부시밀즈', '블렌디드 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '부시밀 bushmills', ir('블렌디드', ['버번'], ['논피트', '삼중증류'])],
  ['m_bushmills10', '부시밀즈 10년 싱글몰트', 'Bushmills 10 Year Old Single Malt', '부시밀즈', '싱글몰트 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '부시밀즈10', ir('싱글몰트', ['버번', '셰리'], ['논피트', '삼중증류'])],
  ['m_redbreast12', '레드브레스트 12년', 'Redbreast 12 Year Old', '레드브레스트', '싱글 팟 스틸', 40, 700, '아일랜드', '아이리시 위스키', '레드브레스트', ir('싱글 팟 스틸', ['셰리', '버번'])],
  ['m_tullamore', '털러모어 듀', 'Tullamore D.E.W.', '털러모어듀', '블렌디드 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '툴라모어 tullamore', ir('블렌디드', ['버번', '셰리'], ['논피트', '삼중증류'])],
  ['m_connemara', '코네마라 피티드', 'Connemara Peated Single Malt', '코네마라', '싱글몰트 아이리시', 40, 700, '아일랜드', '아이리시 위스키', '코네마라', ir('싱글몰트', ['버번'], ['피티드'])],
  ['m_kakubin', '산토리 가쿠빈', 'Suntory Kakubin', '산토리', '블렌디드 재패니즈', 40, 700, '일본', '', '가쿠빈 각병 kakubin 하이볼', jp('블렌디드')],
  ['m_toki', '산토리 토키', 'Suntory Whisky Toki', '산토리', '블렌디드 재패니즈', 43, 700, '일본', '', '토키 toki', jp('블렌디드')],
  ['m_hibiki_harmony', '히비키 하모니', 'Hibiki Japanese Harmony', '산토리', '블렌디드 재패니즈', 43, 700, '일본', '', '히비키 hibiki', jp('블렌디드', ['미즈나라'])],
  ['m_yamazaki12', '야마자키 12년', 'Yamazaki 12 Year Old', '산토리', '싱글몰트 재패니즈', 43, 700, '일본', '', '야마자키 yamazaki', jp('싱글몰트', ['셰리', '미즈나라', '버번'])],
  ['m_hakushu12', '하쿠슈 12년', 'Hakushu 12 Year Old', '산토리', '싱글몰트 재패니즈', 43, 700, '일본', '', '하쿠슈 hakushu', jp('싱글몰트', ['버번'], ['라이트 피티드'])],
  ['m_chita', '산토리 치타', 'The Chita Single Grain', '산토리', '싱글 그레인 재패니즈', 43, 700, '일본', '', '치타 chita', jp('싱글 그레인', ['와인', '셰리'])],
  ['m_nikka_ftb', '닛카 프롬 더 배럴', 'Nikka From The Barrel', '닛카', '블렌디드 재패니즈', 51.4, 500, '일본', '', '프롬더배럴 ftb nikka', jp('블렌디드', [], ['하이프루프'])],
  ['m_nikka_coffey', '닛카 카페 그레인', 'Nikka Coffey Grain', '닛카', '싱글 그레인 재패니즈', 45, 700, '일본', '', '카페그레인 코페이', jp('싱글 그레인', ['버번'])],
  ['m_yoichi', '닛카 요이치', 'Yoichi Single Malt', '닛카', '싱글몰트 재패니즈', 45, 700, '일본', '', '요이치 yoichi', jp('싱글몰트', [], ['피티드', '해양성'])],
  ['m_miyagikyo', '닛카 미야기쿄', 'Miyagikyo Single Malt', '닛카', '싱글몰트 재패니즈', 45, 700, '일본', '', '미야기쿄 miyagikyo', jp('싱글몰트', ['셰리'])],
  ['m_kiwon_tiger', '기원 호랑이', 'Ki One Tiger Edition', '쓰리소사이어티스', '싱글몰트 코리안', 56.2, 700, '한국', '한국 싱글몰트', '기원 호랑이 kione', { origin: '코리안', type: '싱글몰트', cask: ['와인', '셰리'], character: ['캐스크 스트렝스'] }],
  ['m_kiwon_eagle', '기원 독수리', 'Ki One Eagle Edition', '쓰리소사이어티스', '싱글몰트 코리안', 0, 700, '한국', '한국 싱글몰트', '기원독수리', { origin: '코리안', type: '싱글몰트', cask: ['버번', '버진오크'], character: [] }],
  ['m_kimchangsoo', '김창수 위스키', 'Kim Chang Soo Whisky', '김창수위스키증류소', '싱글몰트 코리안', 0, 500, '한국', '한국 싱글몰트', '김창수 kcs'],
];

/* ── 진 ── */
const GIN: Row[] = [
  ['m_bombay_sapphire', '봄베이 사파이어', 'Bombay Sapphire', '봄베이', '런던 드라이 진', 40, 700, '영국', '런던 드라이 진', '봄베이 사파이어 bombay'],
  ['m_tanqueray', '탱커레이 런던 드라이', 'Tanqueray London Dry Gin', '탱커레이', '런던 드라이 진', 43.1, 700, '영국', '런던 드라이 진', '탱커레이 tanqueray'],
  ['m_tanqueray10', '탱커레이 No.TEN', 'Tanqueray No. TEN', '탱커레이', '런던 드라이 진', 47.3, 700, '영국', '런던 드라이 진', '탱커레이텐 넘버텐 no10 tanqueray10'],
  ['m_hendricks', '헨드릭스', "Hendrick's Gin", '헨드릭스', '컨템포러리 진', 41.4, 700, '영국', '런던 드라이 진', '헨드릭 hendricks'],
  ['m_beefeater', '비피터 런던 드라이', 'Beefeater London Dry Gin', '비피터', '런던 드라이 진', 40, 700, '영국', '런던 드라이 진', '비피터 beefeater'],
  ['m_gordons', '고든스 런던 드라이', "Gordon's London Dry Gin", '고든스', '런던 드라이 진', 37.5, 700, '영국', '런던 드라이 진', '고든스 gordons'],
  ['m_monkey47', '몽키 47', 'Monkey 47 Schwarzwald Dry Gin', '몽키47', '드라이 진', 47, 500, '독일', '런던 드라이 진', '몽키47 monkey47'],
  ['m_roku', '로쿠 진', 'Roku Gin', '산토리', '재패니즈 크래프트 진', 43, 700, '일본', '런던 드라이 진', '로쿠 roku'],
  ['m_botanist', '더 보태니스트', 'The Botanist Islay Dry Gin', '브룩라디', '드라이 진', 46, 700, '스코틀랜드', '런던 드라이 진', '보타니스트 botanist'],
  ['m_plymouth', '플리머스 진', 'Plymouth Gin', '플리머스', '플리머스 진', 41.2, 700, '영국', '런던 드라이 진', '플리머스 plymouth'],
  ['m_ginmare', '진 마레', 'Gin Mare', '진마레', '메디터레이니언 진', 42.7, 700, '스페인', '런던 드라이 진', '진마레 ginmare'],
  ['m_citadelle', '시타델 진', 'Citadelle Gin', '시타델', '드라이 진', 44, 700, '프랑스', '런던 드라이 진', '시타델 citadelle'],
  ['m_nordes', '노르데스', 'Nordés Atlantic Galician Gin', '노르데스', '컨템포러리 진', 40, 700, '스페인', '런던 드라이 진', '노르데스 nordes'],
  ['m_hayman_oldtom', '헤이맨스 올드 톰 진', "Hayman's Old Tom Gin", '헤이맨스', '올드 톰 진', 41.4, 700, '영국', '올드 톰 진', '올드톰 oldtom 헤이맨스'],
  ['m_buja', '부자진', 'Buja Gin', '부자진', '크래프트 진', 44, 0, '한국', '런던 드라이 진', '부자 진 bujagin 양평'],
  ['m_tanqueray_sevilla', '탱커레이 플로어 드 세비야', 'Tanqueray Flor de Sevilla', '탱커레이', '플레이버드 진', 41.3, 700, '영국', '런던 드라이 진', '세비야 탱커레이세비야'],
];

/* ── 보드카 ── */
const VODKA: Row[] = [
  ['m_absolut', '앱솔루트', 'Absolut Vodka', '앱솔루트', '플레인 보드카', 40, 700, '스웨덴', '플레인 보드카', '압솔루트 absolut'],
  ['m_absolut_citron', '앱솔루트 시트론', 'Absolut Citron', '앱솔루트', '가향 보드카', 40, 700, '스웨덴', '보드카 시트론', '시트론 citron'],
  ['m_smirnoff', '스미노프 레드', 'Smirnoff No.21 Red', '스미노프', '플레인 보드카', 40, 700, '영국', '플레인 보드카', '스미노프 smirnoff'],
  ['m_greygoose', '그레이 구스', 'Grey Goose', '그레이구스', '플레인 보드카', 40, 700, '프랑스', '플레인 보드카', '그레이구스 greygoose'],
  ['m_belvedere', '벨베데어', 'Belvedere Vodka', '벨베데어', '플레인 보드카', 40, 700, '폴란드', '플레인 보드카', '벨베데레 belvedere'],
  ['m_titos', '티토스 핸드메이드', "Tito's Handmade Vodka", '티토스', '플레인 보드카', 40, 750, '미국', '플레인 보드카', '티토스 titos'],
  ['m_ketelone', '케텔 원', 'Ketel One', '케텔원', '플레인 보드카', 40, 700, '네덜란드', '플레인 보드카', '케텔원 ketelone'],
  ['m_stoli', '스톨리치나야', 'Stolichnaya', '스톨리치나야', '플레인 보드카', 40, 700, '라트비아', '플레인 보드카', '스톨리 stoli'],
  ['m_ciroc', '시락', 'Cîroc', '시락', '플레인 보드카', 40, 700, '프랑스', '플레인 보드카', '시록 ciroc'],
  ['m_skyy', '스카이 보드카', 'SKYY Vodka', '스카이', '플레인 보드카', 40, 750, '미국', '플레인 보드카', '스카이 skyy'],
  ['m_kirkland_french', '커클랜드 프렌치 보드카', 'Kirkland Signature French Vodka', '커클랜드', '플레인 보드카', 40, 1750, '프랑스', '플레인 보드카', '커클랜드 코스트코 kirkland'],
  ['m_absolut_vanilla', '앱솔루트 바닐라', 'Absolut Vanilia', '앱솔루트', '플레이버드 보드카', 40, 700, '스웨덴', '플레인 보드카', '앱솔루트바닐라 바닐라보드카'],
  ['m_russian_standard', '러시안 스탠다드', 'Russian Standard Original', '러시안스탠다드', '플레인 보드카', 40, 700, '러시아', '플레인 보드카', '러시안스탠다드 russianstandard'],
];

/* ── 럼 ── */
const RUM: Row[] = [
  ['m_bacardi_blanca', '바카디 카르타 블랑카', 'Bacardí Carta Blanca', '바카디', '화이트 럼', 37.5, 700, '푸에르토리코', '화이트 럼', '바카디 화이트럼 bacardi'],
  ['m_bacardi_oro', '바카디 카르타 오로', 'Bacardí Carta Oro', '바카디', '골드 럼', 37.5, 700, '푸에르토리코', '골드 럼', '바카디골드'],
  ['m_bacardi_negra', '바카디 카르타 네그라', 'Bacardí Carta Negra', '바카디', '다크 럼', 37.5, 700, '푸에르토리코', '자메이카 럼(앰버/블랙스트랩)', '바카디블랙'],
  ['m_havana3', '하바나 클럽 3년', 'Havana Club Añejo 3 Años', '하바나클럽', '화이트 럼', 40, 700, '쿠바', '쿠바산 화이트 럼', '하바나클럽 havana'],
  ['m_havana7', '하바나 클럽 7년', 'Havana Club Añejo 7 Años', '하바나클럽', '다크 럼', 40, 700, '쿠바', '골드 럼', '하바나7'],
  ['m_captain_spiced', '캡틴 모건 스파이스드 골드', 'Captain Morgan Original Spiced Gold', '캡틴모건', '스파이스드 럼', 35, 700, '영국', '골드 럼', '캡틴모건 captainmorgan'],
  ['m_malibu', '말리부', 'Malibu Original', '말리부', '코코넛 럼 리큐르', 21, 700, '바베이도스', '코코넛 럼', '말리부 malibu'],
  ['m_myers', '마이어스 다크', "Myers's Original Dark", '마이어스', '다크 럼', 40, 700, '자메이카', '자메이카 럼(앰버/블랙스트랩)', '마이어스 myers'],
  ['m_appleton_signature', '애플턴 시그니처', 'Appleton Estate Signature', '애플턴', '골드 럼', 40, 700, '자메이카', '자메이카 럼(앰버/블랙스트랩)', '애플턴 appleton'],
  ['m_plantation3', '플랜테이션 3 스타', 'Plantation 3 Stars', '플랜테이션', '화이트 럼', 41.2, 700, '바베이도스', '화이트 럼', '플랜테이션 plantation'],
  ['m_diplomatico', '디플로마티코 리제르바 엑스클루시바', 'Diplomático Reserva Exclusiva', '디플로마티코', '다크 럼', 40, 700, '베네수엘라', '골드 럼', '디플로마티코 diplomatico'],
  ['m_zacapa23', '자카파 23', 'Ron Zacapa 23', '자카파', '다크 럼', 40, 700, '과테말라', '골드 럼', '자카파 zacapa'],
  ['m_goslings', '고슬링스 블랙 씰', "Gosling's Black Seal", '고슬링스', '블랙 럼', 40, 700, '버뮤다', '자메이카 럼(앰버/블랙스트랩)', '고슬링 다크앤스토미 goslings'],
  ['m_pampero', '팜페로 아니베르사리오', 'Pampero Aniversario', '팜페로', '다크 럼', 40, 700, '베네수엘라', '골드 럼', '팜페로 pampero'],
  ['m_leblon', '레블론 카샤사', 'Leblon Cachaça', '레블론', '카샤사', 40, 700, '브라질', '카샤사', '카샤사 카이피리냐 leblon'],
  ['m_kraken', '크라켄 블랙 스파이스드 럼', 'The Kraken Black Spiced Rum', '크라켄', '스파이스드 럼', 40, 700, '트리니다드토바고', '골드 럼', '크라켄 kraken'],
];

/* ── 데킬라 · 메즈칼 ── */
const TEQUILA: Row[] = [
  ['m_cuervo_gold', '호세 쿠엘보 에스페셜 골드', 'Jose Cuervo Especial Gold', '호세쿠엘보', '데킬라 골드(믹스토)', 38, 700, '멕시코', '데킬라', '호세쿠엘보 쿠엘보 josecuervo'],
  ['m_cuervo_silver', '호세 쿠엘보 에스페셜 실버', 'Jose Cuervo Especial Silver', '호세쿠엘보', '데킬라 실버(믹스토)', 38, 700, '멕시코', '데킬라', '쿠엘보실버'],
  ['m_cuervo_trad', '호세 쿠엘보 트라디시오날 실버', 'Jose Cuervo Tradicional Silver', '호세쿠엘보', '블랑코 데킬라', 38, 700, '멕시코', '100% 아가베 데킬라', '트라디시오날'],
  ['m_olmeca_blanco', '올메카 블랑코', 'Olmeca Blanco', '올메카', '데킬라 블랑코(믹스토)', 38, 700, '멕시코', '데킬라', '올메카 olmeca'],
  ['m_altos_plata', '올메카 알토스 플라타', 'Olmeca Altos Plata', '올메카', '블랑코 데킬라', 38, 700, '멕시코', '100% 아가베 데킬라', '알토스 altos'],
  ['m_donjulio_blanco', '돈 훌리오 블랑코', 'Don Julio Blanco', '돈훌리오', '블랑코 데킬라', 38, 700, '멕시코', '100% 아가베 데킬라', '돈훌리오 donjulio'],
  ['m_donjulio_repo', '돈 훌리오 레포사도', 'Don Julio Reposado', '돈훌리오', '레포사도 데킬라', 38, 700, '멕시코', '레포사도 데킬라(100% 아가베)', '돈훌리오레포'],
  ['m_donjulio1942', '돈 훌리오 1942', 'Don Julio 1942', '돈훌리오', '아녜호 데킬라', 38, 750, '멕시코', '100% 아가베 데킬라', '1942'],
  ['m_patron_silver', '패트론 실버', 'Patrón Silver', '패트론', '블랑코 데킬라', 40, 700, '멕시코', '100% 아가베 데킬라', '패트론 patron'],
  ['m_herradura_plata', '에라두라 플라타', 'Herradura Plata', '에라두라', '블랑코 데킬라', 40, 700, '멕시코', '100% 아가베 데킬라', '에라두라 herradura'],
  ['m_casamigos_blanco', '카사미고스 블랑코', 'Casamigos Blanco', '카사미고스', '블랑코 데킬라', 40, 700, '멕시코', '100% 아가베 데킬라', '카사미고스 casamigos'],
  ['m_eljimador', '엘 히마도르 블랑코', 'el Jimador Blanco', '엘히마도르', '블랑코 데킬라', 38, 700, '멕시코', '100% 아가베 데킬라', '히마도르 jimador'],
  ['m_1800_silver', '1800 실버', '1800 Silver', '1800', '블랑코 데킬라', 38, 750, '멕시코', '100% 아가베 데킬라', '1800실버 천팔백'],
];

const MEZCAL: Row[] = [
  ['m_delmaguey_vida', '델 마게이 비다', 'Del Maguey Vida', '델마게이', '메즈칼 호벤', 42, 700, '멕시코', '메즈칼', '비다 델마게이 delmaguey'],
  ['m_monte_alban', '몬테 알반', 'Monte Albán Mezcal', '몬테알반', '메즈칼', 40, 700, '멕시코', '메즈칼', '몬테알반'],
];

/* ── 브랜디 · 코냑 ── */
const BRANDY: Row[] = [
  ['m_hennessy_vs', '헤네시 VS', 'Hennessy V.S', '헤네시', '코냑 VS', 40, 700, '프랑스', '코냑', '헤네시 hennessy vs'],
  ['m_hennessy_vsop', '헤네시 VSOP', 'Hennessy V.S.O.P Privilège', '헤네시', '코냑 VSOP', 40, 700, '프랑스', '코냑', '헤네시vsop'],
  ['m_hennessy_xo', '헤네시 XO', 'Hennessy X.O', '헤네시', '코냑 XO', 40, 700, '프랑스', '코냑', '헤네시xo'],
  ['m_remy_vsop', '레미 마틴 VSOP', 'Rémy Martin V.S.O.P', '레미마틴', '코냑 VSOP', 40, 700, '프랑스', '코냑', '레미마틴 remy'],
  ['m_remy_xo', '레미 마틴 XO', 'Rémy Martin X.O', '레미마틴', '코냑 XO', 40, 700, '프랑스', '코냑', '레미xo'],
  ['m_martell_vsop', '마르텔 VSOP', 'Martell V.S.O.P', '마르텔', '코냑 VSOP', 40, 700, '프랑스', '코냑', '마르텔 martell'],
  ['m_martell_cb', '마르텔 코르동 블루', 'Martell Cordon Bleu', '마르텔', '코냑 XO급', 40, 700, '프랑스', '코냑', '코르동블루 cordonbleu'],
  ['m_courvoisier_vsop', '쿠르부아지에 VSOP', 'Courvoisier V.S.O.P', '쿠르부아지에', '코냑 VSOP', 40, 700, '프랑스', '코냑', '쿠르부아지에 courvoisier'],
  ['m_camus_vsop', '까뮤 VSOP', 'Camus V.S.O.P', '까뮤', '코냑 VSOP', 40, 700, '프랑스', '코냑', '까뮤 camus'],
  ['m_stremy_xo', '생 레미 XO', 'St-Rémy X.O', '생레미', '브랜디 XO', 40, 700, '프랑스', 'XO 브랜디(코냑 외)', '생레미 stremy'],
  ['m_boulard_vsop', '불라드 칼바도스 VSOP', 'Boulard Calvados V.S.O.P', '불라드', '칼바도스', 40, 700, '프랑스', '칼바도스', '칼바도스 boulard'],
  ['m_nonino_grappa', '노니노 그라파', 'Nonino Grappa', '노니노', '그라파', 41, 700, '이탈리아', '그라파', '그라파 grappa'],
  ['m_pisco_abuel', '피스코 포르톤', 'Pisco Portón', '포르톤', '피스코', 43, 700, '페루', '피스코', '피스코 pisco'],
];

/* ── 리큐르 (비터·아페리티프 포함) ── */
const LIQUEUR: Row[] = [
  ['m_cointreau', '코앵트로', 'Cointreau', '코앵트로', '오렌지 리큐르', 40, 700, '프랑스', '코앵트로', '쿠앵트로 코인트로 cointreau'],
  ['m_grandmarnier', '그랑 마르니에 코르동 루즈', 'Grand Marnier Cordon Rouge', '그랑마르니에', '오렌지 리큐르', 40, 700, '프랑스', '그랑 마르니에', '그랑마니에 grandmarnier'],
  ['m_bols_triplesec', '볼스 트리플 섹', 'Bols Triple Sec', '볼스', '오렌지 리큐르', 38, 700, '네덜란드', '트리플 섹', '트리플섹 triplesec'],
  ['m_bols_blue', '볼스 블루 큐라소', 'Bols Blue Curaçao', '볼스', '오렌지 리큐르', 21, 700, '네덜란드', '블루 큐라소', '블루큐라소 bluecuracao'],
  ['m_disaronno', '디사론노 아마레토', 'Disaronno Originale', '디사론노', '아몬드 리큐르', 28, 700, '이탈리아', '아마레토', '디사론노 아마레토 disaronno amaretto'],
  ['m_kahlua', '깔루아', 'Kahlúa', '깔루아', '커피 리큐르', 20, 700, '멕시코', '깔루아(커피 리큐르)', '칼루아 kahlua'],
  ['m_tiamaria', '티아 마리아', 'Tia Maria', '티아마리아', '커피 리큐르', 20, 700, '이탈리아', '깔루아(커피 리큐르)', '티아마리아 tiamaria'],
  ['m_baileys', '베일리스 오리지널', 'Baileys Original Irish Cream', '베일리스', '크림 리큐르', 17, 700, '아일랜드', '아이리시 크림(베일리스)', '베일리스 bailey baileys'],
  ['m_midori', '미도리', 'Midori Melon Liqueur', '미도리', '멜론 리큐르', 20, 700, '일본', '미도리', '미도리 midori'],
  ['m_peachtree', '디카이퍼 피치트리', 'De Kuyper Peachtree', '디카이퍼', '피치 리큐르', 15, 700, '네덜란드', '피치 슈납스', '피치트리 복숭아 peachtree'],
  ['m_chartreuse_green', '그린 샤르트뢰즈', 'Chartreuse Verte', '샤르트뢰즈', '허브 리큐르', 55, 700, '프랑스', '그린 샤르트뢰즈', '샤르트뢰즈 chartreuse'],
  ['m_benedictine', '베네딕틴 DOM', 'Bénédictine D.O.M.', '베네딕틴', '허브 리큐르', 40, 700, '프랑스', '베네딕틴', '베네딕틴 benedictine'],
  ['m_drambuie', '드람부이', 'Drambuie', '드람부이', '위스키 리큐르', 40, 700, '스코틀랜드', '드람부이', '드람뷰이 drambuie 러스티네일'],
  ['m_galliano', '갈리아노 라우토', "Galliano L'Autentico", '갈리아노', '허브 리큐르', 30, 700, '이탈리아', '갈리아노', '갈리아노 galliano'],
  ['m_chambord', '샹보르', 'Chambord Black Raspberry', '샹보르', '베리 리큐르', 16.5, 500, '프랑스', '샹보르(블랙라즈베리)', '샹보르 chambord'],
  ['m_lejay_cassis', '르쥬 크렘 드 카시스', 'Lejay Crème de Cassis', '르쥬', '베리 리큐르', 20, 700, '프랑스', '크렘 드 카시스', '카시스 cassis 키르'],
  ['m_luxardo_maraschino', '룩사르도 마라스키노', 'Luxardo Maraschino', '룩사르도', '체리 리큐르', 32, 700, '이탈리아', '마라스키노', '마라스키노 luxardo'],
  ['m_bols_cacao_white', '볼스 화이트 크렘 드 카카오', 'Bols Crème de Cacao White', '볼스', '카카오 리큐르', 24, 700, '네덜란드', '크렘 드 카카오', '크렘드카카오 카카오'],
  ['m_bols_menthe_green', '볼스 그린 크렘 드 멘트', 'Bols Crème de Menthe Green', '볼스', '민트 리큐르', 24, 700, '네덜란드', '그린 크렘 드 멘트', '크렘드멘트 민트리큐르'],
  ['m_bols_menthe_white', '볼스 화이트 크렘 드 멘트', 'Bols Crème de Menthe White', '볼스', '민트 리큐르', 24, 700, '네덜란드', '화이트 크렘 드 멘트', '화이트민트'],
  ['m_stgermain', '생 제르맹', 'St-Germain Elderflower', '생제르맹', '엘더플라워 리큐르', 20, 700, '프랑스', '엘더플라워 코디얼', '생제르망 stgermain 엘더플라워'],
  ['m_aperol', '아페롤', 'Aperol', '아페롤', '아페리티프 비터', 11, 700, '이탈리아', '아페롤', '아페롤 스프리츠 aperol'],
  ['m_campari', '캄파리', 'Campari', '캄파리', '아페리티프 비터', 25, 700, '이탈리아', '캄파리', '캄파리 캄빠리 campari 네그로니'],
  ['m_fernet', '페르넷 브랑카', 'Fernet-Branca', '페르넷브랑카', '아마로', 39, 700, '이탈리아', '페르넷', '페르넷 fernet'],
  ['m_montenegro', '아마로 몬테네그로', 'Amaro Montenegro', '몬테네그로', '아마로', 23, 700, '이탈리아', '아마로(노니노)', '아마로 몬테네그로 amaro'],
  ['m_cynar', '치나르', 'Cynar', '치나르', '아마로', 16.5, 700, '이탈리아', '치나르', '치나르 cynar'],
  ['m_angostura_bitters', '앙고스투라 아로마틱 비터', 'Angostura Aromatic Bitters', '앙고스투라', '칵테일 비터', 44.7, 200, '트리니다드토바고', '앙고스투라 비터', '앙고스투라 비터스 angostura'],
  ['m_angostura_orange', '앙고스투라 오렌지 비터', 'Angostura Orange Bitters', '앙고스투라', '칵테일 비터', 28, 100, '트리니다드토바고', '오렌지 비터', '오렌지비터 orangebitters'],
  ['m_peychauds', '페이쇼 비터', "Peychaud's Bitters", '페이쇼', '칵테일 비터', 35, 148, '미국', '페이쇼 비터', '페이쇼 peychaud'],
  ['m_pernod_absinthe', '페르노 압생트', 'Pernod Absinthe', '페르노', '압생트', 68, 700, '프랑스', '압생트', '압생트 absinthe pernod'],
  ['m_jagermeister', '예거마이스터', 'Jägermeister', '예거마이스터', '허브 리큐르', 35, 700, '독일', '기타 리큐르', '예거 야거 jagermeister'],
  ['m_limoncello', '리몬첼로', 'Limoncello', '팔리니', '시트러스 리큐르', 26, 500, '이탈리아', '기타 리큐르', '리몬첼로 limoncello'],
  ['m_jd_honey', '잭 다니엘스 테네시 허니', "Jack Daniel's Tennessee Honey", '잭다니엘스', '가향 위스키 리큐르', 35, 700, '미국', '플레이버드 위스키', '잭허니 테네시허니 jackhoney'],
  ['m_olesmoky_pb', '올레 스모키 피넛버터 위스키', 'Ole Smoky Peanut Butter Whiskey', '올레스모키', '가향 위스키 리큐르', 30, 750, '미국', '플레이버드 위스키', '올레스모키 피넛버터 olesmoky'],
  ['m_bols_banana', '볼스 바나나 리큐르', 'Bols Crème de Banane', '볼스', '바나나 리큐르', 17, 700, '네덜란드', '바나나 리큐르', '바나나리큐르'],
  ['m_velvet_falernum', '벨벳 팔레르넘', 'Velvet Falernum', '존디테일러', '팔레르넘', 11, 700, '바베이도스', '팔레르넘', '팔레르넘 falernum'],
  ['m_goldschlager', '시나몬 리큐르', 'Cinnamon Liqueur', '골드슐라거', '시나몬 리큐르', 0, 700, '스위스', '시나몬 리큐르(시에가)', '시나몬 골드슐라거'],
  ['m_appletree', '애플트리', 'Appletree', '피치트리', '사과 리큐르', 15, 700, '네덜란드', '기타 리큐르', '애플트리 사과리큐르 그린애플 appletree'],
  ['m_dekuyper_triplesec', '드 카이퍼 트리플 섹', 'De Kuyper Triple Sec', '디카이퍼', '오렌지 리큐르', 40, 700, '네덜란드', '트리플 섹', '드카이퍼트리플섹 dekuyper'],
  ['m_dekuyper_blue', '드 카이퍼 블루 큐라소', 'De Kuyper Blue Curaçao', '디카이퍼', '오렌지 리큐르', 24, 700, '네덜란드', '블루 큐라소', '드카이퍼블루 큐라소'],
  ['m_dekuyper_cacao', '드 카이퍼 크렘 드 카카오', 'De Kuyper Crème de Cacao', '디카이퍼', '카카오 리큐르', 24, 700, '네덜란드', '크렘 드 카카오', '드카이퍼카카오'],
  ['m_dekuyper_menthe', '드 카이퍼 크렘 드 멘트', 'De Kuyper Crème de Menthe', '디카이퍼', '민트 리큐르', 24, 700, '네덜란드', '크렘 드 멘트', '드카이퍼멘트'],
  ['m_dekuyper_cassis', '드 카이퍼 크렘 드 카시스', 'De Kuyper Crème de Cassis', '디카이퍼', '베리 리큐르', 15, 700, '네덜란드', '크렘 드 카시스', '드카이퍼카시스'],
  ['m_hermes_greentea', '산토리 헤르메스 그린티', 'Suntory Hermes Green Tea Liqueur', '산토리', '녹차 리큐르', 20, 0, '일본', '기타 리큐르', '헤르메스 그린티 greentea'],
  ['m_xrated', '엑스레이티드 퓨전', 'X-Rated Fusion Liqueur', '엑스레이티드', '과일 리큐르', 17, 750, '프랑스', '기타 리큐르', '엑스레이티드 엑스레이 xrated'],
  ['m_southern_comfort', '서던 컴포트 오리지널', 'Southern Comfort Original', '서던컴포트', '위스키 리큐르', 35, 700, '미국', '기타 리큐르', '서던컴포트 사우스컴포트 southerncomfort'],
  ['m_frangelico', '프란젤리코', 'Frangelico', '프란젤리코', '헤이즐넛 리큐르', 20, 700, '이탈리아', '기타 리큐르', '프란젤리코 frangelico 헤이즐넛'],
  ['m_amarula', '아마룰라 크림', 'Amarula Cream', '아마룰라', '크림 리큐르', 17, 700, '남아프리카공화국', '기타 리큐르', '아마룰라 amarula'],
  ['m_sheridans', '셰리던스', "Sheridan's", '셰리던스', '크림 리큐르', 0, 700, '아일랜드', '기타 리큐르', '셰리던스 sheridans'],
  ['m_licor43', '리코르 43', 'Licor 43', '리코르43', '바닐라 리큐르', 31, 700, '스페인', '기타 리큐르', '리코르43 licor43 콰렌타이트레스'],
  ['m_pimms', '핌스 No.1', "Pimm's No.1 Cup", '핌스', '아페리티프 비터', 25, 700, '영국', '기타 리큐르', '핌스 pimms 핌스컵'],
  ['m_choya_umeshu', '초야 우메슈', 'Choya Umeshu', '초야', '매실 리큐르', 0, 720, '일본', '기타 리큐르', '초야 우메슈 매실주 choya'],
  ['m_jd_fire', '잭 다니엘스 테네시 파이어', "Jack Daniel's Tennessee Fire", '잭다니엘스', '가향 위스키 리큐르', 35, 700, '미국', '플레이버드 위스키', '잭파이어 테네시파이어'],
  ['m_jd_apple', '잭 다니엘스 테네시 애플', "Jack Daniel's Tennessee Apple", '잭다니엘스', '가향 위스키 리큐르', 35, 700, '미국', '플레이버드 위스키', '잭애플 테네시애플'],
];

/* ── 베르무트 ── */
const VERMOUTH: Row[] = [
  ['m_martini_rosso', '마티니 로쏘', 'Martini Rosso', '마티니', '스위트 베르무트', 15, 750, '이탈리아', '스위트 베르무트', '마티니로쏘 로쏘 martinirosso'],
  ['m_martini_dry', '마티니 엑스트라 드라이', 'Martini Extra Dry', '마티니', '드라이 베르무트', 18, 750, '이탈리아', '드라이 베르무트', '마티니드라이 martinidry'],
  ['m_martini_bianco', '마티니 비앙코', 'Martini Bianco', '마티니', '화이트 베르무트', 15, 750, '이탈리아', '스위트 베르무트', '비앙코 bianco'],
  ['m_noillyprat', '노일리 프랏 드라이', 'Noilly Prat Original Dry', '노일리프랏', '드라이 베르무트', 18, 750, '프랑스', '드라이 베르무트', '노일리프랏 noillyprat'],
  ['m_carpano_antica', '카르파노 안티카 포뮬라', 'Carpano Antica Formula', '카르파노', '스위트 베르무트', 16.5, 1000, '이탈리아', '스위트 베르무트', '안티카포뮬라 카르파노'],
  ['m_cocchi_torino', '코키 베르무트 디 토리노', 'Cocchi Vermouth di Torino', '코키', '스위트 베르무트', 16, 750, '이탈리아', '스위트 베르무트', '코키 cocchi'],
  ['m_dolin_dry', '돌린 드라이', 'Dolin Dry', '돌린', '드라이 베르무트', 17.5, 750, '프랑스', '드라이 베르무트', '돌린드라이 dolin'],
  ['m_dolin_rouge', '돌린 루즈', 'Dolin Rouge', '돌린', '스위트 베르무트', 16, 750, '프랑스', '스위트 베르무트', '돌린루즈'],
  ['m_lillet_blanc', '릴레 블랑', 'Lillet Blanc', '릴레', '아페리티프 와인', 17, 750, '프랑스', '리에 블랑', '릴레블랑 lillet'],
];

/* ── 와인 · 주정강화 ── */
const WINE: Row[] = [
  ['m_moet_imperial', '모엣 샹동 브뤼 임페리얼', 'Moët & Chandon Brut Impérial', '모엣샹동', '샴페인', 12, 750, '프랑스', '샴페인', '모엣 샴페인 moet'],
  ['m_veuve_yellow', '뵈브 클리코 옐로라벨', 'Veuve Clicquot Yellow Label', '뵈브클리코', '샴페인', 12, 750, '프랑스', '샴페인', '뵈브클리코 veuve'],
  ['m_lamarca_prosecco', '라 마르카 프로세코', 'La Marca Prosecco', '라마르카', '프로세코', 11, 750, '이탈리아', '프로세코', '프로세코 prosecco'],
  ['m_tiopepe', '띠오 뻬뻬 피노 셰리', 'Tio Pepe Fino Sherry', '곤잘레스비아스', '피노 셰리', 15, 750, '스페인', '드라이 화이트 와인', '띠오뻬뻬 셰리 tiopepe sherry'],
  ['m_grahams_ruby', '그라함스 파인 루비 포트', "Graham's Fine Ruby Port", '그라함스', '루비 포트', 19, 750, '포르투갈', '루비 포트', '포트와인 루비포트 port'],
  ['m_freixenet_cordon', '프레시넷 코르동 네그로', 'Freixenet Cordon Negro Brut', '프레시넷', '카바', 12, 750, '스페인', '', '프레시넷 코르동네그로 freixenet 카바'],
  ['m_yellowtail_shiraz', '옐로우테일 시라즈', 'Yellow Tail Shiraz', '옐로우테일', '레드 와인', 0, 750, '호주', '레드 와인(드라이)', '옐로우테일 옐로테일 yellowtail'],
  ['m_santahelena_alpas', '산타 헬레나 알파스 까베르네 소비뇽', 'Santa Helena Alpas Cabernet Sauvignon', '산타헬레나', '레드 와인', 0, 750, '칠레', '레드 와인(드라이)', '산타헬레나 알파스'],
  ['m_mateus_rose', '마테우스 로제', 'Mateus Rosé', '마테우스', '로제 와인', 11, 750, '포르투갈', '', '마테우스 로제 mateus'],
];

/* ── 맥주 ── */
const BEER: Row[] = [
  ['m_cass', '카스 후레쉬', 'Cass Fresh', '오비맥주', '라거', 4.5, 500, '한국', '', '카스 cass'],
  ['m_terra', '테라', 'Terra', '하이트진로', '라거', 4.6, 500, '한국', '', '테라 terra'],
  ['m_kloud', '클라우드', 'Kloud', '롯데칠성', '라거', 5, 500, '한국', '', '클라우드 kloud'],
  ['m_guinness', '기네스 드래프트', 'Guinness Draught', '기네스', '스타우트', 4.2, 440, '아일랜드', '', '기네스 guinness'],
  ['m_asahi', '아사히 슈퍼드라이', 'Asahi Super Dry', '아사히', '라거', 5, 500, '일본', '', '아사히 asahi'],
  ['m_stella', '스텔라 아르투아', 'Stella Artois', '스텔라아르투아', '라거', 5, 500, '벨기에', '', '스텔라 stella'],
  ['m_heineken', '하이네켄', 'Heineken', '하이네켄', '라거', 5, 500, '네덜란드', '', '하이네켄 heineken'],
  ['m_corona', '코로나 엑스트라', 'Corona Extra', '코로나', '라거', 4.5, 355, '멕시코', '', '코로나 corona'],
  ['m_hoegaarden', '호가든', 'Hoegaarden', '호가든', '밀맥주', 4.9, 500, '벨기에', '', '호가든 hoegaarden'],
  ['m_pilsner_urquell', '필스너 우르켈', 'Pilsner Urquell', '필스너우르켈', '필스너', 4.4, 500, '체코', '', '우르켈 pilsner'],
  ['m_gouden_carolus_imperial', '구덴 카롤루스 임페리얼 다크', 'Gouden Carolus Imperial Dark', '헷앙커', '벨지안 다크 에일', 0, 330, '벨기에', '', '구덴카롤루스 카롤루스 goudencarolus'],
  ['m_kagua_blanc', '카구아 블랑', 'Kagua Blanc', '니혼비어', '벨지안 화이트 에일', 7.5, 330, '일본', '', '카구아 블랑 kagua'],
  ['m_kagua_rouge', '카구아 루즈', 'Kagua Rouge', '니혼비어', '벨지안 다크 에일', 9, 330, '일본', '', '카구아 루즈'],
  ['m_kelly', '켈리', 'Kelly', '하이트진로', '라거', 4.5, 500, '한국', '', '켈리 kelly'],
  ['m_cass_light', '카스 라이트', 'Cass Light', '오비맥주', '라거', 4, 500, '한국', '', '카스라이트 casslight'],
  ['m_jeju_wit', '제주 위트 에일', 'Jeju Wit Ale', '제주맥주', '밀맥주', 5.3, 330, '한국', '', '제주위트 제주맥주'],
  ['m_gompyo', '곰표 밀맥주', 'Gompyo Wheat Beer', '세븐브로이', '밀맥주', 4.5, 500, '한국', '', '곰표 곰표밀맥주'],
  ['m_sapporo', '삿포로 프리미엄', 'Sapporo Premium', '삿포로', '라거', 5, 500, '일본', '', '삿포로 sapporo'],
  ['m_tsingtao', '칭따오', 'Tsingtao', '칭따오', '라거', 4.7, 500, '중국', '', '칭따오 칭다오 tsingtao'],
  ['m_budweiser', '버드와이저', 'Budweiser', '버드와이저', '라거', 5, 500, '미국', '', '버드와이저 버드 budweiser'],
  ['m_kronenbourg_blanc', '크로넨버그 1664 블랑', 'Kronenbourg 1664 Blanc', '크로넨버그', '밀맥주', 5, 330, '프랑스', '', '크로넨버그 1664 블랑 blanc'],
];

/* ── 사케 · 소주 ── */
const SAKE: Row[] = [
  ['m_dassai45', '닷사이 45 준마이다이긴조', 'Dassai 45 Junmai Daiginjo', '아사히슈조', '준마이다이긴조', 16, 720, '일본', '', '닷사이 다사이 dassai'],
  ['m_kubota_senju', '쿠보타 센주', 'Kubota Senju', '아사히슈조(니가타)', '긴조', 15, 720, '일본', '', '쿠보타 kubota'],
  ['m_iichiko', '이이치코 실루엣', 'Iichiko Silhouette', '산와슈루이', '보리 소주', 25, 720, '일본', '', '이이치코 iichiko'],
  ['m_hwayo25', '화요 25', 'Hwayo 25', '화요', '증류식 소주', 25, 375, '한국', '', '화요 hwayo'],
  ['m_hwayo41', '화요 41', 'Hwayo 41', '화요', '증류식 소주', 41, 375, '한국', '', '화요41'],
  ['m_chamisul', '참이슬 후레쉬', 'Chamisul Fresh', '하이트진로', '희석식 소주', 0, 360, '한국', '', '참이슬 소주 chamisul'],
  ['m_chumchurum', '처음처럼', 'Chum Churum', '롯데칠성', '희석식 소주', 0, 360, '한국', '', '처음처럼'],
  ['m_wonsoju_spirit', '원소주 스피릿', 'Won Soju Spirit', '원스피리츠', '증류식 소주', 24, 375, '한국', '', '원소주 스피릿 wonsoju'],
  ['m_tokki_white', '토끼소주 화이트', 'Tokki Soju White', '토끼소주', '증류식 소주', 23, 375, '한국', '', '토끼소주 tokki'],
  ['m_tokki_sunbee', '토끼소주 선비진', 'Tokki Soju Sunbee', '토끼소주', '증류식 소주', 40, 375, '한국', '', '선비진 토끼소주40'],
  ['m_jinro_isback', '진로 이즈백', 'Jinro Is Back', '하이트진로', '희석식 소주', 0, 360, '한국', '', '진로이즈백 진로'],
  ['m_saero', '새로', 'Saero', '롯데칠성', '희석식 소주', 0, 360, '한국', '', '새로 제로슈거'],
  ['m_hallasan', '한라산 오리지널', 'Hallasan Original', '한라산소주', '희석식 소주', 0, 375, '한국', '', '한라산소주 제주소주'],
  ['m_wolgyegwan_junmai', '월계관 준마이', 'Gekkeikan Junmai', '월계관', '준마이', 0, 720, '일본', '', '월계관 겟케이칸 gekkeikan'],
  ['m_yumeginga', '유메긴가 준마이 다이긴조', 'Yumeginga Junmai Daiginjo', '야마자키카모시', '준마이다이긴조', 16, 720, '일본', '', '유메긴가 dream 드림'],
  ['m_neungi', '내국양조 능이주', 'Naeguk Neungi-ju', '내국양조', '약주', 13, 375, '한국', '', '능이주 내국양조'],
  ['m_songi', '내국양조 송이주', 'Naeguk Songi-ju', '내국양조', '약주', 13, 375, '한국', '', '송이주 내국양조'],
  ['m_jangsu', '장수 생막걸리', 'Jangsu Makgeolli', '서울장수', '생막걸리', 6, 750, '한국', '', '장수막걸리 막걸리 jangsu'],
  ['m_kooksoondang', '국순당 생막걸리', 'Kooksoondang Makgeolli', '국순당', '생막걸리', 6, 750, '한국', '', '국순당 우국생 막걸리'],
  ['m_jipyeong', '지평 생막걸리', 'Jipyeong Makgeolli', '지평주조', '생막걸리', 5, 750, '한국', '', '지평막걸리 지평'],
  ['m_baekseju', '백세주', 'Baekseju', '국순당', '약주', 13, 375, '한국', '', '백세주 baekseju'],
  ['m_igangju', '이강주', 'Igangju', '전주이강주', '증류식 소주', 25, 375, '한국', '', '이강주 전주이강주'],
  ['m_gamhongro', '감홍로', 'Gamhongro', '감홍로주', '증류식 소주', 40, 375, '한국', '', '감홍로 감홍로주'],
  ['m_munbaeju', '문배주', 'Munbaeju', '문배주양조원', '증류식 소주', 40, 375, '한국', '', '문배주 munbaeju'],
  ['m_jamong_aisul', '자몽에이슬', 'Jamong-e-isul', '하이트진로', '과일 소주', 13, 360, '한국', '', '자몽에이슬 과일소주'],
  ['m_sunhari', '순하리 처음처럼', 'Sunhari Chum Churum', '롯데칠성', '과일 소주', 12, 360, '한국', '', '순하리 sunhari'],
  ['m_joeunday', '좋은데이', 'Good Day', '무학', '희석식 소주', 0, 360, '한국', '', '좋은데이 goodday'],
];

/* ── RTD · 캔칵테일 (편의점에서 바로 집는 것들) ── */
const RTD: Row[] = [
  ['m_horoyoi_peach', '산토리 호로요이 백도', 'Suntory Horoyoi White Peach', '산토리', '츄하이', 3, 350, '일본', '', '호로요이 복숭아 horoyoi'],
  ['m_horoyoi_white', '산토리 호로요이 화이트사워', 'Suntory Horoyoi White Sour', '산토리', '츄하이', 3, 350, '일본', '', '호로요이 화이트사워'],
  ['m_strongzero_lemon', '산토리 -196 스트롱제로 더블레몬', 'Suntory -196 Strong Zero Double Lemon', '산토리', '츄하이', 9, 350, '일본', '', '스트롱제로 더블레몬 strongzero'],
  ['m_strongzero_grape', '산토리 -196 스트롱제로 더블그레이프프루트', 'Suntory -196 Strong Zero Double Grapefruit', '산토리', '츄하이', 9, 350, '일본', '', '스트롱제로 자몽'],
  ['m_kaku_highball', '산토리 가쿠 하이볼 캔', 'Suntory Kaku Highball Can', '산토리', '하이볼 캔', 7, 350, '일본', '', '가쿠하이볼 카쿠하이볼 하이볼캔'],
  ['m_jimbeam_highball', '짐빔 하이볼 캔', 'Jim Beam Highball Can', '짐빔', '하이볼 캔', 5, 350, '일본', '', '짐빔하이볼 하이볼캔'],
  ['m_smirnoff_ice', '스미노프 아이스', 'Smirnoff Ice', '스미노프', 'RTD 칵테일', 4.5, 275, '영국', '', '스미노프아이스 smirnoffice'],
  ['m_cruiser', '크루저', 'Cruiser', '크루저', 'RTD 칵테일', 0, 275, '호주', '', '크루저 cruiser'],
  ['m_kobe_chuhai', '고베 거류지 츄하이 레몬', 'Kobe Kyoryuchi Chuhai Lemon', '토미나가', '츄하이', 0, 350, '일본', '', '고베거류지 츄하이 레몬'],
  ['m_strongsawa', '스트롱사와 레몬', 'Strong Sawa Lemon', '세븐앤아이', '츄하이', 0, 350, '일본', '', '스트롱사와 사와'],
];

/* ── 기타 증류주 ── */
const SPIRIT: Row[] = [
  ['m_baijiu_luzhou', '루저우라오자오', 'Luzhou Laojiao', '루저우라오자오', '농향형 백주', 52, 500, '중국', '', '백주 고량주 baijiu'],
  ['m_soju_andong', '안동소주', 'Andong Soju', '민속주안동소주', '증류식 소주', 45, 400, '한국', '', '안동소주'],
  ['m_yeontae', '연태구냥', 'Yantai Guniang', '옌타이', '농향형 백주', 0, 500, '중국', '', '연태구냥 옌타이 yantai'],
];

/* ── 칵테일 부재료 (믹서·시럽) ── */
const MIXER: Row[] = [
  ['m_fever_tonic', '피버트리 토닉워터', 'Fever-Tree Indian Tonic Water', '피버트리', '토닉워터', 0, 200, '영국', '토닉워터', '피버트리 토닉 fevertree tonic'],
  ['m_schweppes_tonic', '슈웹스 토닉워터', 'Schweppes Tonic Water', '슈웹스', '토닉워터', 0, 300, '한국', '토닉워터', '슈웹스토닉 schweppes'],
  ['m_canada_dry', '캐나다 드라이 진저에일', 'Canada Dry Ginger Ale', '캐나다드라이', '진저에일', 0, 250, '한국', '진저에일', '진저에일 캐나다드라이 gingerale'],
  ['m_fever_gingerbeer', '피버트리 진저비어', 'Fever-Tree Ginger Beer', '피버트리', '진저비어', 0, 200, '영국', '진저비어', '진저비어 gingerbeer 모스코뮬'],
  ['m_perrier', '페리에', 'Perrier', '페리에', '탄산수', 0, 330, '프랑스', '탄산수', '페리에 탄산수 perrier'],
  ['m_coke', '코카콜라', 'Coca-Cola', '코카콜라', '콜라', 0, 355, '한국', '콜라', '콜라 코크 cola coke'],
  ['m_sprite', '스프라이트', 'Sprite', '코카콜라', '레몬라임 소다', 0, 355, '한국', '레몬라임 소다(스프라이트/세븐업)', '스프라이트 사이다 sprite'],
  ['m_monin_gomme', '모닌 설탕 시럽', 'Monin Pure Cane Syrup', '모닌', '설탕 시럽', 0, 700, '프랑스', '설탕시럽', '설탕시럽 심플시럽 모닌 monin'],
  ['m_monin_grenadine', '모닌 그레나딘', 'Monin Grenadine', '모닌', '그레나딘 시럽', 0, 700, '프랑스', '그레나딘', '그레나딘 grenadine'],
  ['m_monin_orgeat', '모닌 오르쟈 시럽', 'Monin Orgeat', '모닌', '아몬드 시럽', 0, 700, '프랑스', '오르쟈 시럽(아몬드)', '오르쟈 오르자 orgeat 마이타이'],
];

/* ── 빌드: Row[] → LiquorMasterItem[] ── */

const GROUPS: Array<[LiquorCategory, Row[]]> = [
  ['whisky', WHISKY_SCOTCH_MALT], ['whisky', WHISKY_SCOTCH_BLEND],
  ['whisky', WHISKY_AMERICAN], ['whisky', WHISKY_WORLD],
  ['gin', GIN], ['vodka', VODKA], ['rum', RUM], ['tequila', TEQUILA], ['mezcal', MEZCAL],
  ['brandy', BRANDY], ['liqueur', LIQUEUR], ['vermouth', VERMOUTH], ['wine', WINE],
  ['beer', BEER], ['sake', SAKE], ['rtd', RTD], ['spirit', SPIRIT], ['mixer', MIXER],
];

function build([id, ko, en, brand, sub, abv, ml, country, ing, alias, wc]: Row, category: LiquorCategory): LiquorMasterItem {
  const aliases = [...new Set([...alias.split(/\s+/).filter(Boolean), ...(LIQUOR_ALIASES[id] ?? [])])];
  const keywordSource = [ko, en, brand, sub, ...aliases];
  const searchKeywords = [...new Set(keywordSource.map(normalizeQuery).filter(Boolean).concat(initials(normalizeQuery(ko))))];
  return {
    id, nameKo: ko, nameEn: en, brand, category, subcategory: sub,
    abv: abv || undefined,
    volumeMl: ml || undefined,
    country,
    ingredientName: ing || undefined,
    aliases, searchKeywords,
    whiskyClass: wc,
    source: 'master',
  };
}

export const LIQUOR_MASTER: LiquorMasterItem[] = GROUPS.flatMap(([cat, rows]) => rows.map((r) => build(r, cat)));

export const liquorMasterById = new Map<string, LiquorMasterItem>(LIQUOR_MASTER.map((i) => [i.id, i]));

export function masterCountByCategory(): Record<string, number> {
  return LIQUOR_MASTER.reduce<Record<string, number>>((acc, i) => { acc[i.category] = (acc[i.category] ?? 0) + 1; return acc; }, {});
}
