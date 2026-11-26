"""Parallax sets. Each set builds static layers (cached images) + an animate() hook.
Layer images are LW x LH, drawn so that design (0,0) maps to (OX,OY) inside them."""
import math, random, functools
import skia
from kit import *
from chars import flame

LW, LH = 2700, 1400
OX, OY = 390, 200


def new_layer():
    s = skia.Surface(LW, LH)
    c = s.getCanvas()
    c.clear(skia.Color(0, 0, 0, 0))
    c.translate(OX, OY)
    return s, c


_TEX = None


def snap(s, tex=34):
    """bake a subtle painted-paper texture onto the layer (only where it has content)"""
    global _TEX
    if _TEX is None:
        _TEX = noise_image(255, warm=True)
    c = s.getCanvas()
    c.save(); c.resetMatrix()
    p = P(Shader=_TEX.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(), skia.Matrix.Scale(2.2, 2.2)), Alpha=tex)
    p.setBlendMode(skia.BlendMode.kSrcATop)
    c.drawRect(skia.Rect(0, 0, LW, LH), p)
    # fine grit
    p2 = P(Shader=_TEX.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat, skia.SamplingOptions(), skia.Matrix.Scale(0.6, 0.6)), Alpha=tex // 2)
    p2.setBlendMode(skia.BlendMode.kSrcATop)
    c.drawRect(skia.Rect(0, 0, LW, LH), p2)
    c.restore()
    return s.makeImageSnapshot()


def hills(c, y0, amp, col, seed, ow=5, n=9, top_col=None):
    rnd = random.Random(seed)
    pts = [(-OX - 50, LH)]
    xs = [-OX - 50 + i * (LW + 100) / n for i in range(n + 1)]
    for x in xs:
        pts.append((x, y0 - rnd.uniform(0.2, 1.0) * amp))
    pts.append((LW - OX + 50, LH))
    p = path(pts[1:-1], close=False, smooth=True)
    p.lineTo(LW - OX + 50, LH); p.lineTo(-OX - 50, LH); p.close()
    if top_col:
        draw(c, p, None, ow, grad=vgrad(y0 - amp, y0 + 250, [rgb(top_col), rgb(col)]))
    else:
        draw(c, p, rgb(col), ow)
    return p


def mountains(c, base, height, col, seed, snow=True, ow=5):
    rnd = random.Random(seed)
    x = -OX - 100
    while x < LW - OX:
        w = rnd.uniform(380, 700); h = rnd.uniform(0.55, 1.0) * height
        pk = (x + w / 2 + rnd.uniform(-60, 60), base - h)
        tri = path([(x, base + 40), pk, (x + w, base + 40)])
        cc = rgb(col)
        draw(c, tri, cc, ow)
        c.save(); c.clipPath(tri, doAntiAlias=True)
        c.drawPath(path([pk, (x + w, base + 40), (pk[0] + 20, base + 40)]), fillp(shade(cc, -0.18)))
        for k in range(3):  # ridge lines
            ex = pk[0] + (k - 1) * w * 0.22 + rnd.uniform(-20, 20)
            c.drawPath(path([pk, (pk[0] + (ex - pk[0]) * 0.5 + rnd.uniform(-15, 15), pk[1] + h * 0.45), (ex, base + 30)], close=False, smooth=True), strokep(shade(cc, -0.3), 2.5))
        if snow:
            sn = path([(pk[0] - w * 0.18, pk[1] + h * 0.28), pk, (pk[0] + w * 0.17, pk[1] + h * 0.3), (pk[0] + w * 0.05, pk[1] + h * 0.22), (pk[0] - w * 0.06, pk[1] + h * 0.33)])
            c.drawPath(sn, fillp(rgb('#e9e6df')))
        c.restore()
        c.drawPath(tri, strokep(INK, ow))
        x += w * rnd.uniform(0.45, 0.7)


def grass_tufts(c, y0, y1, col, seed, n=160, size=1.0):
    rnd = random.Random(seed)
    for _ in range(n):
        x = rnd.uniform(-OX, LW - OX); y = rnd.uniform(y0, y1)
        k = (y - y0) / max(1, (y1 - y0)) * 0.8 + 0.4
        h = rnd.uniform(14, 30) * k * size
        for j in (-1, 0, 1):
            c.drawLine(x, y, x + j * 8 * k + rnd.uniform(-3, 3), y - h, strokep(shade(rgb(col), -0.3 + rnd.uniform(-0.05, 0.1)), 3 * k))


def clouds(c, y, col, seed, n=6):
    """puffy comic clouds: overlapping circles with a flat base"""
    rnd = random.Random(seed)
    cc = rgb(col)
    for i in range(n):
        x = -OX + (i + 0.5) * (LW / n) + rnd.uniform(-80, 80); yy = y + rnd.uniform(-80, 60)
        w = rnd.uniform(240, 380)
        p = skia.Path()
        for k in range(6):
            px = x - w / 2 + (k + 0.5) * w / 6
            r = w * rnd.uniform(0.12, 0.2) * (1.25 if k in (2, 3) else 1)
            p.addCircle(px, yy - r * 0.6, r)
        p.addRect(skia.Rect(x - w / 2 + 10, yy - w * 0.08, x + w / 2 - 10, yy))
        p.setFillType(skia.PathFillType.kWinding)
        p = skia.Op(p, p, skia.PathOp.kUnion_PathOp) or p
        c.drawPath(p, fillp(cc))
        c.save(); c.clipPath(p, doAntiAlias=True)
        c.drawRect(skia.Rect(x - w, yy - w * 0.06, x + w, yy + 10), fillp(shade(cc, -0.12)))
        c.restore()
        c.drawPath(p, strokep(INK, 4))


def yurt(c, x, y, s, col='#e3d8c0', door='#b0472f', night=False, glow=False):
    """felt ger, base centre at x,y"""
    wall = path([(x - 170 * s, y), (x - 170 * s, y - 120 * s), (x + 170 * s, y - 120 * s), (x + 170 * s, y)])
    cc = rgb(col) if not night else shade(rgb(col), -0.45)
    draw(c, wall, cc, 5)
    roof = path([(x - 185 * s, y - 115 * s), (x - 40 * s, y - 225 * s), (x + 40 * s, y - 225 * s), (x + 185 * s, y - 115 * s)], smooth=False)
    draw(c, roof, shade(cc, -0.08), 5)
    for k in (-1, 1):  # ropes
        c.drawLine(x - 170 * s, y - (60 + k * 25) * s, x + 170 * s, y - (60 + k * 25) * s, strokep(shade(cc, -0.35), 4 * s))
    c.drawRect(skia.Rect(x - 40 * s, y - 232 * s, x + 40 * s, y - 222 * s), fillp(INK))
    d = skia.Rect(x - 34 * s, y - 95 * s, x + 34 * s, y)
    if glow:
        c.drawRect(d, fillp(rgb('#ffbf5c')))
        g = rgrad(x, y - 50 * s, 180 * s, [skia.Color(255, 170, 70, 90), skia.Color(255, 170, 70, 0)])
        c.drawCircle(x, y - 50 * s, 180 * s, g)
    else:
        c.drawRect(d, fillp(rgb(door) if not night else shade(rgb(door), -0.4)))
    c.drawRect(d, strokep(INK, 4))
    # smoke hole pipe
    c.drawLine(x + 10 * s, y - 228 * s, x + 14 * s, y - 280 * s, strokep(INK, 6 * s))


def pine(c, x, y, s, col='#2f4a3a'):
    c.drawLine(x, y, x, y - 60 * s, strokep(INK, 14 * s)); c.drawLine(x, y, x, y - 60 * s, strokep(rgb('#5a3a22'), 8 * s))
    for k in range(4):
        w = (110 - k * 22) * s; yy = y - 40 * s - k * 70 * s
        tri = path([(x - w, yy), (x, yy - 120 * s), (x + w, yy)])
        draw(c, tri, shade(rgb(col), -0.05 * k), 4)


def forest(c, y, seed, n=26, col='#2f4a3a', scale=1.0):
    rnd = random.Random(seed)
    for i in range(n):
        x = -OX + (i + rnd.random()) * (LW / n)
        pine(c, x, y + rnd.uniform(-20, 30), rnd.uniform(0.8, 1.3) * scale, col)


def moon(c, x, y, r=70):
    g = rgrad(x, y, r * 4, [skia.Color(220, 230, 255, 70), skia.Color(220, 230, 255, 0)])
    c.drawCircle(x, y, r * 4, g)
    c.drawCircle(x, y, r, fillp(rgb('#f1ecd8')))
    c.drawCircle(x + r * 0.3, y - r * 0.2, r * 0.22, fillp(rgb('#ddd5bd')))
    c.drawCircle(x - r * 0.35, y + r * 0.3, r * 0.15, fillp(rgb('#ddd5bd')))
    c.drawCircle(x, y, r, strokep(INK, 4))


def stars(c, seed, n=140, ymax=600):
    rnd = random.Random(seed)
    for _ in range(n):
        x = rnd.uniform(-OX, LW - OX); y = rnd.uniform(-OY, ymax)
        c.drawCircle(x, y, rnd.uniform(1, 2.6), fillp(skia.Color(240, 240, 220, rnd.randint(120, 255))))


def sky(c, look):
    L = LOOKS[look]
    c.drawRect(skia.Rect(-OX, -OY, LW - OX, LH - OY), vgrad(-OY, 800, [rgb(L['sky'][0]), rgb(L['sky'][1])]))


def banner_tug(c, x, y, s, col='#e8e2d2'):
    c.drawLine(x, y, x, y - 420 * s, strokep(INK, 12 * s)); c.drawLine(x, y, x, y - 420 * s, strokep(rgb('#6b4a2e'), 6 * s))
    tuft = path([(x - 40 * s, y - 380 * s), (x, y - 430 * s), (x + 40 * s, y - 380 * s), (x + 30 * s, y - 250 * s), (x, y - 230 * s), (x - 30 * s, y - 250 * s)], smooth=True)
    draw(c, tuft, rgb(col), 4)
    c.drawPath(path([(x - 18 * s, y - 470 * s), (x, y - 520 * s), (x + 18 * s, y - 470 * s)]), fillp(rgb('#c9a25a')))


def wall_city(c, y, col='#b59a6e', persian=False, seed=3):
    rnd = random.Random(seed)
    cc = rgb(col)
    wl = path([(-OX, y), (-OX, y - 260), (LW - OX, y - 260), (LW - OX, y)])
    draw(c, wl, cc, 5)
    for k in range(-OX, LW - OX, 60):  # crenellations
        c.drawRect(skia.Rect(k, y - 290, k + 34, y - 258), fillp(cc)); c.drawRect(skia.Rect(k, y - 290, k + 34, y - 258), strokep(INK, 4))
    for k in range(-OX, LW - OX, 46):
        for row in range(5):
            yy = y - 250 + row * 50 + (row % 2) * 0
            c.drawLine(k + (row % 2) * 23, yy, k + (row % 2) * 23 + 40, yy, strokep(shade(cc, -0.2), 2))
    for tx in range(-OX + 200, LW - OX, 640):
        tw = path([(tx - 90, y), (tx - 90, y - 420), (tx + 90, y - 420), (tx + 90, y)])
        draw(c, tw, shade(cc, 0.05), 5)
        if persian:
            dome = path([(tx - 95, y - 420), (tx - 70, y - 520), (tx, y - 580), (tx + 70, y - 520), (tx + 95, y - 420)], smooth=True)
            draw(c, dome, rgb('#3f7f86'), 5)
        else:
            rf = path([(tx - 130, y - 420), (tx, y - 520), (tx + 130, y - 420)])
            draw(c, rf, rgb('#5c3a2e'), 5)
    gx = 960
    gate = path([(gx - 110, y), (gx - 110, y - 170), (gx, y - 240), (gx + 110, y - 170), (gx + 110, y)], smooth=False)
    draw(c, gate, rgb('#2a1d16'), 5)


# --------------------------------------------------------------------------- set builders
@functools.lru_cache(None)
def build_steppe(look='day', yurts=0, mountains_on=True, river=False, snow=False, seed=1, horizon=640, camp_glow=False, trees=False):
    L = LOOKS[look]
    layers = []
    s, c = new_layer(); sky(c, look)
    if look in ('night',):
        stars(c, seed); moon(c, 1450, 180)
    elif look in ('dusk', 'dawn', 'war'):
        sun = rgrad(1300, horizon - 60, 500, [skia.Color(255, 200, 120, 160), skia.Color(255, 160, 80, 0)])
        c.drawCircle(1300, horizon - 60, 500, sun)
        c.drawCircle(1300, horizon - 60, 70, fillp(rgb('#ffd59a')))
    else:
        clouds(c, 220, '#f2ead8' if look != 'storm' else '#5b5a58', seed)
    layers.append((0.0, snap(s)))
    s, c = new_layer()
    if mountains_on:
        mountains(c, horizon, 360, L['far'], seed + 1, snow=look in ('day', 'winter', 'dawn') or snow)
    hills(c, horizon + 40, 90, L['mid'], seed + 2, ow=4)
    # atmospheric haze band at the horizon
    hz = rgb(L['sky'][1])
    c.drawRect(skia.Rect(-OX, horizon - 160, LW - OX, horizon + 140), vgrad(horizon - 160, horizon + 140, [skia.Color(skia.ColorGetR(hz), skia.ColorGetG(hz), skia.ColorGetB(hz), 0), skia.Color(skia.ColorGetR(hz), skia.ColorGetG(hz), skia.ColorGetB(hz), 110), skia.Color(skia.ColorGetR(hz), skia.ColorGetG(hz), skia.ColorGetB(hz), 0)]))
    layers.append((0.15, snap(s)))
    s, c = new_layer()
    hills(c, horizon + 150, 70, L['near'] if not snow else '#e6e4dc', seed + 3, top_col=None)
    if trees:
        forest(c, horizon + 150, seed + 9, col='#26392e' if look in ('night', 'storm') else '#3a5a44')
    for i in range(yurts):
        night = look in ('night', 'storm')
        yurt(c, 520 + i * 330 + (i % 2) * 60, horizon + 150 - 10 + (i % 3) * 18, 0.55 + (i % 2) * 0.08, night=night, glow=camp_glow and i % 2 == 0)
    if river:
        rv = path([(-OX, horizon + 320), (500, horizon + 270), (1100, horizon + 300), (1700, horizon + 260), (LW - OX, horizon + 290),
                   (LW - OX, horizon + 360), (1700, horizon + 340), (1100, horizon + 390), (500, horizon + 350), (-OX, horizon + 400)], smooth=True)
        rc = rgb('#5a7f8e') if look not in ('night', 'storm') else rgb('#24384a')
        draw(c, rv, rc, 4)
    layers.append((0.45, snap(s)))
    s, c = new_layer()
    gcol = L['near'] if not snow else '#eeeeea'
    g = path([(-OX, horizon + 330), (400, horizon + 300), (1200, horizon + 320), (LW - OX, horizon + 300), (LW - OX, LH - OY), (-OX, LH - OY)], smooth=False)
    draw(c, g, None, 0, grad=vgrad(horizon + 300, 1200, [rgb(gcol), shade(rgb(gcol), -0.25)]))
    if not snow:
        grass_tufts(c, horizon + 330, 1180, gcol, seed + 4)
    layers.append((1.0, snap(s)))
    return layers


@functools.lru_cache(None)
def build_yurt_interior(look='night', seed=2):
    layers = []
    s, c = new_layer()
    felt = rgb('#7a5a3e')
    c.drawRect(skia.Rect(-OX, -OY, LW - OX, LH - OY), fillp(shade(felt, -0.5)))
    # lattice wall
    for k in range(-OX, LW - OX, 70):
        c.drawLine(k, 180, k + 140, 640, strokep(rgb('#a8763e'), 6)); c.drawLine(k + 140, 180, k, 640, strokep(rgb('#a8763e'), 6))
    c.drawRect(skia.Rect(-OX, 160, LW - OX, 200), fillp(rgb('#8a3a2a'))); c.drawRect(skia.Rect(-OX, 160, LW - OX, 200), strokep(INK, 4))
    for k in range(-OX, LW - OX, 120):  # roof poles
        c.drawLine(k, 170, 960 + (k - 960) * 0.35, -OY, strokep(rgb('#c0503a'), 9))
    # hangings + chest
    for x in (280, 1640):
        tap = skia.Rect(x - 120, 260, x + 120, 560)
        c.drawRect(tap, fillp(rgb('#6e2c22'))); c.drawRect(tap, strokep(INK, 5))
        for j in range(4):
            c.drawRect(skia.Rect(x - 90 + j * 6, 290 + j * 60, x + 90 - j * 6, 320 + j * 60), strokep(rgb('#d4ab55'), 4))
    ch = skia.Rect(1250, 520, 1520, 660)
    c.drawRect(ch, fillp(rgb('#9c4a2c'))); c.drawRect(ch, strokep(INK, 5))
    c.drawRect(skia.Rect(1260, 540, 1510, 560), fillp(rgb('#d4ab55')))
    layers.append((0.2, snap(s)))
    s, c = new_layer()
    fl = path([(-OX, 640), (LW - OX, 640), (LW - OX, LH - OY), (-OX, LH - OY)])
    draw(c, fl, None, 0, grad=vgrad(640, 1150, [rgb('#5e4430'), rgb('#2e2018')]))
    rug = path([(380, 760), (1540, 760), (1700, 1080), (220, 1080)])
    draw(c, rug, rgb('#8a2f24'), 5)
    for j in range(5):
        c.drawPath(path([(420 + j * 30, 790 + j * 18), (1500 - j * 30, 790 + j * 18), (1640 - j * 34, 1060 - j * 18), (280 + j * 34, 1060 - j * 18)]), strokep(rgb('#d4ab55') if j % 2 == 0 else rgb('#2f4a5a'), 4))
    layers.append((1.0, snap(s)))
    return layers


def build(set_name, **kw):
    if set_name == 'steppe':
        return build_steppe(**kw)
    if set_name == 'yurt':
        return build_yurt_interior(**kw)
    if set_name == 'city':
        return build_city(**kw)
    if set_name == 'palace':
        return build_palace(**kw)
    raise KeyError(set_name)


@functools.lru_cache(None)
def build_city(look='day', persian=False, seed=5):
    layers = list(build_steppe(look, 0, True, False, False, seed, 640))[:2]
    s, c = new_layer()
    wall_city(c, 900, '#b59a6e' if not persian else '#c8a878', persian, seed)
    layers.append((0.45, snap(s)))
    s, c = new_layer()
    L = LOOKS[look]
    g = path([(-OX, 900), (LW - OX, 900), (LW - OX, LH - OY), (-OX, LH - OY)])
    draw(c, g, None, 0, grad=vgrad(900, 1200, [rgb(L['near']), shade(rgb(L['near']), -0.3)]))
    layers.append((1.0, snap(s)))
    return layers


@functools.lru_cache(None)
def build_palace(look='day', seed=6):
    layers = []
    s, c = new_layer()
    c.drawRect(skia.Rect(-OX, -OY, LW - OX, LH - OY), fillp(rgb('#3b2c3a')))
    for i, x in enumerate(range(-OX, LW - OX, 420)):
        arch = path([(x + 60, 820), (x + 60, 300), (x + 210, 120), (x + 360, 300), (x + 360, 820)], smooth=False)
        draw(c, arch, rgb('#c8a878'), 6)
        inner = path([(x + 110, 820), (x + 110, 330), (x + 210, 200), (x + 310, 330), (x + 310, 820)])
        draw(c, inner, rgb('#2a4f60'), 5)
        for j in range(6):
            for k in range(3):
                cx, cy = x + 145 + k * 65, 380 + j * 70
                d = path([(cx, cy - 22), (cx + 22, cy), (cx, cy + 22), (cx - 22, cy)])
                draw(c, d, rgb('#3f8a8e') if (j + k) % 2 else rgb('#d9c38a'), 2)
    layers.append((0.25, snap(s)))
    s, c = new_layer()
    fl = path([(-OX, 820), (LW - OX, 820), (LW - OX, LH - OY), (-OX, LH - OY)])
    draw(c, fl, None, 0, grad=vgrad(820, 1150, [rgb('#7a5a4a'), rgb('#3a2a24')]))
    rug = path([(560, 880), (1360, 880), (1500, 1120), (420, 1120)])
    draw(c, rug, rgb('#2f4a6a'), 5)
    layers.append((1.0, snap(s)))
    return layers


def draw_layers(c, layers, cam):
    """cam = (x, y, zoom): world point at screen centre; parallax by depth"""
    cx, cy, z = cam
    for d, img in layers:
        zz = 1 + (z - 1) * (0.35 + 0.65 * d)
        px = (cx - 960) * (0.15 + 0.85 * d)
        py = (cy - 540) * (0.15 + 0.85 * d)
        c.save()
        c.translate(960, 540)
        c.scale(zz, zz)
        c.translate(-960 - px, -540 - py)
        c.drawImage(img, -OX, -OY)
        c.restore()


def world_tx(c, cam, d=1.0):
    """apply the transform of a layer at depth d (for drawing animated objects in world space)"""
    cx, cy, z = cam
    zz = 1 + (z - 1) * (0.35 + 0.65 * d)
    px = (cx - 960) * (0.15 + 0.85 * d)
    py = (cy - 540) * (0.15 + 0.85 * d)
    c.translate(960, 540)
    c.scale(zz, zz)
    c.translate(-960 - px, -540 - py)
