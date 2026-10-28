/**
 * Mark — 사진 대신 쓰는 일관된 기본 표현.
 *
 * 저장소에 칵테일·병 사진 자산이 없다(public/ 은 앱 아이콘뿐). 다른 술의 사진이나
 * 무관한 스톡 사진으로 채우지 않고, 잔·병 실루엣에 기주별 색만 달리해 통일한다.
 * 크기가 고정이라 이미지가 생기기 전에도 목록 높이가 흔들리지 않는다.
 */
import { IconMartini, IconWhisky, IconBottle } from './icons';
import { GlassArt, NeatPour } from './GlassArt';
import { BottleArt } from './BottleArt';
import { CaskArt } from './CaskArt';
import { bottleColor } from '../../data/bottleVisual';
import { drawsAsCask } from '../../data/caskVisual';
import { referenceRepo } from '../../repositories/referenceRepo';

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

const PX: Record<Size, number> = { sm: 44, md: 56, lg: 96 };

/**
 * 칵테일 — 잔. id 가 있으면 그 레시피로 잔 모양·음료 색·가니시를 그리고,
 * 없으면(위스키 추천 등) 종류 아이콘만 둔다.
 */
export function CocktailMark({ base, cocktailId, size = 'md' }: {
  base?: string | undefined; cocktailId?: string | undefined; size?: Size;
}) {
  const ck = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;
  return (
    <span className={`mark ${size} k-${keyOf(base)}`} aria-hidden="true">
      {ck ? <GlassArt cocktail={ck} size={PX[size]} /> : base === '위스키' ? <IconWhisky /> : <IconMartini />}
    </span>
  );
}

/**
 * 병 — 위스키·보유 술. bottleId 가 있으면 위스키는 오크통(캐스크·피트·연수)으로,
 * 그 밖의 술은 병(모양·술 색)으로 그리고, 못 찾은 병은 종류 아이콘만 둔다.
 */
export function BottleMark({ kind, bottleId, size = 'md' }: {
  kind?: string | undefined; bottleId?: string | undefined; size?: Size;
}) {
  const b = bottleId ? referenceRepo.bottleById(bottleId) : undefined;
  return (
    <span className={`mark ${size} k-${keyOf(kind)}`} aria-hidden="true">
      {b ? (drawsAsCask(b) ? <CaskArt bottle={b} size={PX[size]} /> : <BottleArt bottle={b} size={PX[size]} />) : <IconBottle />}
    </span>
  );
}

/**
 * 대표 추천의 큰 자리 — 사진이 들어갈 영역을 같은 규칙으로 채운다.
 * 위스키는 병이 아니라 잔으로 낸다. 이 자리는 "지금 이걸 마셔라"는 권유라서다.
 */
export function LeadArt({ base, kind, cocktailId, bottleId, size = 124 }: {
  base?: string | undefined; kind: 'cocktail' | 'whisky';
  cocktailId?: string | undefined; bottleId?: string | undefined; size?: number;
}) {
  const ck = cocktailId ? referenceRepo.cocktailById(cocktailId) : undefined;
  const bt = bottleId ? referenceRepo.bottleById(bottleId) : undefined;
  const pour = bt ? bottleColor(bt) : undefined;
  return (
    <div className={`art k-${keyOf(base)}`} aria-hidden="true">
      {ck ? <GlassArt cocktail={ck} size={size} />
        : pour ? <NeatPour fill={pour.fill} alpha={pour.alpha} size={size} />
        : kind === 'whisky' ? <IconWhisky /> : <IconMartini />}
    </div>
  );
}
