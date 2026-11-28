import sys, numpy as np, wave, subprocess, math
import os; _p = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(_p, 'tools')) and _p != '/': _p = os.path.dirname(_p)
sys.path.insert(0, os.path.join(_p, 'tools')); import audio_lib as A
from audio_lib import *
D = 2640 / 60; S.n = int(SR*D); S.rng = np.random.default_rng(1992); S.L = np.zeros(S.n); S.R = np.zeros(S.n); S.AN = [[0,0],[100,100]]
F = lambda f: f/30.
def noise(d): return S.rng.standard_normal(int(d*SR))
def env(d, a=0.2, r=0.3): th = T(d); return np.minimum(1, th/a)*np.minimum(1, np.maximum(0, d-th)/r)
def jet(d, g=0.3, muff=False):
    th = T(d); n = noise(d); s = lp(n, 500 if muff else 1400)*1.4 + bp(n, 2000, 5000)*(0.05 if muff else 0.25) + 0.06*np.sin(2*np.pi*(3100 + 40*np.sin(2*np.pi*0.3*th))*th)*(0 if muff else 1)
    return s*env(d, 0.3, 0.4)*g
def waves(d, g=0.35): th = T(d); return lp(noise(d), 700)*(0.55+0.45*np.sin(2*np.pi*0.35*th)**2)*env(d, 0.3, 0.3)*g*2
def hall(d, g=0.12): th = T(d); return (lp(noise(d), 250)*2 + 0.25*np.sin(2*np.pi*50*th))*env(d, 0.2, 0.2)*g
def cabin(d, g=0.18): return lp(noise(d), 420)*2.2*env(d, 0.15, 0.3)*g
def keytick(g=0.22): th = T(0.03); return hp(S.rng.standard_normal(len(th)), 3000)*np.exp(-th*200)*g
def creak(d=0.9, g=0.4): th = T(d); f = 90 + 40*np.sin(2*np.pi*1.3*th); ph = np.cumsum(f)/SR; s = np.sign(np.sin(2*np.pi*ph))*bp(noise(d), 200, 2500); return bp(s, 150, 3000)*np.sin(np.pi*th/d)*g
def clank(g=0.5): th = T(0.5); return sum(np.sin(2*np.pi*f*th)*np.exp(-th*k) for f, k in [(420, 9), (1130, 12), (2210, 16)])*g/2 + lp(noise(0.5), 3000)*np.exp(-th*40)*g
def chain(d, g=0.25):
    out = np.zeros(int(d*SR))
    for i in range(int(d*14)):
        c = keytick(1.0)[:1300]*0.6 + clank(0.15)[:1300]
        j = int(i/14*SR); out[j:j+len(c)] += c[:len(out)-j]
    return bp(out, 600, 7000)*g
def splash(g=0.7): th = T(1.2); return (bp(noise(1.2), 300, 6000)*np.exp(-th*3.5)*1.2 + lp(noise(1.2), 400)*np.exp(-th*5))*g
def pumpthunk(g=0.5): th = T(0.35); return (np.sin(2*np.pi*(70*np.exp(-th*6)+35)*th)*np.exp(-th*10) + lp(noise(0.35), 900)*np.exp(-th*25)*0.5)*g
def hiss(d, g=0.2): return bp(noise(d), 3000, 9000)*env(d, 0.05, d*0.6)*g
def tear(g=0.8): th = T(0.9); f = 600 - 400*th; s = np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*bp(noise(0.9), 300, 5000); return bp(s, 200, 6000)*np.exp(-th*3)*g
def ding(g=0.35): return np.concatenate([chime(84, g, 0.5)[:int(0.42*SR)], chime(79, g, 1.2)])
def warn(g=0.25): th = T(0.5); return np.sign(np.sin(2*np.pi*440*th))*0.3*bp(np.ones(len(th)), 300, 3000)*0 + np.sin(2*np.pi*440*th)*(np.sin(2*np.pi*8*th) > 0)*np.minimum(1, (0.5-th)*30)*g
def rewind(d, g=0.6): th = T(d); f = 2200-1600*(th/d); ph = np.cumsum(f)/SR; s = np.sign(np.sin(2*np.pi*ph))*0.3 + bp(noise(d), 1500, 6000)*0.6; return s*np.sin(np.pi*th/d)**0.7*g
def shatter(d=1.0, g=0.8, dens=60):
    out = np.zeros(int(d*SR)); th = T(d)
    for k in range(int(dens*d)):
        t0 = (S.rng.random()**1.8)*d*0.8; L = int(SR*(0.01+S.rng.random()*0.05)); j = int(t0*SR)
        if j+L >= len(out): continue
        tt = np.arange(L)/SR; b = bp(S.rng.standard_normal(L), 2500, 11000)*np.exp(-tt*120)*(0.4+S.rng.random())
        f = 2500+S.rng.random()*5000; b += 0.25*np.sin(2*np.pi*f*tt)*np.exp(-tt*60)
        out[j:j+L] += b*(1-t0/d)
    return out*g + bp(noise(d), 1500, 9000)*np.exp(-th*9)*g*0.8
def zing(d=0.4, g=0.3): th = T(d); f = 1500+5000*(th/d)**2; return np.sin(2*np.pi*np.cumsum(f)/SR)*np.minimum(1, th*20)*np.exp(-np.maximum(0, th-d*0.8)*30)*g
def roar(d, g=0.12): th = T(d); n = noise(d); return (lp(n, 300)*2 + bp(n, 800, 3000)*0.15*(np.abs(np.sin(th*7.3))+0.2))*env(d, 0.2, 0.3)*g
def step(g=0.25): th = T(0.12); return lp(noise(0.12), 900)*np.exp(-th*45)*g + np.sin(2*np.pi*110*th)*np.exp(-th*40)*g*0.5
def boing(d=0.6, g=0.3): th = T(d); return np.sin(2*np.pi*(180+60*np.sin(2*np.pi*9*th))*th)*np.exp(-th*4)*g
def street(d, g=0.12): th = T(d); return (lp(noise(d), 500)*1.6 + bp(noise(d), 1500, 4000)*0.08)*env(d, 0.2, 0.3)*g
def tinkles(d, g=0.18):
    out = np.zeros(int(d*SR))
    for k in range(int(d*40)):
        j = int(S.rng.random()*(len(out)-3000)); tt = np.arange(2400)/SR; f = 3000+S.rng.random()*6000
        out[j:j+2400] += np.sin(2*np.pi*f*tt)*np.exp(-tt*80)*(0.3+S.rng.random()*0.7)
    return out*g
def rocket(d, g=0.5):
    th = T(d); n = noise(d); crack = (S.rng.random(len(th)) < 0.002) * S.rng.standard_normal(len(th)) * 3
    return (lp(n, 260) * 2.4 + bp(n, 400, 2500) * 0.6 + bp(crack, 800, 6000)) * env(d, 0.08, 0.3) * g
def screech(d=0.8, g=0.4): th = T(d); f = 2400 - 900 * th / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * bp(noise(d), 1500, 5000) * 0.8 * np.exp(-th * 2) * g
def beep(f=1200, d=0.12, g=0.2): th = T(d); return np.sin(2 * np.pi * f * th) * np.minimum(1, (d - th) * 60) * g
def tinnitus(d, g=0.06): th = T(d); return np.sin(2 * np.pi * 3800 * th) * env(d, 0.3, 0.6) * g
def chalk(d=0.5, g=0.18): th = T(d); return bp(noise(d), 2500, 7000) * (np.abs(np.sin(th * 40)) ** 3) * g
def cheer(d=1.6, g=0.12): th = T(d); return bp(noise(d), 300, 3000) * np.sin(np.pi * th / d) * (0.7 + 0.3 * np.sin(th * 11)) * g
def click(g=0.5): th = T(0.06); return hp(noise(0.06), 2000) * np.exp(-th * 140) * g + np.sin(2 * np.pi * 2600 * th) * np.exp(-th * 90) * g * 0.6
def crackle(d, g=0.18, dens=22):
    out = np.zeros(int(d*SR)); th = T(d)
    for k in range(int(d*dens)):
        j = int(S.rng.random()*(len(out)-2000)); L = int(SR*(0.004+S.rng.random()*0.02)); tt = np.arange(L)/SR
        out[j:j+L] += bp(S.rng.standard_normal(L), 1500, 8000)*np.exp(-tt*300)*(0.3+S.rng.random())
    return (out + lp(noise(d), 200)*0.6)*env(d, 0.15, 0.3)*g
def sizzle(d, g=0.15): th = T(d); n = noise(d); pops = (S.rng.random(len(th)) < 0.004)*S.rng.standard_normal(len(th))*2; return (bp(n, 3500, 11000)*(0.7+0.3*np.sin(th*17)) + bp(pops, 2000, 9000))*env(d, 0.1, 0.3)*g
def stoveroar(d, g=0.12): th = T(d); n = noise(d); return (lp(n, 180)*2.6 + bp(n, 300, 900)*0.25*(0.8+0.2*np.sin(th*3.1)))*env(d, 0.3, 0.4)*g
def shovel(g=0.35): th = T(0.55); return (bp(noise(0.55), 1200, 6000)*np.exp(-th*5)*0.8 + crackle(0.55, 0.6, 60))*g
def coal(g=0.3):
    out = np.zeros(int(0.6*SR))
    for k in range(9):
        j = int((k/9)*0.45*SR + S.rng.random()*800); tt = np.arange(1800)/SR; f = 700+S.rng.random()*1500
        out[j:j+1800] += (np.sin(2*np.pi*f*tt)*0.5 + bp(S.rng.standard_normal(1800), 800, 5000))*np.exp(-tt*90)
    return out*g
def whistle(d, g=0.12): th = T(d); f = 1850 + 120*np.minimum(1, th/0.4); return np.sin(2*np.pi*np.cumsum(f)/SR)*(0.85+0.15*np.sin(2*np.pi*6*th))*env(d, 0.25, 0.2)*g + bp(noise(d), 2000, 6000)*env(d, 0.1, 0.2)*g*0.4
def tick(g=0.22): th = T(0.04); return (hp(noise(0.04), 2500)*0.6 + np.sin(2*np.pi*3200*th))*np.exp(-th*160)*g
def pant(d, g=0.18, rate=4.2): th = T(d); return bp(noise(d), 700, 2600)*np.abs(np.sin(np.pi*rate*th))**2*env(d, 0.1, 0.2)*g
def bark(g=0.35): th = T(0.22); f = 520 - 300*th; return np.tanh(3*np.sin(2*np.pi*np.cumsum(f)/SR))*bp(np.ones(len(th)), 300, 3000)*0 + np.tanh(2.5*np.sin(2*np.pi*np.cumsum(f)/SR))*np.exp(-th*14)*g*0.6 + bp(noise(0.22), 600, 3000)*np.exp(-th*18)*g*0.5
def clank(g=0.5): th = T(0.5); return sum(np.sin(2*np.pi*f*th)*np.exp(-th*k) for f, k in [(320, 8), (870, 11), (1830, 15)])*g/2 + lp(noise(0.5), 2500)*np.exp(-th*40)*g
def steamhiss(d, g=0.2): th = T(d); return bp(noise(d), 2500, 9000)*np.exp(-th*(2.5/d))*np.minimum(1, th*40)*g
def crack(g=0.25): th = T(0.08); return bp(noise(0.08), 1500, 7000)*np.exp(-th*90)*g
def birds(d, g=0.06):
    out = np.zeros(int(d*SR))
    for k in range(int(d*2.2)):
        j = int(S.rng.random()*(len(out)-9000)); L = int(SR*(0.08+S.rng.random()*0.1)); tt = np.arange(L)/SR; f0 = 2600+S.rng.random()*1800
        out[j:j+L] += np.sin(2*np.pi*np.cumsum(f0+900*np.sin(2*np.pi*(14+S.rng.random()*10)*tt))/SR)*np.sin(np.pi*tt/tt[-1])*(0.4+0.6*S.rng.random())
    return out*g
def roomtone(d, g=0.05): return lp(noise(d), 300)*2*env(d, 0.3, 0.3)*g
def crickets(d, g=0.05): th = T(d); return np.sin(2*np.pi*4300*th)*(np.sin(2*np.pi*28*th) > 0.3)*(np.sin(2*np.pi*0.9*th) > -0.2)*env(d, 0.3, 0.3)*g
def snore(d, g=0.16, rate=0.42):
    th = T(d); ph = (th*rate) % 1; m = np.where(ph < 0.55, np.sin(np.pi*ph/0.55), 0)
    return (lp(noise(d), 260)*1.6 + 0.4*np.sign(np.sin(2*np.pi*55*th))*lp(noise(d), 600))*m*g
def flip(g=0.22): th = T(0.25); return bp(noise(0.25), 1500, 7000)*np.exp(-th*18)*g + bp(noise(0.25), 400, 1500)*np.exp(-th*30)*g*0.5
def swipe(g=0.3): th = T(0.3); return bp(noise(0.3), 500, 4000)*np.sin(np.pi*th/0.3)**2*g
def clink(g=0.3): th = T(0.6); return sum(np.sin(2*np.pi*f*th)*np.exp(-th*k) for f, k in [(2300, 9), (3900, 14), (5200, 18)])*g/2
def slap(g=0.4): th = T(0.12); return bp(noise(0.12), 600, 5000)*np.exp(-th*60)*g + np.sin(2*np.pi*180*th)*np.exp(-th*50)*g*0.6
def warble(d, g=0.18): th = T(d); f = 500+260*np.sin(2*np.pi*3.2*th) - 200*th/d; return np.sin(2*np.pi*np.cumsum(f)/SR)*env(d, 0.05, 0.3)*g
def snip(g=0.25): th = T(0.09); return (hp(noise(0.09), 3500)*np.exp(-th*70) + np.sin(2*np.pi*3200*th)*np.exp(-th*80)*0.4)*g
def cupclk(g=0.2): th = T(0.12); return (bp(noise(0.12), 1200, 6000)*np.exp(-th*60) + np.sin(2*np.pi*(900+300*S.rng.random())*th)*np.exp(-th*50)*0.5)*g
def rattle(d, g=0.08): th = T(d); return bp(noise(d), 1500, 6000)*(0.5+0.5*np.abs(np.sin(th*31)))*env(d, 0.1, 0.2)*g
def rustle(d, g=0.08): th = T(d); return bp(noise(d), 2000, 8000)*(0.5+0.5*np.abs(np.sin(th*9)))*env(d, 0.2, 0.3)*g
def kaching(g=0.3): return np.concatenate([np.zeros(int(0.0*SR)), chime(96, g, 0.9)]) + np.pad(clank(g*0.5), (0, 0))[:int(0.9*SR)] if False else chime(96, g, 0.9)
def tick2(g=0.12): th = T(0.05); return hp(noise(0.05), 2500)*np.exp(-th*160)*g
def printer(d, g=0.06): th = T(d); return bp(noise(d), 800, 4000)*(0.55+0.45*np.abs(np.sin(2*np.pi*7*th)))*env(d, 0.1, 0.2)*g*2
def snare_roll(d, g=0.12): th = T(d); return hp(noise(d), 1500)*(0.6+0.4*np.abs(np.sin(2*np.pi*22*th)))*np.linspace(0.4, 1.0, len(th))*env(d, 0.05, 0.05)*g
def dong(g=0.2): th = T(1.4); return (np.sin(2*np.pi*392*th) + 0.6*np.sin(2*np.pi*784*th) + 0.3*np.sin(2*np.pi*1176*th))*np.exp(-th*2.5)*g
def fanfare(t0, g=0.14):
    for k, n in enumerate([72, 76, 79, 84]): add(chime(n, g, 0.5), t0 + k * 0.11, actual=True)
# ---- Count Rumford's fireplace: soft SFX on every action (the voice leads) ----
def water(d, g=0.06): th = T(d); return bp(noise(d), 200, 1800)*(0.5+0.5*np.abs(np.sin(th*1.3))*np.abs(np.sin(th*0.5+1)))*env(d, 0.3, 0.4)*g
def fire(d, g=0.05): return crackle(d, g, 26) + stoveroar(d, g * 0.6)
def cough(g=0.07): th = T(0.16); return bp(noise(0.16), 300, 2200)*np.exp(-th*22)*g + np.sin(2*np.pi*150*th)*np.exp(-th*30)*g*0.4
def scratch(d, g=0.05): th = T(d); return bp(noise(d), 3000, 8000)*(0.4+0.6*np.abs(np.sin(th*23))**2)*env(d, 0.05, 0.1)*g
def hum(d, g=0.05): th = T(d); return (np.sin(2*np.pi*110*th) + 0.5*np.sin(2*np.pi*165*th))*env(d, 0.4, 0.5)*g
WH = [237, 593, 1110, 1866, 2148, 2267, 2377]
for k, f in enumerate(WH): add(whoosh(0.3 + (k % 2) * 0.06, 0.3 + (k % 3) * 0.03), f / 60 - 0.18, actual=True)
# hook: the blazing Rumford fire
add(fire(3.95, 0.06), 0.0, actual=True)
# 1796: big smoky hearth, three coughs, the lady coughs twice
add(fire(5.9, 0.04), 3.95, actual=True); add(roomtone(5.9, 0.05), 3.95, actual=True)
for k in range(3): add(cough(0.07), (287 + k * 10) / 60, actual=True)
for k in range(2): add(cough(0.06), (501 + k * 9) / 60, actual=True)
add(pop(0.12), (237 + 120) / 60, actual=True)
# the squeeze: five trowel strikes, the lightbulb, the walls swinging out
add(fire(4.8, 0.05), 9.88, actual=True)
for h in [648, 676, 704, 732, 760]: add(clank(0.12), h / 60, actual=True); add(crack(0.16), h / 60, actual=True)
add(ding(0.2), 768 / 60, actual=True); add(creak(1.2, 0.06), 785 / 60, actual=True)
# "sounds backwards": the question mark
add(pop(0.16), 931 / 60, actual=True)
# the cutaway: warm hum, rays, hot air up the flue, the throat
add(hum(6.8, 0.03), 18.5, actual=True); add(fire(13.0, 0.04), 18.5, actual=True); add(shing(0.12), (1110 + 20) / 60, actual=True)
add(whoosh(0.5, 0.12), 1316 / 60, actual=True); add(shing(0.1), 1525 / 60, actual=True); add(whoosh(0.45, 0.12), 1712 / 60, actual=True)
# London street: hammers, windows lighting up
add(street(4.7, 0.03), 31.1, actual=True)
for i in range(2):
    for k in range(6): add(thump(0.12 if i else 0.14), (1866 + 74 + i * 12 + k * 28 + 17) / 60, actual=True)
add(tinkles(3.5, 0.03), 31.6, actual=True)
# Jane Austen: candle, quill scratching
add(roomtone(2.0, 0.05), 35.8, actual=True); add(scratch(1.1, 0.05), 35.85, actual=True); add(flip(0.1), 37.0, actual=True)
# today: fire, the kid
add(fire(1.85, 0.05), 37.78, actual=True); add(pop(0.14), (2267 + 10) / 60, actual=True)
# payoff: wink, heart
add(fire(4.4, 0.05), 39.62, actual=True); add(ding(0.18), (2377 + 55) / 60, actual=True); add(pop(0.16), (2377 + 50) / 60, actual=True)
music_rich([62,65,69,74, 58,62,65,70, 60,64,67,72, 57,61,64,69], 0.0, D, quiet=[(17.4, 18.6), (39.5, 39.9)], bpm=104, g=0.08)
# ---- voice + duck + master ----
subprocess.run(['ffmpeg','-v','error','-y','-i','/home/claude/shorts/rumford/audio/voice.mp3','-t','44.0','-ac','1','-ar',str(SR),'-af','highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-1.5','vo.wav'],check=True)
wv = wave.open('vo.wav'); v = np.frombuffer(wv.readframes(wv.getnframes()),np.int16)/32768.; vv = np.zeros(S.n); vv[:min(S.n,len(v))] = v[:S.n]
envv = np.convolve(np.abs(vv),np.ones(int(0.15*SR))/int(0.15*SR),'same'); duck = 1-0.6*np.clip(envv/0.05,0,1)
bg = np.stack([S.L*duck,S.R*duck],1); bg = np.tanh(bg*1.3)/np.tanh(1.3); bg /= np.max(np.abs(bg))*1.12
mix = bg*0.3+np.stack([vv,vv],1); mix /= max(1.0,np.max(np.abs(mix))*1.02)
w = wave.open('mix_raw.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i','mix_raw.wav','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar','48000','final_mix.wav'],check=True); print('ok')
