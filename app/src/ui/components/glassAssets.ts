// 자동 생성 — scripts/glass_assets.py. 직접 고치지 말 것.
// 잔·가니시 그림 파일과 그 자리(80×80 viewBox 단위).
import coupeGlass from '../../assets/glass/coupe-glass.webp';
import coupeLiquid from '../../assets/glass/coupe-liquid.webp';
import martiniGlass from '../../assets/glass/martini-glass.webp';
import martiniLiquid from '../../assets/glass/martini-liquid.webp';
import fluteGlass from '../../assets/glass/flute-glass.webp';
import fluteLiquid from '../../assets/glass/flute-liquid.webp';
import hurricaneGlass from '../../assets/glass/hurricane-glass.webp';
import hurricaneLiquid from '../../assets/glass/hurricane-liquid.webp';
import highballGlass from '../../assets/glass/highball-glass.webp';
import highballLiquid from '../../assets/glass/highball-liquid.webp';
import rocksGlass from '../../assets/glass/rocks-glass.webp';
import rocksLiquid from '../../assets/glass/rocks-liquid.webp';
import shotGlass from '../../assets/glass/shot-glass.webp';
import shotLiquid from '../../assets/glass/shot-liquid.webp';
import mugGlass from '../../assets/glass/mug-glass.webp';
import mugLiquid from '../../assets/glass/mug-liquid.webp';
import g_lemon_peel from '../../assets/glass/g-lemon-peel.webp';
import g_orange_peel from '../../assets/glass/g-orange-peel.webp';
import g_lime_peel from '../../assets/glass/g-lime-peel.webp';
import g_lemon_wedge from '../../assets/glass/g-lemon-wedge.webp';
import g_lime_wedge from '../../assets/glass/g-lime-wedge.webp';
import g_orange_wedge from '../../assets/glass/g-orange-wedge.webp';
import g_pineapple_wedge from '../../assets/glass/g-pineapple-wedge.webp';
import g_lemon_wheel from '../../assets/glass/g-lemon-wheel.webp';
import g_lime_wheel from '../../assets/glass/g-lime-wheel.webp';
import g_orange_wheel from '../../assets/glass/g-orange-wheel.webp';
import g_pineapple_wheel from '../../assets/glass/g-pineapple-wheel.webp';
import g_mint from '../../assets/glass/g-mint.webp';
import g_pick_cherry from '../../assets/glass/g-pick-cherry.webp';
import g_pick_olive from '../../assets/glass/g-pick-olive.webp';
import g_pick_onion from '../../assets/glass/g-pick-onion.webp';
import g_pick_berry from '../../assets/glass/g-pick-berry.webp';
import g_pick_ginger from '../../assets/glass/g-pick-ginger.webp';
import g_celery from '../../assets/glass/g-celery.webp';
import g_in_lemon from '../../assets/glass/g-in-lemon.webp';
import g_in_lime from '../../assets/glass/g-in-lime.webp';
import g_in_orange from '../../assets/glass/g-in-orange.webp';
import { type GlassKind } from '../../data/drinkVisual';

type Box = { x: number; y: number; w: number; h: number };
type Ellipse = { cx: number; cy: number; rx: number; ry: number };
export interface GlassSprite {
  glass: string; liquid: string; box: Box; surface: Ellipse; rim: Ellipse; bottom: number;
  /** 높이별 액체 폭 [y, cx, rx] — 위에서 아래로 */
  profile: Array<[number, number, number]>;
}
export const GLASS_SPRITES: Record<GlassKind, GlassSprite> = {
  coupe: { glass: coupeGlass, liquid: coupeLiquid, box: {x: 21.69, y: 14.0, w: 36.62, h: 58.0}, surface: {cx: 39.97, cy: 19.08, rx: 15.52, ry: 2.17}, rim: {cx: 39.94, cy: 14.85, rx: 15.55, ry: 2.49}, bottom: 33.63,
    profile: [[18.51, 39.6, 2.66], [19.14, 40.06, 12.54], [19.77, 39.94, 16.3], [20.4, 39.94, 17.43], [21.02, 39.94, 17.49], [21.65, 39.97, 17.53], [22.28, 39.97, 17.46], [22.9, 39.97, 17.4], [23.53, 39.94, 17.31], [24.16, 39.97, 17.15], [24.78, 39.97, 16.96], [25.41, 39.94, 16.68], [26.04, 39.49, 16.87], [26.73, 39.94, 15.99], [27.36, 39.97, 15.58], [27.98, 39.94, 15.11], [28.61, 39.94, 14.55], [29.24, 39.9, 13.89], [29.86, 39.94, 13.17], [30.49, 39.94, 12.29], [31.12, 39.97, 11.26], [31.74, 39.94, 10.03], [32.37, 39.94, 8.4], [33.0, 39.97, 6.24], [33.63, 39.88, 1.32]] },
  martini: { glass: martiniGlass, liquid: martiniLiquid, box: {x: 21.82, y: 12.0, w: 36.37, h: 60.0}, surface: {cx: 39.9, cy: 17.45, rx: 14.93, ry: 2.09}, rim: {cx: 39.98, cy: 12.89, rx: 17.63, ry: 2.82}, bottom: 38.06,
    profile: [[16.86, 39.74, 3.02], [17.71, 39.9, 14.28], [18.63, 39.87, 14.9], [19.48, 39.84, 14.34], [20.4, 39.48, 14.11], [21.26, 39.8, 13.19], [22.18, 39.44, 12.96], [23.03, 39.78, 12.05], [23.95, 39.42, 11.82], [24.8, 39.74, 10.9], [25.72, 39.8, 11.09], [26.57, 40.2, 10.18], [27.43, 40.2, 9.58], [28.35, 39.35, 8.93], [29.2, 39.7, 7.98], [30.12, 39.71, 7.32], [30.97, 39.67, 6.76], [31.89, 39.25, 6.6], [32.74, 39.68, 5.58], [33.66, 39.7, 4.96], [34.52, 39.67, 4.4], [35.44, 39.67, 3.74], [36.29, 39.71, 3.05], [37.21, 39.7, 2.13], [38.06, 39.75, 0.39]] },
  flute: { glass: fluteGlass, liquid: fluteLiquid, box: {x: 30.73, y: 8.0, w: 18.55, h: 64.0}, surface: {cx: 39.9, cy: 14.14, rx: 7.55, ry: 1.2}, rim: {cx: 39.94, cy: 9.01, rx: 7.86, ry: 1.5}, bottom: 42.73,
    profile: [[13.53, 39.84, 0.47], [14.74, 39.94, 7.59], [15.96, 40.24, 7.96], [17.17, 39.9, 7.69], [18.39, 40.24, 8.03], [19.6, 40.24, 8.03], [20.81, 39.86, 8.4], [22.03, 40.24, 8.03], [23.24, 39.9, 7.69], [24.46, 39.87, 8.33], [25.67, 40.24, 7.89], [26.88, 39.9, 7.49], [28.1, 40.24, 7.69], [29.38, 39.87, 7.18], [30.59, 39.87, 7.72], [31.81, 39.87, 6.71], [33.02, 39.87, 6.44], [34.23, 39.84, 6.14], [35.45, 39.86, 5.77], [36.66, 39.43, 5.8], [37.88, 39.87, 4.89], [39.09, 39.39, 4.82], [40.3, 39.86, 3.68], [41.52, 39.87, 2.73], [42.73, 39.9, 0.13]] },
  hurricane: { glass: hurricaneGlass, liquid: hurricaneLiquid, box: {x: 26.66, y: 8.0, w: 26.67, h: 64.0}, surface: {cx: 40.06, cy: 16.21, rx: 8.78, ry: 1.23}, rim: {cx: 40.06, cy: 8.94, rx: 11.73, ry: 1.88}, bottom: 53.77,
    profile: [[15.57, 40.43, 2.18], [17.18, 40.03, 8.75], [18.79, 40.0, 8.51], [20.33, 39.99, 8.38], [21.94, 39.6, 8.71], [23.55, 39.99, 8.44], [25.09, 40.4, 9.05], [26.7, 39.96, 9.01], [28.31, 40.0, 9.45], [29.91, 39.99, 9.99], [31.52, 40.4, 10.99], [33.06, 40.4, 11.53], [34.67, 39.97, 11.63], [36.28, 39.96, 12.03], [37.82, 40.4, 12.73], [39.43, 39.96, 12.5], [41.04, 39.96, 12.5], [42.65, 39.97, 12.3], [44.26, 39.96, 11.96], [45.8, 39.93, 11.46], [47.41, 39.89, 10.69], [49.01, 39.89, 9.62], [50.55, 40.5, 8.81], [52.16, 39.89, 6.06], [53.77, 39.89, 1.04]] },
  highball: { glass: highballGlass, liquid: highballLiquid, box: {x: 27.66, y: 10.0, w: 24.67, h: 62.0}, surface: {cx: 39.96, cy: 18.58, rx: 10.89, ry: 1.52}, rim: {cx: 39.97, cy: 10.9, rx: 11.98, ry: 1.92}, bottom: 66.28,
    profile: [[17.97, 39.96, 1.51], [19.96, 39.97, 11.47], [22.01, 39.94, 11.44], [24.01, 40.38, 11.82], [26.0, 39.96, 11.4], [28.05, 40.38, 11.76], [30.05, 39.96, 11.34], [32.04, 39.96, 11.34], [34.09, 39.97, 11.28], [36.08, 39.97, 11.28], [38.08, 39.55, 11.63], [40.13, 39.97, 11.21], [42.12, 40.0, 11.18], [44.12, 39.97, 11.15], [46.17, 39.97, 11.15], [48.16, 39.99, 11.12], [50.16, 39.96, 11.08], [52.21, 39.99, 11.05], [54.2, 39.99, 11.05], [56.19, 39.96, 11.02], [58.25, 39.99, 10.99], [60.24, 39.97, 10.95], [62.23, 40.0, 10.92], [64.29, 40.0, 10.73], [66.28, 39.9, 2.47]] },
  rocks: { glass: rocksGlass, liquid: rocksLiquid, box: {x: 20.87, y: 28.0, w: 38.27, h: 44.0}, surface: {cx: 40.22, cy: 40.82, rx: 13.72, ry: 1.92}, rim: {cx: 39.98, cy: 28.7, rx: 15.86, ry: 2.54}, bottom: 65.64,
    profile: [[40.38, 39.84, 1.77], [41.45, 40.59, 14.96], [42.47, 39.98, 18.33], [43.54, 39.98, 18.38], [44.61, 39.96, 18.36], [45.63, 39.96, 18.36], [46.7, 39.98, 18.33], [47.77, 39.98, 18.33], [48.79, 39.98, 18.33], [49.85, 39.98, 18.33], [50.92, 39.96, 18.31], [51.94, 39.96, 18.31], [53.01, 39.98, 18.28], [54.08, 39.98, 18.28], [55.1, 39.96, 18.26], [56.17, 39.96, 18.26], [57.24, 39.98, 18.24], [58.26, 39.98, 18.24], [59.32, 39.98, 18.24], [60.39, 39.96, 18.21], [61.41, 39.96, 18.21], [62.48, 39.98, 17.99], [63.55, 39.89, 16.92], [64.57, 39.69, 13.96], [65.64, 39.76, 1.31]] },
  shot: { glass: shotGlass, liquid: shotLiquid, box: {x: 26.6, y: 36.0, w: 26.81, h: 36.0}, surface: {cx: 40.15, cy: 42.39, rx: 9.12, ry: 1.28}, rim: {cx: 39.97, cy: 36.67, rx: 11.75, ry: 1.88}, bottom: 65.61,
    profile: [[42.04, 39.83, 0.81], [43.02, 39.97, 10.84], [44.0, 39.93, 11.72], [44.98, 39.93, 11.58], [45.96, 39.93, 11.51], [46.95, 39.93, 11.37], [47.93, 39.94, 11.23], [48.91, 39.48, 11.54], [49.89, 39.9, 10.98], [50.88, 39.9, 10.84], [51.86, 39.44, 11.16], [52.84, 39.9, 10.56], [53.82, 39.86, 10.46], [54.81, 39.86, 10.32], [55.79, 40.36, 10.67], [56.77, 39.86, 10.04], [57.75, 39.86, 9.89], [58.74, 39.86, 9.75], [59.72, 39.86, 9.61], [60.7, 39.86, 9.47], [61.68, 39.86, 9.33], [62.67, 39.86, 9.19], [63.65, 39.86, 8.98], [64.63, 39.9, 8.39], [65.61, 39.94, 0.7]] },
  mug: { glass: mugGlass, liquid: mugLiquid, box: {x: 18.38, y: 20.0, w: 43.23, h: 52.0}, surface: {cx: 33.82, cy: 28.83, rx: 12.85, ry: 1.8}, rim: {cx: 33.98, cy: 20.76, rx: 13.63, ry: 2.18}, bottom: 65.59,
    profile: [[28.32, 34.01, 2.02], [29.89, 33.78, 14.39], [31.41, 33.78, 14.5], [32.99, 33.75, 14.48], [34.56, 33.72, 14.45], [36.08, 33.7, 14.42], [37.65, 33.7, 14.36], [39.17, 33.67, 14.34], [40.74, 33.67, 14.34], [42.32, 33.65, 14.31], [43.84, 33.65, 14.31], [45.41, 33.65, 14.31], [46.93, 33.65, 14.31], [48.5, 33.65, 14.31], [50.08, 33.65, 14.31], [51.59, 33.65, 14.31], [53.17, 33.65, 14.31], [54.74, 33.65, 14.31], [56.26, 33.65, 14.31], [57.83, 33.67, 14.34], [59.41, 33.65, 14.31], [60.93, 33.67, 14.11], [62.5, 33.64, 13.46], [64.02, 33.62, 11.75], [65.59, 33.42, 1.32]] },
};

export const GARNISH_SPRITES = {
  'lemon-peel': { src: g_lemon_peel, w: 9.11, h: 17.75 },
  'orange-peel': { src: g_orange_peel, w: 9.11, h: 17.66 },
  'lime-peel': { src: g_lime_peel, w: 9.21, h: 17.56 },
  'lemon-wedge': { src: g_lemon_wedge, w: 12.15, h: 14.91 },
  'lime-wedge': { src: g_lime_wedge, w: 11.96, h: 14.72 },
  'orange-wedge': { src: g_orange_wedge, w: 12.15, h: 15.0 },
  'pineapple-wedge': { src: g_pineapple_wedge, w: 14.72, h: 12.72 },
  'lemon-wheel': { src: g_lemon_wheel, w: 14.91, h: 15.0 },
  'lime-wheel': { src: g_lime_wheel, w: 14.53, h: 14.91 },
  'orange-wheel': { src: g_orange_wheel, w: 15.0, h: 15.09 },
  'pineapple-wheel': { src: g_pineapple_wheel, w: 16.71, h: 16.33 },
  'mint': { src: g_mint, w: 14.72, h: 19.75 },
  'pick-cherry': { src: g_pick_cherry, w: 15.47, h: 16.04 },
  'pick-olive': { src: g_pick_olive, w: 15.95, h: 16.04 },
  'pick-onion': { src: g_pick_onion, w: 15.66, h: 15.95 },
  'pick-berry': { src: g_pick_berry, w: 15.95, h: 16.04 },
  'pick-ginger': { src: g_pick_ginger, w: 16.23, h: 16.04 },
  'celery': { src: g_celery, w: 11.87, h: 25.54 },
  'in-lemon': { src: g_in_lemon, w: 14.91, h: 15.09 },
  'in-lime': { src: g_in_lime, w: 14.91, h: 15.19 },
  'in-orange': { src: g_in_orange, w: 15.09, h: 15.38 },
} as const;
export type GarnishSprite = keyof typeof GARNISH_SPRITES;
