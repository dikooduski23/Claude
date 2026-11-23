python3 - "$1" <<'PY'
import sys,glob
from PIL import Image,ImageDraw
fs=sorted(glob.glob('stills/*.jpg')); cols=6
ims=[]
for f in fs:
  im=Image.open(f).resize((216,384)); ImageDraw.Draw(im).text((5,5),f[-9:-4],fill='yellow',stroke_width=2,stroke_fill='black'); ims.append(im)
rows=(len(ims)+cols-1)//cols; s=Image.new('RGB',(216*cols,384*rows)); [s.paste(im,((i%cols)*216,(i//cols)*384)) for i,im in enumerate(ims)]; s.save(sys.argv[1])
PY
