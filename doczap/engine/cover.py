from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import sys
im = Image.open(sys.argv[1]).convert('RGB').resize((1080, 1920), Image.LANCZOS); im = ImageEnhance.Color(im).enhance(1.06)
d = ImageDraw.Draw(im); F = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', 96)
lines = [('HE WON THE', '#ffffff'), ('LOTTERY 14 TIMES…', '#ffffff'), ('LEGALLY', '#ffd23f')]
y0 = int(sys.argv[3]) if len(sys.argv) > 3 else 190
for i, (l, c) in enumerate(lines):
    d.text((540, y0 + i * 124), l, font=F, fill=c, anchor='mm', stroke_width=13, stroke_fill='#000000')
im.save(sys.argv[2], quality=93)
