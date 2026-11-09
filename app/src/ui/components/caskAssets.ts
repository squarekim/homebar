// 자동 생성 — scripts/cask_assets.py. 직접 고치지 말 것.
import body from '../../assets/cask/body.webp';
import head from '../../assets/cask/head.webp';
import shade from '../../assets/cask/shade.webp';

/** 오크통 그림과 그 자리(80×80 viewBox 단위). head 는 마구리의 가로·세로 범위, plug 는 마개 꼭대기 */
export const CASK_SPRITE = { body, head, shade, box: {x: 10.0, y: 23.19, w: 60.0, h: 48.81}, headBox: {x0: 40.73, x1: 66.99, y0: 30.33, y1: 68.21}, plug: {x: 40.13, y: 23.28} } as const;
