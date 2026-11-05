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
export interface GlassSprite { glass: string; liquid: string; box: Box; surface: Ellipse; rim: Ellipse; bottom: number }
export const GLASS_SPRITES: Record<GlassKind, GlassSprite> = {
  coupe: { glass: coupeGlass, liquid: coupeLiquid, box: {x: 21.69, y: 14.0, w: 36.62, h: 58.0}, surface: {cx: 39.97, cy: 19.08, rx: 15.52, ry: 2.17}, rim: {cx: 39.94, cy: 14.85, rx: 15.55, ry: 2.49}, bottom: 33.63 },
  martini: { glass: martiniGlass, liquid: martiniLiquid, box: {x: 21.82, y: 12.0, w: 36.37, h: 60.0}, surface: {cx: 39.9, cy: 17.45, rx: 14.93, ry: 2.09}, rim: {cx: 39.98, cy: 12.89, rx: 17.63, ry: 2.82}, bottom: 38.06 },
  flute: { glass: fluteGlass, liquid: fluteLiquid, box: {x: 30.73, y: 8.0, w: 18.55, h: 64.0}, surface: {cx: 39.9, cy: 14.14, rx: 7.55, ry: 1.2}, rim: {cx: 39.94, cy: 9.01, rx: 7.86, ry: 1.5}, bottom: 42.73 },
  hurricane: { glass: hurricaneGlass, liquid: hurricaneLiquid, box: {x: 26.66, y: 8.0, w: 26.67, h: 64.0}, surface: {cx: 40.06, cy: 16.21, rx: 8.78, ry: 1.23}, rim: {cx: 40.06, cy: 8.94, rx: 11.73, ry: 1.88}, bottom: 53.77 },
  highball: { glass: highballGlass, liquid: highballLiquid, box: {x: 27.66, y: 10.0, w: 24.67, h: 62.0}, surface: {cx: 39.96, cy: 18.58, rx: 10.89, ry: 1.52}, rim: {cx: 39.97, cy: 10.9, rx: 11.98, ry: 1.92}, bottom: 66.28 },
  rocks: { glass: rocksGlass, liquid: rocksLiquid, box: {x: 20.87, y: 28.0, w: 38.27, h: 44.0}, surface: {cx: 40.22, cy: 40.82, rx: 13.72, ry: 1.92}, rim: {cx: 39.98, cy: 28.7, rx: 15.86, ry: 2.54}, bottom: 65.64 },
  shot: { glass: shotGlass, liquid: shotLiquid, box: {x: 26.6, y: 36.0, w: 26.81, h: 36.0}, surface: {cx: 40.15, cy: 42.39, rx: 9.12, ry: 1.28}, rim: {cx: 39.97, cy: 36.67, rx: 11.75, ry: 1.88}, bottom: 65.61 },
  mug: { glass: mugGlass, liquid: mugLiquid, box: {x: 18.38, y: 20.0, w: 43.23, h: 52.0}, surface: {cx: 33.82, cy: 28.83, rx: 12.85, ry: 1.8}, rim: {cx: 33.98, cy: 20.76, rx: 13.63, ry: 2.18}, bottom: 65.59 },
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
