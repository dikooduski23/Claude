import json, subprocess, numpy as np
SR=48000
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32)
A,B,C=load('vo_a.mp3'),load('vo_b.mp3'),load('vo_c.mp3')
wa,wb,wc=[json.load(open(f'w_{x}.json'))['words'] for x in 'abc']
txt={x:open(f'vo_{x}.txt').read().strip().split('\n\n') for x in 'abc'}
def para_spans(words,paras):
    out=[];i=0
    for p in paras:
        n=len(p.split()); out.append((i,i+n)); i+=n
    return out
pa,pb=para_spans(wa,txt['a']),para_spans(wb,txt['b'])
# locate split points inside B paragraph 1
b1s,b1e=pb[1]
ws=[w[0] for w in wb]
i_ride=next(i for i in range(b1s,b1e) if ws[i]=='ride.' and ws[i-1]=='you' and ws[i-2]=='Then')
i_bj=next(i for i in range(b1s,b1e) if ws[i]=='today.')
def t0(words,i): return words[i][1]
def t1(words,i): return words[i][2]
# segments: (src, words, wstart, wend, chapter or None)
segs=[('A',wa,*pa[0],None)]
chap=[('I','The Blood Clot','Mongolia, around 1162'),('II','Poison','The Tatar feast'),('III','Abandoned','Nobody, on the steppe'),
      ('IV','The Fish','Age fourteen'),('V','The Collar','Prisoner of the Taichiud'),('VI','The Sable Coat','A coat for an army')]
for k in range(1,7): segs.append(('A',wa,*pa[k],chap[k-1]))
segs.append(('B',wb,*pb[0],('VII','Brothers','Jamukha')))
segs.append(('B',wb,b1s,i_ride+1,('VIII','Genghis Khan','Spring, 1206')))
segs.append(('C',wc,0,len(wc),('IX','The Horsemen','How herders beat empires')))
segs.append(('B',wb,i_bj+1,b1e,('X','The Insult','Otrar, 1218')))
segs.append(('B',wb,*pb[2],('XI','The Last Ride','1227')))
segs.append(('B',wb,*pb[3],('END','','')))
src={'A':A,'B':B,'C':C}
GAP_CH=2.6; PAD=0.25
out=[np.zeros(int(SR*0.4),np.float32)]; T=0.4; master=[]; chapters=[]
for s,words,a,b,ch in segs:
    st=max(0,words[a][1]-0.08); en=words[b-1][2]+0.18
    if b==len(words): en=len(src[s])/SR
    if ch:
        if ch[0]!='END': chapters.append(dict(num=ch[0],title=ch[1],sub=ch[2],t=T))
        else: chapters.append(dict(num='END',title='',sub='',t=T))
        g=GAP_CH if ch[0]!='END' else 1.2
        out.append(np.zeros(int(SR*g),np.float32)); T+=g
    seg=src[s][int(st*SR):int(en*SR)]
    fade=int(SR*0.01); seg=seg.copy(); seg[:fade]*=np.linspace(0,1,fade); seg[-fade:]*=np.linspace(1,0,fade)
    for w in words[a:b]: master.append([w[0],round(T+w[1]-st,3),round(T+w[2]-st,3)])
    out.append(seg); T+=len(seg)/SR
    out.append(np.zeros(int(SR*PAD),np.float32)); T+=PAD
out.append(np.zeros(int(SR*2.5),np.float32)); T+=2.5
audio=np.concatenate(out)
subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(SR),'-ac','1','-i','-','voice.wav'],input=audio.tobytes())
json.dump(dict(dur=len(audio)/SR,words=master,chapters=chapters),open('timeline.json','w'),indent=0)
print('total',round(len(audio)/SR,2),'s',len(master),'words')
for c in chapters: print(c['num'],c['title'],round(c['t'],1))
