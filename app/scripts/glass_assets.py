"""
glass_assets.py — GPT로 그린 잔·가니시 원본을 앱용 그림 조각으로 나눈다.

원본은 드라이브 '홈바_잔_가니시_gpt_생성원본_20261105' 폴더에 있다(저장소에는 넣지 않는다).
  glass_<kind>.png        잔 8장. 액체는 마젠타(#FF00FF) 계열로만 칠해져 있다.
  garnish_sheet_0N_*.png  가니시 시트 4장. 투명 배경에 항목이 떨어져 있다.

만드는 것 (app/src/assets/glass/):
  <kind>-liquid.webp   액체가 차지하는 자리(흰색, 알파 = 덮는 정도). 앱이 레시피 색으로 칠한다.
  <kind>-glass.webp    유리·얼음·액체 명암. 액체 위에 겹친다.
  g-<name>.webp        가니시 한 조각씩
  app/src/ui/components/glassAssets.ts  위 그림의 자리(80×80 viewBox 기준)

실행: python3 scripts/glass_assets.py <원본 폴더>   (Pillow, NumPy 필요)
같은 원본이면 항상 같은 결과가 나온다.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

PX = 4            # viewBox 1단위당 픽셀 — 120px 상세 화면을 2.7배 화면에서도 선명하게
BASE = 72         # 잔 바닥이 닿는 y
# 잔마다 viewBox 안에서 차지할 최대 높이·너비(단위). 작은 목록(44px)에서도 종류가 구별되게 정한다.
FIT = {
    'coupe': (58, 54), 'martini': (60, 56), 'flute': (64, 30), 'hurricane': (64, 40),
    'highball': (62, 34), 'rocks': (44, 52), 'shot': (36, 32), 'mug': (52, 58),
    'wine': (60, 40), 'wineice': (60, 40),
}
# 시트 안 순서(위→아래, 왼→오른)대로 붙이는 이름
SHEETS = {
    'garnish_sheet_01_peels_wedges.png': ['lemon-peel', 'orange-peel', 'lime-peel', 'lemon-wedge', 'lime-wedge', 'orange-wedge'],
    'garnish_sheet_02_wheels_mint.png': ['pineapple-wedge', 'lemon-wheel', 'lime-wheel', 'orange-wheel', 'pineapple-wheel', 'mint'],
    'garnish_sheet_03_picks.png': ['pick-cherry', 'pick-olive', 'pick-onion', 'pick-berry', 'pick-ginger'],
    'garnish_sheet_04_celery_slices.png': ['celery', 'in-lemon', 'in-lime', 'in-orange'],
}
WHEEL_UNITS = 15  # 레몬 휠 지름(단위) — 가니시 크기의 기준

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'glass')
META = os.path.join(ROOT, 'src', 'ui', 'components', 'glassAssets.ts')


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def fill_holes(mask):
    """mask(bool) 안에 갇힌 구멍(얼음 자리)을 채운다."""
    h, w = mask.shape
    im = Image.new('L', (w + 2, h + 2), 0)
    im.paste(Image.fromarray((mask * 255).astype(np.uint8)), (1, 1))
    ImageDraw.floodfill(im, (0, 0), 128)
    a = np.asarray(im)[1:-1, 1:-1]
    return a != 128


def save(arr, path, lossless=False):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=88, lossless=lossless, method=6)


def split_glass(path, kind):
    src = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
    r, g, b, a = (src[..., i] for i in range(4))
    al = a / 255
    hi = np.maximum(np.maximum(r, b), 1)
    w = np.clip((np.minimum(r, b) - g) / hi, 0, 1) * (al > .05)   # 마젠타다움(밝기와 무관)
    region = fill_holes(w > .35)                                   # 액체 자리(얼음 포함)
    f = smooth(.1, .7, w)                                          # 그 픽셀에서 액체가 비치는 정도
    # 액체 명암: 마젠타의 밝기를 기준값과 비교해 어둡게/밝게
    bright = hi / 255
    full = region & (f > .95)
    m = float(np.percentile(bright[full], 70)) if full.any() else .8
    dark = np.clip((m - bright) / m, 0, 1) * .85
    light = np.clip((bright - m) / max(1e-3, 1 - m), 0, 1) * .7
    sd = np.where(bright < m, dark, light) * (f > .95)
    S = np.where(bright < m, 0.0, 255.0)
    # 액체 아닌 성분(얼음·유리)의 색: 마젠타에는 초록이 없으므로 초록 채널로 되살린다
    gray = np.clip(g / np.maximum(1 - f, 1e-3), 0, 255)

    cov = np.where(region, al, al * f)                             # 액체 마스크 알파
    t_in = 1 - f * (1 - sd)
    o_in = np.where(t_in > 1e-3, (f * sd * S + (1 - f) * gray) / np.maximum(t_in, 1e-3), 0)
    inside = cov > .02
    t = np.where(inside, t_in * al + (1 - al) * 0, al)
    over = np.zeros_like(src)
    for c, ch in enumerate((r, g, b)):
        out_col = np.where(w > .05, gray, ch)                      # 바깥 경계의 분홍 번짐 제거
        over[..., c] = np.where(inside, o_in, out_col)
    over[..., 3] = t * 255
    liq = np.zeros_like(src)
    liq[..., :3] = 255
    liq[..., 3] = cov * 255

    ys, xs = np.nonzero(a > 8)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    H, W = FIT[kind]
    s = min(H / (y1 - y0), W / (x1 - x0))                          # 원본 px → 단위
    bw, bh = (x1 - x0) * s, (y1 - y0) * s
    box = dict(x=round(40 - bw / 2, 2), y=round(BASE - bh, 2), w=round(bw, 2), h=round(bh, 2))
    size = (max(1, round(bw * PX)), max(1, round(bh * PX)))

    def crop(arr):
        im = Image.fromarray(np.clip(arr[y0:y1, x0:x1], 0, 255).astype(np.uint8), 'RGBA')
        return np.asarray(im.resize(size, Image.LANCZOS)).astype(np.float64)

    save(crop(over), os.path.join(OUT, f'{kind}-glass.webp'))
    save(crop(liq), os.path.join(OUT, f'{kind}-liquid.webp'), lossless=True)

    def u(px, axis):
        return round((px - (x0 if axis == 'x' else y0)) * s + (box['x'] if axis == 'x' else box['y']), 2)

    # 기준점: 액체 표면(맨 윗줄과 폭), 테두리(유리 맨 윗줄과 폭), 액체 바닥
    ry_, rx_ = np.nonzero(region)
    top = ry_.min()
    band = region[top:top + max(3, int(.02 * (y1 - y0)))]
    cols = np.nonzero(band.any(0))[0]
    sx0, sx1 = cols.min(), cols.max()
    surf_cy = top + .5 * (band.shape[0])
    rim_rows = np.nonzero((a > 60).any(1))[0]
    rim_top = rim_rows.min()
    rim_band = a[rim_top:rim_top + max(4, int(.03 * (y1 - y0)))] > 60
    rcols = np.nonzero(rim_band.any(0))[0]
    # 머그 손잡이처럼 옆으로 튀어나온 부분은 테두리 폭에서 뺀다(맨 윗줄만 본다)
    rx0, rx1 = rcols.min(), rcols.max()
    meta = dict(
        box=box,
        surface=dict(cx=round((u(sx0, 'x') + u(sx1, 'x')) / 2, 2), cy=u(surf_cy, 'y'),
                     rx=round((sx1 - sx0) * s / 2, 2), ry=round(max(1.2, (sx1 - sx0) * s * .07), 2)),
        rim=dict(cx=round((u(rx0, 'x') + u(rx1, 'x')) / 2, 2), cy=u(rim_top + rim_band.shape[0] / 2, 'y'),
                 rx=round((rx1 - rx0) * s / 2, 2), ry=round(max(1.5, (rx1 - rx0) * s * .08), 2)),
        bottom=u(ry_.max(), 'y'),
        # 높이별 액체 폭 — 층 경계를 잔 원근에 맞는 곡선으로 그릴 때 쓴다 [y, cx, rx]
        profile=profile(region, top, ry_.max(), u, s),
    )
    return meta


def profile(region, top, bottom, u, s, n=24):
    out = []
    for k in range(n + 1):
        y = int(round(top + (bottom - top) * k / n))
        cols = np.nonzero(region[y])[0]
        if not len(cols):
            continue
        out.append([u(y, 'y'), round((u(cols.min(), 'x') + u(cols.max(), 'x')) / 2, 2), round((cols.max() - cols.min()) * s / 2, 2)])
    return out


def components(alpha, min_area):
    """알파 영역을 덩어리로 나눈다(4방향 연결)."""
    h, w = alpha.shape
    lab = np.zeros((h, w), np.int32)
    out = []
    n = 0
    on = alpha
    for y0 in range(h):
        row = np.nonzero(on[y0] & (lab[y0] == 0))[0]
        for x0 in row:
            if lab[y0, x0]:
                continue
            n += 1
            stack = [(y0, x0)]
            lab[y0, x0] = n
            pts = []
            while stack:
                y, x = stack.pop()
                pts.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and on[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        stack.append((yy, xx))
            if len(pts) >= min_area:
                ys = [p[0] for p in pts]
                xs = [p[1] for p in pts]
                out.append((min(ys), max(ys) + 1, min(xs), max(xs) + 1, n))
    return out, lab


def split_sheets(src_dir):
    pieces = {}
    for fname, names in SHEETS.items():
        im = np.asarray(Image.open(os.path.join(src_dir, fname)).convert('RGBA'))
        small = im[::2, ::2, 3] > 40                       # 절반 크기에서 덩어리를 찾는다(속도)
        comps, _ = components(small, 400)
        comps = [(y0 * 2, y1 * 2, x0 * 2, x1 * 2) for y0, y1, x0, x1, _ in comps]
        if len(comps) != len(names):
            raise SystemExit(f'{fname}: {len(comps)}조각 (예상 {len(names)})')
        # 줄(세로 위치)로 묶은 뒤 왼쪽부터
        comps.sort(key=lambda c: (c[0] + c[1]) / 2)
        rows, cur = [], [comps[0]]
        for c in comps[1:]:
            if (c[0] + c[1]) / 2 - (cur[-1][0] + cur[-1][1]) / 2 > 120:
                rows.append(cur)
                cur = [c]
            else:
                cur.append(c)
        rows.append(cur)
        ordered = [c for row in rows for c in sorted(row, key=lambda c: c[2])]
        for name, (y0, y1, x0, x1) in zip(names, ordered):
            pad = 6
            y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
            y1, x1 = min(im.shape[0], y1 + pad), min(im.shape[1], x1 + pad)
            piece = im[y0:y1, x0:x1].copy()
            piece[..., 3] = np.where(piece[..., 3] < 12, 0, piece[..., 3])   # 시트 바탕의 옅은 얼룩 제거
            pieces[name] = piece
    wheel = pieces['lemon-wheel']
    s = WHEEL_UNITS / max(wheel.shape[:2])
    meta = {}
    for name, piece in pieces.items():
        h, w = piece.shape[:2]
        size = (max(1, round(w * s * PX)), max(1, round(h * s * PX)))
        Image.fromarray(piece, 'RGBA').resize(size, Image.LANCZOS).save(
            os.path.join(OUT, f'g-{name}.webp'), 'WEBP', quality=88, method=6)
        meta[name] = dict(w=round(w * s, 2), h=round(h * s, 2))
    return meta


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    glasses = {k: split_glass(os.path.join(src, f'glass_{k}.png'), k) for k in FIT}
    garnish = split_sheets(src)
    lines = [
        '// 자동 생성 — scripts/glass_assets.py. 직접 고치지 말 것.',
        '// 잔·가니시 그림 파일과 그 자리(80×80 viewBox 단위).',
    ]
    for k in FIT:
        lines.append(f"import {k}Glass from '../../assets/glass/{k}-glass.webp';")
        lines.append(f"import {k}Liquid from '../../assets/glass/{k}-liquid.webp';")
    gname = {n: 'g_' + n.replace('-', '_') for n in garnish}
    for n, v in gname.items():
        lines.append(f"import {v} from '../../assets/glass/g-{n}.webp';")
    lines += [
        "import { type GlassKind } from '../../data/drinkVisual';",
        '',
        'type Box = { x: number; y: number; w: number; h: number };',
        'type Ellipse = { cx: number; cy: number; rx: number; ry: number };',
        'export interface GlassSprite {',
        '  glass: string; liquid: string; box: Box; surface: Ellipse; rim: Ellipse; bottom: number;',
        '  /** 높이별 액체 폭 [y, cx, rx] — 위에서 아래로 */',
        '  profile: Array<[number, number, number]>;',
        '}',
        'export const GLASS_SPRITES: Record<GlassKind, GlassSprite> = {',
    ]
    for k, m in glasses.items():
        lines.append(f"  {k}: {{ glass: {k}Glass, liquid: {k}Liquid, box: {json.dumps(m['box'])}, "
                     f"surface: {json.dumps(m['surface'])}, rim: {json.dumps(m['rim'])}, bottom: {m['bottom']},\n"
                     f"    profile: {json.dumps(m['profile'])} }},")
    lines += ['};', '', 'export const GARNISH_SPRITES = {']
    for n, m in garnish.items():
        lines.append(f"  '{n}': {{ src: {gname[n]}, w: {m['w']}, h: {m['h']} }},")
    lines += ['} as const;', 'export type GarnishSprite = keyof typeof GARNISH_SPRITES;', '']
    out = '\n'.join(lines).replace('"x"', 'x').replace('"y"', 'y').replace('"w"', 'w').replace('"h"', 'h') \
        .replace('"cx"', 'cx').replace('"cy"', 'cy').replace('"rx"', 'rx').replace('"ry"', 'ry')
    with open(META, 'w', encoding='utf-8') as fh:
        fh.write(out)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'{len(glasses)} glasses, {len(garnish)} garnishes, {total / 1024:.0f} KB')


if __name__ == '__main__':
    main()
