"""Born-in-Lore style overlays: chapter cards, polaroids, notes, map, end card, film finish."""
import math, random
import numpy as np
import skia
from kit import *


def chapter_card(c, num, title, sub, t, dur=2.6):
    """full-frame chapter title: dark vignette band, roman numeral + serif title, ink rules draw in"""
    a = ease(t / 0.35) * (1 - ease((t - dur + 0.3) / 0.3))
    if a <= 0:
        return
    c.saveLayerAlpha(None, int(255 * a))
    band = skia.Rect(0, 360, W, 720)
    c.drawRect(band, vgrad(360, 720, [skia.Color(15, 10, 8, 0), skia.Color(15, 10, 8, 215), skia.Color(15, 10, 8, 215), skia.Color(15, 10, 8, 0)], [0, 0.25, 0.75, 1]))
    k = ease((t - 0.1) / 0.6)
    text(c, 'CHAPTER ' + num, 960, 470, font('serif', 40), rgb('#d4ab55'))
    c.drawLine(960 - 380 * k, 500, 960 + 380 * k, 500, strokep(rgb('#d4ab55'), 2))
    text(c, title, 960, 600, font('serif', 104), rgb('#f2e6cc'), shadow=skia.Color(0, 0, 0, 200))
    if sub:
        text(c, sub, 960, 660, font('serif_i', 38), rgb('#c9b894'))
    c.restore()


def location_tag(c, line1, line2, t, dur=3.0, x=110, y=930):
    a = ease(t / 0.3) * (1 - ease((t - dur + 0.3) / 0.3))
    if a <= 0:
        return
    c.saveLayerAlpha(None, int(255 * a))
    text(c, line1, x, y, font('serif', 64), rgb('#f2e6cc'), align='left', shadow=skia.Color(0, 0, 0, 220))
    c.drawLine(x, y + 22, x + 420 * ease(t / 0.8), y + 22, strokep(rgb('#d4ab55'), 3))
    if line2:
        text(c, line2, x, y + 72, font('serif_i', 38), rgb('#d9c9a4'), align='left', shadow=skia.Color(0, 0, 0, 220))
    c.restore()


def paper_note(c, lines, x, y, t, rot=-3, w=520, tape=True, dur=99):
    k = ease(t / 0.35)
    if k <= 0 or t > dur:
        return
    c.save()
    c.translate(x, y + (1 - k) * 60)
    c.rotate(rot)
    h = 70 + 58 * len(lines)
    sh = fillp(skia.Color(0, 0, 0, 90)); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10))
    c.drawRect(skia.Rect(-w / 2 + 10, -h / 2 + 14, w / 2 + 10, h / 2 + 14), sh)
    r = skia.Rect(-w / 2, -h / 2, w / 2, h / 2)
    c.drawRect(r, fillp(rgb('#efe3c2'))); c.drawRect(r, paper_paint(60)); c.drawRect(r, strokep(rgb('#8a7a5a'), 2))
    for i, ln in enumerate(lines):
        reveal = ease((t - 0.25 - i * 0.35) / 0.4)
        if reveal > 0:
            c.save(); c.clipRect(skia.Rect(-w / 2, -h / 2, -w / 2 + w * reveal, h / 2))
            text(c, ln, -w / 2 + 34, -h / 2 + 78 + i * 58, font('hand', 52), rgb('#2a1d16'), align='left')
            c.restore()
    if tape:
        tp = skia.Rect(-70, -h / 2 - 20, 70, -h / 2 + 18)
        c.drawRect(tp, fillp(skia.Color(230, 220, 190, 180)))
    c.restore()


def polaroid(c, draw_fn, x, y, t, rot=4, w=430, h=380, caption=None):
    """polaroid drops in, draw_fn(c, rect) paints the photo content"""
    k = ease(t / 0.4)
    if k <= 0:
        return
    c.save()
    c.translate(x, y - (1 - k) * 500)
    c.rotate(rot + (1 - k) * 25)
    sh = fillp(skia.Color(0, 0, 0, 110)); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 14))
    c.drawRect(skia.Rect(-w / 2 + 12, -h / 2 + 16, w / 2 + 12, h / 2 + 80), sh)
    fr = skia.Rect(-w / 2, -h / 2, w / 2, h / 2 + 70)
    c.drawRect(fr, fillp(rgb('#f4efe2'))); c.drawRect(fr, strokep(rgb('#9a8f78'), 2))
    ph = skia.Rect(-w / 2 + 24, -h / 2 + 24, w / 2 - 24, h / 2 - 10)
    c.save(); c.clipRect(ph); draw_fn(c, ph); c.restore()
    c.drawRect(ph, strokep(INK, 3))
    if caption:
        text(c, caption, 0, h / 2 + 48, font('hand', 44), rgb('#2a1d16'))
    c.restore()


def red_circle(c, x, y, rx, ry, t):
    k = ease(t / 0.5)
    if k <= 0:
        return
    p = skia.Path()
    p.addArc(skia.Rect(x - rx, y - ry, x + rx, y + ry), -100, 370 * k)
    c.drawPath(p, strokep(rgb('#c0281e'), 8))


def year_stamp(c, s, t, x=1700, y=170):
    k = ease(t / 0.25)
    if k <= 0:
        return
    sc = 1.6 - 0.6 * k
    c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(-6)
    c.saveLayerAlpha(None, int(230 * k))
    f = font('serif', 70)
    w = f.measureText(s) + 60
    r = skia.Rect(-w / 2, -60, w / 2, 30)
    c.drawRect(r, strokep(rgb('#b8302a'), 6))
    text(c, s, 0, 6, f, rgb('#b8302a'))
    c.restore(); c.restore()


def height_chart(c, marks, t, x=1500):
    """time-passing growth chart on a felt wall; marks=[('9',y),...]"""
    for i, (lab, yy) in enumerate(marks):
        k = ease((t - i * 0.5) / 0.4)
        if k <= 0:
            continue
        c.drawLine(x - 70 * k, yy, x + 70 * k, yy, strokep(rgb('#efe3c2'), 6))
        text(c, lab, x + 100, yy + 14, font('hand', 52), rgb('#efe3c2'), align='left')


def end_card(c, t, question, sub='Who should be born next?'):
    k = ease(t / 0.6)
    c.saveLayerAlpha(None, int(255 * k))
    page = skia.Rect(360, 160, 1560, 920)
    sh = fillp(skia.Color(0, 0, 0, 140)); sh.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 20))
    c.drawRect(page.makeOffset(16, 20), sh)
    c.drawRect(page, fillp(rgb('#ecdfbf'))); c.drawRect(page, paper_paint(70)); c.drawRect(page, strokep(rgb('#6b5a3a'), 3))
    text(c, question[0], 960, 340, font('serif', 78), rgb('#2a1d16'))
    text(c, question[1], 960, 430, font('serif', 78), rgb('#2a1d16'))
    c.drawLine(660, 490, 1260, 490, strokep(rgb('#8a2f24'), 3))
    text(c, sub, 960, 600, font('hand', 70), rgb('#8a2f24'))
    opts = ['Nikola Tesla', 'a Spartan', 'a Roman Gladiator', 'a child of Pompeii']
    for i, o in enumerate(opts):
        kk = ease((t - 0.8 - i * 0.3) / 0.3)
        if kk > 0:
            c.drawRect(skia.Rect(520 + (i % 2) * 460, 660 + (i // 2) * 100, 560 + (i % 2) * 460, 700 + (i // 2) * 100), strokep(rgb('#2a1d16'), 4))
            text(c, o, 590 + (i % 2) * 460, 697 + (i // 2) * 100, font('hand', 54), rgb('#2a1d16'), align='left')
    c.restore()


# --------------------------------------------------------------------------- film finish (numpy, applied per frame)
_VIG = None


def vignette_mask():
    global _VIG
    if _VIG is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        _VIG = np.clip(1.0 - 0.42 * np.clip(d - 0.45, 0, 1) ** 1.4, 0, 1)[..., None]
    return _VIG


_GRAIN = [np.random.default_rng(i).normal(0, 1, (H // 2, W // 2)).astype(np.float32) for i in range(6)]


def film_finish(arr, frame, warm=0.06, grain=6.0):
    """arr: HxWx4 uint8 RGBA -> HxWx3 uint8 with grade, vignette, grain"""
    a = arr[..., :3].astype(np.float32)
    # gentle sepia grade (Born in Lore muted look)
    lum = a @ np.array([0.299, 0.587, 0.114], np.float32)
    a = a * 0.9 + lum[..., None] * 0.1
    a[..., 0] *= 1 + warm; a[..., 2] *= 1 - warm
    a *= vignette_mask()
    g = _GRAIN[frame % 6]
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)
    a += g[..., None] * grain
    return np.clip(a, 0, 255).astype(np.uint8)
