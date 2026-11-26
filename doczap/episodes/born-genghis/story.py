"""What If You Were Born as Genghis Khan? — shot list (anchored to voice phrases)."""
import math, random
import skia
from kit import *
from chars import spec, draw_char, draw_head, draw_horse
import overlays as O
import sets as S
from fx import Light

# ---------------------------------------------------------------- cast
BABY = spec(age='baby', hat='none')
KID = spec(age='child', hat='none', robe='#6b5236', trim='#a88a52', sash='#6b2a22')
TEEN = spec(age='teen', hat='none', robe='#5a4636', trim='#a88a52', sash='#6b2a22')
YOUNG = spec(age='adult', hat='band', robe='#5a4636', trim='#c9a25a', sash='#6b2a22', beard='stubble')
WAR = spec(age='adult', hat='fur', hatcol='#4a3020', robe='#6a3a2a', trim='#c9a25a', sash='#2f4a5a', beard='mustache', armor=True)
KHAN = spec(age='adult', hat='fur', hatcol='#2c3e52', robe='#7a2e24', trim='#d4ab55', sash='#2f4a5a', beard='khan', armor=True)
OLDKHAN = spec(age='old', hat='fur', hatcol='#2c3e52', robe='#7a2e24', trim='#d4ab55', sash='#2f4a5a', beard='grey')
HOE = spec(female=True, hat='band', robe='#3f5a63', trim='#c9a25a', skin='a')
YES = spec(beard='mustache', robe='#4a5a3a', trim='#b0904a', hatcol='#5a3020')
DAI = spec(beard='grey', age='old', robe='#5a4a6a', trim='#d4ab55', hatcol='#3a2a4a')
BORK = spec(female=True, age='child', hat='band', robe='#8a3a3a', trim='#d4ab55', skin='a')
BOR = spec(female=True, age='teen', hat='band', robe='#8a3a3a', trim='#d4ab55', skin='a')
BORA = spec(female=True, age='adult', hat='band', robe='#8a3a3a', trim='#d4ab55', skin='a')
TAT1 = spec(beard='full', robe='#6a3a5a', trim='#c9a25a', hatcol='#2a2a2a', skin='c')
TAT2 = spec(beard='stubble', robe='#5a3a4a', trim='#a0804a', hatcol='#2a2a2a', skin='c', scar=True)
MERK = spec(beard='full', robe='#3a4a3a', trim='#8a7a5a', hat='helmet', skin='c', scar=True)
GROOM = spec(beard='stubble', robe='#3a4a3a', trim='#8a7a5a', hatcol='#3a4a3a', skin='c')
BEH = spec(age='teen', hat='none', robe='#3e4a52', trim='#8a8a7a', skin='c')
KHAS = spec(age='teen', hat='none', robe='#6a5a3a', trim='#a88a52')
KHASK = spec(age='child', hat='none', robe='#4a5a60', trim='#a88a52')
BELK = spec(age='child', hat='none', robe='#5a5a6a', trim='#8a8a7a', skin='c')
ELD = spec(beard='grey', age='old', robe='#4a4038', hatcol='#3a3028')
ELD2 = spec(beard='grey', age='old', robe='#3a4038', hatcol='#2a3028', skin='c')
TARG = spec(beard='full', robe='#2e3a4a', trim='#b08a4a', hatcol='#1e2a3a', skin='c', scar=True)
GUARD = spec(beard='stubble', robe='#3a3a44', trim='#7a7a6a', hat='helmet', skin='c')
SOR = spec(beard='grey', robe='#5a5040', hatcol='#3a3a30', age='old')
TOG = spec(beard='full', robe='#2c4a6a', trim='#e0c070', hatcol='#6a2020', age='old', cape='#5a1a1a')
JAM = spec(beard='mustache', robe='#2f5a5a', trim='#c9c0a0', hatcol='#1e3a3a', skin='c', cape='#1e2e3e')
NOB = spec(beard='full', robe='#4a2a5a', trim='#e0c070', hatcol='#2a1a3a')
HERD = spec(beard='stubble', robe='#6a6050', trim='#8a7a60', hat='none')
HERDG = spec(beard='stubble', robe='#6a3a2a', trim='#c9a25a', hat='helmet', armor=True)
JEBE = spec(beard='mustache', robe='#5a3a2a', trim='#a88a52', hat='none', scar=True)
JIN = spec(beard='mustache', robe='#8a2a2a', trim='#e0c070', hat='helmet', skin='a', armor=True)
JINC = spec(beard='full', robe='#a03a2a', trim='#e0c070', hat='helmet', skin='a', armor=True)
MERCH = spec(beard='full', robe='#7a6a4a', trim='#c9a25a', hat='turban', hatcol='#d8cfb8', skin='c')
INAL = spec(beard='full', robe='#2a4a6a', trim='#e0c070', hat='turban', hatcol='#e8e0cc', skin='c', cape='#4a1a2a')
SHAH = spec(beard='full', robe='#6a1a3a', trim='#f0d080', hat='turban', hatcol='#f4ecd8', skin='c', cape='#2a1a4a')
ENVOY = spec(beard='none', robe='#4a5a3a', trim='#b0904a', hatcol='#5a3020')
MONK = spec(bald=True, hat='none', robe='#c86a2a', trim='#e0b050', skin='a')
IMAM = spec(beard='full', hat='turban', robe='#e8e0cc', trim='#3a6a5a', skin='c')
SHAMAN = spec(beard='grey', age='old', hatcol='#3a2a20', robe='#3a3028', trim='#c9a25a')
PRIEST = spec(beard='full', hat='none', robe='#2a2a3a', trim='#c9a25a', skin='a')


def A(c, x, y, s=1.0, **p):
    d = dict(c=c, x=x, y=y, s=s)
    for k in ('mv', 'walk', 'talk', 'rot', 'z', 'wspeed'):
        if k in p:
            d[k] = p.pop(k)
    d['p'] = p
    return d


def HORSE(x, y, s=0.8, rider=None, facing=1, gallop=False, col='#6b4a32', mv=None, rp=None, gspeed=1.6, z=None):
    d = dict(k='horse', x=x, y=y, s=s, rider=rider, gallop=gallop, col=col, p=dict(facing=facing), rp=rp or {}, gspeed=gspeed)
    if mv: d['mv'] = mv
    if z is not None: d['z'] = z
    return d


def HEAD(c, x, y, r=110, **p):
    return dict(k='head', c=c, x=x, y=y, r=r, p=p)


def FN(fn, x=0, y=0, s=1.0, z=None):
    d = dict(k='fn', fn=fn, x=x, y=y, s=s)
    if z is not None: d['z'] = z
    return d


def steppe(look='day', **kw):
    return ('steppe', dict(look=look, **kw))


NIGHT = lambda lights=(), d=0.55: Light(d * 0.7, '#0a1226', lights)
DUSKL = lambda lights=(), d=0.25: Light(d, '#2a1018', lights)
FIRE_L = lambda x, y, r=520: (x, y, r * 1.35, '#ffb060', 1.0)


# ---------------------------------------------------------------- custom drawings
def coat(c, x, y, s, t, u):
    p = path([(x - 120 * s, y - 260 * s), (x + 120 * s, y - 260 * s), (x + 190 * s, y + 160 * s), (x - 190 * s, y + 160 * s)], smooth=False)
    draw(c, p, rgb('#2e2218'), 6)
    rnd = random.Random(3)
    for i in range(120):
        xx = x + rnd.uniform(-170, 170) * s; yy = y + rnd.uniform(-240, 150) * s
        c.drawLine(xx, yy, xx + rnd.uniform(-6, 6), yy + 14 * s, strokep(rgb('#5a4430'), 2.5))
    c.drawPath(path([(x - 120 * s, y - 260 * s), (x, y - 180 * s), (x + 120 * s, y - 260 * s)], close=False), strokep(rgb('#8a6a48'), 14 * s))
    g = rgrad(x, y - 300 * s, 260 * s, [skia.Color(255, 220, 150, 80), skia.Color(255, 220, 150, 0)])
    c.drawCircle(x, y - 300 * s, 260 * s, g)


def bow_diagram(c, x, y, s, t, u):
    k = ease(u * 3)
    b = path([(x - 420, y - 60), (x - 260, y + 60), (x, y - 10), (x + 260, y + 60), (x + 420, y - 60)], close=False, smooth=True)
    c.drawPath(b, strokep(INK, 34)); c.drawPath(b, strokep(rgb('#7a4a24'), 24))
    c.drawPath(b, strokep(rgb('#e8dcc0'), 6))
    c.drawLine(x - 420, y - 60, x + 420, y - 60, strokep(rgb('#e8dcc0'), 3))
    labs = [('wood', x - 300, y + 160, x - 250, y + 55), ('horn', x, y + 190, x, y + 5), ('sinew', x + 300, y + 160, x + 250, y + 55)]
    for i, (lab, tx, ty, ax, ay) in enumerate(labs):
        kk = ease((u - 0.15 - i * 0.12) * 5)
        if kk <= 0: continue
        c.drawLine(tx, ty - 50, tx + (ax - tx) * kk, ty - 50 + (ay - ty + 50) * kk, strokep(rgb('#f2e6cc'), 4))
        text(c, lab, tx, ty, font('hand', 70), rgb('#f2e6cc'), shadow=skia.Color(0, 0, 0, 200))


def parchment_bg(c, t, u):
    c.drawRect(skia.Rect(0, 0, W, H), fillp(rgb('#d9c7a0')))
    c.drawRect(skia.Rect(0, 0, W, H), paper_paint(90))
    c.drawRect(skia.Rect(0, 0, W, H), rgrad(960, 540, 1200, [skia.Color(0, 0, 0, 0), skia.Color(60, 30, 10, 150)]))


REGIONS = {  # stylised (not to scale) campaign map
    'MONGOLIA': [(900, 300), (1250, 260), (1400, 380), (1280, 470), (950, 480), (860, 400)],
    'JIN': [(1300, 480), (1560, 450), (1640, 620), (1480, 760), (1280, 700), (1240, 560)],
    'XI XIA': [(1000, 500), (1230, 500), (1260, 640), (1050, 680), (960, 590)],
    'KHWARAZM': [(260, 420), (620, 380), (760, 520), (650, 700), (330, 690), (220, 560)],
    'QARA KHITAI': [(640, 330), (870, 320), (930, 480), (760, 520), (620, 430)],
}


def campaign_map(c, t, u, show=(), arrows=(), owned=(), grow=None):
    parchment_bg(c, t, u)
    for name, pts in REGIONS.items():
        col = rgb('#b8a074')
        if name in owned or (grow and name in grow[0] and u > grow[1].get(name, 0)):
            col = rgb('#a8443a')
        draw(c, path(pts, smooth=True), col, 4, oc=rgb('#4a3420'))
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        text(c, name, cx, cy + 12, font('serif', 34), rgb('#3a2414'))
    for i, (a, b, d0) in enumerate(arrows):
        k = ease((u - d0) * 3)
        if k <= 0: continue
        (x0, y0), (x1, y1) = a, b
        xm, ym = (x0 + x1) / 2, min(y0, y1) - 80
        pts = []
        for j in range(21):
            s = j / 20 * k
            pts.append(((1 - s) ** 2 * x0 + 2 * (1 - s) * s * xm + s * s * x1, (1 - s) ** 2 * y0 + 2 * (1 - s) * s * ym + s * s * y1))
        c.drawPath(path(pts, close=False), strokep(rgb('#8a1a12'), 10))
        if k > 0.95:
            ex, ey = pts[-1]; px, py = pts[-3]
            ang = math.atan2(ey - py, ex - px)
            hd = path([(ex + math.cos(ang) * 30, ey + math.sin(ang) * 30), (ex + math.cos(ang + 2.4) * 30, ey + math.sin(ang + 2.4) * 30), (ex + math.cos(ang - 2.4) * 30, ey + math.sin(ang - 2.4) * 30)])
            c.drawPath(hd, fillp(rgb('#8a1a12')))
    # compass
    c.drawCircle(1720, 900, 70, strokep(rgb('#4a3420'), 3))
    text(c, 'N', 1720, 820, font('serif', 36), rgb('#4a3420'))
    c.drawLine(1720, 840, 1720, 960, strokep(rgb('#4a3420'), 3))


def decimal_diagram(c, t, u):
    c.drawRect(skia.Rect(0, 0, W, H), fillp(rgb('#1c1612')))
    c.drawRect(skia.Rect(0, 0, W, H), paper_paint(40))
    labs = [('10', 1, 10), ('100', 2, 100), ('1,000', 3, 1000)]
    for i, (lab, d, n) in enumerate(labs):
        k = ease((u - i * 0.25) * 4)
        if k <= 0: continue
        x0 = 220 + i * 560
        text(c, lab, x0 + 200, 260, font('serif', 96), rgb('#d4ab55'))
        cols = [5, 10, 40][i]; rows = [2, 10, 25][i]
        cell = [60, 30, 9][i]
        for r in range(rows):
            for q in range(cols):
                if (r * cols + q) / (rows * cols) > k: continue
                cx = x0 + 200 - cols * cell / 2 + q * cell + cell / 2
                cy = 360 + r * cell + cell / 2
                c.drawCircle(cx, cy, cell * 0.36, fillp(rgb('#c9b894')))


def holy_men(c, x, y, s, t, u):
    for i, sp in enumerate([MONK, IMAM, SHAMAN, PRIEST]):
        draw_char(c, 420 + i * 360, 1060, 0.95, sp, dict(facing=1 if i < 2 else -1, expr='calm', seed=i), t)


def crossed_notes(c, t, u):
    items = [('illness?', 560, 360, -4), ('a fall from his horse?', 1320, 330, 3), ('an arrow?', 700, 700, 2), ('lightning?', 1300, 720, -3)]
    for i, (s, x, y, r) in enumerate(items):
        O.paper_note(c, [s], x, y, t - i * 0.35, rot=r, w=480)
    k = ease((t - 2.2) / 0.6)
    if k > 0:
        text(c, 'written down years later', 960, 1000, font('hand', 66), rgb('#f2e6cc'), shadow=skia.Color(0, 0, 0, 220))


# ---------------------------------------------------------------- shots
def build(tl):
    ch = {c['num']: c for c in tl['chapters']}
    S_ = []
    add = S_.append
    G = 1040  # ground line for feet

    # ===== COLD OPEN
    add(dict(t=0.0, set=steppe('winter', snow=True), cam=((960, 520, 1.0), (960, 560, 1.12)),
             actors=[A(HOE, 820, G, 0.8, facing=1, expr='determined'), A(KID, 990, G, 0.8, facing=1, expr='sad'), A(KHASK, 1110, G, 0.7, facing=1, expr='cry')],
             fx=[('snow', 220)]))
    add(dict(at='You will kill your own', set=steppe('war', mountains_on=True), cam=((960, 560, 1.0), (930, 470, 1.55)),
             actors=[A(TEEN, 960, G, 1.1, facing=-1, expr='rage', arms='draw', prop='bow')], light=DUSKL(d=0.3), trans='whip'))
    add(dict(at='You will wear a wooden', set=steppe('night', yurts=3, mountains_on=False), cam=((900, 520, 1.25), (960, 500, 1.4)),
             actors=[A(TEEN, 900, G, 1.0, facing=1, expr='fear', cangue=True), A(GUARD, 1250, G, 1.0, facing=-1, expr='cold', arms='hold', prop='torch'),
                     A(GUARD, 560, G, 0.95, facing=1, expr='smirk', arms='hold', prop='spear')],
             light=NIGHT([FIRE_L(1310, 760, 560)], 0.6)))
    add(dict(at='And one day, the largest', set=steppe('dawn', yurts=6), cam=((960, 470, 1.5), (960, 560, 1.0)),
             actors=[A(KHAN, 960, 980, 1.0, facing=1, expr='determined', arms='raise')] +
                    [A(spec(robe=['#5a4636', '#4a5a3a', '#6a3a3a'][k % 3], hatcol='#3a3028', seed=k), 80 + k * 46, 1110 + (k % 2) * 30, 0.55,
                       facing=1 if k < 20 else -1, arms='raise' if k % 4 == 0 else 'down', seed=k) for k in range(40)],
             wfx_back=[('tug', 560 + k * 100, 930, 0.7) for k in range(9)], trans='whip'))
    add(dict(at='But tonight', set=('yurt', dict(look='night')), cam=((900, 560, 1.0), (760, 620, 1.35)),
             actors=[A(HOE, 640, G, 1.05, facing=1, expr='calm', arms=('cradle', 'cradle'), look=(1, 1)), dict(k='char', c=BABY, x=700, y=690, s=0.5, p=dict(facing=1, expr='sleep'), z=1100)],
             wfx=[('fire', 1060, 900, 50)], light=NIGHT([FIRE_L(1060, 860, 700)], 0.5)))
    add(dict(at='And legend says you were', set=('yurt', dict(look='night')), cam=((730, 640, 3.2), (735, 620, 3.7)),
             actors=[dict(k='char', c=BABY, x=700, y=720, s=0.62, p=dict(facing=1, expr='calm', fist=True, clot=True))],
             wfx=[('fire', 1060, 900, 50)], light=NIGHT([FIRE_L(1060, 860, 700)], 0.45), fx=[('bars',)]))

    # ===== CH I
    add(dict(t=ch['I']['t'], set=steppe('night', yurts=5, camp_glow=True), cam=((960, 520, 1.05), (960, 540, 1.12)),
             light=NIGHT((), 0.35), ov=[('chapter', ch['I'])], fx=[('embers',)]))
    add(dict(at="It's around eleven", set=steppe('day', yurts=4), cam=((700, 520, 1.0), (1220, 520, 1.0)),
             actors=[HORSE(500, G, 0.6, facing=1), HORSE(1400, G - 20, 0.55, facing=-1, col='#8a6a4a')],
             ov=[('tag', 'Mongolia', 'Around 1162', 0.3)], fx=[('dust',)]))
    add(dict(at='Your father is Yesugei', set=steppe('day', yurts=2), cam=((960, 520, 1.15), (1000, 480, 1.3)),
             actors=[A(YES, 1000, G, 1.05, facing=-1, expr='smirk', arms=('hips', 'hips'))],
             ov=[('note', ['YESUGEI', 'chief of the Borjigin', 'lots of enemies'], 520, 360, -4, 0.5)]))
    add(dict(at='Your mother is Hoelun', set=steppe('day', yurts=2), cam=((900, 480, 1.4), (900, 470, 1.55)),
             actors=[A(HOE, 900, G, 1.05, facing=1, expr='calm')], ov=[('note', ['HOELUN', 'your mother'], 1400, 360, 4, 0.4)]))
    add(dict(at='and he kidnapped her', set=steppe('dusk'), cam=((960, 540, 1.0), (1100, 540, 1.1)),
             actors=[HORSE(700, G, 0.85, rider=YES, facing=1, gallop=True, mv=(600, 0), rp=dict(expr='grin')),
                     A(HOE, 550, G - 250, 0.45, facing=-1, expr='shock', arms='reach', rot=90, mv=(600, 0), z=G + 1),
                     A(GROOM, 1650, G, 0.9, facing=-1, expr='shock', arms='reach')],
             fx=[('tint', '#c89a6a', 0.35), ('dust',)], trans='whip'))
    add(dict(at='That will matter later', set=steppe('dusk'), cam=((1500, 520, 1.7), (1500, 500, 1.85)),
             actors=[A(GROOM, 1500, G, 1.0, facing=-1, expr='angry')], fx=[('tint', '#c89a6a', 0.35)],
             ov=[('circle', 960, 470, 300, 330, 0.3)]))
    add(dict(at="When you're born, the old", set=('yurt', dict(look='night')), cam=((960, 560, 1.1), (820, 600, 1.4)),
             actors=[A(HOE, 640, G, 1.05, facing=1, expr='smile', arms=('cradle', 'cradle'), look=(1, 1)), dict(k='char', c=BABY, x=700, y=690, s=0.5, p=dict(facing=1, expr='calm', fist=True), z=1100),
                     A(ELD, 1350, G, 0.95, facing=-1, expr='shock')],
             wfx=[('fire', 1040, 900, 50)], light=NIGHT([FIRE_L(1040, 860, 700)], 0.5)))
    add(dict(at='your tiny fist', set=('yurt', dict(look='night')), cam=((730, 640, 3.2), (735, 620, 3.7)),
             actors=[dict(k='char', c=BABY, x=700, y=720, s=0.62, p=dict(facing=1, expr='calm', fist=True, clot=True))],
             light=NIGHT([FIRE_L(1040, 860, 700)], 0.45), ov=[('circle', 870, 330, 130, 120, 0.6)], fx=[('bars',)]))
    add(dict(at='Your father has just captured', set=steppe('day', yurts=3), cam=((960, 540, 1.0), (1000, 520, 1.08)),
             actors=[HORSE(700, G, 0.8, rider=YES, facing=1, mv=(250, 0), rp=dict(expr='grin', arms='raise')),
                     A(TAT1, 1180, G, 0.95, facing=1, expr='angry', arms=('bound', 'bound'), walk=True, mv=(250, 0))],
             ov=[('note', ['captured Tatar:', 'TEMUJIN'], 1500, 300, 3, 0.8)]))
    add(dict(at='So he names you after him', set=('yurt', dict(look='night')), cam=((960, 600, 1.15), (960, 520, 1.3)),
             actors=[A(YES, 960, G, 1.05, facing=1, expr='grin', arms=('up2', 'up2')), dict(k='char', c=BABY, x=1010, y=430, s=0.5, p=dict(facing=1, expr='calm'), z=G + 5)],
             wfx=[('fire', 560, 900, 50)], light=NIGHT([FIRE_L(560, 860, 760)], 0.45),
             ov=[('note', ['TEMUJIN'], 1480, 300, -3, 0.9)]))
    add(dict(at='The elders whisper', set=('yurt', dict(look='night')), cam=((960, 600, 1.2), (980, 560, 1.4)),
             actors=[A(ELD, 680, G, 1.0, facing=1, expr='fear', talk=True), A(ELD2, 1240, G, 1.0, facing=-1, expr='fear', sweat=True)],
             wfx=[('fire', 960, 920, 40)], light=NIGHT([FIRE_L(960, 880, 520)], 0.62)))
    add(dict(at='For greatness', set=('yurt', dict(look='night')), cam=((730, 640, 3.2), (735, 620, 3.7)),
             actors=[dict(k='char', c=BABY, x=700, y=720, s=0.62, p=dict(facing=1, expr='cold', look=(1, 0)))],
             light=NIGHT([FIRE_L(1040, 860, 700)], 0.5), fx=[('bars',)]))

    # ===== CH II
    add(dict(t=ch['II']['t'], set=steppe('dusk'), cam=((960, 520, 1.0), (980, 520, 1.06)),
             actors=[HORSE(820, 980, 0.4, rider=YES, facing=1, gallop=True, mv=(200, 0)), HORSE(980, 990, 0.32, rider=KID, facing=1, gallop=True, mv=(200, 0))],
             ov=[('chapter', ch['II'])]))
    add(dict(at="You're nine", set=steppe('day'), cam=((800, 540, 1.1), (1200, 540, 1.1)),
             actors=[HORSE(700, G, 0.8, rider=YES, facing=1, gallop=True, mv=(500, 0), rp=dict(expr='smile')),
                     HORSE(400, G + 30, 0.6, rider=KID, facing=1, gallop=True, mv=(500, 0), rp=dict(expr='smile'))],
             fx=[('dust',)], ov=[('polaroid', lambda c, r: (c.drawRect(r, fillp(rgb('#c8b088'))), draw_head(c, r.centerX(), r.centerY() + 20, 110, KID, dict(facing=1, expr='smile'), 0)), 1560, 300, 6, 'age 9', 0.6)]))
    add(dict(at='A chief named Dai Setsen', set=steppe('day', yurts=2), cam=((960, 520, 1.1), (1000, 500, 1.2)),
             actors=[A(DAI, 820, G, 1.0, facing=1, expr='smile'), A(BORK, 1080, G, 0.85, facing=1, expr='smile')],
             ov=[('note', ['DAI SETSEN', 'Khongirad chief'], 420, 330, -3, 0.4)]))
    add(dict(at='The fathers agree', set=steppe('day', yurts=2), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[A(DAI, 1160, G, 1.0, facing=-1, expr='grin', arms='reach'), A(YES, 760, G, 1.0, facing=1, expr='grin', arms='reach'),
                     A(KID, 560, G, 0.8, facing=1, expr='smile', look=(1, 0)), A(BORK, 1380, G, 0.8, facing=-1, expr='smile')]))
    add(dict(at='You stay with her family', set=steppe('dusk', yurts=2), cam=((960, 540, 1.0), (1100, 520, 1.05)),
             actors=[A(KID, 640, G, 0.85, facing=1, expr='sad', arms='wave'), HORSE(1100, 980, 0.45, rider=YES, facing=1, mv=(500, -20))]))
    add(dict(at='On the way, he finds Tatars', set=steppe('dusk', yurts=3), cam=((960, 560, 1.0), (1000, 540, 1.12)),
             actors=[HORSE(380, G, 0.75, rider=YES, facing=1, mv=(200, 0)), A(TAT1, 1180, G, 0.9, facing=-1, expr='grin', sit=1), A(TAT2, 1520, G, 0.9, facing=-1, expr='smile', sit=1)],
             wfx=[('fire', 1000, 1010, 55)], light=DUSKL([FIRE_L(1000, 980, 640)], 0.35)))
    add(dict(at='Steppe custom says', set=steppe('dusk', yurts=3), cam=((1000, 540, 1.2), (1000, 530, 1.25)),
             actors=[A(TAT1, 1180, G, 0.9, facing=-1, expr='smile', sit=1, arms='wave')], wfx=[('fire', 1000, 1010, 55)], light=DUSKL([FIRE_L(1000, 980, 640)], 0.35),
             ov=[('note', ['Steppe law:', 'feed every traveler'], 640, 300, -4, 0.3)]))
    add(dict(at='So he sits down', set=steppe('dusk', yurts=3), cam=((960, 600, 1.2), (980, 600, 1.3)),
             actors=[A(YES, 760, G, 0.9, facing=1, expr='smile', sit=1), A(TAT1, 1180, G, 0.9, facing=-1, expr='grin', sit=1), A(TAT2, 1450, G, 0.9, facing=-1, expr='smile', sit=1)],
             wfx=[('fire', 980, 1010, 55)], light=DUSKL([FIRE_L(980, 980, 640)], 0.4)))
    add(dict(at='But someone recognizes him', set=steppe('dusk', yurts=3), cam=((1450, 560, 2.0), (1450, 540, 2.3)),
             actors=[A(TAT2, 1450, G, 0.9, facing=-1, expr='cold', look=(-1, 0))], wfx=[('fire', 980, 1010, 55)], light=DUSKL([FIRE_L(980, 980, 640)], 0.45), trans='whip'))
    add(dict(at='The man who killed their people', set=steppe('dusk', yurts=3), cam=((760, 620, 1.9), (760, 600, 2.1)),
             actors=[A(YES, 760, G, 0.9, facing=1, expr='smile', sit=1)], wfx=[('fire', 980, 1010, 55)], light=DUSKL([FIRE_L(980, 980, 640)], 0.45),
             ov=[('circle', 960, 470, 280, 300, 0.2)]))
    add(dict(at='They smile', set=steppe('dusk', yurts=3), cam=((1300, 600, 1.5), (1320, 590, 1.6)),
             actors=[A(TAT1, 1180, G, 0.9, facing=-1, expr='grin', sit=1), A(TAT2, 1450, G, 0.9, facing=-1, expr='grin', sit=1)],
             wfx=[('fire', 980, 1010, 55)], light=DUSKL([FIRE_L(980, 980, 640)], 0.5)))
    add(dict(at='They pour him a drink', set=steppe('dusk', yurts=3), cam=((900, 700, 2.2), (880, 690, 2.6)),
             actors=[A(YES, 760, G, 0.9, facing=1, expr='smile', sit=1, arms='hold', prop='cup')], wfx=[('fire', 980, 1010, 55)], light=DUSKL([FIRE_L(980, 980, 640)], 0.5), fx=[('bars',)]))
    add(dict(at='He makes it home', set=steppe('night', yurts=2, mountains_on=False), cam=((960, 560, 1.1), (900, 560, 1.25)),
             actors=[HORSE(1100, G, 0.8, rider=YES, facing=-1, mv=(-250, 0), rp=dict(expr='sad', sweat=True, tint='#7aa060'))],
             light=NIGHT((), 0.5)))
    add(dict(at='By the time you get back', set=('yurt', dict(look='night')), cam=((960, 600, 1.0), (960, 640, 1.2)),
             actors=[A(YES, 1180, 1000, 0.85, facing=1, expr='dead', rot=-90, z=900), A(HOE, 1500, G, 1.0, facing=-1, expr='cry'), A(KID, 520, G, 0.85, facing=1, expr='shock', arms='reach')],
             wfx=[('fire', 760, 920, 30)], light=NIGHT([FIRE_L(760, 880, 500)], 0.6)))

    # ===== CH III
    add(dict(t=ch['III']['t'], set=steppe('winter', snow=True, yurts=1), cam=((960, 520, 1.0), (960, 520, 1.05)), fx=[('snow', 120)], ov=[('chapter', ch['III'])]))
    add(dict(at='And then it gets worse', set=steppe('winter', snow=True, yurts=3), cam=((960, 560, 1.15), (1000, 540, 1.25)),
             actors=[A(ELD, 760, G, 1.0, facing=1, expr='cold', talk=True), A(ELD2, 1160, G, 1.0, facing=-1, expr='smirk')], fx=[('snow', 120)]))
    add(dict(at="The clan won't follow", set=steppe('winter', snow=True, yurts=3), cam=((960, 560, 1.0), (960, 540, 1.1)),
             actors=[A(ELD, 1400, G, 1.0, facing=-1, expr='cold', arms='point'), A(HOE, 760, G, 1.0, facing=1, expr='angry'), A(KID, 560, G, 0.8, facing=1, expr='fear'), A(KHASK, 420, G, 0.7, facing=1, expr='sad')],
             fx=[('snow', 120)]))
    add(dict(at='So one morning', set=steppe('winter', snow=True), cam=((960, 540, 1.0), (1150, 520, 1.0)),
             actors=[HORSE(1000 + k * 180, 760 + (k % 2) * 10, 0.22, facing=1, mv=(300, 0), z=700) for k in range(7)] +
                    [A(HOE, 520, G, 0.85, facing=1, expr='sad'), A(KID, 700, G, 0.7, facing=1, expr='sad')], fx=[('snow', 160)]))
    add(dict(at='Everyone.', set=steppe('winter', snow=True), cam=((960, 520, 1.25), (960, 520, 1.0)), fx=[('snow', 260)]))
    add(dict(at='They take the herds', set=steppe('winter', snow=True), cam=((960, 560, 1.0), (1200, 560, 1.05)),
             actors=[HORSE(600 + k * 160, 900 + (k % 3) * 40, 0.35, facing=1, gallop=True, col=['#6b4a32', '#8a6a4a', '#3a2a20'][k % 3], mv=(500, 0), gspeed=2.2) for k in range(8)],
             fx=[('snow', 160)], trans='whip'))
    add(dict(at='You, your mother, your brothers', set=steppe('winter', snow=True, yurts=1), cam=((960, 560, 1.0), (960, 540, 1.08)),
             actors=[A(HOE, 960, G, 1.0, facing=1, expr='determined'), A(KID, 760, G, 0.8, facing=1, expr='sad'), A(KHASK, 620, G, 0.72, facing=1, expr='sad'),
                     A(BEH, 1200, G, 0.85, facing=-1, expr='smirk'), A(BELK, 1360, G, 0.68, facing=-1, expr='fear')], fx=[('snow', 100)]))
    add(dict(at='With winter coming', set=steppe('storm', snow=True), cam=((960, 520, 1.0), (960, 500, 1.1)),
             actors=[A(HOE, 960, G, 0.7, facing=1, expr='sad'), A(KID, 1080, G, 0.55, facing=1, expr='sad')], fx=[('snow', 320)]))
    add(dict(at='Your mother refuses', set=steppe('winter', snow=True), cam=((960, 480, 1.6), (960, 470, 1.8)),
             actors=[A(HOE, 960, G, 1.0, facing=1, expr='determined')], fx=[('snow', 120)]))
    add(dict(at='She digs roots', set=steppe('winter', snow=True), cam=((800, 620, 1.3), (1000, 600, 1.3)),
             actors=[A(HOE, 700, G, 0.95, facing=1, expr='determined', arms=('reach', 'reach'), sit=1), A(KID, 1250, G, 0.85, facing=1, expr='determined', arms='draw', prop='bow')],
             fx=[('snow', 100)]))
    add(dict(at='You fish the river', set=steppe('winter', snow=True, river=True), cam=((960, 600, 1.3), (960, 580, 1.4)),
             actors=[A(KID, 960, G, 0.9, facing=1, expr='smile', arms='hold', prop='fish')], fx=[('snow', 80)]))
    add(dict(at='Some days there is nothing', set=('yurt', dict(look='night')), cam=((960, 640, 1.1), (960, 620, 1.25)),
             actors=[A(KID, 760, G, 0.8, facing=1, expr='sad', sit=1), A(KHASK, 1000, G, 0.7, facing=-1, expr='sad', sit=1), A(BELK, 1180, G, 0.65, facing=-1, expr='sad', sit=1)],
             wfx=[('fire', 960, 960, 22)], light=NIGHT([FIRE_L(960, 940, 360)], 0.7)))
    add(dict(at='Your little brothers cry', set=('yurt', dict(look='night')), cam=((1000, 760, 2.4), (1000, 740, 2.7)),
             actors=[A(KHASK, 1000, G, 0.7, facing=-1, expr='cry', sit=1)], light=NIGHT([FIRE_L(960, 940, 360)], 0.65)))
    add(dict(at='For the first time in your life', set=steppe('winter', snow=True), cam=((960, 820, 2.2), (960, 560, 1.0)),
             actors=[A(KID, 960, G, 0.6, facing=1, expr='sad')], fx=[('snow', 200)]))
    add(dict(at='And nobody, on the steppe', set=steppe('night', snow=True, mountains_on=True), cam=((960, 560, 1.4), (960, 520, 1.9)),
             actors=[A(KID, 960, G, 0.9, facing=1, expr='determined', look=(1, 0))], light=NIGHT((), 0.4), fx=[('snow', 100), ('bars',)]))

    # ===== CH IV
    add(dict(t=ch['IV']['t'], set=steppe('day', river=True, mountains_on=True), cam=((960, 540, 1.0), (980, 540, 1.06)), ov=[('chapter', ch['IV'])]))
    add(dict(at="You're about fourteen", set=steppe('day', river=True), cam=((960, 520, 1.2), (960, 500, 1.35)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='determined', arms='hold', prop='bow')],
             ov=[('polaroid', lambda c, r: (c.drawRect(r, fillp(rgb('#b8c0a8'))), draw_head(c, r.centerX(), r.centerY() + 20, 110, TEEN, dict(facing=1, expr='determined'), 0)), 1540, 320, -5, 'age 14', 0.5)]))
    add(dict(at='Your older half-brother', set=steppe('day', river=True), cam=((1000, 480, 1.4), (1000, 470, 1.55)),
             actors=[A(BEH, 1000, G, 1.1, facing=-1, expr='smirk', arms=('hips', 'hips'))], ov=[('note', ['BEHTER', 'half-brother', 'bigger'], 520, 330, -3, 0.4)]))
    add(dict(at="He's bigger", set=steppe('day', river=True), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[A(BEH, 1120, G, 1.1, facing=-1, expr='grin', arms='reach'), A(TEEN, 780, G, 0.95, facing=1, expr='angry', arms='cradle')]))
    add(dict(at='One day, he takes a fish', set=steppe('day', river=True), cam=((960, 580, 1.3), (960, 560, 1.4)),
             actors=[A(BEH, 1080, G, 1.1, facing=-1, expr='grin', arms='raise', prop='fish'), A(TEEN, 800, G, 0.95, facing=1, expr='shock', arms='reach')], trans='whip'))
    add(dict(at='And something in you snaps', set=steppe('war'), cam=((960, 460, 1.8), (960, 450, 2.2)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='rage', tint='#c04030')], fx=[('tint', '#c04040', 0.3), ('bars',)]))
    add(dict(at='You and your brother Khasar', set=steppe('dusk'), cam=((900, 560, 1.1), (1100, 560, 1.15)),
             actors=[A(TEEN, 900, G, 1.0, facing=1, expr='cold', arms='hold', prop='bow', walk=True, mv=(260, 0)), A(KHAS, 650, G, 0.95, facing=1, expr='cold', arms='hold', prop='bow', walk=True, mv=(260, 0))]))
    add(dict(at='Khasar from the front', set=steppe('dusk'), cam=((960, 560, 1.0), (960, 540, 1.08)),
             actors=[A(BEH, 960, G - 60, 0.75, facing=1, expr='neutral', sit=1), A(KHAS, 1550, G, 0.85, facing=-1, expr='cold', arms='draw', prop='bow'), A(TEEN, 380, G, 0.85, facing=1, expr='cold', arms='draw', prop='bow')],
             light=DUSKL((), 0.35)))
    add(dict(at='Before he dies', set=steppe('dusk'), cam=((620, 860, 1.7), (640, 850, 1.85)), track_off=1,
             actors=[A(BEH, 960, 900, 0.9, facing=1, expr='sad', rot=-80, z=900)], light=DUSKL((), 0.4), fx=[('bars',)]))
    add(dict(at='Spare his little brother', set=steppe('dusk', yurts=1), cam=((960, 520, 1.6), (960, 510, 1.8)),
             actors=[A(BELK, 960, G, 0.9, facing=1, expr='cry')], light=DUSKL((), 0.35), ov=[('note', ['BELGUTEI'], 1450, 320, 3, 0.3)]))
    add(dict(at='You do.', set=steppe('dusk'), cam=((960, 470, 1.7), (960, 460, 1.8)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='cold', arms='down', prop='bow')], light=DUSKL((), 0.4)))
    add(dict(at='Your mother is furious', set=steppe('dusk', yurts=2), cam=((960, 540, 1.2), (960, 520, 1.35)),
             actors=[A(HOE, 1150, G, 1.0, facing=-1, expr='rage', arms='point'), A(TEEN, 760, G, 0.95, facing=1, expr='sad')], light=DUSKL((), 0.3)))
    add(dict(at='A family this small', set=steppe('dusk', yurts=1), cam=((960, 540, 1.05), (960, 540, 1.0)),
             actors=[A(HOE, 900, G, 0.8, facing=1, expr='sad'), A(TEEN, 1050, G, 0.75, facing=1, expr='sad'), A(KHAS, 1180, G, 0.72, facing=1, expr='sad'), A(BELK, 760, G, 0.6, facing=1, expr='sad')],
             light=DUSKL((), 0.3)))
    add(dict(at='But word travels', set=steppe('dusk'), cam=((960, 560, 1.0), (960, 540, 1.1)),
             actors=[HORSE(560 + k * 220, 830, 0.35, rider=TARG if k == 2 else GUARD, facing=-1, z=830) for k in range(5)], light=DUSKL((), 0.4)))
    add(dict(at='And the people who abandoned', set=steppe('dusk'), cam=((1000, 460, 1.6), (1000, 450, 1.8)),
             actors=[A(TARG, 1000, G, 1.0, facing=-1, expr='angry')], light=DUSKL((), 0.45), ov=[('note', ['TEMUJIN?'], 520, 360, -5, 1.0)]))

    # ===== CH V
    add(dict(t=ch['V']['t'], set=steppe('night', yurts=5, camp_glow=True), cam=((960, 520, 1.0), (960, 520, 1.08)), light=NIGHT((), 0.35), ov=[('chapter', ch['V'])]))
    add(dict(at='The Taichiud, the clan', set=steppe('night', yurts=4, camp_glow=True), cam=((960, 600, 1.15), (980, 580, 1.25)),
             actors=[A(TARG, 760, G, 1.0, facing=1, expr='angry', talk=True, arms='point'), A(GUARD, 1220, G, 0.95, facing=-1, expr='smirk', sit=1), A(GUARD, 1450, G, 0.95, facing=-1, expr='cold', sit=1)],
             wfx=[('fire', 1000, 1010, 55)], light=NIGHT([FIRE_L(1000, 980, 640)], 0.55)))
    add(dict(at='So they come for you', set=steppe('night', mountains_on=True), cam=((960, 560, 1.0), (1200, 560, 1.05)),
             actors=[HORSE(500 + k * 260, G - (k % 2) * 40, 0.6, rider=GUARD, facing=1, gallop=True, mv=(500, 0), gspeed=2.2, rp=dict(expr='shout', arms='hold', prop='torch')) for k in range(4)],
             light=NIGHT([(560 + k * 260, 520, 380, '#ffb060', 1.0) for k in range(4)], 0.6), fx=[('speed',)], trans='whip'))
    add(dict(at='They catch you', set=steppe('night', mountains_on=False), cam=((960, 520, 1.3), (960, 500, 1.45)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='fear', sweat=True), A(GUARD, 640, G, 1.0, facing=1, expr='grin', arms='reach'), A(GUARD, 1300, G, 1.0, facing=-1, expr='smirk', arms='hold', prop='torch')],
             light=NIGHT([FIRE_L(1360, 760, 520)], 0.6)))
    add(dict(at='They lock your neck', set=steppe('night', yurts=2, mountains_on=False), cam=((960, 520, 1.8), (960, 500, 2.0)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='angry', cangue=True)], light=NIGHT([FIRE_L(1300, 600, 600)], 0.55),
             ov=[('note', ['cangue:', 'a wooden collar'], 1480, 330, 4, 0.8)]))
    add(dict(at='and pass you from tent to tent', set=steppe('night', yurts=6, camp_glow=True, mountains_on=False), cam=((700, 560, 1.1), (1250, 560, 1.1)),
             actors=[A(TEEN, 700, G, 0.95, facing=1, expr='sad', cangue=True, walk=True, mv=(550, 0)), A(GUARD, 450, G, 0.95, facing=1, expr='grin', arms='hold', prop='spear', walk=True, mv=(550, 0))],
             light=NIGHT([FIRE_L(900, 700, 500), FIRE_L(1500, 700, 500)], 0.55)))
    add(dict(at='Then one night', set=steppe('night', mountains_on=True), cam=((800, 560, 1.0), (1150, 560, 1.05)),
             actors=[A(TEEN, 700, G, 0.9, facing=1, expr='fear', cangue=True, walk=True, wspeed=3.0, mv=(700, 0))], light=NIGHT((), 0.45), trans='whip'))
    add(dict(at='You hide in the river', set=steppe('night', river=True, mountains_on=False), cam=((900, 840, 2.0), (880, 830, 2.3)),
             actors=[HEAD(TEEN, 860, 900, 72, facing=1, expr='fear', look=(1, -1))], wfx=[('water', -400, 930, 2400)], light=NIGHT((), 0.4)))
    add(dict(at='A man named Sorkhan-Shira', set=steppe('night', river=True, mountains_on=False), cam=((1100, 620, 1.15), (1150, 600, 1.25)),
             actors=[HEAD(TEEN, 820, 930, 70, facing=1, expr='fear', look=(1, -1)), A(SOR, 1450, 870, 0.9, facing=-1, expr='calm', arms='hold', prop='torch', z=850)],
             wfx=[('water', -400, 960, 2400)], light=NIGHT([FIRE_L(1520, 560, 600)], 0.55), ov=[('note', ['SORKHAN-SHIRA'], 520, 300, -4, 1.0)]))
    add(dict(at='and says nothing', set=steppe('night', river=True, mountains_on=False), cam=((1450, 480, 2.0), (1450, 470, 2.2)),
             actors=[A(SOR, 1450, 870, 0.9, facing=-1, expr='calm', blink=1.0, arms='hold', prop='torch')], light=NIGHT([FIRE_L(1520, 560, 600)], 0.55)))
    add(dict(at='His family gives you a horse', set=steppe('dawn'), cam=((960, 540, 1.1), (960, 520, 1.15)),
             actors=[HORSE(960, G, 0.85, rider=TEEN, facing=1, rp=dict(expr='smile', arms='hold', prop='bow')), A(SOR, 560, G, 0.9, facing=1, expr='smile', arms='wave')]))
    add(dict(at='Remember his name', set=steppe('dawn'), cam=((560, 480, 1.6), (560, 470, 1.7)),
             actors=[A(SOR, 560, G, 0.9, facing=1, expr='smile', arms='wave')], ov=[('note', ['SORKHAN-SHIRA'], 1300, 360, 3, 0.2), ('circle', 1300, 350, 280, 90, 0.8)]))
    add(dict(at='Because the boy he just saved', set=steppe('dawn'), cam=((960, 560, 1.3), (1200, 540, 1.0)),
             actors=[HORSE(900, G, 0.75, rider=TEEN, facing=1, gallop=True, mv=(500, -40), rp=dict(expr='determined', arms='hold', prop='bow'))], fx=[('dust',)]))

    # ===== CH VI
    add(dict(t=ch['VI']['t'], set=steppe('day', yurts=4), cam=((960, 520, 1.0), (980, 520, 1.06)), ov=[('chapter', ch['VI'])]))
    add(dict(at="You're sixteen now", set=steppe('day', yurts=3), cam=((700, 540, 1.1), (1000, 540, 1.15)),
             actors=[HORSE(600, G, 0.85, rider=YOUNG, facing=1, mv=(400, 0), rp=dict(expr='smile'))], ov=[('tag', 'The Khongirad', 'Six or seven years later', 0.3)]))
    add(dict(at='and her father keeps his word', set=steppe('day', yurts=3), cam=((960, 540, 1.15), (960, 520, 1.25)),
             actors=[A(YOUNG, 800, G, 1.0, facing=1, expr='smile'), A(BOR, 1100, G, 0.95, facing=-1, expr='smile'), A(DAI, 1420, G, 0.95, facing=-1, expr='grin', arms='wave')]))
    add(dict(at='Her dowry is a sable coat', set=('yurt', dict(look='night')), cam=((960, 560, 1.3), (960, 540, 1.5)),
             actors=[FN(coat, 960, 760, 1.0)], wfx=[('fire', 560, 960, 40)], light=NIGHT([FIRE_L(960, 600, 800)], 0.35)))
    add(dict(at='And you know exactly', set=('yurt', dict(look='night')), cam=((960, 480, 1.8), (960, 470, 2.0)),
             actors=[A(YOUNG, 960, G, 1.0, facing=1, expr='smirk')], light=NIGHT([FIRE_L(700, 800, 700)], 0.4)))
    add(dict(at='To Toghrul, khan of the Keraites', set=('yurt', dict(look='night')), cam=((960, 560, 1.1), (1000, 540, 1.2)),
             actors=[A(TOG, 1200, G, 1.05, facing=-1, expr='grin'), A(YOUNG, 760, G, 1.0, facing=1, expr='smile', arms='reach'), FN(coat, 990, 760, 0.6)],
             wfx=[('fire', 980, 990, 30)], light=NIGHT([FIRE_L(980, 900, 700)], 0.4), ov=[('note', ['TOGHRUL', 'khan of the Keraites'], 520, 260, -3, 0.5)]))
    add(dict(at='A coat... for an army', set=('yurt', dict(look='night')), cam=((960, 520, 1.3), (960, 500, 1.4)),
             actors=[A(TOG, 1100, G, 1.05, facing=-1, expr='grin', arms='reach'), A(YOUNG, 840, G, 1.0, facing=1, expr='grin', arms='reach')], light=NIGHT([FIRE_L(960, 900, 700)], 0.4)))
    add(dict(at='Because soon after, at dawn', set=steppe('dawn', yurts=3), cam=((960, 560, 1.0), (960, 540, 1.1)),
             actors=[HORSE(1700 + k * 150, G - (k % 3) * 30, 0.55, rider=MERK, facing=-1, gallop=True, mv=(-700, 0), gspeed=2.2, rp=dict(expr='shout', arms='hold', prop='sword')) for k in range(5)],
             fx=[('dust',)], trans='whip'))
    add(dict(at='The Merkits', set=steppe('dawn'), cam=((960, 450, 1.8), (960, 440, 2.0)),
             actors=[A(MERK, 960, G, 1.0, facing=-1, expr='rage', arms='raise', prop='sword')], fx=[('tint', '#c06040', 0.25)]))
    add(dict(at='Remember how your father stole', set=steppe('dusk'), cam=((960, 540, 1.0), (1100, 540, 1.1)),
             actors=[HORSE(700, G, 0.85, rider=YES, facing=1, gallop=True, mv=(500, 0), rp=dict(expr='grin')), A(GROOM, 1650, G, 0.9, facing=-1, expr='rage', arms='reach')],
             fx=[('tint', '#c89a6a', 0.4), ('dust',)], ov=[('note', ['revenge'], 1500, 300, 5, 0.6)]))
    add(dict(at='You escape into the mountains', set=steppe('day', trees=True, mountains_on=True), cam=((800, 520, 1.0), (1150, 480, 1.1)),
             actors=[HORSE(700, G, 0.75, rider=YOUNG, facing=1, gallop=True, mv=(600, -30), rp=dict(expr='fear'))], fx=[('speed',)]))
    add(dict(at='is taken', set=steppe('dawn', yurts=2), cam=((960, 540, 1.2), (760, 540, 1.25)),
             actors=[HORSE(1100, G, 0.85, rider=MERK, facing=-1, gallop=True, mv=(-500, 0), rp=dict(expr='grin')),
                     A(BOR, 1250, G - 250, 0.45, facing=1, expr='cry', arms='reach', rot=-90, mv=(-500, 0), z=G + 1)], fx=[('dust',)]))
    add(dict(at='So you call in the coat', set=('yurt', dict(look='night')), cam=((960, 520, 1.2), (960, 500, 1.3)),
             actors=[A(YOUNG, 780, G, 1.0, facing=1, expr='determined', arms='point'), A(TOG, 1180, G, 1.05, facing=-1, expr='determined')], light=NIGHT([FIRE_L(960, 900, 700)], 0.4)))
    add(dict(at='Toghrul rides', set=steppe('day'), cam=((960, 540, 1.15), (1100, 540, 1.15)),
             actors=[HORSE(900, G, 0.9, rider=TOG, facing=1, gallop=True, mv=(300, 0), col='#3a2a20', rp=dict(expr='determined', arms='raise', prop='sword'))], fx=[('dust',)], trans='whip'))
    add(dict(at='Your childhood blood brother', set=steppe('day'), cam=((960, 540, 1.15), (1100, 540, 1.15)),
             actors=[HORSE(900, G, 0.9, rider=JAM, facing=1, gallop=True, mv=(300, 0), col='#8a7a6a', rp=dict(expr='smirk', arms='hold', prop='spear'))],
             fx=[('dust',)], ov=[('note', ['JAMUKHA', 'blood brother'], 1450, 280, 4, 0.5)], trans='whip'))
    add(dict(at='Thousands of warriors', set=steppe('dusk'), cam=((960, 540, 1.0), (960, 560, 1.06)),
             actors=[HORSE(120 + k * 95, 840 + (k % 3) * 22, 0.24, rider=WAR, facing=1, z=830) for k in range(19)] +
                    [HORSE(60 + k * 120, 960 + (k % 2) * 30, 0.36, rider=WAR, facing=1, z=950) for k in range(16)], light=DUSKL((), 0.2)))
    add(dict(at='You crush the Merkits', set=steppe('war', yurts=4, camp_glow=True), cam=((960, 540, 1.0), (1000, 540, 1.1)), shake=3,
             actors=[HORSE(700, G, 0.85, rider=YOUNG, facing=1, gallop=True, mv=(250, 0), rp=dict(expr='rage', arms='raise', prop='sword')),
                     A(MERK, 1400, G, 0.9, facing=-1, expr='fear')],
             wfx=[('fire', 300, 980, 80), ('fire', 1700, 990, 90), ('smoke', 1600, 800, 1.2)], fx=[('arrows',), ('embers',)],
             light=DUSKL([FIRE_L(300, 940, 700), FIRE_L(1700, 950, 700)], 0.35)))
    add(dict(at='shouting one name', set=steppe('war', yurts=4, camp_glow=True), cam=((900, 420, 1.6), (900, 410, 1.8)),
             actors=[HORSE(800, G, 0.85, rider=YOUNG, facing=1, rp=dict(expr='shout', arms='raise'))], wfx=[('smoke', 1500, 800, 1.0)], fx=[('embers',)],
             light=DUSKL([FIRE_L(300, 940, 700)], 0.35)))
    add(dict(at='And she hears you', set=steppe('war', yurts=4, camp_glow=True), cam=((1100, 480, 1.7), (1100, 470, 1.9)),
             actors=[A(BOR, 1100, G, 1.0, facing=-1, expr='shock', look=(-1, 0))], fx=[('embers',)], light=DUSKL([FIRE_L(1500, 940, 700)], 0.3), trans='whip'))
    add(dict(at='Through the smoke', set=steppe('war', yurts=4, camp_glow=True), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[HORSE(760, G, 0.85, rider=YOUNG, facing=1, rp=dict(expr='smile', arms='reach')), A(BOR, 1350, G, 0.95, facing=-1, expr='smile', arms='reach', walk=True, wspeed=3, mv=(-200, 0))],
             wfx=[('smoke', 1600, 800, 1.2), ('fire', 1750, 990, 70)], fx=[('embers',)], light=DUSKL([FIRE_L(1750, 950, 700)], 0.3)))
    add(dict(at='Soon after, your first son', set=('yurt', dict(look='night')), cam=((960, 560, 1.1), (960, 540, 1.25)),
             actors=[A(BORA, 820, G, 1.0, facing=1, expr='smile', arms=('cradle', 'cradle')), dict(k='char', c=BABY, x=880, y=690, s=0.48, p=dict(facing=1, expr='sleep'), z=1100),
                     A(YOUNG, 1200, G, 1.0, facing=-1, expr='smile')], wfx=[('fire', 1000, 960, 40)], light=NIGHT([FIRE_L(1000, 920, 700)], 0.45),
             ov=[('note', ['JOCHI'], 1500, 300, 4, 1.0)]))

    # ===== CH VII
    add(dict(t=ch['VII']['t'], set=steppe('storm'), cam=((960, 520, 1.0), (960, 520, 1.05)),
             actors=[A(WAR, 640, G, 0.9, facing=1, expr='cold'), A(JAM, 1280, G, 0.9, facing=-1, expr='cold')], ov=[('chapter', ch['VII'])]))
    add(dict(at="But here's the twist", set=steppe('storm'), cam=((1100, 480, 1.4), (1280, 460, 1.8)),
             actors=[A(WAR, 640, G, 0.95, facing=1, expr='calm'), A(JAM, 1280, G, 0.95, facing=-1, expr='smirk')]))
    add(dict(at='He favors noble families', set=steppe('storm', yurts=3), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[A(JAM, 960, G, 1.0, facing=1, expr='smirk'), A(NOB, 1250, G, 0.95, facing=-1, expr='smirk'), A(NOB, 650, G, 0.95, facing=1, expr='grin')]))
    add(dict(at='You do something crazy', set=steppe('day', yurts=3), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[A(WAR, 760, G, 1.0, facing=1, expr='smile', arms='point'), A(HERD, 1180, G, 0.95, facing=-1, expr='shock')]))
    add(dict(at="A herder's son can become", set=steppe('day', yurts=3), cam=((1180, 470, 1.7), (1180, 460, 1.9)),
             actors=[A(HERDG, 1180, G, 0.95, facing=-1, expr='grin')], ov=[('note', ['promoted by talent', 'not by blood'], 560, 320, -4, 0.4)]))
    add(dict(at='In one battle, an enemy archer', set=steppe('war'), cam=((960, 540, 1.0), (960, 540, 1.1)),
             actors=[A(JEBE, 1500, G, 0.95, facing=-1, expr='determined', arms='draw', prop='bow'), HORSE(600, G, 0.85, rider=WAR, facing=1, rp=dict(expr='shock'))],
             fx=[('speed',)], light=DUSKL((), 0.25), trans='whip'))
    add(dict(at='After you win', set=steppe('dusk'), cam=((960, 560, 1.1), (960, 540, 1.2)),
             actors=[A(WAR, 1300, G, 1.0, facing=-1, expr='cold', arms=('hips', 'hips'))] + [A(GUARD, 560 + k * 170, G, 0.85, facing=1, expr='fear', sit=1) for k in range(4)],
             light=DUSKL((), 0.3)))
    add(dict(at='One man steps forward', set=steppe('dusk'), cam=((900, 500, 1.4), (900, 480, 1.6)),
             actors=[A(JEBE, 900, G, 1.0, facing=1, expr='determined')], light=DUSKL((), 0.3)))
    add(dict(at='Kill me, or spare me', set=steppe('dusk'), cam=((900, 440, 2.0), (900, 430, 2.2)),
             actors=[A(JEBE, 900, G, 1.0, facing=1, expr='determined', talk=True)], light=DUSKL((), 0.35), fx=[('bars',)]))
    add(dict(at='You spare him', set=steppe('dusk'), cam=((1300, 460, 1.8), (1300, 450, 1.9)),
             actors=[A(WAR, 1300, G, 1.0, facing=-1, expr='smile')], light=DUSKL((), 0.3)))
    add(dict(at='You name him Jebe', set=steppe('day'), cam=((960, 520, 1.3), (960, 500, 1.4)),
             actors=[A(JEBE, 960, G, 1.0, facing=1, expr='grin', arms='hold', prop='bow')], ov=[('note', ['JEBE', '"the arrow"'], 1480, 320, 4, 0.4)]))
    add(dict(at="That's why men leave Jamukha", set=steppe('storm'), cam=((960, 540, 1.0), (960, 540, 1.05)),
             actors=[A(JAM, 300, G, 0.9, facing=1, expr='angry')] + [A(spec(robe=['#5a4636', '#4a5a3a', '#6a3a3a'][k % 3], hatcol='#3a3028'), 520 + k * 150, G, 0.8, facing=1, expr='neutral', walk=True, mv=(380, 0), seed=k) for k in range(5)] +
                    [A(WAR, 1650, G, 0.95, facing=-1, expr='smile', arms='wave')]))
    add(dict(at="Years later, Jamukha's own men", set=steppe('dusk'), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[A(JAM, 1000, G, 0.95, facing=-1, expr='sad', arms=('bound', 'bound')), A(GUARD, 1250, G, 0.95, facing=-1, expr='cold', arms='reach'), A(KHAN, 600, G, 1.0, facing=1, expr='cold')],
             light=DUSKL((), 0.35)))
    add(dict(at='You offer him his life', set=steppe('dusk'), cam=((760, 480, 1.5), (760, 470, 1.6)),
             actors=[A(KHAN, 760, G, 1.0, facing=1, expr='sad', arms='reach')], light=DUSKL((), 0.35)))
    add(dict(at='He refuses', set=steppe('dusk'), cam=((1100, 460, 1.8), (1100, 450, 1.9)),
             actors=[A(JAM, 1100, G, 1.0, facing=-1, expr='calm', arms=('bound', 'bound'))], light=DUSKL((), 0.4)))
    add(dict(at='The old chronicle says he asked', set=steppe('night', mountains_on=True), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[A(KHAN, 960, G, 0.8, facing=1, expr='sad')], wfx=[('fire', 1200, 1010, 40)], light=NIGHT([FIRE_L(1200, 980, 500)], 0.6), fx=[('bars',)]))
    add(dict(at='And you granted it', set=steppe('night'), cam=((960, 470, 2.0), (960, 460, 2.3)),
             actors=[A(KHAN, 960, G, 0.9, facing=1, expr='sad', look=(0, 1))], light=NIGHT([FIRE_L(1200, 980, 500)], 0.6), fx=[('bars',)]))

    # ===== CH VIII
    add(dict(t=ch['VIII']['t'], set=steppe('dawn', yurts=6), cam=((960, 520, 1.0), (960, 520, 1.06)),
             wfx_back=[('tug', 560 + k * 100, 930, 0.7) for k in range(9)], ov=[('chapter', ch['VIII'])]))
    add(dict(at='Spring, twelve-oh-six', set=steppe('dawn', yurts=6), cam=((960, 540, 1.0), (960, 560, 1.06)),
             actors=[HORSE(100 + k * 140, 900 + (k % 2) * 20, 0.3, rider=spec(robe=['#5a4636', '#4a5a3a', '#6a3a3a'][k % 3], hatcol='#3a3028'), facing=1, mv=(160, 0), z=880) for k in range(13)],
             ov=[('stamp', '1206', 0.4)]))
    add(dict(at='And the boy everyone abandoned', set=steppe('dawn', yurts=6), cam=((960, 560, 1.0), (960, 470, 1.3)),
             actors=[A(KHAN, 960, 980, 1.0, facing=1, expr='determined', arms='raise')] +
                    [A(spec(robe=['#5a4636', '#4a5a3a', '#6a3a3a'][k % 3], hatcol='#3a3028'), 80 + k * 46, 1110 + (k % 2) * 30, 0.55, facing=1 if k < 20 else -1, arms='raise' if k % 3 == 0 else 'down', seed=k) for k in range(40)],
             wfx_back=[('tug', 560 + k * 100, 930, 0.7) for k in range(9)]))
    add(dict(at='Genghis Khan.', set=steppe('dawn', yurts=6), cam=((960, 440, 2.2), (960, 430, 2.5)),
             actors=[A(KHAN, 960, 980, 1.0, facing=1, expr='determined')], wfx_back=[('tug', 560 + k * 100, 930, 0.7) for k in range(9)], fx=[('bars',)], trans='whip'))
    add(dict(at='You break up the old clans', bg=decimal_diagram, ov=[('note', ['no more clans:', 'units of 10, 100, 1,000'], 1450, 940, 3, 1.5)]))
    add(dict(at='You give your people a code', set=('yurt', dict(look='night')), cam=((960, 520, 1.3), (960, 500, 1.4)),
             actors=[A(KHAN, 960, G, 1.0, facing=1, expr='determined', arms='hold', prop='scroll')], light=NIGHT([FIRE_L(700, 860, 700)], 0.35)))
    add(dict(at='You allow every religion', set=steppe('day', yurts=4), cam=((960, 540, 1.0), (960, 520, 1.08)), actors=[FN(holy_men)]))
    add(dict(at='You start horse relay stations', set=steppe('day', yurts=1), cam=((960, 540, 1.0), (1200, 540, 1.0)),
             actors=[HORSE(500, G, 0.75, rider=WAR, facing=1, gallop=True, mv=(900, 0), gspeed=2.4, rp=dict(expr='determined', arms='hold', prop='scroll'))], fx=[('speed',), ('dust',)],
             ov=[('note', ['the Yam:', 'relay stations'], 1480, 300, 4, 0.6)]))
    add(dict(at='Then you ride', set=steppe('dawn'), cam=((960, 560, 1.25), (960, 540, 1.05)),
             actors=[HORSE(960, G, 1.0, rider=KHAN, facing=1, gallop=True, gspeed=2.0, rp=dict(expr='determined', arms='raise', prop='sword'))], fx=[('speed',)], trans='whip'))

    # ===== CH IX
    add(dict(t=ch['IX']['t'], set=steppe('dusk'), cam=((960, 520, 1.0), (980, 520, 1.06)),
             actors=[HORSE(120 + k * 95, 860 + (k % 3) * 22, 0.26, rider=WAR, facing=1, gallop=True, z=850) for k in range(19)], ov=[('chapter', ch['IX'])]))
    add(dict(at='But how does an army of herders', set=steppe('day'), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[HORSE(150 + k * 120, 900 + (k % 3) * 40, 0.4, rider=WAR, facing=1, gallop=True, mv=(200, 0), z=880 + k % 3 * 40) for k in range(14)], fx=[('dust',)]))
    add(dict(at='Mongol kids learn to ride', set=steppe('day', yurts=2), cam=((960, 560, 1.2), (1100, 560, 1.25)),
             actors=[HORSE(900, G, 0.55, rider=KHASK, facing=1, gallop=True, mv=(250, 0), col='#9a7a5a', rp=dict(expr='grin', arms='raise'))], ov=[('note', ['riding from', 'about age 3'], 1500, 300, 4, 0.6)]))
    add(dict(at="and soon they're shooting", set=steppe('day'), cam=((960, 540, 1.3), (1100, 540, 1.3)),
             actors=[HORSE(900, G, 0.7, rider=KID, facing=1, gallop=True, mv=(250, 0), rp=dict(expr='determined', arms='draw', prop='bow'))], fx=[('speed',)]))
    add(dict(at="Your soldiers don't need roads", set=steppe('day'), cam=((900, 540, 1.0), (1150, 540, 1.0)),
             actors=[HORSE(700, G, 0.75, rider=WAR, facing=1, mv=(400, 0)), HORSE(420, G - 30, 0.65, facing=1, mv=(400, 0), col='#8a6a4a'), HORSE(180, G - 50, 0.6, facing=1, mv=(400, 0), col='#3a2a20')],
             ov=[('note', ['3 to 4 spare', 'horses each'], 1500, 300, 4, 0.8)]))
    add(dict(at='When one gets tired', set=steppe('dusk'), cam=((960, 520, 1.3), (1200, 520, 1.3)),
             actors=[HORSE(900, G, 0.8, rider=WAR, facing=1, gallop=True, mv=(400, 0), rp=dict(expr='determined')), HORSE(1150, G + 20, 0.75, facing=1, gallop=True, mv=(400, 0), col='#8a6a4a')], fx=[('speed',)]))
    add(dict(at='Their bow is short', set=steppe('night', mountains_on=False), cam=((960, 540, 1.0), (960, 540, 1.05)), actors=[FN(bow_diagram, 960, 560)], light=NIGHT((), 0.5)))
    add(dict(at='And their favorite trick', set=steppe('day'), cam=((960, 450, 1.9), (960, 440, 2.1)), actors=[A(KHAN, 960, G, 1.0, facing=1, expr='smirk')], trans='whip'))
    add(dict(at='Your riders turn and run', set=steppe('day'), cam=((960, 540, 1.0), (760, 540, 1.0)),
             actors=[HORSE(700 + k * 170, G - (k % 2) * 40, 0.55, rider=WAR, facing=-1, gallop=True, mv=(-500, 0), rp=dict(expr='grin')) for k in range(3)] +
                    [HORSE(1500 + k * 170, G - (k % 2) * 40, 0.55, rider=JIN, facing=-1, gallop=True, mv=(-500, 0), rp=dict(expr='grin', arms='raise', prop='sword')) for k in range(3)], fx=[('dust',)]))
    add(dict(at='Straight into a trap', set=steppe('day'), cam=((960, 540, 1.1), (960, 520, 1.2)), shake=2,
             actors=[HORSE(250 + k * 180, 840, 0.4, rider=WAR, facing=1, mv=(0, 60), rp=dict(expr='shout', arms='draw', prop='bow'), z=830) for k in range(9)] +
                    [A(JIN, 960, G, 1.0, facing=-1, expr='shock', sweat=True)], fx=[('arrows',)]))
    add(dict(at='First, you test them', set=('city', dict(look='day', persian=False)), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[HORSE(300 + k * 260, 1060, 0.5, rider=WAR, facing=1, z=1060) for k in range(6)], ov=[('tag', 'Western Xia', '1209 to 1210', 0.3)]))
    add(dict(at='their king gives in', set=('city', dict(look='day', persian=False)), cam=((960, 600, 1.4), (960, 580, 1.5)),
             actors=[A(spec(beard='full', robe='#6a5a2a', trim='#e0c070', hat='helmet', skin='a'), 960, 1060, 1.0, facing=1, expr='sad', arms=('raise', 'raise'))]))
    add(dict(at='Then, in twelve eleven', bg=lambda c, t, u: campaign_map(c, t, u, arrows=[((1100, 400), (1430, 590), 0.15)], owned=('MONGOLIA', 'XI XIA')), ov=[('stamp', '1211', 0.3)]))
    add(dict(at='Their army waits for you', set=steppe('day', mountains_on=True, horizon=700), cam=((960, 540, 1.0), (960, 520, 1.08)),
             actors=[A(JIN, 500 + k * 140, G - (k % 2) * 30, 0.7, facing=-1, expr='cold', arms='hold', prop='spear', seed=k) for k in range(9)], ov=[('tag', "Badger's Mouth", 'Yehuling Pass, 1211', 0.4)]))
    add(dict(at='Their commander hesitates', set=steppe('day', mountains_on=True, horizon=700), cam=((960, 460, 1.9), (960, 450, 2.1)),
             actors=[A(JINC, 960, G, 1.0, facing=1, expr='fear', sweat=True)]))
    add(dict(at='and you crush them', set=steppe('war'), cam=((960, 540, 1.0), (1150, 540, 1.1)), shake=4,
             actors=[HORSE(600 + k * 260, G - (k % 2) * 40, 0.7, rider=WAR, facing=1, gallop=True, mv=(400, 0), rp=dict(expr='rage', arms='raise', prop='sword')) for k in range(4)],
             wfx=[('smoke', 1400, 820, 1.4), ('fire', 1600, 1000, 70)], fx=[('arrows',), ('embers',)], light=DUSKL([FIRE_L(1600, 950, 700)], 0.3), trans='whip'))
    add(dict(at='Thousands die', set=steppe('war'), cam=((960, 540, 1.05), (960, 540, 1.0)),
             wfx=[('smoke', 600, 900, 1.6), ('smoke', 1300, 880, 1.8), ('fire', 900, 1020, 50)], fx=[('embers',), ('bars',)], light=DUSKL([FIRE_L(900, 990, 600)], 0.45)))
    add(dict(at='Then, in twelve fifteen', set=('city', dict(look='war', persian=False)), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[HORSE(500, 1080, 0.7, rider=KHAN, facing=1, rp=dict(expr='cold'), z=1080)], wfx=[('fire', 700, 640, 80), ('fire', 1400, 650, 90), ('smoke', 1300, 500, 1.5)],
             fx=[('embers',)], light=DUSKL([FIRE_L(700, 600, 700), FIRE_L(1400, 610, 700)], 0.3), ov=[('tag', 'Zhongdu', "today's Beijing, 1215", 0.4)]))

    # ===== CH X
    add(dict(t=ch['X']['t'], set=steppe('day', mountains_on=False), cam=((960, 520, 1.0), (1000, 520, 1.06)), warm=0.12,
             actors=[dict(k='camel', x=500 + k * 330, y=980, s=0.45, p=dict(facing=1), rider=MERCH if k % 2 == 0 else None, mv=(200, 0), z=980) for k in range(4)], ov=[('chapter', ch['X'])]))
    add(dict(at='In twelve eighteen', set=steppe('day', mountains_on=False), cam=((800, 540, 1.1), (1150, 540, 1.1)), warm=0.12,
             actors=[dict(k='camel', x=500 + k * 380, y=G, s=0.6, p=dict(facing=1), rider=MERCH if k % 2 == 0 else None, mv=(350, 0)) for k in range(4)],
             ov=[('note', ['about 450', 'merchants'], 1500, 300, 4, 1.0)]))
    add(dict(at='The governor of Otrar', set=('palace', dict(look='day')), cam=((960, 540, 1.15), (960, 520, 1.3)),
             actors=[A(INAL, 960, G, 1.05, facing=1, expr='smirk', arms='point')], ov=[('note', ['INALCHUQ', 'governor of Otrar'], 520, 280, -3, 0.4)]))
    add(dict(at='and kills them all', set=('palace', dict(look='day')), cam=((960, 540, 1.1), (960, 520, 1.2)),
             actors=[A(GUARD, 760, G, 1.0, facing=1, expr='cold', arms='raise', prop='sword'), A(MERCH, 1200, G, 0.95, facing=-1, expr='fear', arms='up2')],
             fx=[('tint', '#b03020', 0.35), ('bars',)], trans='whip'))
    add(dict(at='One camel driver escapes', set=steppe('night', mountains_on=True), cam=((800, 540, 1.1), (1200, 540, 1.1)),
             actors=[dict(k='camel', x=700, y=G, s=0.65, p=dict(facing=1), rider=MERCH, mv=(500, 0))], light=NIGHT((), 0.45), fx=[('speed',)]))
    add(dict(at='You send envoys to the Shah', set=('palace', dict(look='day')), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[A(SHAH, 1300, G, 1.05, facing=-1, expr='smirk', sit=1), A(ENVOY, 650, G, 0.95, facing=1, expr='calm'), A(MERCH, 850, G, 0.95, facing=1, expr='calm')],
             ov=[('note', ['SHAH MUHAMMAD II', 'of Khwarazm'], 1450, 260, 3, 0.6)]))
    add(dict(at='and shaves the beards', set=('palace', dict(look='day')), cam=((650, 470, 1.8), (650, 460, 2.0)),
             actors=[A(ENVOY, 650, G, 0.95, facing=1, expr='shock', arms=('up2', 'down'))]))
    add(dict(at='Within three years', set=steppe('war'), cam=((960, 440, 2.0), (960, 430, 2.4)),
             actors=[A(KHAN, 960, G, 1.0, facing=1, expr='rage', tint='#b04030')], fx=[('tint', '#c04040', 0.25), ('bars',)]))
    add(dict(at='his empire collapses', bg=lambda c, t, u: campaign_map(c, t, u, arrows=[((900, 400), (500, 540), 0.1)], owned=('MONGOLIA', 'XI XIA', 'QARA KHITAI'), grow=(('KHWARAZM', 'JIN'), {'KHWARAZM': 0.6, 'JIN': 0.3}))))
    add(dict(at='Cities are wiped out', set=('city', dict(look='war', persian=True)), cam=((960, 540, 1.0), (960, 520, 1.08)),
             wfx=[('fire', 500, 640, 90), ('fire', 1200, 650, 100), ('smoke', 900, 500, 1.8), ('smoke', 1500, 520, 1.6)], fx=[('embers',)],
             light=DUSKL([FIRE_L(500, 600, 700), FIRE_L(1200, 610, 700)], 0.35), ov=[('tag', 'Khwarazm', '1219 to 1221', 0.4)]))
    add(dict(at='Your armies cross mountains', set=steppe('winter', snow=True, mountains_on=True, horizon=720), cam=((960, 540, 1.0), (1150, 520, 1.05)),
             actors=[HORSE(300 + k * 170, 1000 - k * 15, 0.42, rider=WAR, facing=1, mv=(300, -20), z=1000 - k) for k in range(8)], fx=[('snow', 200)]))
    add(dict(at='This is the part of your story', set=steppe('war'), cam=((960, 560, 1.0), (960, 540, 1.1)),
             actors=[A(KHAN, 960, G, 0.6, facing=1, expr='cold')], wfx=[('smoke', 500, 900, 1.8), ('smoke', 1400, 880, 1.6), ('fire', 1500, 1010, 60)], fx=[('embers',), ('bars',)],
             light=DUSKL([FIRE_L(1500, 980, 600)], 0.45)))
    add(dict(at='And the man who started it', set=('yurt', dict(look='night')), cam=((960, 460, 2.0), (960, 450, 2.2)),
             actors=[A(OLDKHAN, 960, G, 1.0, facing=1, expr='sad')], light=NIGHT([FIRE_L(700, 860, 700)], 0.5)))

    # ===== CH XI
    add(dict(t=ch['XI']['t'], set=steppe('dusk', mountains_on=True), cam=((960, 520, 1.0), (980, 520, 1.06)),
             actors=[HORSE(800, 980, 0.4, rider=OLDKHAN, facing=1, mv=(150, 0), z=980)], ov=[('chapter', ch['XI'])]))
    add(dict(at='Twelve twenty-seven', set=steppe('dusk', mountains_on=True), cam=((960, 540, 1.1), (1100, 540, 1.15)),
             actors=[HORSE(900, G, 0.85, rider=OLDKHAN, facing=1, mv=(250, 0), rp=dict(expr='sad'))] + [HORSE(400 + k * 160, 900, 0.35, rider=WAR, facing=1, mv=(250, 0), z=890) for k in range(5)],
             ov=[('stamp', '1227', 0.3), ('tag', 'Western Xia', 'at war again', 0.6)]))
    add(dict(at='And in August', set=('yurt', dict(look='night')), cam=((960, 640, 1.2), (960, 680, 1.4)),
             actors=[A(OLDKHAN, 1000, 1020, 0.95, facing=1, expr='sleep', rot=-90, z=900), A(WAR, 1450, G, 0.95, facing=-1, expr='sad')],
             wfx=[('fire', 600, 940, 26)], light=NIGHT([FIRE_L(600, 900, 460)], 0.68), fx=[('bars',)]))
    add(dict(at='How? Nobody knows', set=steppe('night', mountains_on=False), cam=((960, 540, 1.0), (960, 540, 1.04)), light=NIGHT((), 0.7), ov=[('fn', crossed_notes, 0.0)]))
    add(dict(at='Even your grave is a mystery', set=steppe('night', trees=True, mountains_on=True), cam=((960, 540, 1.0), (960, 520, 1.1)),
             actors=[HORSE(500 + k * 200, 950, 0.32, rider=WAR, facing=1, mv=(180, 0), z=940) for k in range(5)], light=NIGHT((), 0.5)))
    add(dict(at='Nearly eight hundred years later', set=steppe('night', trees=True, mountains_on=True), cam=((960, 480, 1.2), (960, 460, 1.35)),
             light=NIGHT((), 0.45), ov=[('note', ['grave: still', 'not found'], 1400, 760, 3, 0.6), ('circle', 960, 420, 520, 200, 0.3)]))
    add(dict(at='In two thousand three', bg=parchment_bg,
             ov=[('note', ['2003 study:', '1 in 200 men', 'might descend from you'], 960, 480, -2, 0.2)]))
    add(dict(at='Newer research says', bg=parchment_bg,
             ov=[('note', ['2003 study:', '1 in 200 men', 'might descend from you'], 960, 480, -2, -1.0),
                 ('fn', lambda c, t, u: c.drawLine(560, 420 + 0 * t, 560 + 800 * ease(t / 0.5), 560, strokep(rgb('#b8302a'), 10)), 0.6),
                 ('fn', lambda c, t, u: text(c, 'maybe not his at all', 960, 820, font('hand', 80), rgb('#8a1a12')) if t > 0 else None, 1.2)]))
    add(dict(at='But the empire you started', bg=lambda c, t, u: campaign_map(c, t, u, owned=('MONGOLIA', 'XI XIA', 'QARA KHITAI', 'KHWARAZM', 'JIN')),
             ov=[('fn', lambda c, t, u: text(c, 'the largest connected land empire in history', 960, 1000, font('serif_i', 54), rgb('#3a2414')) if t > 0 else None, 1.0)]))

    # ===== ENDING
    add(dict(t=ch['END']['t'], set=steppe('night', yurts=3, camp_glow=True), cam=((960, 520, 1.0), (960, 520, 1.04)), light=NIGHT((), 0.4), fx=[('embers',)]))
    add(dict(at='A baby holding blood', set=('yurt', dict(look='night')), cam=((730, 640, 3.2), (735, 620, 3.7)),
             actors=[dict(k='char', c=BABY, x=700, y=720, s=0.62, p=dict(facing=1, expr='calm', fist=True, clot=True))], light=NIGHT([FIRE_L(1040, 860, 700)], 0.45), fx=[('bars',)]))
    add(dict(at='A boy left with nothing', set=steppe('winter', snow=True), cam=((960, 560, 1.4), (960, 540, 1.2)),
             actors=[A(KID, 960, G, 0.8, facing=1, expr='sad')], fx=[('snow', 200), ('bars',)]))
    add(dict(at='A prisoner in a wooden collar', set=steppe('night', mountains_on=False), cam=((960, 500, 1.7), (960, 490, 1.85)),
             actors=[A(TEEN, 960, G, 1.0, facing=1, expr='determined', cangue=True)], light=NIGHT([FIRE_L(1300, 600, 600)], 0.55), fx=[('bars',)]))
    add(dict(at='Who ended up ruling', set=steppe('dawn', yurts=6), cam=((960, 470, 1.6), (960, 560, 1.0)),
             actors=[A(KHAN, 960, 980, 1.0, facing=1, expr='determined', arms='raise')], wfx_back=[('tug', 560 + k * 100, 930, 0.7) for k in range(9)]))
    add(dict(at='So... were you a builder', set=steppe('war'), cam=((960, 450, 2.0), (960, 440, 2.3)), actors=[A(KHAN, 960, G, 1.0, facing=1, expr='cold', look=(0, 0))], fx=[('bars',)]))
    add(dict(at='Tell me in the comments', set=steppe('night', yurts=3, camp_glow=True), light=NIGHT((), 0.5),
             ov=[('end', ('Builder of nations...', '...or destroyer?'))]))
    return S_
