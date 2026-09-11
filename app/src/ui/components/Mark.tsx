/**
 * Mark — 사진 대신 쓰는 일관된 기본 표현.
 *
 * 저장소에 칵테일·병 사진 자산이 없다(public/ 은 앱 아이콘뿐). 다른 술의 사진이나
 * 무관한 스톡 사진으로 채우지 않고, 잔·병 실루엣에 기주별 색만 달리해 통일한다.
 * 크기가 고정이라 이미지가 생기기 전에도 목록 높이가 흔들리지 않는다.
 */
import { IconMartini, IconWhisky, IconBottle } from './icons';

type Size = 'sm' | 'md' | 'lg';

/** 기주 → 색 키. 데이터에 있는 값만 쓰고 모르는 값은 기본색으로 둔다. */
const BASE_KEY: Record<string, string> = {
  위스키: 'whisky', 진: 'gin', 보드카: 'vodka', 럼: 'rum', 데킬라: 'tequila',
  브랜디: 'brandy', 리큐르: 'liqueur', 와인: 'wine',
  '럼·데킬라·브랜디': 'rum', '메즈칼': 'tequila', '베르무트': 'wine',
};

function keyOf(label: string | undefined): string {
  return (label && BASE_KEY[label]) ?? 'other';
}

/** 칵테일 — 잔 */
export function CocktailMark({ base, size = 'md' }: { base?: string | undefined; size?: Size }) {
  return (
    <span className={`mark ${size} k-${keyOf(base)}`} aria-hidden="true">
      {base === '위스키' ? <IconWhisky /> : <IconMartini />}
    </span>
  );
}

/** 병 — 위스키·보유 술 */
export function BottleMark({ kind, size = 'md' }: { kind?: string | undefined; size?: Size }) {
  return (
    <span className={`mark ${size} k-${keyOf(kind)}`} aria-hidden="true"><IconBottle /></span>
  );
}

/** 대표 추천의 큰 자리 — 사진이 들어갈 영역을 같은 규칙으로 채운다 */
export function LeadArt({ base, kind }: { base?: string | undefined; kind: 'cocktail' | 'whisky' }) {
  return (
    <div className={`art k-${keyOf(base)}`} aria-hidden="true">
      {kind === 'whisky' ? <IconWhisky /> : <IconMartini />}
    </div>
  );
}
