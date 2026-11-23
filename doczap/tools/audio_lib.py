import os, re as _re2, numpy as np, json, wave, subprocess, sys
from scipy.signal import butter, sosfilt
SR = 44100
class A: pass
S = A()
def init(N):
    S.N = N
    S.WJ = json.load(open(f'warp_ep{N}.json')); S.AN = S.WJ['anch']; S.DUR = S.WJ['dur']+0.05; S.n = int(SR*S.DUR)
    plan = json.load(open(f'ep{N}_plan.json')); S.words = plan['words']; S.scenes = plan['scenes']
    S.rng = np.random.default_rng(sum(map(ord,str(N)))*7+1)
    S.L = np.zeros(S.n); S.R = np.zeros(S.n)
def inv(p):
    AN = S.AN
    for i in range(1, len(AN)):
        if p <= AN[i][1]:
            a0,p0 = AN[i-1]; a1,p1 = AN[i]; return a0+(a1-a0)*(p-p0)/(p1-p0)
    return AN[-1][0]+(p-AN[-1][1])
def fwd(a):
    AN = S.AN
    for i in range(1, len(AN)):
        if a <= AN[i][0]:
            a0,p0 = AN[i-1]; a1,p1 = AN[i]; return p0+(p1-p0)*(a-a0)/(a1-a0)
    return AN[-1][1]+(a-AN[-1][0])
norm = lambda w: ''.join(c for c in w.lower() if c.isalnum())
def wt(w, after=0):
    w = norm(w)
    for x in S.words:
        if x['s'] >= after and norm(x['w']) == w: return x['s']
    raise SystemExit('missing word '+w)
bp = lambda x,lo,hi,o=2: sosfilt(butter(o,[lo,hi],btype='band',fs=SR,output='sos'),x)
lp = lambda x,f,o=2: sosfilt(butter(o,f,btype='low',fs=SR,output='sos'),x)
hp = lambda x,f,o=2: sosfilt(butter(o,f,btype='high',fs=SR,output='sos'),x)
T = lambda d: np.arange(int(d*SR))/SR
def add(sig, t, g=1.0, pan=0.0, actual=False):
    i = int((t if actual else inv(t))*SR); n = min(len(sig), S.n-i)
    if n <= 0 or i < 0: return
    S.L[i:i+n] += sig[:n]*g*(1-max(0,pan)); S.R[i:i+n] += sig[:n]*g*(1+min(0,pan))
def pluck(f, d=0.9):
    n = int(d*SR); p = max(2,int(SR/f)); buf = S.rng.uniform(-1,1,p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i%p]; buf[i%p] = 0.5*(buf[i%p]+buf[(i+1)%p])*0.996
    return out
note = lambda m: 440*2**((m-69)/12)
def pop(g=0.5): th=T(0.12); return np.sin(2*np.pi*(900-5000*th)*th)*np.exp(-th*35)*g
def whoosh(d=0.35,g=0.4): n=int(d*SR); return bp(S.rng.standard_normal(n),400,3000)*np.sin(np.linspace(0,np.pi,n))**2*g
def thump(g=1.0): th=T(0.5); return (np.sin(2*np.pi*(80-60*th)*th)*np.exp(-th*9)+lp(S.rng.standard_normal(len(th)),200)*np.exp(-th*12)*0.5)*g
def chime(m,g=0.4,d=1.4): th=T(d); f=note(m); return (np.sin(2*np.pi*f*th)+0.4*np.sin(2*np.pi*f*2.01*th)+0.2*np.sin(2*np.pi*f*3.02*th))*np.exp(-th*3)*g
def shing(g=0.5): th=T(1.0); return sum(np.sin(2*np.pi*f*th)*np.exp(-th*k) for f,k in [(2650,3),(3970,4),(5310,6)])*g*0.4+hp(S.rng.standard_normal(len(th)),4000)*np.exp(-th*30)*g*0.3
def squish(g=0.8): th=T(0.6); return np.sin(2*np.pi*(140+60*np.sin(2*np.pi*9*th))*th)*np.exp(-th*4)*g
def buzzer(g=0.35): th=T(0.7); s=np.sign(np.sin(2*np.pi*220*th))*0.6+np.sign(np.sin(2*np.pi*233*th))*0.4; return lp(s,2500)*(th<0.65)*g
def boom(g=1.0): th=T(2.5); return (lp(S.rng.standard_normal(len(th)),150,3)*5*np.exp(-th*1.5)+np.sin(2*np.pi*45*th)*np.exp(-th*2))*g
def riser(d,g=0.3): th=T(max(0.1,d)); return np.sin(2*np.pi*(200*th+300*th**2/max(0.1,d)))*(th/max(0.1,d))**2*g + bp(S.rng.standard_normal(len(th)),1000,6000)*(th/max(0.1,d))**3*g*0.6
def gulp(g=0.7): th=T(0.35); return np.sin(2*np.pi*(180-120*th)*th)*np.exp(-th*12)*g
def scratch(g=0.6): th=T(0.5); return bp(S.rng.standard_normal(len(th)),800,5000)*np.sin(2*np.pi*(14-20*th)*th)*np.exp(-th*4)*g
def zap(d=0.35,g=1.0):
    n=int(d*SR); x=S.rng.standard_normal(n); gate=(S.rng.uniform(0,1,n//200+1)>0.45).repeat(200)[:n]
    e=np.exp(-np.arange(n)/(d*0.6*SR)); return (bp(x*gate,1500,7000)*e*0.8+np.sign(np.sin(2*np.pi*120*np.arange(n)/SR))*0.25*e)*g
def heartbeat(g=0.8): th=T(0.25); s=np.sin(2*np.pi*55*th)*np.exp(-th*18); out=np.zeros(int(0.5*SR)); out[:len(s)]+=s; out[int(0.22*SR):int(0.22*SR)+len(s)]+=s*0.7; return out*g
def ring(g=0.4): th=T(1.2); return np.sin(2*np.pi*1400*th)*np.sign(np.sin(2*np.pi*20*th)).clip(0,1)*(th<1.0)*g*0.6
def thunder(g=1.0): n=int(2.8*SR); return (lp(S.rng.standard_normal(n),180,3)*6*np.exp(-np.arange(n)/SR*0.9)+hp(S.rng.standard_normal(n),2000)*np.exp(-np.arange(n)/SR*8)*0.5)*g
def gasp(g=0.5): n=int(0.8*SR); return bp(S.rng.standard_normal(n),600,2500)*np.sin(np.linspace(0,np.pi,n))**1.5*g
def chord(t0, notes, g=0.3, step=0.08):
    for i,m in enumerate(notes): add(chime(m,g), t0+i*step)
def music(pattern, start_p, end_p, quiet=(), bpm=104, g=0.13, drone=(55,82.4)):
    t = np.arange(S.n)/SR
    bed = (np.sin(2*np.pi*drone[0]*t)*0.45+np.sin(2*np.pi*drone[1]*t)*0.3)*(0.7+0.3*np.sin(2*np.pi*0.12*t))*0.08 + lp(S.rng.standard_normal(S.n),260)*0.03
    S.L += bed; S.R += bed
    beat = 60/bpm/2; tt = inv(start_p); k = 0; cache = {}
    while fwd(tt) < end_p:
        pl = fwd(tt)
        if not any(a < pl < b for a,b in quiet):
            m = pattern[k % len(pattern)]
            if m not in cache: cache[m] = pluck(note(m), 0.7)
            add(cache[m], tt, g, pan=0.3 if k%2 else -0.3, actual=True)
            if k % 8 == 0:
                if ('b',m) not in cache: cache[('b',m)] = pluck(note(m-24), 1.2)
                add(cache[('b',m)], tt, g*1.9, actual=True)
        tt += beat; k += 1
def whooshes():
    for c in S.scenes[1:]: add(whoosh(0.35,0.35), c-0.15)
def cta_jingle():
    TF = wt('follow')
    for i,m in enumerate([72,76,79,84]): add(pluck(note(m),0.7), TF+i*0.13, 0.3)
    add(pop(0.6), TF); add(pop(0.6), wt('comment'))
def finish(VO):
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(S.WJ['shift']),'-i',VO,'-ac','1','-ar',str(SR),'-af','highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-1.5',f'vo44_{S.N}.wav'],check=True)
    wv = wave.open(f'vo44_{S.N}.wav'); v = np.frombuffer(wv.readframes(wv.getnframes()),np.int16)/32768.; vv = np.zeros(S.n); vv[:min(S.n,len(v))] = v[:S.n]
    envv = np.convolve(np.abs(vv),np.ones(int(0.15*SR))/int(0.15*SR),'same'); duck = 1-0.45*np.clip(envv/0.05,0,1)
    bg = np.stack([S.L*duck,S.R*duck],1); bg = np.tanh(bg*1.3)/np.tanh(1.3); bg /= np.max(np.abs(bg))*1.12
    mix = bg*0.42+np.stack([vv,vv],1); mix /= max(1.0,np.max(np.abs(mix))*1.02)
    fade = int(0.6*SR); mix[-fade:] *= np.linspace(1,0,fade)[:,None]
    w = wave.open(f'final_mix_ep{S.N}.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
    import re as _re
    _n=int(_re.match(r'\d+',str(S.N)).group())
    if _n>=12 or __import__('os').environ.get('NEWSTYLE'):
        subprocess.run(['ffmpeg','-v','error','-y','-i',f'final_mix_ep{S.N}.wav','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar',str(SR),f'final_mix_ep{S.N}_n.wav'],check=True)
        import os; os.replace(f'final_mix_ep{S.N}_n.wav',f'final_mix_ep{S.N}.wav')
    print('audio ok', S.DUR)

def music_rich(pattern, start_p, end_p, quiet=(), bpm=100, g=0.12, drone=(55,82.4)):
    """Doc Zap 2.0 music: plucks + warm chord pads + soft beat."""
    music(pattern, start_p, end_p, quiet=quiet, bpm=bpm, g=g*0.85, drone=drone)
    beat = 60/bpm; bar = beat*4
    groups = [pattern[i:i+4] for i in range(0, len(pattern), 4)]
    def pad(notes, d):
        th = T(d); s = np.zeros(len(th))
        for m in notes[:3]:
            f = note(m-12)
            for det in (-0.12, 0.0, 0.12):
                ff = f*2**(det/12)
                for h in range(1, 6): s += np.sin(2*np.pi*ff*h*th + h)/h
        s = lp(s, 1400); env = np.minimum(1, th/0.6)*np.minimum(1, (d-th)/0.5)
        return s*env/np.max(np.abs(s)+1e-9)
    def kick():
        th = T(0.35); return np.sin(2*np.pi*(110*np.exp(-th*18)+40)*th)*np.exp(-th*9)
    def hat():
        th = T(0.06); return hp(S.rng.standard_normal(len(th)), 7000)*np.exp(-th*60)
    def clap():
        th = T(0.18); return bp(S.rng.standard_normal(len(th)), 1200, 3500)*np.exp(-th*22)
    K, Hh, C = kick(), hat(), clap()
    tt = inv(start_p); b = 0
    while fwd(tt) < end_p:
        pl = fwd(tt); q = any(a < pl < c for a,c in quiet)
        if not q:
            add(pad(groups[b % len(groups)], bar+0.6), tt, g*0.9, actual=True)
            for k in range(8):
                t8 = tt + k*beat/2
                if fwd(t8) >= end_p: break
                if k in (0, 4): add(K, t8, g*1.6, actual=True)
                if k in (2, 6): add(C, t8, g*0.5, actual=True)
                add(Hh, t8, g*(0.35 if k % 2 else 0.2), pan=0.3, actual=True)
        tt += bar; b += 1
