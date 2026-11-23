# sentence-case 1-2 word captions in the reference style -> PNG per chunk + ffmpeg overlay filter
import json, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter
END = 41.85
W = json.load(open('words.json'))
W = [w for w in W if w['s'] < END]
# numbers that read better as digits
M = []; i = 0
while i < len(W):
    a = W[i]['w'].lower().strip(',.')
    nx = lambda k: W[i + k]['w'].lower().strip(',.') if i + k < len(W) else ''
    if a == 'nineteen' and nx(1).startswith('ninety'): M.append({'w': '1992,', 's': W[i]['s'], 'e': W[i + 1]['e']}); i += 2; continue
    if a == 'twenty-seven' and nx(1) == 'million' and nx(2) == 'dollars': M.append({'w': '$27 million.', 's': W[i]['s'], 'e': W[i + 2]['e']}); i += 3; continue
    if a == 'seven' and nx(1) == 'million': M.append({'w': '7 million.', 's': W[i]['s'], 'e': W[i + 1]['e']}); i += 2; continue
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
    if len(cur) == 2 or re.search(r'[.,?!…]$', w['w']):
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
F = ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf', 60)
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
