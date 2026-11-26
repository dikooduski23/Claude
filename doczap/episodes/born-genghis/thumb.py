import sys; sys.path.insert(0,'../../longform'); sys.path.insert(0,'.')
from kit import *; from chars import *; import overlays as O; from fx import fire
from story import KHAN, BABY
import numpy as np
from PIL import Image
s=skia.Surface(W,H); c=s.getCanvas()
c.drawRect(skia.Rect(0,0,W,H), rgrad(1250,500,1300,[rgb('#a8341f'),rgb('#3a0f0a'),rgb('#120605')],[0,0.55,1]))
for k in range(18):
    a=k/18*math.pi*2; c.drawLine(1250,500,1250+math.cos(a)*1600,500+math.sin(a)*1600,strokep(skia.Color(255,140,60,25),60))
draw_char(c,1250,1650,2.3,KHAN,dict(facing=-1,expr='cold',look=(-1,0),blink=0.0),0)
# baby fist inset circle
c.save(); cp=ellipse(470,560,250,250); c.clipPath(cp,doAntiAlias=True)
c.drawRect(skia.Rect(200,300,740,820),fillp(rgb('#5a3a26')))
draw_char(c,430,760,1.35,BABY,dict(facing=1,expr='calm',fist=True,clot=True,blink=0.0),0)
c.restore(); c.drawPath(cp,strokep(rgb('#f2e6cc'),12))
f=font('serif',140)
text(c,'BORN',470,190,f,rgb('#f2e6cc'),stroke=INK,sw=14,shadow=skia.Color(0,0,0,255))
text(c,'HOLDING',470,915,font('serif',120),rgb('#f2e6cc'),stroke=INK,sw=14,shadow=skia.Color(0,0,0,255))
text(c,'BLOOD',470,1030,font('serif',120),rgb('#e04a32'),stroke=INK,sw=14,shadow=skia.Color(0,0,0,255))
arr=s.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)
Image.fromarray(O.film_finish(arr,0,grain=3)).resize((1280,720),Image.LANCZOS).save('thumbnail.png')
