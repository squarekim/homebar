// 자동 생성 — scripts/cask_assets.py. 직접 고치지 말 것.
import body from '../../assets/cask/body.webp';
import head from '../../assets/cask/head.webp';
import shade from '../../assets/cask/shade.webp';
import f_vanilla from '../../assets/cask/f-vanilla.webp';
import f_honey from '../../assets/cask/f-honey.webp';
import f_apple from '../../assets/cask/f-apple.webp';
import f_dried from '../../assets/cask/f-dried.webp';
import f_citrus from '../../assets/cask/f-citrus.webp';
import f_chocolate from '../../assets/cask/f-chocolate.webp';
import f_nut from '../../assets/cask/f-nut.webp';
import f_flower from '../../assets/cask/f-flower.webp';
import f_spice from '../../assets/cask/f-spice.webp';
import f_sea from '../../assets/cask/f-sea.webp';
import f_caramel from '../../assets/cask/f-caramel.webp';
import f_tropical from '../../assets/cask/f-tropical.webp';
import f_berry from '../../assets/cask/f-berry.webp';
import f_coffee from '../../assets/cask/f-coffee.webp';
import f_grain from '../../assets/cask/f-grain.webp';
import f_herb from '../../assets/cask/f-herb.webp';
import f_peat from '../../assets/cask/f-peat.webp';

/** 오크통 그림과 그 자리(80×80 viewBox 단위). head 는 마구리의 가로·세로 범위, plug 는 마개 꼭대기 */
export const CASK_SPRITE = { body, head, shade, box: {x: 10.0, y: 23.19, w: 60.0, h: 48.81}, headBox: {x0: 40.73, x1: 66.99, y0: 30.33, y1: 68.21}, plug: {x: 40.13, y: 23.28} } as const;

/** 맛 물건(단위 크기). 사과·배 너비 기준으로 같은 비율 */
export const FLAVOR_SPRITES = {
  vanilla: { src: f_vanilla, w: 16.75, h: 14.55 },
  honey: { src: f_honey, w: 15.09, h: 15.25 },
  apple: { src: f_apple, w: 17.0, h: 15.13 },
  dried: { src: f_dried, w: 16.92, h: 11.6 },
  citrus: { src: f_citrus, w: 18.41, h: 15.92 },
  chocolate: { src: f_chocolate, w: 17.62, h: 9.85 },
  nut: { src: f_nut, w: 17.42, h: 10.97 },
  flower: { src: f_flower, w: 17.79, h: 16.67 },
  spice: { src: f_spice, w: 16.92, h: 10.97 },
  sea: { src: f_sea, w: 14.13, h: 13.43 },
  caramel: { src: f_caramel, w: 14.76, h: 11.18 },
  tropical: { src: f_tropical, w: 15.92, h: 14.01 },
  berry: { src: f_berry, w: 12.76, h: 11.6 },
  coffee: { src: f_coffee, w: 10.18, h: 7.65 },
  grain: { src: f_grain, w: 13.13, h: 11.39 },
  herb: { src: f_herb, w: 14.92, h: 12.14 },
  peat: { src: f_peat, w: 16.25, h: 11.47 },
} as const;
export type FlavorObject = keyof typeof FLAVOR_SPRITES;
