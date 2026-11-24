# handwritten in-world labels with a hand-drawn arrow (reference style "spike" label)
# Edit LABELS for each episode (positions read off a plate). Writes:
#   cap/labels.json  -> animated remocn labels (Handwrite + InkArrow) for overlay.py  [default path]
#   cap/l_<n>.png    -> legacy static PNG labels for the old compose path
# Box coords: (x, y) = top-left of a w x h box on the 1080x1920 frame; tx/ty = text centre and
# arrow_to = arrow head, both inside the box; vx = drift in px/s around drift_at (follows a camera move).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, json, os

LABELS = [
    dict(name='jack', text='jackpot', start=10.0, end=12.45, x=40, y=620, vx=-45, drift_at=11.5, tx=230, ty=70, arrow_to=(150, 300)),
    dict(name='tix', text='every ticket', start=11.0, end=12.45, x=600, y=450, vx=45, drift_at=11.5, tx=230, ty=70, arrow_to=(250, 300)),
]

F = ImageFont.truetype('fonts/caveat-latin-700-normal.woff', 96)
def label(text, path, arrow_to, W=460, H=330, tx=None, ty=70):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    tx = tx if tx is not None else W // 2
    # arrow: a gentle curve from under the text to arrow_to, with a two-stroke head
    x0, y0 = tx, ty + 60; x1, y1 = arrow_to; cx, cy = (x0 + x1) / 2 + 40, (y0 + y1) / 2
    pts = [((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1) for t in [i / 30 for i in range(31)]]
    a = math.atan2(y1 - pts[-4][1], x1 - pts[-4][0]); head = [(x1 - 34 * math.cos(a + s), y1 - 34 * math.sin(a + s)) for s in (0.5, -0.5)]
    for col, w in (((20, 20, 24, 255), 15), ((255, 255, 255, 255), 8)):
        d.line(pts, fill=col, width=w, joint='curve'); d.line([head[0], (x1, y1), head[1]], fill=col, width=w, joint='curve')
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((tx, ty), text, font=F, anchor='mm', fill=(0, 0, 0, 170), stroke_width=9, stroke_fill=(0, 0, 0, 170))
    im = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)), im); d = ImageDraw.Draw(im)
    d.text((tx, ty), text, font=F, anchor='mm', fill=(255, 255, 255, 255), stroke_width=4, stroke_fill=(20, 20, 24, 255))
    im.save(path)

os.makedirs('cap', exist_ok=True)
out = []
for L in LABELS:
    label(L['text'], f"cap/l_{L['name']}.png", L['arrow_to'], tx=L['tx'], ty=L['ty'])
    out.append({'text': L['text'], 'start': L['start'], 'end': L['end'], 'x': L['x'], 'y': L['y'], 'w': L.get('w', 460), 'h': L.get('h', 330),
                'vx': L.get('vx', 0), 'driftAt': L.get('drift_at'), 'tx': L['tx'], 'ty': L['ty'], 'arrowTo': list(L['arrow_to']) if L.get('arrow_to') else None,
                'circle': L.get('circle')})
json.dump(out, open('cap/labels.json', 'w'), indent=1)
print('labels:', ', '.join(L['text'] for L in LABELS))
