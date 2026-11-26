"""Word aligner: pocketsphinx recognition + difflib match to the known script.
usage: python3 align.py audio.mp3 script.txt out.json"""
import re, json, subprocess, sys, difflib
from pocketsphinx import Decoder
mp3, scr, out = sys.argv[1:4]
raw = subprocess.run(['ffmpeg','-v','error','-i',mp3,'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
dur = len(raw)/32000
d = Decoder(samprate=16000); d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
rec = [(re.sub(r'\(\d+\)','',s.word), s.start_frame/100, (s.end_frame+1)/100) for s in d.seg() if not s.word.startswith('<') and s.word not in ('[NOISE]','[SPEECH]')]
words = open(scr).read().split()
norm = lambda w: re.sub(r"[^a-z']", '', w.lower()) or '_'
toks = [norm(w) for w in words]
sm = difflib.SequenceMatcher(None, toks, [r[0] for r in rec], autojunk=False)
tt = [None]*len(toks)
for op,a1,a2,b1,b2 in sm.get_opcodes():
    if op=='equal' or (op=='replace'):
        n=a2-a1; m=b2-b1
        for k in range(n):
            if m: j=b1+int(k*m/n); tt[a1+k]=[rec[j][1],rec[j][2]]
# interpolate gaps
known=[i for i,x in enumerate(tt) if x]
for i in range(len(tt)):
    if tt[i] is None:
        p=max([k for k in known if k<i],default=None); q=min([k for k in known if k>i],default=None)
        a=tt[p][1] if p is not None else 0.0; b=tt[q][0] if q is not None else dur
        np_=(q if q is not None else len(tt))-(p if p is not None else -1)
        f=(i-(p if p is not None else -1))/np_
        t0=a+(b-a)*f; tt[i]=[t0,t0+(b-a)/np_]
json.dump({'dur':dur,'words':[[w,round(t[0],3),round(t[1],3)] for w,t in zip(words,tt)]},open(out,'w'))
print('matched',len(known),'/',len(toks),'dur',round(dur,2))
