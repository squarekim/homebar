"""
cask_assets.py — Gemini로 그린 오크통 원본을 앱용 그림 조각으로 나눈다.

원본은 드라이브 '홈바_오크통_v3' 폴더의 cask.png 다(저장소에는 넣지 않는다).
  배경은 #00FF00 초록, 몸통 판자는 #FF00FF 마젠타, 마구리는 #00FFFF 시안 계열로 칠해져 있다.

만드는 것 (app/src/assets/cask/):
  body.webp   몸통 판자 자리(흰색, 알파 = 덮는 정도). 앱이 첫 캐스크 나무색으로 칠한다
  head.webp   마구리 자리. 앱이 캐스크 수만큼 세로로 나눠 칠한다
  shade.webp  쇠테·마개(원래 색)와 나무 명암(검정/흰색 반투명). 나무색 위에 겹친다
  app/src/ui/components/caskAssets.ts  위 그림의 자리(80×80 viewBox 기준)

실행: python3 scripts/cask_assets.py <cask.png>   (Pillow, NumPy 필요)
"""
import json
import os
import sys

import numpy as np
from PIL import Image

PX = 4          # viewBox 1단위당 픽셀
FIT_W = 70      # 통 너비(단위)
BASE = 72       # 통 바닥 y

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'cask')
META = os.path.join(ROOT, 'src', 'ui', 'components', 'caskAssets.ts')


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    src = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float64)
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    hi = np.maximum(np.maximum(r, np.maximum(g, b)), 1)
    green = np.clip((g - np.maximum(r, b)) / hi, 0, 1)
    alpha = 1 - smooth(.25, .6, green)                       # 초록 배경 → 투명
    mag = smooth(.2, .6, np.clip((np.minimum(r, b) - g) / hi, 0, 1)) * alpha
    cya = smooth(.2, .6, np.clip((np.minimum(g, b) - r) / hi, 0, 1)) * alpha

    # 나무 명암: 키 색의 밝기를 기준(70번째 백분위)과 비교해 검정/흰색 반투명으로
    def shade(mask, bright):
        full = mask > .9
        m = float(np.percentile(bright[full], 70)) if full.any() else .8
        dark = np.clip((m - bright) / m, 0, 1) * .8
        light = np.clip((bright - m) / max(1e-3, 1 - m), 0, 1) * .55
        return np.where(bright < m, dark, light), np.where(bright < m, 0.0, 255.0)

    bm, cm = np.maximum(r, b) / 255, np.maximum(g, b) / 255
    sd_m, s_m = shade(mag, bm)
    sd_c, s_c = shade(cya, cm)
    wood = np.maximum(mag, cya)
    sd = np.where(mag >= cya, sd_m, sd_c) * wood
    sc = np.where(mag >= cya, s_m, s_c)

    # 쇠테·마개 등 나머지: 원래 색. 가장자리 초록 번짐은 초록을 빨강·파랑 수준으로 누른다
    rest = np.clip(alpha - wood, 0, 1)
    gg = np.minimum(g, np.maximum(r, b))
    out = np.zeros(src.shape[:2] + (4,))
    a_out = rest + sd * (1 - rest)
    for k, ch in enumerate((r, gg, b)):
        out[..., k] = np.where(a_out > 1e-3, (ch * rest + sc * sd * (1 - rest)) / np.maximum(a_out, 1e-3), 0)
    out[..., 3] = a_out * 255

    ys, xs = np.nonzero(alpha > .1)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    s = FIT_W / (x1 - x0)
    bw, bh = (x1 - x0) * s, (y1 - y0) * s
    box = dict(x=round(40 - bw / 2, 2), y=round(BASE - bh, 2), w=round(bw, 2), h=round(bh, 2))
    size = (round(bw * PX), round(bh * PX))
    os.makedirs(OUT, exist_ok=True)

    def save(arr, name, lossless=False):
        im = Image.fromarray(np.clip(arr[y0:y1, x0:x1], 0, 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
        im.save(os.path.join(OUT, name), 'WEBP', quality=88, lossless=lossless, method=6)

    def mask_img(m):
        a = np.zeros(src.shape[:2] + (4,))
        a[..., :3] = 255
        a[..., 3] = m * 255
        return a

    save(mask_img(mag), 'body.webp', True)
    save(mask_img(cya), 'head.webp', True)
    save(out, 'shade.webp')

    def u(px, axis):
        return round((px - (x0 if axis == 'x' else y0)) * s + (box['x'] if axis == 'x' else box['y']), 2)

    hy, hx = np.nonzero(cya > .5)
    head = dict(x0=u(hx.min(), 'x'), x1=u(hx.max(), 'x'), y0=u(hy.min(), 'y'), y1=u(hy.max(), 'y'))
    # 마개: 몸통 위쪽에서 나무가 아닌(회색) 덩어리의 꼭대기
    ty, tx = np.nonzero((rest > .5) & (np.arange(src.shape[0])[:, None] < y0 + (y1 - y0) * .2))
    plug = dict(x=u(float(np.median(tx)), 'x'), y=u(ty.min(), 'y')) if len(tx) else dict(x=box['x'] + bw * .45, y=box['y'])
    lines = [
        '// 자동 생성 — scripts/cask_assets.py. 직접 고치지 말 것.',
        "import body from '../../assets/cask/body.webp';",
        "import head from '../../assets/cask/head.webp';",
        "import shade from '../../assets/cask/shade.webp';",
        '',
        '/** 오크통 그림과 그 자리(80×80 viewBox 단위). head 는 마구리의 가로·세로 범위, plug 는 마개 꼭대기 */',
        f'export const CASK_SPRITE = {{ body, head, shade, box: {json.dumps(box)}, headBox: {json.dumps(head)}, plug: {json.dumps(plug)} }} as const;',
        '',
    ]
    txt = '\n'.join(lines)
    for k in ('x', 'y', 'w', 'h', 'x0', 'x1', 'y0', 'y1'):
        txt = txt.replace(f'"{k}"', k)
    with open(META, 'w', encoding='utf-8') as fh:
        fh.write(txt)
    print(box, head, plug, sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')


if __name__ == '__main__':
    main()
