# apply the house glossy glow (same chain as compose_plates --glow 0.85) to stills, then build a preview sheet
import glob, subprocess, sys, os
from PIL import Image
k=float(os.environ.get('GLOW','0.85')); os.makedirs('stills_glow', exist_ok=True)
fc=(f"format=gbrp,split=3[gA][gB][gC];[gB]curves=all='0/0 0.55/0.03 0.8/0.45 1/1',split[hb1][hb2];[hb1]gblur=sigma=10[t1];[hb2]gblur=sigma=40[t2]"
    f";[gC]gblur=sigma=22,eq=saturation=1.25[sh];[t1][t2]blend=all_mode=screen[hl];[gA][hl]blend=all_mode=screen:all_opacity={0.55*k:.3f}[g1];[g1][sh]blend=all_mode=screen:all_opacity={0.16*k:.3f},eq=saturation={1+0.06*k:.3f}:contrast={1+0.03*k:.3f},unsharp=5:5:0.55:5:5:0.0")
fs=sorted(glob.glob('stills/*.jpg'))
for f in fs: subprocess.run(['ffmpeg','-y','-v','error','-i',f,'-filter_complex',fc,'-q:v','2','stills_glow/'+os.path.basename(f)],check=True)
cols=int(sys.argv[2]); W,H=360,640; rows=(len(fs)+cols-1)//cols
s=Image.new('RGB',(W*cols,H*rows),'#111')
for i,f in enumerate(sorted(glob.glob('stills_glow/*.jpg'))): s.paste(Image.open(f).resize((W,H)),((i%cols)*W,(i//cols)*H))
s.save(sys.argv[1],quality=90)
