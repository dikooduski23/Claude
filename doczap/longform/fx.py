"""Effects: lighting pass, fire, embers, smoke, snow, dust, arrows, rain, whip blur."""
import math, random
import numpy as np
import skia
from kit import *


def fire(c, x, y, r, t, seed=0, logs=True):
    """layered campfire with tongues, embers and a ground light pool"""
    rnd = random.Random(seed)
    # ground light pool
    c.drawOval(skia.Rect(x - r * 5, y - r * 0.9, x + r * 5, y + r * 0.9),
               rgrad(x, y, r * 5, [skia.Color(255, 170, 80, 120), skia.Color(255, 140, 60, 0)]))
    if logs:
        for a in (-0.35, 0.35, 0):
            dx = math.cos(a) * r * 1.3; dy = math.sin(a) * r * 0.25
            c.drawLine(x - dx, y + dy + 6, x + dx, y - dy + 6, strokep(INK, r * 0.42))
            c.drawLine(x - dx, y + dy + 6, x + dx, y - dy + 6, strokep(rgb('#5a3a22'), r * 0.28))
    # tongues: back (red) -> mid (orange) -> core (yellow)
    for layer, (col, k, n) in enumerate([('#c8401e', 1.25, 5), ('#f08a2a', 1.0, 4), ('#ffd56a', 0.62, 3)]):
        for i in range(n):
            ph = t * (6 + i * 1.7) + seed * 3 + i * 2.1 + layer
            ox = (i - (n - 1) / 2) * r * 0.42 * k
            h = r * k * (1.7 + 0.45 * math.sin(ph) + 0.25 * math.sin(ph * 2.3))
            w = r * 0.42 * k
            sway = math.sin(ph * 0.7) * r * 0.25
            p = path([(x + ox - w, y), (x + ox - w * 0.6, y - h * 0.45), (x + ox + sway, y - h), (x + ox + w * 0.6, y - h * 0.45), (x + ox + w, y)], smooth=True)
            c.drawPath(p, fillp(rgb(col)))
            if layer == 0:
                c.drawPath(p, strokep(INK, 3.5))
    # embers
    for i in range(14):
        life = (t * 0.6 + i / 14 + seed * 0.13) % 1.0
        ex = x + math.sin(i * 7.3 + t * 2) * r * (0.4 + life * 1.4)
        ey = y - r * 0.8 - life * r * 6
        c.drawCircle(ex, ey, max(0.8, 3.2 * (1 - life)), fillp(skia.Color(255, 200, 90, int(255 * (1 - life)))))


def torch_flame(c, x, y, r, t, seed=0):
    for col, k in (('#e0602a', 1.0), ('#ffd56a', 0.55)):
        h = r * k * (2.0 + 0.35 * math.sin(t * 13 + seed))
        p = path([(x - r * 0.5 * k, y), (x - r * 0.3 * k, y - h * 0.5), (x + math.sin(t * 9 + seed) * r * 0.2, y - h), (x + r * 0.3 * k, y - h * 0.5), (x + r * 0.5 * k, y)], smooth=True)
        c.drawPath(p, fillp(rgb(col)))


class Light:
    """lighting pass: darken everything by `dark` (0..1) with colour, then cut holes / add glow for light sources"""
    def __init__(self, dark=0.0, col='#0a1020', lights=()):
        self.dark = dark; self.col = col; self.lights = lights

    def apply(self, c, t, cam_fn=None):
        if self.dark <= 0 and not self.lights:
            return
        # multiply darkness layer with radial holes
        c.saveLayer(None, None)
        dc = rgb(self.col)
        c.drawRect(skia.Rect(0, 0, W, H), fillp(skia.Color(skia.ColorGetR(dc), skia.ColorGetG(dc), skia.ColorGetB(dc), int(255 * self.dark))))
        for (x, y, r, col, flick) in self.lights:
            if cam_fn:
                x, y, sc = cam_fn(x, y); r *= sc
            f = 1 + flick * (0.06 * math.sin(t * 11 + x) + 0.04 * math.sin(t * 23 + y))
            p = rgrad(x, y, r * f, [skia.Color(0, 0, 0, 255), skia.Color(0, 0, 0, 140), skia.Color(0, 0, 0, 0)], [0, 0.5, 1])
            p.setBlendMode(skia.BlendMode.kDstOut)
            c.drawCircle(x, y, r * f, p)
        c.restore()
        # additive warm glow
        for (x, y, r, col, flick) in self.lights:
            if cam_fn:
                x, y, sc = cam_fn(x, y); r *= sc
            f = 1 + flick * (0.08 * math.sin(t * 13 + x))
            lc = rgb(col)
            p = rgrad(x, y, r * 0.75 * f, [skia.Color(skia.ColorGetR(lc), skia.ColorGetG(lc), skia.ColorGetB(lc), 70), skia.Color(skia.ColorGetR(lc), skia.ColorGetG(lc), skia.ColorGetB(lc), 0)])
            p.setBlendMode(skia.BlendMode.kScreen)
            c.drawCircle(x, y, r * 0.75 * f, p)


def snow(c, t, n=160, seed=1, wind=40):
    rnd = random.Random(seed)
    for i in range(n):
        sp = rnd.uniform(40, 110); sz = rnd.uniform(1.5, 4.5)
        x = (rnd.uniform(0, W) + t * wind * (sz / 3) + math.sin(t + i) * 12) % W
        y = (rnd.uniform(0, H) + t * sp) % H
        c.drawCircle(x, y, sz, fillp(skia.Color(245, 245, 250, 210)))


def dust(c, t, n=60, seed=2, col=(220, 190, 140)):
    rnd = random.Random(seed)
    for i in range(n):
        x = (rnd.uniform(0, W) + t * rnd.uniform(10, 40)) % W
        y = rnd.uniform(0, H) + math.sin(t * 0.7 + i) * 15
        c.drawCircle(x, y, rnd.uniform(1, 3), fillp(skia.Color(*col, rnd.randint(60, 140))))


def embers_screen(c, t, n=50, seed=3):
    rnd = random.Random(seed)
    for i in range(n):
        life = (t * rnd.uniform(0.15, 0.35) + rnd.random()) % 1
        x = rnd.uniform(0, W) + math.sin(t * 2 + i) * 30
        y = H + 40 - life * (H + 100)
        c.drawCircle(x, y, 2.5 * (1 - life) + 0.8, fillp(skia.Color(255, 180, 80, int(230 * (1 - life)))))


def smoke(c, x, y, t, s=1.0, n=7, seed=4, col=(60, 50, 45)):
    rnd = random.Random(seed)
    for i in range(n):
        life = (t * 0.12 + i / n) % 1
        px = x + math.sin(i * 2.1 + t * 0.3) * 40 * s + life * 120 * s
        py = y - life * 420 * s
        r = (40 + life * 140) * s
        c.drawCircle(px, py, r, fillp(skia.Color(*col, int(150 * (1 - life)))))


def rain_arrows(c, t, n=40, seed=5, ang=-0.45, speed=900, col='#2a1d16'):
    rnd = random.Random(seed)
    for i in range(n):
        x0 = rnd.uniform(-300, W + 300); ph = (t * speed / 1400 + rnd.random()) % 1
        x = x0 + ph * 1400 * math.cos(ang) * -1
        y = -100 + ph * 1400 * math.sin(-ang)
        L = 70
        dx = -math.cos(ang) * L; dy = math.sin(-ang) * L
        c.drawLine(x, y, x + dx, y + dy, strokep(rgb(col), 3))
        c.drawPath(path([(x + dx, y + dy), (x + dx * 1.15 - dy * 0.08, y + dy * 1.15 + dx * 0.08), (x + dx * 1.15 + dy * 0.08, y + dy * 1.15 - dx * 0.08)]), fillp(rgb(col)))


def speed_lines(c, t, n=24, seed=6, alpha=60):
    rnd = random.Random(seed)
    for i in range(n):
        y = rnd.uniform(0, H); L = rnd.uniform(200, 600)
        x = (rnd.uniform(0, W) - t * 2400) % (W + 600) - 300
        c.drawLine(x, y, x + L, y, strokep(skia.Color(240, 230, 210, alpha), rnd.uniform(1.5, 4)))


def camel(c, x, y, s, facing=1, t=0.0, rider=None):
    f = facing
    col = rgb('#c49a62')
    bob = math.sin(t * 6) * 6 * s
    by = y - 260 * s + bob
    for i, lx in enumerate((-110, -80, 90, 120)):
        ph = math.sin(t * 6 + i * 1.7)
        limb(c, [(x + f * lx * s, by + 40 * s), (x + f * (lx + ph * 25) * s, by + 150 * s), (x + f * (lx + ph * 40) * s, y)], shade(col, -0.2 if i % 2 else 0), 26 * s, 4)
    body = path([(x - f * 170 * s, by + 10 * s), (x - f * 120 * s, by - 60 * s), (x - f * 50 * s, by - 150 * s), (x + f * 10 * s, by - 70 * s), (x + f * 60 * s, by - 140 * s), (x + f * 130 * s, by - 60 * s),
                 (x + f * 160 * s, by + 40 * s), (x - f * 150 * s, by + 55 * s)], smooth=True)
    draw(c, body, col, 5)
    nk = path([(x + f * 140 * s, by - 20 * s), (x + f * 230 * s, by - 110 * s), (x + f * 250 * s, by - 190 * s), (x + f * 300 * s, by - 185 * s), (x + f * 305 * s, by - 160 * s),
               (x + f * 265 * s, by - 150 * s), (x + f * 255 * s, by - 90 * s), (x + f * 165 * s, by + 30 * s)], smooth=True)
    draw(c, nk, col, 5)
    c.drawCircle(x + f * 270 * s, by - 178 * s, 5 * s, fillp(INK))
    if rider is not None:
        from chars import draw_char
        draw_char(c, x - f * 10 * s, by - 40 * s + 110 * s, s * 0.9, rider, dict(facing=f, sit=1, expr='fear', seed=3), t)


def whip_blur(img, amount, direction=1):
    """returns an image filter-applied draw of img with horizontal blur (for whip-pans)"""
    s = skia.Surface(W, H)
    c = s.getCanvas()
    p = skia.Paint(ImageFilter=skia.ImageFilters.Blur(amount, amount * 0.04))
    c.drawImage(img, 0, 0, skia.SamplingOptions(), p)
    return s.makeImageSnapshot()
