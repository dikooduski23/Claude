import glob,sys
from PIL import Image,ImageDraw
fs=sorted(glob.glob('stills/*.jpg')); cols=int(sys.argv[2]) if len(sys.argv)>2 else 7; W,H=216,384
rows=(len(fs)+cols-1)//cols; s=Image.new('RGB',(W*cols,H*rows))
for i,f in enumerate(fs):
  im=Image.open(f).resize((W,H)); ImageDraw.Draw(im).text((5,5),f[-9:-4],fill='yellow',stroke_width=2,stroke_fill='black'); s.paste(im,((i%cols)*W,(i//cols)*H))
s.save(sys.argv[1],quality=88)
