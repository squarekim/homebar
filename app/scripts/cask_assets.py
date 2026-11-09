"""
cask_assets.py — Gemini로 그린 오크통 원본을 앱용 그림 조각으로 나눈다.

원본은 드라이브 '홈바_오크통_v3' 폴더의 cask.png 다(저장소에는 넣지 않는다).
  배경은 #00FF00 초록, 몸통 판자는 #FF00FF 마젠타, 마구리는 #00FFFF 시안 계열로 칠해져 있다.

만드는 것 (app/src/assets/cask/):
  body.webp   몸통 판자 자리(흰색, 알파 = 덮는 정도). 앱이 첫 캐스크 나무색으로 칠한다
  head.webp   마구리 자리. 앱이 캐스크 수만큼 세로로 나눠 칠한다
  shade.webp  쇠테·마개(원래 색)와 나무 명암(검정/흰색 반투명). 나무색 위에 겹친다
  app/src/ui/components/caskAssets.ts  위 그림의 자리(80×80 viewBox 기준)

  f-<name>.webp  맛 물건 17종(flavor_sheet_01~04.png 를 칸별로 잘라 초록 배경을 지운 것)

실행: python3 scripts/cask_assets.py <cask.png> <flavor_sheet_01.png> … <flavor_sheet_04.png>   (Pillow, NumPy 필요)
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

PX = 4          # viewBox 1단위당 픽셀
FIT_W = 60      # 통 너비(단위) — 잔과 같은 여백이 남도록
BASE = 72       # 통 바닥 y

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'cask')
META = os.path.join(ROOT, 'src', 'ui', 'components', 'caskAssets.ts')


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


# 시트 칸 순서(위→아래, 왼→오른). 1~3장은 2×2, 4장은 위 3칸 + 아래 2칸
SHEETS = [
    [['vanilla', 'honey'], ['apple', 'dried']],
    [['citrus', 'chocolate'], ['nut', 'flower']],
    [['spice', 'sea'], ['caramel', 'tropical']],
    [['berry', 'coffee', 'grain'], ['herb', 'peat']],
]
FLAVOR_UNITS = 17   # 사과·배 그림 너비(단위) — 모든 물건이 같은 비율


def key_green(path):
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    hi = np.maximum(np.maximum(r, np.maximum(g, b)), 1)
    a = 1 - smooth(.25, .6, np.clip((g - np.maximum(r, b)) / hi, 0, 1))
    out = np.zeros(src.shape[:2] + (4,))
    out[..., 0], out[..., 1], out[..., 2] = r, np.minimum(g, np.maximum(r, b)), b
    out[..., 3] = a * 255
    return out


def split_flavors(paths):
    pieces = {}
    for path, rows in zip(paths, SHEETS):
        im = key_green(path)
        h, w = im.shape[:2]
        for ri, row in enumerate(rows):
            for ci, name in enumerate(row):
                cell = im[ri * h // len(rows):(ri + 1) * h // len(rows), ci * w // len(row):(ci + 1) * w // len(row)]
                ys, xs = np.nonzero(cell[..., 3] > 40)
                pieces[name] = cell[max(0, ys.min() - 4):ys.max() + 5, max(0, xs.min() - 4):xs.max() + 5]
    s = FLAVOR_UNITS / pieces['apple'].shape[1]
    meta = {}
    for name, piece in pieces.items():
        ph, pw = piece.shape[:2]
        size = (max(1, round(pw * s * PX)), max(1, round(ph * s * PX)))
        Image.fromarray(np.clip(piece, 0, 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS) \
            .save(os.path.join(OUT, f'f-{name}.webp'), 'WEBP', quality=86, method=6)
        meta[name] = (round(pw * s, 2), round(ph * s, 2))
    return meta


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
        # 잔처럼 낮은 대비로 — 원본의 강한 명암을 그대로 쓰면 통만 무겁게 보인다
        dark = np.clip((m - bright) / m, 0, 1) * .55
        light = np.clip((bright - m) / max(1e-3, 1 - m), 0, 1) * .35
        return np.where(bright < m, dark, light), np.where(bright < m, 0.0, 255.0)

    bm, cm = np.maximum(r, b) / 255, np.maximum(g, b) / 255
    sd_m, s_m = shade(mag, bm)
    sd_c, s_c = shade(cya, cm)
    wood = np.maximum(mag, cya)
    sd = np.where(mag >= cya, sd_m, sd_c) * wood
    # 원본 나뭇결의 잔 점무늬를 흐려 큰 명암만 남긴다(잔의 매끈한 그라데이션과 맞춘다)
    blur = lambda a, r: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float64) / 255
    sd = blur(sd, 6) * wood
    sc = np.where(mag >= cya, s_m, s_c)

    # 쇠테·마개 등 나머지: 원래 색. 가장자리 초록 번짐은 초록을 빨강·파랑 수준으로 누른다
    rest = np.clip(alpha - wood, 0, 1)
    gg = np.minimum(g, np.maximum(r, b))
    # 쇠테를 한 단계 밝게 — 검은 띠 대신 잔 테두리 같은 회색 금속으로
    r, gg, b = (ch + (205 - ch) * .28 for ch in (r, gg, b))
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
    flavors = split_flavors(sys.argv[2:6]) if len(sys.argv) >= 6 else {}
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
    if flavors:
        lines[4:4] = [f"import f_{n} from '../../assets/cask/f-{n}.webp';" for n in flavors]
        lines += ['/** 맛 물건(단위 크기). 사과·배 너비 기준으로 같은 비율 */', 'export const FLAVOR_SPRITES = {']
        lines += [f"  {n}: {{ src: f_{n}, w: {w}, h: {h} }}," for n, (w, h) in flavors.items()]
        lines += ['} as const;', 'export type FlavorObject = keyof typeof FLAVOR_SPRITES;', '']
    txt = '\n'.join(lines)
    for k in ('x', 'y', 'w', 'h', 'x0', 'x1', 'y0', 'y1'):
        txt = txt.replace(f'"{k}"', k)
    with open(META, 'w', encoding='utf-8') as fh:
        fh.write(txt)
    print(box, head, plug, sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')


if __name__ == '__main__':
    main()
