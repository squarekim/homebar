"""
combo_assets.py — 잔과 가니시를 한 장으로 그린 통그림(GPT)을 앱용 층으로 나눈다.

원본은 드라이브 '홈바_잔_가니시_gpt_생성원본_20261105' 폴더에 있다(저장소에는 넣지 않는다).
  glass_<kind>.png             잔 원본(glass_assets.py 와 같은 파일, 와인 얼음 잔은 glass_wine_ice.png → glass_wineice.png 로 받는다)
  gpt_combo_<키>.png           잔 원본을 편집해 가니시를 더한 통그림. 잔·캔버스는 원본과 같다.
키는 '<잔>_<조각>+<조각>' (조각은 이름순) — drinkVisual.ts 의 comboKey 와 같은 규칙.
레몬·라임·오렌지 한 조각뿐인 장은 'citrus' 로 그려 받고(레몬색), 여기서 레몬·라임·오렌지 세 벌을 만든다.

만드는 것 (app/src/assets/glass/combo/):
  <키>-glass.webp, <키>-liquid.webp   glass_assets.py 와 같은 방식으로 나눈 유리·액체 층
  app/src/ui/components/comboAssets.ts  각 통그림의 자리(잔 원본과 같은 배율 — 잔은 기본 그림과 정확히 겹친다)

실행: python3 scripts/combo_assets.py <원본 폴더>   (Pillow, NumPy 필요)
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glass_assets import PX, ROOT, frame, save, split_layers  # noqa: E402

OUT = os.path.join(ROOT, 'src', 'assets', 'glass', 'combo')
META = os.path.join(ROOT, 'src', 'ui', 'components', 'comboAssets.ts')
# 레몬 노랑을 옮길 색상(도)과 채도·밝기 배율
RECOLOR = {'lemon': None, 'orange': (27, 1.05, .92), 'lime': (82, .9, .9)}


def recolor(src, orig, target):
    """원본 잔과 달라진(가니시) 픽셀 중 노란 것(32~72°)만 색상을 옮긴다."""
    if target is None:
        return src
    hue, ks, kv = target
    diff = np.abs(src[..., :3] - orig[..., :3]).max(-1) > 25
    hsv = np.asarray(Image.fromarray(np.clip(src[..., :3], 0, 255).astype(np.uint8), 'RGB').convert('HSV')).astype(np.float64)
    h = hsv[..., 0] * 360 / 255
    m = diff & (hsv[..., 1] > 64) & (src[..., 3] > 20) & (h >= 32) & (h <= 72)
    hsv[..., 0] = np.where(m, hue * 255 / 360, hsv[..., 0])
    hsv[..., 1] = np.where(m, np.clip(hsv[..., 1] * ks, 0, 255), hsv[..., 1])
    hsv[..., 2] = np.where(m, np.clip(hsv[..., 2] * kv, 0, 255), hsv[..., 2])
    rgb = np.asarray(Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')).astype(np.float64)
    out = src.copy()
    out[..., :3] = rgb
    return out


def main():
    src_dir = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, '*.webp')):
        os.remove(f)
    metas = {}
    for path in sorted(glob.glob(os.path.join(src_dir, 'gpt_combo_*.png'))):
        key = os.path.basename(path)[len('gpt_combo_'):-4]
        kind = key.split('_')[0]
        orig = np.asarray(Image.open(os.path.join(src_dir, f'glass_{kind}.png')).convert('RGBA')).astype(np.float64)
        src = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
        if src.shape != orig.shape:
            raise SystemExit(f'{key}: 캔버스가 원본과 다르다 {src.shape} ≠ {orig.shape}')
        gy0, _, gx0, _, s, bx, by = frame(orig[..., 3], kind)
        variants = {key: None} if 'citrus' not in key else \
            {key.replace('citrus', fr): RECOLOR[fr] for fr in RECOLOR}
        for vkey, tgt in variants.items():
            im = recolor(src, orig, tgt)
            over, liq, _ = split_layers(im, balanced=True)
            ys, xs = np.nonzero(im[..., 3] > 8)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            box = dict(x=round(bx + (x0 - gx0) * s, 2), y=round(by + (y0 - gy0) * s, 2),
                       w=round((x1 - x0) * s, 2), h=round((y1 - y0) * s, 2))
            size = (max(1, round(box['w'] * PX)), max(1, round(box['h'] * PX)))

            def crop(arr):
                pic = Image.fromarray(np.clip(arr[y0:y1, x0:x1], 0, 255).astype(np.uint8), 'RGBA')
                return np.asarray(pic.resize(size, Image.LANCZOS)).astype(np.float64)

            save(crop(over), os.path.join(OUT, f'{vkey}-glass.webp'))
            save(crop(liq), os.path.join(OUT, f'{vkey}-liquid.webp'), lossless=True)
            metas[vkey] = box
    ident = {k: 'c_' + k.replace('-', '_').replace('+', '__') for k in metas}
    lines = ['// 자동 생성 — scripts/combo_assets.py. 직접 고치지 말 것.',
             '// 잔+가니시 통그림(유리·액체 층)과 그 자리(80×80 viewBox 단위). 키는 drinkVisual.ts comboKey.']
    for k, v in ident.items():
        lines.append(f"import {v}G from '../../assets/glass/combo/{k}-glass.webp';")
        lines.append(f"import {v}L from '../../assets/glass/combo/{k}-liquid.webp';")
    lines += ['', 'export interface ComboSprite { glass: string; liquid: string; box: { x: number; y: number; w: number; h: number } }',
              'export const COMBO_SPRITES: Record<string, ComboSprite> = {']
    for k, b in metas.items():
        lines.append(f"  '{k}': {{ glass: {ident[k]}G, liquid: {ident[k]}L, box: {json.dumps(b)} }},".replace('"', ''))
    lines += ['};', '']
    with open(META, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'{len(metas)} combos, {total / 1024:.0f} KB')


if __name__ == '__main__':
    main()
