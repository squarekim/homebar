// 자동 생성 — scripts/cask_assets.py. 직접 고치지 말 것.
import body from '../../assets/cask/body.webp';
import head from '../../assets/cask/head.webp';
import shade from '../../assets/cask/shade.webp';

/** 오크통 그림과 그 자리(80×80 viewBox 단위). head 는 마구리의 가로·세로 범위, plug 는 마개 꼭대기 */
export const CASK_SPRITE = { body, head, shade, box: {x: 5.0, y: 15.06, w: 70.0, h: 56.94}, headBox: {x0: 40.85, x1: 71.48, y0: 23.4, y1: 67.59}, plug: {x: 40.15, y: 15.16} } as const;
