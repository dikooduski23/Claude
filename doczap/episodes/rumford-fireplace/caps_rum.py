# sentence-case 1-2 word captions in the reference style -> PNG per chunk + ffmpeg overlay filter
import json, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter
END = 44.0
W = json.load(open('words.json'))
W = [w for w in W if w['s'] < END]
# numbers that read better as digits
M = []; i = 0
while i < len(W):
    a = W[i]['w'].lower().strip(',.')
    nx = lambda k: W[i + k]['w'].lower().strip(',.') if i + k < len(W) else ''
    if a == 'seventeen' and nx(1).startswith('ninety'): M.append({'w': '1796.', 's': W[i]['s'], 'e': W[i + 1]['e']}); i += 2; continue
    if a == 'hundred' and nx(1) == 'and' and nx(2) == 'fifty': M[-1] = {'w': '150', 's': M[-1]['s'], 'e': W[i + 2]['e']} if M and M[-1]['w'].lower() == 'a' else M[-1]; (M.append({'w': '150', 's': W[i]['s'], 'e': W[i + 2]['e']}) if M[-1]['w'] != '150' else None); i += 3; continue
    if a == 'two' and nx(1).startswith('months'): M.append({'w': '2 months', 's': W[i]['s'], 'e': W[i + 1]['e']}); i += 2; continue
    M.append(dict(W[i])); i += 1
W = M
# fix shared timestamps (e.g. "see," and "he" both at 5.16)
for i in range(len(W) - 1):
    if abs(W[i + 1]['s'] - W[i]['s']) < 0.02:
        mid = (W[i]['s'] + W[i]['e']) / 2; W[i]['e'] = mid; W[i + 1]['s'] = mid
chunks, cur = [], []
for w in W:
    if cur and (len(' '.join(x['w'] for x in cur + [w])) > 12 or any(ch.isdigit() for ch in w['w'])):
        chunks.append(cur); cur = []
    cur.append(w)
    if sum(len(x['w'].split()) for x in cur) >= 2 or re.search(r'[.,?!…:]$', w['w']):
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
mm = []
wc = lambda c: sum(len(x['w'].split()) for x in c)
for i, c in enumerate(chunks):
    nxt = chunks[i + 1][0]['s'] if i + 1 < len(chunks) else END
    endp = lambda ch: re.search(r'[.?!]$', ch[-1]['w'].replace('...', '')) is not None
    if mm and nxt - c[0]['s'] < 0.2 and wc(mm[-1]) + wc(c) <= 2 and not endp(mm[-1]): mm[-1] = mm[-1] + c
    elif nxt - c[0]['s'] < 0.2 and i + 1 < len(chunks) and wc(c) + wc(chunks[i + 1]) <= 2 and not endp(c): chunks[i + 1] = c + chunks[i + 1]
    else: mm.append(c)
chunks = mm
import os
F = ImageFont.truetype(next(p for p in ['/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf', 'fonts/Poppins-Bold.ttf'] if os.path.exists(p)), 60)
filt, inputs = [], []
for i, c in enumerate(chunks):
    t = ' '.join(x['w'] for x in c).replace('...', '').replace('…', '')
    s, e = c[0]['s'], (chunks[i + 1][0]['s'] if i + 1 < len(chunks) else END)
    im = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0)); sh = Image.new('RGBA', (1080, 1920), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((540, 1345), t, font=F, anchor='mm', fill=(0, 0, 0, 200), stroke_width=7, stroke_fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(5)); im = Image.alpha_composite(im, sh)
    ImageDraw.Draw(im).text((540, 1342), t, font=F, anchor='mm', fill=(255, 255, 255, 255), stroke_width=3, stroke_fill=(20, 20, 24, 255))
    im.save(f'cap/c{i:02d}.png'); inputs.append(f'cap/c{i:02d}.png'); filt.append((s, e)); print(f'{s:5.2f}-{e:5.2f} {t}')
json.dump({'inputs': inputs, 'win': filt}, open('cap/caps.json', 'w'))
