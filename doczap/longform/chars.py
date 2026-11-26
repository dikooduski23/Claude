"""Puppet characters for the long-form comic style.
draw_char(canvas, x, y, s, spec, pose, t)  -> feet at (x,y), adult height ~ 560*s"""
import math
import skia
from kit import *

SKIN = {'a': '#e2b48a', 'b': '#d3a077', 'c': '#c08a62', 'd': '#a9744f'}
EXPR = {
    # brow tilt (inner up +), brow height, mouth kind, eye openness, pupil size
    'neutral': (0.0, 0.0, 'flat', 1.0, 1.0),
    'calm':    (0.05, 0.0, 'soft', 0.8, 1.0),
    'smile':   (0.1, 0.05, 'smile', 0.85, 1.0),
    'grin':    (0.0, 0.08, 'grin', 0.75, 1.0),
    'smirk':   (-0.25, 0.0, 'smirk', 0.7, 1.0),
    'angry':   (-0.6, -0.06, 'snarl', 0.8, 0.85),
    'rage':    (-0.85, -0.1, 'shout', 0.95, 0.7),
    'sad':     (0.6, 0.04, 'frown', 0.75, 1.05),
    'cry':     (0.8, 0.06, 'cry', 0.6, 1.1),
    'fear':    (0.7, 0.14, 'o', 1.2, 0.65),
    'shock':   (0.3, 0.22, 'o', 1.3, 0.6),
    'determined': (-0.4, -0.03, 'flat', 0.85, 0.9),
    'cold':    (-0.2, -0.02, 'flat', 0.6, 0.85),
    'sleep':   (0.1, 0.0, 'soft', 0.0, 1.0),
    'dead':    (0.1, 0.0, 'soft', 0.0, 1.0),
    'shout':   (-0.5, 0.05, 'shout', 1.0, 0.8),
}

BASE = dict(skin='b', hair='#1b1512', hat='fur', robe='#7a3b2e', trim='#c9a25a', sash='#2f4a5a',
            pants='#3a2e28', boots='#3b2a20', beard='none', age='adult', female=False, hatcol=None,
            armor=False, scar=False, cape=None, bald=False)


def spec(**kw):
    d = dict(BASE)
    d.update(kw)
    return d


AGE = {  # body scale, head scale (relative), leg len
    'baby': (0.32, 0.62, 0.0),
    'child': (0.58, 0.82, 0.55),
    'teen': (0.82, 0.92, 0.85),
    'adult': (1.0, 1.0, 1.0),
    'old': (0.97, 1.0, 0.95),
}


def draw_head(c, hx, hy, r, sp, pose, t):
    f = pose.get('facing', 1)
    ex = pose.get('expr', 'neutral')
    bt, bh, mk, eo, ps = EXPR.get(ex, EXPR['neutral'])
    talk = pose.get('talk', 0.0)
    blink = pose.get('blink', None)
    if blink is None:  # automatic blink every ~3.7s
        ph = (t * 1.0 + pose.get('seed', 0) * 0.37) % 3.7
        blink = 1.0 if ph < 0.12 else 0.0
    eo = eo * (1 - blink)
    skin = rgb(SKIN.get(sp['skin'], sp['skin']) if not sp['skin'].startswith('#') else sp['skin'])
    if pose.get('tint'):
        skin = mix(skin, rgb(pose['tint']), 0.35)
    off = f * 0.16 * r  # feature offset for 3/4 view
    look = pose.get('look', (0, 0))
    # neck
    nk = path([(hx - 0.32 * r, hy + 0.55 * r), (hx + 0.32 * r, hy + 0.55 * r), (hx + 0.3 * r, hy + 1.05 * r), (hx - 0.3 * r, hy + 1.05 * r)])
    draw(c, nk, shade(skin, -0.15), 4)
    # ear (on the far side from facing)
    ea_x = hx - f * 0.86 * r
    ear = ellipse(ea_x, hy + 0.08 * r, 0.16 * r, 0.24 * r)
    draw(c, ear, shade(skin, -0.05), 4)
    # long hair behind (female / braids)
    if sp['female']:
        hb = path([(hx - 1.0 * r, hy - 0.3 * r), (hx + 1.0 * r, hy - 0.3 * r), (hx + 0.95 * r, hy + 1.1 * r), (hx - 0.95 * r, hy + 1.1 * r)], smooth=True)
        draw(c, hb, rgb(sp['hair']), 4)
    # face shape: wide cheeks, softly pointed jaw
    jaw = 1.0 if sp['age'] not in ('baby', 'child') else 0.86
    pts = [(-0.92, -0.35), (-0.9, 0.2), (-0.72, 0.62), (-0.36, 0.92 * jaw), (0.0 + f * 0.08, 1.0 * jaw),
           (0.36, 0.92 * jaw), (0.72, 0.62), (0.9, 0.2), (0.92, -0.35), (0.6, -0.9), (0.0, -1.02), (-0.6, -0.9)]
    face = path([(hx + px * r + (off * 0.4 if px * f > 0 else 0), hy + py * r) for px, py in pts], smooth=True)
    c.drawPath(face, fillp(skin))
    # cel shadow on the far side + under hat
    c.save()
    c.clipPath(face, doAntiAlias=True)
    sh = ellipse(hx - f * 1.05 * r, hy + 0.1 * r, 0.62 * r, 1.4 * r)
    c.drawPath(sh, fillp(shade(skin, -0.16)))
    c.drawRect(skia.Rect(hx - r * 1.2, hy - r * 1.3, hx + r * 1.2, hy - r * 0.5), fillp(shade(skin, -0.12)))
    # cheek warmth
    for sx in (-1, 1):
        cp = rgrad(hx + off + sx * 0.5 * r, hy + 0.38 * r, 0.3 * r, [skia.Color(220, 110, 90, 70), skia.Color(220, 110, 90, 0)])
        c.drawCircle(hx + off + sx * 0.5 * r, hy + 0.38 * r, 0.3 * r, cp)
    if sp['scar']:
        c.drawLine(hx + off + 0.35 * r, hy - 0.2 * r, hx + off + 0.55 * r, hy + 0.45 * r, strokep(shade(skin, -0.4), 3))
    c.restore()
    c.drawPath(face, strokep(INK, 5))
    # beard
    bd = sp['beard']
    if bd in ('khan', 'full', 'grey'):
        bc = rgb('#9a958c') if bd == 'grey' else rgb(sp['hair'])
        bpts = [(-0.78, 0.25), (-0.6, 0.75), (-0.25, 1.05), (0.0 + f * 0.08, 1.32 if bd != 'full' else 1.2), (0.25, 1.05), (0.6, 0.75), (0.78, 0.25), (0.5, 0.62), (0.0, 0.7), (-0.5, 0.62)]
        draw(c, path([(hx + px * r + off * 0.3, hy + py * r) for px, py in bpts], smooth=True), bc, 4)
    if bd == 'stubble':
        c.save(); c.clipPath(face, doAntiAlias=True)
        c.drawPath(path([(hx - 0.8 * r, hy + 0.35 * r), (hx + 0.8 * r, hy + 0.35 * r), (hx + 0.4 * r, hy + 1.1 * r), (hx - 0.4 * r, hy + 1.1 * r)], smooth=True), fillp(skia.Color(40, 30, 25, 60)))
        c.restore()
    # eyes
    ey = hy + 0.06 * r - bh * 0.2 * r
    for side in (-1, 1):
        cx = hx + off + side * 0.38 * r
        near = (side * f) > 0
        rx = 0.25 * r * (1.05 if near else 0.9)
        ry = 0.21 * r * eo
        if ex == 'dead':
            c.drawLine(cx - rx, ey - rx * 0.6, cx + rx, ey + rx * 0.6, strokep(INK, 5))
            c.drawLine(cx - rx, ey + rx * 0.6, cx + rx, ey - rx * 0.6, strokep(INK, 5))
            continue
        if ry < 0.02 * r:
            arc = path([(cx - rx, ey), (cx, ey + 0.06 * r), (cx + rx, ey)], close=False, smooth=True)
            c.drawPath(arc, strokep(INK, 5))
            continue
        # almond eye
        e = path([(cx - rx, ey + 0.02 * r), (cx - rx * 0.3, ey - ry), (cx + rx * 0.5, ey - ry * 0.95), (cx + rx, ey - 0.01 * r),
                  (cx + rx * 0.4, ey + ry * 0.85), (cx - rx * 0.4, ey + ry * 0.8)], smooth=True)
        c.drawPath(e, fillp(skia.Color(248, 242, 230)))
        c.save(); c.clipPath(e, doAntiAlias=True)
        ix = cx + f * 0.05 * r + look[0] * 0.08 * r
        iy = ey + 0.01 * r + look[1] * 0.05 * r
        ir = 0.155 * r
        c.drawCircle(ix, iy, ir, fillp(rgb('#4a2e1c')))
        c.drawCircle(ix, iy, ir * 0.55 * ps, fillp(rgb('#120c0a')))
        c.drawCircle(ix + 0.04 * r, iy - 0.045 * r, ir * 0.3, fillp(skia.Color(255, 255, 255)))
        c.restore()
        # upper lid: thick line
        lid = path([(cx - rx * 1.08, ey + 0.03 * r), (cx - rx * 0.3, ey - ry * 1.05), (cx + rx * 0.5, ey - ry), (cx + rx * 1.1, ey - 0.02 * r)], close=False, smooth=True)
        c.drawPath(lid, strokep(INK, 6))
        c.drawPath(path([(cx - rx * 0.4, ey + ry * 0.82), (cx + rx * 0.5, ey + ry * 0.86)], close=False), strokep(shade(skin, -0.35), 2.5))
        if ex in ('cry',):
            c.drawPath(path([(cx, ey + ry), (cx - 0.04 * r, ey + 0.5 * r), (cx, ey + 0.6 * r)], close=False, smooth=True), strokep(rgb('#8fc3e0'), 5))
    # brows
    for side in (-1, 1):
        cx = hx + off + side * 0.38 * r
        by = ey - 0.3 * r - bh * 0.3 * r
        inner = cx - side * 0.2 * r
        outer = cx + side * 0.22 * r
        iy = by - bt * 0.14 * r
        oy = by + bt * 0.06 * r
        bw = 9 if sp['age'] not in ('baby', 'child') else 6
        c.drawPath(path([(inner, iy), ((inner + outer) / 2, min(iy, oy) - 0.04 * r), (outer, oy)], close=False, smooth=True),
                   strokep(rgb(sp['hair']) if sp['beard'] != 'grey' else rgb('#7d776e'), bw))
    # nose
    nx = hx + off + f * 0.06 * r
    c.drawPath(path([(nx, hy + 0.12 * r), (nx + f * 0.1 * r, hy + 0.36 * r), (nx - f * 0.02 * r, hy + 0.42 * r)], close=False, smooth=True), strokep(shade(skin, -0.45), 3.5))
    # mouth
    mx, my = hx + off + f * 0.02 * r, hy + 0.62 * r
    mw = 0.26 * r
    op = max(talk, {'o': 0.55, 'shout': 0.7, 'grin': 0.25, 'cry': 0.3}.get(mk, 0.0))
    if mk in ('smile', 'grin', 'soft') and op < 0.2:
        cur = {'smile': 0.12, 'grin': 0.16, 'soft': 0.05}[mk]
        c.drawPath(path([(mx - mw, my - 0.02 * r), (mx, my + cur * r), (mx + mw, my - 0.03 * r)], close=False, smooth=True), strokep(INK, 4.5))
    elif mk == 'smirk' and op < 0.2:
        c.drawPath(path([(mx - mw * 0.8, my + 0.02 * r), (mx + mw * 0.2, my + 0.03 * r), (mx + mw, my - 0.07 * r)], close=False, smooth=True), strokep(INK, 4.5))
    elif mk in ('frown', 'snarl') and op < 0.2:
        c.drawPath(path([(mx - mw, my + 0.06 * r), (mx, my - 0.02 * r), (mx + mw, my + 0.06 * r)], close=False, smooth=True), strokep(INK, 4.5))
    elif op >= 0.2 or mk in ('o', 'shout', 'cry'):
        hgt = (0.06 + 0.22 * op) * r
        wid = mw * (0.6 if mk == 'o' else 0.95)
        m = path([(mx - wid, my - 0.01 * r), (mx, my - hgt * 0.35), (mx + wid, my - 0.01 * r), (mx, my + hgt)], smooth=True)
        draw(c, m, rgb('#4a1d1a'), 4)
        if mk in ('shout', 'grin', 'snarl'):
            c.save(); c.clipPath(m, doAntiAlias=True)
            c.drawRect(skia.Rect(mx - wid, my - hgt, mx + wid, my + 0.02 * r), fillp(skia.Color(240, 236, 225)))
            c.restore(); c.drawPath(m, strokep(INK, 4))
    else:
        c.drawLine(mx - mw * 0.8, my, mx + mw * 0.8, my + 0.01 * r, strokep(INK, 4.5))
    # hair / hat
    hat = sp['hat']
    hc = rgb(sp['hair'])
    if not sp['bald'] and hat in ('none', 'fur', 'band'):
        top = path([(hx - 0.96 * r, hy - 0.2 * r), (hx - 0.9 * r, hy - 0.75 * r), (hx - 0.3 * r, hy - 1.12 * r), (hx + 0.4 * r, hy - 1.1 * r),
                    (hx + 0.95 * r, hy - 0.7 * r), (hx + 0.97 * r, hy - 0.2 * r), (hx + 0.7 * r, hy - 0.55 * r + f * 0.05 * r),
                    (hx + 0.1 * r, hy - 0.62 * r), (hx - 0.5 * r, hy - 0.55 * r), (hx - 0.8 * r, hy - 0.4 * r)], smooth=True)
        if sp['age'] == 'baby':
            c.drawPath(path([(hx - 0.1 * r, hy - 0.95 * r), (hx + 0.1 * r, hy - 1.2 * r), (hx + 0.25 * r, hy - 0.98 * r)], close=False, smooth=True), strokep(hc, 6))
        else:
            draw(c, top, hc, 5)
        if not sp['female'] and sp['age'] in ('child', 'teen', 'adult', 'old') and hat == 'none':
            # traditional side braid loops
            for side in (-1, 1):
                lx = hx + side * 0.95 * r
                lp = ellipse(lx, hy + 0.35 * r, 0.14 * r, 0.28 * r)
                draw(c, lp, hc, 4)
    if hat == 'fur':
        hcol = rgb(sp['hatcol'] or sp['robe'])
        crown = path([(hx - 0.86 * r, hy - 0.62 * r), (hx - 0.7 * r, hy - 1.35 * r), (hx, hy - 1.7 * r), (hx + 0.7 * r, hy - 1.35 * r), (hx + 0.86 * r, hy - 0.62 * r)], smooth=True)
        draw(c, crown, hcol, 5)
        c.save(); c.clipPath(crown, doAntiAlias=True)
        c.drawPath(ellipse(hx - f * 0.6 * r, hy - 1.1 * r, 0.5 * r, 0.9 * r), fillp(shade(hcol, -0.2)))
        c.restore(); c.drawPath(crown, strokep(INK, 5))
        c.drawCircle(hx, hy - 1.72 * r, 0.09 * r, fillp(rgb(sp['trim'])))
        c.drawCircle(hx, hy - 1.72 * r, 0.09 * r, strokep(INK, 3))
        brim = path([(hx - 1.05 * r, hy - 0.42 * r), (hx - 1.0 * r, hy - 0.86 * r), (hx, hy - 0.98 * r), (hx + 1.0 * r, hy - 0.86 * r),
                     (hx + 1.05 * r, hy - 0.42 * r), (hx, hy - 0.56 * r)], smooth=True)
        draw(c, brim, rgb('#6b4a2e'), 5)
        for k in range(9):  # fur tufts
            fx = hx - 0.9 * r + k * 0.225 * r
            c.drawLine(fx, hy - 0.86 * r, fx + 0.05 * r, hy - 0.6 * r, strokep(rgb('#8a6440'), 3))
    elif hat == 'helmet':
        hcol = rgb('#8a8a86')
        dome = path([(hx - 0.98 * r, hy - 0.3 * r), (hx - 0.85 * r, hy - 1.0 * r), (hx, hy - 1.45 * r), (hx + 0.85 * r, hy - 1.0 * r), (hx + 0.98 * r, hy - 0.3 * r), (hx, hy - 0.5 * r)], smooth=True)
        draw(c, dome, hcol, 5)
        c.drawLine(hx, hy - 1.45 * r, hx, hy - 1.85 * r, strokep(INK, 9))
        c.drawLine(hx, hy - 1.45 * r, hx, hy - 1.85 * r, strokep(rgb(sp['trim']), 5))
        c.drawPath(path([(hx - 0.98 * r, hy - 0.3 * r), (hx - 1.05 * r, hy + 0.5 * r), (hx - 0.75 * r, hy + 0.55 * r), (hx - 0.8 * r, hy - 0.4 * r)], smooth=True), fillp(rgb('#5b4a3a')))
    elif hat == 'turban':
        tc = rgb(sp['hatcol'] or '#e8e0cc')
        tb = path([(hx - 1.05 * r, hy - 0.4 * r), (hx - 1.1 * r, hy - 1.1 * r), (hx - 0.4 * r, hy - 1.55 * r), (hx + 0.5 * r, hy - 1.5 * r), (hx + 1.1 * r, hy - 1.05 * r), (hx + 1.05 * r, hy - 0.4 * r), (hx, hy - 0.6 * r)], smooth=True)
        draw(c, tb, tc, 5)
        for k in range(3):
            c.drawPath(path([(hx - 1.0 * r, hy - (0.6 + k * 0.28) * r), (hx, hy - (0.85 + k * 0.3) * r), (hx + 1.0 * r, hy - (0.65 + k * 0.27) * r)], close=False, smooth=True), strokep(shade(tc, -0.25), 3))
        c.drawCircle(hx + f * 0.1 * r, hy - 0.95 * r, 0.12 * r, fillp(rgb('#b8302a')))
        c.drawCircle(hx + f * 0.1 * r, hy - 0.95 * r, 0.12 * r, strokep(INK, 3))
    elif hat == 'band':
        c.drawPath(path([(hx - 0.95 * r, hy - 0.5 * r), (hx, hy - 0.66 * r), (hx + 0.95 * r, hy - 0.5 * r)], close=False, smooth=True), strokep(INK, 16))
        c.drawPath(path([(hx - 0.95 * r, hy - 0.5 * r), (hx, hy - 0.66 * r), (hx + 0.95 * r, hy - 0.5 * r)], close=False, smooth=True), strokep(rgb(sp['trim']), 9))
    if sp['female']:
        for side in (-1, 1):  # braids with ornaments
            bx = hx + side * 0.92 * r
            limb(c, [(bx, hy - 0.1 * r), (bx + side * 0.08 * r, hy + 0.6 * r), (bx + side * 0.05 * r, hy + 1.3 * r)], hc, 0.22 * r, 3)
            c.drawCircle(bx + side * 0.05 * r, hy + 1.3 * r, 0.09 * r, fillp(rgb(sp['trim'])))
            c.drawCircle(bx + side * 0.05 * r, hy + 1.3 * r, 0.09 * r, strokep(INK, 3))
    if sp['beard'] in ('mustache', 'khan', 'grey', 'full'):
        mc = rgb('#9a958c') if sp['beard'] == 'grey' else hc
        for side in (-1, 1):
            c.drawPath(path([(mx, my - 0.1 * r), (mx + side * 0.25 * r, my - 0.12 * r), (mx + side * 0.42 * r, my + 0.14 * r)], close=False, smooth=True), strokep(INK, 11))
            c.drawPath(path([(mx, my - 0.1 * r), (mx + side * 0.25 * r, my - 0.12 * r), (mx + side * 0.42 * r, my + 0.14 * r)], close=False, smooth=True), strokep(mc, 6))
    sweat = pose.get('sweat')
    if sweat:
        d = path([(hx + f * 0.95 * r, hy - 0.5 * r), (hx + f * 1.05 * r, hy - 0.25 * r), (hx + f * 0.95 * r, hy - 0.18 * r), (hx + f * 0.88 * r, hy - 0.28 * r)], smooth=True)
        draw(c, d, rgb('#bfe0f0'), 3)


ARMS = {  # shoulder-relative (upper angle deg, lower angle deg) 0 = straight down, + = forward
    'down': (8, 4), 'hips': (-35, 120), 'point': (80, 85), 'raise': (160, 170), 'reach': (65, 60),
    'hold': (40, 95), 'fists': (20, 140), 'cross': (35, 120), 'wave': (130, 165), 'bow': (88, 90),
    'draw': (70, 150), 'cradle': (45, 110), 'shield': (30, 60), 'up2': (150, 175), 'bound': (95, 180),
}


def arm(c, sx, sy, L, a1, a2, f, col, s, hand_col):
    r1 = math.radians(a1); r2 = math.radians(a2)
    ex = sx + f * math.sin(r1) * L; ey = sy + math.cos(r1) * L
    hx = ex + f * math.sin(r2) * L * 0.95; hy = ey + math.cos(r2) * L * 0.95
    limb(c, [(sx, sy), (ex, ey), (hx, hy)], col, 30 * s, 4)
    # sleeve cuff
    cx_ = ex + f * math.sin(r2) * L * 0.78; cy_ = ey + math.cos(r2) * L * 0.78
    c.drawCircle(cx_, cy_, 19 * s, fillp(shade(col, 0.25))); c.drawCircle(cx_, cy_, 19 * s, strokep(INK, 3.5))
    c.drawCircle(hx, hy, 18 * s, fillp(hand_col))
    c.drawCircle(hx, hy, 18 * s, strokep(INK, 4))
    return hx, hy


def draw_char(c, x, y, s, sp, pose, t=0.0):
    """feet at (x,y). pose: facing, expr, arms ('down' or (front,back)), talk, walk(phase or None), sit, crouch, bob"""
    f = pose.get('facing', 1)
    bs, hs, ll = AGE[sp['age']]
    s2 = s * bs
    skin = rgb(SKIN.get(sp['skin'], '#d3a077'))
    breath = math.sin(t * 2.2 + pose.get('seed', 0)) * 3 * s2
    walk = pose.get('walk')
    bob = 0
    if walk is not None:
        bob = -abs(math.sin(walk * math.pi)) * 10 * s2
    y = y + bob
    if sp['age'] == 'baby':
        # swaddled baby bundle
        bundle = path([(x - 120 * s, y - 40 * s), (x - 90 * s, y - 120 * s), (x + 60 * s, y - 130 * s), (x + 130 * s, y - 70 * s), (x + 110 * s, y), (x - 100 * s, y + 5 * s)], smooth=True)
        draw(c, bundle, rgb(pose.get('wrap', '#d8c7a4')), 5)
        for k in range(3):
            c.drawPath(path([(x - 80 * s + k * 60 * s, y - 115 * s), (x - 60 * s + k * 60 * s, y - 10 * s)], close=False), strokep(shade(rgb(pose.get('wrap', '#d8c7a4')), -0.3), 3))
        draw_head(c, x + f * 95 * s, y - 120 * s, 60 * s, sp, pose, t)
        if pose.get('fist'):
            fx, fy = x + f * 10 * s, y - 150 * s
            c.drawCircle(fx, fy, 30 * s, fillp(skin)); c.drawCircle(fx, fy, 30 * s, strokep(INK, 4))
            for k in range(3):
                c.drawLine(fx - 14 * s + k * 12 * s, fy - 22 * s, fx - 14 * s + k * 12 * s, fy - 6 * s, strokep(shade(skin, -0.35), 2.5))
            if pose.get('clot'):
                cl = path([(fx - 4 * s, fy - 30 * s), (fx + 14 * s, fy - 44 * s), (fx + 26 * s, fy - 30 * s), (fx + 18 * s, fy - 16 * s), (fx + 2 * s, fy - 18 * s)], smooth=True)
                draw(c, cl, rgb('#7a1010'), 3)
                c.drawCircle(fx + 14 * s, fy - 34 * s, 4 * s, fillp(rgb('#d05050')))
        return
    sit = pose.get('sit', 0)
    leg = 210 * s2 * ll * (1 - 0.45 * sit)
    hip_y = y - leg
    torso = 220 * s2
    sh_y = hip_y - torso + breath
    sh_x = x
    hr = 92 * s * hs
    arms = pose.get('arms', 'down')
    if isinstance(arms, str):
        arms = (arms, arms if arms not in ('point', 'wave', 'reach', 'draw', 'hold') else 'down')
    robe = rgb(sp['robe'])
    # back arm
    a1, a2 = ARMS.get(arms[1], ARMS['down']) if isinstance(arms[1], str) else arms[1]
    arm(c, sh_x - f * 58 * s2, sh_y + 30 * s2, 120 * s2, a1 * 0.7, a2 * 0.7, f, shade(robe, -0.25), s2, shade(skin, -0.1))
    # legs
    if sit:
        for side in (-1, 1):
            limb(c, [(x + side * 30 * s2, hip_y), (x + f * 110 * s2 + side * 25 * s2, hip_y + 10 * s2), (x + f * 120 * s2 + side * 25 * s2, y)], rgb(sp['pants']), 44 * s2, 4)
    else:
        for side in (-1, 1):
            ph = 0 if walk is None else math.sin(walk * math.pi * 2 + (0 if side > 0 else math.pi))
            kx = x + side * 26 * s2 + f * ph * 45 * s2
            fx = x + side * 26 * s2 + f * ph * 70 * s2
            fy = y - max(0, -ph) * 25 * s2
            limb(c, [(x + side * 26 * s2, hip_y), (kx, hip_y + leg * 0.5), (fx, fy - 20 * s2)], rgb(sp['pants']), 46 * s2, 4)
            boot = path([(fx - 26 * s2, fy - 52 * s2), (fx + 26 * s2, fy - 52 * s2), (fx + 30 * s2, fy - 10 * s2), (fx + f * 58 * s2, fy - 6 * s2), (fx + f * 60 * s2, fy + 4 * s2), (fx - 30 * s2, fy + 4 * s2)], smooth=False)
            draw(c, boot, rgb(sp['boots']), 4)
    # robe (deel): flared below the sash
    hem = hip_y + leg * (0.55 if not sit else 0.2)
    body = path([(sh_x - 70 * s2, sh_y), (sh_x + 70 * s2, sh_y), (sh_x + 78 * s2, hip_y - 20 * s2), (sh_x + 112 * s2, hem), (sh_x - 112 * s2, hem), (sh_x - 78 * s2, hip_y - 20 * s2)], smooth=False)
    draw(c, body, robe, 5)
    c.save(); c.clipPath(body, doAntiAlias=True)
    c.drawPath(path([(sh_x - f * 140 * s2, sh_y - 10), (sh_x - f * 20 * s2, sh_y - 10), (sh_x - f * 40 * s2, hem + 10), (sh_x - f * 160 * s2, hem + 10)]), fillp(shade(robe, -0.2)))
    if sp['armor']:
        for row in range(5):
            yy = sh_y + 40 * s2 + row * 34 * s2
            for col_ in range(-3, 4):
                c.drawRoundRect(skia.Rect(sh_x + col_ * 26 * s2 - 12 * s2, yy, sh_x + col_ * 26 * s2 + 12 * s2, yy + 28 * s2), 4, 4, strokep(shade(robe, -0.45), 2.5))
    c.drawPath(path([(sh_x - f * 10 * s2, sh_y), (sh_x + f * 60 * s2, sh_y + 110 * s2), (sh_x + f * 70 * s2, hem)], close=False), strokep(rgb(sp['trim']), 10 * s2))
    c.drawPath(path([(sh_x - f * 10 * s2, sh_y), (sh_x + f * 60 * s2, sh_y + 110 * s2), (sh_x + f * 70 * s2, hem)], close=False), strokep(INK, 3))
    c.drawRect(skia.Rect(sh_x - 200 * s2, hem - 18 * s2, sh_x + 200 * s2, hem), fillp(rgb(sp['trim'])))
    c.restore()
    c.drawPath(body, strokep(INK, 5))
    sash = path([(sh_x - 80 * s2, hip_y - 48 * s2), (sh_x + 80 * s2, hip_y - 48 * s2), (sh_x + 82 * s2, hip_y - 12 * s2), (sh_x - 82 * s2, hip_y - 12 * s2)])
    draw(c, sash, rgb(sp['sash']), 4)
    if sp['cape']:
        cp = path([(sh_x - 80 * s2, sh_y), (sh_x - f * 150 * s2, hem + 20 * s2), (sh_x - f * 40 * s2, hem + 30 * s2)], smooth=True)
        draw(c, cp, rgb(sp['cape']), 4)
    # collar
    draw(c, path([(sh_x - 48 * s2, sh_y - 6), (sh_x + 48 * s2, sh_y - 6), (sh_x + 30 * s2, sh_y + 26 * s2), (sh_x - 30 * s2, sh_y + 26 * s2)]), rgb(sp['trim']), 4)
    # head
    hx = sh_x + f * 6 * s
    hy = sh_y - hr * 0.95
    draw_head(c, hx, hy, hr, sp, pose, t)
    # front arm (drawn last so gestures read)
    a1, a2 = ARMS.get(arms[0], ARMS['down']) if isinstance(arms[0], str) else arms[0]
    hand = arm(c, sh_x + f * 58 * s2, sh_y + 30 * s2, 120 * s2, a1, a2, f, robe, s2, skin)
    prop = pose.get('prop')
    if prop:
        draw_prop(c, prop, hand, f, s2, t)
    if pose.get('cangue'):
        cg = skia.Rect(hx - 210 * s, hy + hr * 1.05, hx + 210 * s, hy + hr * 1.05 + 46 * s)
        c.drawRect(cg, fillp(rgb('#6e4a2c')))
        c.drawRect(cg, strokep(INK, 5))
        for k in range(1, 6):
            c.drawLine(cg.left() + k * cg.width() / 6, cg.top(), cg.left() + k * cg.width() / 6 + 5, cg.bottom(), strokep(rgb('#4b301b'), 2))
    return (hx, hy, hr)


def draw_prop(c, kind, hand, f, s, t):
    hx, hy = hand
    if kind == 'bow':
        b = path([(hx, hy - 150 * s), (hx + f * 55 * s, hy), (hx, hy + 150 * s)], close=False, smooth=True)
        c.drawPath(b, strokep(INK, 14 * s)); c.drawPath(b, strokep(rgb('#7a4a24'), 8 * s))
        c.drawLine(hx, hy - 150 * s, hx, hy + 150 * s, strokep(rgb('#e8dcc0'), 2.5))
    elif kind == 'sword':
        c.drawLine(hx, hy, hx + f * 40 * s, hy - 230 * s, strokep(INK, 16 * s))
        c.drawLine(hx, hy, hx + f * 40 * s, hy - 230 * s, strokep(rgb('#c9ccd0'), 9 * s))
        c.drawLine(hx - 26 * s, hy - 8 * s, hx + 26 * s, hy + 8 * s, strokep(INK, 12 * s))
    elif kind == 'cup':
        cp = path([(hx - 22 * s, hy - 40 * s), (hx + 22 * s, hy - 40 * s), (hx + 16 * s, hy + 5 * s), (hx - 16 * s, hy + 5 * s)])
        draw(c, cp, rgb('#b08a4a'), 4)
    elif kind == 'fish':
        fp = path([(hx - 70 * s, hy), (hx - 20 * s, hy - 22 * s), (hx + 40 * s, hy - 10 * s), (hx + 70 * s, hy - 26 * s), (hx + 64 * s, hy + 14 * s), (hx + 40 * s, hy + 8 * s), (hx - 20 * s, hy + 20 * s)], smooth=True)
        draw(c, fp, rgb('#9fb0b0'), 4)
        c.drawCircle(hx - 48 * s, hy - 3 * s, 5 * s, fillp(INK))
    elif kind == 'torch':
        c.drawLine(hx, hy + 40 * s, hx + f * 10 * s, hy - 120 * s, strokep(INK, 16 * s))
        c.drawLine(hx, hy + 40 * s, hx + f * 10 * s, hy - 120 * s, strokep(rgb('#6b4426'), 9 * s))
        flame(c, hx + f * 10 * s, hy - 120 * s, 40 * s, t)
    elif kind == 'scroll':
        sc = skia.Rect(hx - 20 * s, hy - 90 * s, hx + 20 * s, hy + 90 * s)
        c.drawRoundRect(sc, 12, 12, fillp(rgb('#e6d5ad'))); c.drawRoundRect(sc, 12, 12, strokep(INK, 4))
    elif kind == 'spear':
        c.drawLine(hx, hy + 160 * s, hx + f * 10 * s, hy - 280 * s, strokep(INK, 14 * s))
        c.drawLine(hx, hy + 160 * s, hx + f * 10 * s, hy - 280 * s, strokep(rgb('#7a5432'), 7 * s))
        tip = path([(hx + f * 10 * s - 14 * s, hy - 270 * s), (hx + f * 12 * s, hy - 340 * s), (hx + f * 10 * s + 14 * s, hy - 270 * s)])
        draw(c, tip, rgb('#c9ccd0'), 4)


def flame(c, x, y, r, t, k=1.0):
    fl = 1 + 0.12 * math.sin(t * 17) + 0.08 * math.sin(t * 29 + 1)
    glow = rgrad(x, y - r * 0.4, r * 4 * k, [skia.Color(255, 170, 70, 110), skia.Color(255, 120, 40, 0)])
    c.drawCircle(x, y - r * 0.4, r * 4 * k, glow)
    outer = path([(x - r * 0.8, y), (x - r * 0.6, y - r * 1.0 * fl), (x - r * 0.1 + math.sin(t * 9) * r * 0.2, y - r * 2.2 * fl), (x + r * 0.5, y - r * 1.1 * fl), (x + r * 0.8, y)], smooth=True)
    draw(c, outer, rgb('#f08a2a'), 4)
    inner = path([(x - r * 0.4, y), (x - r * 0.25, y - r * 0.8 * fl), (x + math.sin(t * 11) * r * 0.1, y - r * 1.4 * fl), (x + r * 0.3, y - r * 0.7 * fl), (x + r * 0.4, y)], smooth=True)
    c.drawPath(inner, fillp(rgb('#ffd56a')))


# --------------------------------------------------------------------------- horse
def draw_horse(c, x, y, s, col='#6b4a32', mane='#2a1d15', facing=1, gallop=None, t=0.0, rider=None, rpose=None):
    f = facing
    hc = rgb(col)
    g = 0 if gallop is None else gallop
    bob = -abs(math.sin(g * math.pi * 2)) * 14 * s if gallop is not None else math.sin(t * 2) * 2 * s
    by = y - 250 * s + bob
    # legs
    for i, (lx, phase) in enumerate([(-120, 0.0), (-95, 0.5), (110, 0.25), (135, 0.75)]):
        far = i % 2 == 1
        ph = math.sin((g + phase) * math.pi * 2) if gallop is not None else 0
        kx = x + f * (lx + ph * 40) * s
        fx = x + f * (lx + ph * 75) * s
        fy = y - max(0, ph) * 40 * s
        lc = shade(hc, -0.25) if far else hc
        limb(c, [(x + f * lx * s, by + 40 * s), (kx, by + 140 * s), (fx, fy - 10 * s)], lc, 30 * s, 4)
        c.drawRect(skia.Rect(fx - 18 * s, fy - 22 * s, fx + 18 * s, fy), fillp(INK))
    # body
    body = path([(x - f * 180 * s, by - 10 * s), (x - f * 120 * s, by - 70 * s), (x + f * 100 * s, by - 75 * s), (x + f * 175 * s, by - 30 * s),
                 (x + f * 160 * s, by + 60 * s), (x - f * 150 * s, by + 65 * s)], smooth=True)
    draw(c, body, hc, 5)
    c.save(); c.clipPath(body, doAntiAlias=True)
    c.drawPath(ellipse(x, by + 70 * s, 220 * s, 50 * s), fillp(shade(hc, -0.2)))
    c.restore(); c.drawPath(body, strokep(INK, 5))
    # tail
    tl = path([(x - f * 175 * s, by - 30 * s), (x - f * 250 * s, by + 20 * s + math.sin(t * 5) * 10 * s), (x - f * 235 * s, by + 120 * s), (x - f * 195 * s, by + 30 * s)], smooth=True)
    draw(c, tl, rgb(mane), 4)
    # neck + head
    nk = path([(x + f * 100 * s, by - 60 * s), (x + f * 175 * s, by - 190 * s), (x + f * 215 * s, by - 205 * s), (x + f * 220 * s, by - 160 * s), (x + f * 175 * s, by + 10 * s)], smooth=True)
    draw(c, nk, hc, 5)
    hd = path([(x + f * 185 * s, by - 215 * s), (x + f * 230 * s, by - 225 * s), (x + f * 320 * s, by - 150 * s), (x + f * 305 * s, by - 118 * s), (x + f * 205 * s, by - 150 * s)], smooth=True)
    draw(c, hd, hc, 5)
    c.drawCircle(x + f * 232 * s, by - 190 * s, 7 * s, fillp(INK))
    ear = path([(x + f * 200 * s, by - 215 * s), (x + f * 210 * s, by - 262 * s), (x + f * 228 * s, by - 222 * s)])
    draw(c, ear, hc, 4)
    mn = path([(x + f * 110 * s, by - 80 * s), (x + f * 170 * s, by - 205 * s), (x + f * 205 * s, by - 222 * s), (x + f * 160 * s, by - 150 * s), (x + f * 118 * s, by - 60 * s)], smooth=True)
    draw(c, mn, rgb(mane), 4)
    # saddle
    sd = path([(x - f * 60 * s, by - 72 * s), (x + f * 60 * s, by - 75 * s), (x + f * 55 * s, by - 20 * s), (x - f * 55 * s, by - 20 * s)])
    draw(c, sd, rgb('#8a2f24'), 4)
    if rider is not None:
        rp = dict(rpose or {})
        rp.setdefault('facing', f)
        rp['sit'] = 1
        draw_char(c, x - f * 10 * s, by - 20 * s + 200 * s * 0.55, s * 0.95, rider, rp, t)


def head_center(sp, x, y, s, pose=None):
    """world position of the head centre for draw_char(x,y,s)"""
    pose = pose or {}
    bs, hs, ll = AGE[sp['age']]
    s2 = s * bs
    if sp['age'] == 'baby':
        return x + pose.get('facing', 1) * 95 * s, y - 120 * s, 60 * s
    sit = pose.get('sit', 0)
    leg = 210 * s2 * ll * (1 - 0.45 * sit)
    sh_y = y - leg - 220 * s2
    hr = 92 * s * hs
    return x + pose.get('facing', 1) * 6 * s, sh_y - hr * 0.95, hr
