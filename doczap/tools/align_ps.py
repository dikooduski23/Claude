# Word-level aligner using pocketsphinx recognition + sequence matching.
# usage: EP=epN.html python3 align_ps.py vo.mp3 SHIFT   -> warp.json (same format as align.py)
import os, re, json, subprocess, sys, difflib
from pocketsphinx import Decoder
MP3 = sys.argv[1]; SHIFT = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
raw = subprocess.run(['ffmpeg','-v','error','-i',MP3,'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
dur = len(raw)/32000
d = Decoder(samprate=16000); d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
rec = [(re.sub(r'\(\d+\)','',s.word), s.start_frame/100, (s.end_frame+1)/100) for s in d.seg() if not s.word.startswith('<') and s.word not in ('[NOISE]',)]
HTML = os.environ.get('EP','ep1.html'); src = open(HTML).read()
TOTAL = float(re.search(r'const TOTAL=([\d.]+)', src).group(1))
segs = [(float(a),float(b),json.loads(c)) for a,b,c in re.findall(r'\[([\d.]+),([\d.]+),("(?:[^"\\]|\\.)*")\]', src)]
ONES='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS='_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()
def n2w(n):
    n=int(n)
    if n<20: return ONES[n]
    if n<100: return TENS[n//10]+('' if n%10==0 else ' '+ONES[n%10])
    if 1100<=n<2000: return n2w(n//100)+' '+(n2w(n%100) if n%100 else 'hundred')
    if n<1000: return ONES[n//100]+' hundred'+('' if n%100==0 else ' '+n2w(n%100))
    return ' '.join(ONES[int(c)] for c in str(n))
def norm(w):
    w = re.sub(r'\d+', lambda m: ' '+n2w(m.group())+' ', w.lower())
    return [x for x in re.findall(r"[a-z']+", w.replace('-',' '))] or ['_']
units = []  # (seg, word)
for si,(a,b,t) in enumerate(segs):
    for w in t.split(' '):
        if w: units.append((si,w))
toks = []; owner = []
for ui,(_,w) in enumerate(units):
    for x in norm(w): toks.append(x); owner.append(ui)
rw = [r[0] for r in rec]
sm = difflib.SequenceMatcher(None, toks, rw, autojunk=False)
tt = [None]*len(toks)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): tt[blk.a+k] = (rec[blk.b+k][1], rec[blk.b+k][2])
# fuzzy pass for replaced spans of equal length
for op,a1,a2,b1,b2 in sm.get_opcodes():
    if op=='replace':
        n=a2-a1; m=b2-b1
        for k in range(n):
            j=b1+int(k*m/n); tt[a1+k]=(rec[j][1],rec[j][2]) if m else None
matched = sum(1 for x in tt if x)
# per-unit times
us = [None]*len(units)
for i,x in enumerate(tt):
    if x is None: continue
    u=owner[i]; us[u] = (x[0], x[1]) if us[u] is None else (min(us[u][0],x[0]), max(us[u][1],x[1]))
# interpolate missing
first = rec[0][1] if rec else 0.0; last = rec[-1][2] if rec else dur
known = [i for i,x in enumerate(us) if x]
for i in range(len(us)):
    if us[i]: continue
    p = max([k for k in known if k<i], default=None); q = min([k for k in known if k>i], default=None)
    a = us[p][1] if p is not None else first; b = us[q][0] if q is not None else last
    lo = p if p is not None else -1; hi = q if q is not None else len(us)
    f0 = (i-lo)/(hi-lo); f1 = (i-lo+1)/(hi-lo)
    us[i] = (a+(b-a)*f0, a+(b-a)*f1) if p is not None or q is not None else (0,dur)
# enforce monotonic
for i in range(1,len(us)):
    if us[i][0] < us[i-1][0]: us[i] = (us[i-1][1], max(us[i][1], us[i-1][1]+0.05))
words = [{'w':units[i][1],'s':round(us[i][0]-SHIFT,3),'e':round(us[i][1]-SHIFT,3)} for i in range(len(units))]
anch = [(0.0,0.0)]
for si,(pa,pb,_) in enumerate(segs):
    xs = [us[i] for i in range(len(units)) if units[i][0]==si]
    anch += [(min(x[0] for x in xs)-SHIFT, pa), (max(x[1] for x in xs)-SHIFT, pb)]
end_a = anch[-1][0] + 2.0; anch.append((end_a, TOTAL))
clean = [anch[0]]
for a,p in anch[1:]:
    if a > clean[-1][0]+0.02 and p > clean[-1][1]: clean.append((a,p))
json.dump({'anch':clean,'words':words,'dur':end_a,'shift':SHIFT}, open('warp.json','w'))
print('matched tokens', matched, '/', len(toks), 'rec words', len(rw))
for si,(pa,pb,t) in enumerate(segs):
    xs=[us[i] for i in range(len(units)) if units[i][0]==si]
    print(f"{min(x[0] for x in xs):6.2f}-{max(x[1] for x in xs):6.2f} | {t}")
print('video duration', round(end_a,2))
