"""Doc Zap long-form 2D comic kit (Born-in-Lore style).
Skia vector drawing: bold dark outlines, muted sepia/teal palette, warm fire accents,
parallax sets, puppet characters with big expressive eyes, paper overlays.
All coordinates are in a 1920x1080 design space."""
import math, random, functools
import numpy as np
import skia

W, H = 1920, 1080
INK = skia.Color(30, 22, 18)
FONTDIR = '/usr/share/fonts/truetype/google-fonts/ofl/'
KIT_DIR = __file__.rsplit('/', 1)[0]


def rgb(h, a=255):
    h = h.lstrip('#')
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mix(c1, c2, t):
    a = [skia.ColorGetR(c1), skia.ColorGetG(c1), skia.ColorGetB(c1), skia.ColorGetA(c1)]
    b = [skia.ColorGetR(c2), skia.ColorGetG(c2), skia.ColorGetB(c2), skia.ColorGetA(c2)]
    return skia.Color(*[int(a[i] + (b[i] - a[i]) * t) for i in (0, 1, 2, 3)])


def shade(c, k):
    """k<0 darker, k>0 lighter"""
    return mix(c, skia.Color(255, 245, 225) if k > 0 else skia.Color(20, 14, 12), abs(k))


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def eio(t):
    t = max(0.0, min(1.0, t))
    return 0.5 - 0.5 * math.cos(math.pi * t)


def lerp(a, b, t):
    return a + (b - a) * t


@functools.lru_cache(None)
def font(name, size):
    paths = {
        'serif': FONTDIR + 'cardo/Cardo-Bold.ttf',
        'serif_r': FONTDIR + 'cardo/Cardo-Regular.ttf',
        'serif_i': FONTDIR + 'cardo/Cardo-Italic.ttf',
        'crimson': FONTDIR + 'crimsontext/CrimsonText-Bold.ttf',
        'hand': KIT_DIR + '/../engine/fonts/caveat-latin-700-normal.woff',
        'sans': '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf',
    }
    tf = skia.Typeface.MakeFromFile(paths[name])
    if tf is None:
        tf = skia.Typeface('serif')
    f = skia.Font(tf, size)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    return f


def P(**kw):
    p = skia.Paint(AntiAlias=True, **kw)
    return p


def fillp(c):
    return P(Color=c, Style=skia.Paint.kFill_Style)


def strokep(c=INK, w=5):
    return P(Color=c, Style=skia.Paint.kStroke_Style, StrokeWidth=w,
             StrokeJoin=skia.Paint.kRound_Join, StrokeCap=skia.Paint.kRound_Cap)


def path(pts, close=True, smooth=False):
    """pts: list of (x,y). smooth -> Catmull-Rom through points"""
    p = skia.Path()
    if not pts:
        return p
    if not smooth:
        p.moveTo(*pts[0])
        for q in pts[1:]:
            p.lineTo(*q)
    else:
        n = len(pts)
        p.moveTo(*pts[0])
        rng = range(n if close else n - 1)
        for i in rng:
            p0 = pts[(i - 1) % n] if (close or i > 0) else pts[i]
            p1 = pts[i]
            p2 = pts[(i + 1) % n]
            p3 = pts[(i + 2) % n] if (close or i + 2 < n) else p2
            c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
            p.cubicTo(*c1, *c2, *p2)
    if close:
        p.close()
    return p


def draw(c, pth, col, ow=5, oc=INK, grad=None):
    if grad is not None:
        c.drawPath(pth, grad)
    elif col is not None:
        c.drawPath(pth, fillp(col))
    if ow:
        c.drawPath(pth, strokep(oc, ow))


def vgrad(y0, y1, cols, pos=None):
    sh = skia.GradientShader.MakeLinear([(0, y0), (0, y1)], cols, pos)
    return P(Shader=sh)


def rgrad(cx, cy, r, cols, pos=None):
    sh = skia.GradientShader.MakeRadial((cx, cy), r, cols, pos)
    return P(Shader=sh)


def ellipse(cx, cy, rx, ry):
    p = skia.Path()
    p.addOval(skia.Rect(cx - rx, cy - ry, cx + rx, cy + ry))
    return p


def limb(c, pts, col, w, ow=4):
    """thick rounded limb with outline"""
    pth = path(pts, close=False, smooth=len(pts) > 2)
    c.drawPath(pth, strokep(INK, w + ow * 2))
    c.drawPath(pth, strokep(col, w))


def text(c, s, x, y, f, col, align='center', stroke=None, sw=0, shadow=None):
    w = f.measureText(s)
    if align == 'center':
        x -= w / 2
    elif align == 'right':
        x -= w
    blob = skia.TextBlob.MakeFromString(s, f)
    if shadow:
        sp = fillp(shadow)
        sp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 6))
        c.drawTextBlob(blob, x + 3, y + 5, sp)
    if stroke:
        c.drawTextBlob(blob, x, y, strokep(stroke, sw))
    c.drawTextBlob(blob, x, y, fillp(col))
    return w


# --------------------------------------------------------------------------- palette / looks
LOOKS = {
    # sky top, sky bottom, far, mid, near ground, ambient tint, light colour
    'dawn':   dict(sky=('#3d4a5c', '#d9a46a'), far='#6b6f7a', mid='#8a8662', near='#a89a5e', tint='#f2c28a', amb=0.0),
    'day':    dict(sky=('#7fa3b8', '#e3d4ad'), far='#8d9aa0', mid='#9b9a66', near='#b5a565', tint='#fff1d0', amb=0.0),
    'dusk':   dict(sky=('#2e2a3d', '#c8734a'), far='#5a4a55', mid='#6e5a45', near='#7d6a45', tint='#f0a060', amb=0.15),
    'night':  dict(sky=('#0e1626', '#2c3b52'), far='#26324a', mid='#2e3a44', near='#3a4236', tint='#9fb4d8', amb=0.35),
    'winter': dict(sky=('#5f6f82', '#c9cfd2'), far='#8e98a3', mid='#b9bdb8', near='#d8d8d0', tint='#e6eef5', amb=0.05),
    'storm':  dict(sky=('#1c1f24', '#4d4a45'), far='#3b3c3e', mid='#4a4639', near='#5a5238', tint='#c8b89a', amb=0.25),
    'war':    dict(sky=('#2a1612', '#a5482a'), far='#4d2e26', mid='#5e3d2a', near='#6b4a30', tint='#ff9a5a', amb=0.2),
}


# --------------------------------------------------------------------------- noise texture (paper / grain)
_rng = np.random.default_rng(7)


def _make_noise(sz=512, a=1.0):
    n = _rng.normal(0, 1, (sz, sz)).astype(np.float32)
    k = np.array([1, 4, 6, 4, 1], np.float32)
    k = k / k.sum()
    for ax in (0, 1):
        n = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), ax, n)
    n = (n - n.min()) / (n.max() - n.min())
    return n


_NOISE = _make_noise()


def noise_image(alpha=28, warm=True, seed=0):
    n = np.roll(_NOISE, (seed * 37) % 512, axis=0)
    v = (n * 255).astype(np.uint8)
    arr = np.zeros((512, 512, 4), np.uint8)
    arr[..., 0] = v
    arr[..., 1] = (v * (0.92 if warm else 1)).astype(np.uint8)
    arr[..., 2] = (v * (0.8 if warm else 1)).astype(np.uint8)
    arr[..., 3] = alpha
    return skia.Image.fromarray(arr, colorType=skia.kRGBA_8888_ColorType)


_PAPER = None


def paper_paint(alpha=40):
    global _PAPER
    if _PAPER is None:
        _PAPER = noise_image(255)
    sh = _PAPER.makeShader(skia.TileMode.kRepeat, skia.TileMode.kRepeat)
    p = P(Shader=sh, Alpha=alpha)
    p.setBlendMode(skia.BlendMode.kOverlay)
    return p
