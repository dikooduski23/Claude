# The Ice King: voice + music + ambience + SFX -> final_mix.wav (loudnorm to -14 LUFS happens when base.mp4 is composed)
import wave, numpy as np
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 35.6; n = int(SR * DUR); rng = np.random.default_rng(1806)
with wave.open('voice_loop.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768; ch = w.getnchannels()
v = v.reshape(-1, ch).mean(1) if ch > 1 else v
L = np.zeros(n); R = np.zeros(n)
bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f, o=2: sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f, o=2: sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
T = lambda d: np.arange(int(d * SR)) / SR
F = lambda f: f / 60.0
def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= n or t < 0: return
    s = sig[:n - i] * g; L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
th = np.arange(n) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=0.6, g=0.25):
    t = T(d); f = note(m); return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 7) * g
# ---------------- music: bouncy 6/8 shanty in G major, minor turn for the melt + prison, royal build at the end ----------------
beat = 60 / 132
major = [67, 71, 74, 71, 72, 76, 74, 71, 69, 72, 74, 72]; minor = [67, 70, 74, 70, 69, 72, 70, 67, 65, 69, 70, 69]
mus = np.zeros(n)
for k in range(int(DUR / beat)):
    t0 = k * beat; sad = 9.3 <= t0 < 17.5; m = (minor if sad else major)[k % 12] - (12 if sad else 0) + (5 if t0 > 31.5 else 0)
    s = pluck(m, 0.5, 0.2); i = int(t0 * SR); mus[i:i + len(s)] += s[:max(0, n - i)]
    if k % 3 == 0: b = pluck((43 if not sad else 43) + (5 if t0 > 31.5 else 0), 0.7, 0.32); mus[i:i + len(b)] += b[:max(0, n - i)]
env = np.interp(th, [0, 9.2, 9.4, 15.7, 15.8, 17.4, 17.6, 26.0, 26.2, 31.5, 31.7, 35.6], [0.85, 0.85, 0.6, 0.6, 0.15, 0.15, 0.75, 0.75, 1.0, 1.0, 1.15, 1.15])
add(mus * env * 0.5, 0)
# ---------------- ambience ----------------
def seg(a, b, sig_fn, g, pan=0.0):
    d = b - a; s = sig_fn(int(d * SR)); fade = np.minimum(1, np.minimum(np.arange(len(s)) / (0.15 * SR), (len(s) - np.arange(len(s))) / (0.15 * SR))); add(s * fade, a, g, pan)
wind = lambda m: bp(rng.standard_normal(m), 200, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(m) / SR / 3.1))
waves = lambda m: lp(rng.standard_normal(m), 600) * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(m) / SR / 4.2))
crowd = lambda m: bp(rng.standard_normal(m), 300, 2500) * (0.7 + 0.3 * np.sin(2 * np.pi * np.arange(m) / SR * 1.7))
for a, b in [(0, F(555)), (F(1895), DUR)]: seg(a, b, wind, 0.09)
for a, b in [(F(555), F(760)), (F(1560), F(1700))]: seg(a, b, waves, 0.1)
seg(F(1700), F(1895), crowd, 0.08); seg(F(1560), F(1700), crowd, 0.07)
saw = lambda m: (np.sin(2 * np.pi * 1450 * np.arange(m) / SR + 3 * np.sin(2 * np.pi * 6 * np.arange(m) / SR)) * 0.3 + hp(rng.standard_normal(m), 3000) * 0.4) * (0.5 + 0.5 * np.sin(2 * np.pi * np.arange(m) / SR / 2.4) ** 2)
seg(F(1050), F(1310), saw, 0.05)
# ---------------- SFX (own bus, so its level is set separately) ----------------
BL, BR = L.copy(), R.copy(); L[:] = 0; R[:] = 0
whoosh = lambda d=0.45: bp(rng.standard_normal(int(d * SR)), 300, 3500) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2
boom = lambda: (np.sin(2 * np.pi * (70 - 30 * T(0.7)) * T(0.7)) * np.exp(-T(0.7) * 5) + lp(rng.standard_normal(int(0.7 * SR)), 300) * np.exp(-T(0.7) * 8) * 0.6)
for i, (c, kind) in enumerate([(160, 'w'), (305, 'w'), (555, 'w'), (760, 'z'), (1050, 'w'), (1310, 'f'), (1560, 'w'), (1700, 'w'), (1895, 'z'), (2040, 'w')]):
    t = F(c)
    if kind == 'w': add(whoosh(), t - 0.22, 0.6, -0.4 if i % 2 else 0.4)
    elif kind == 'z': add(whoosh(0.35), t - 0.2, 0.5); add(boom(), t, 0.7)
    else: add(bp(rng.standard_normal(int(0.8 * SR)), 2000, 8000) * np.sin(np.linspace(0, np.pi, int(0.8 * SR))) ** 2, t - 0.4, 0.25)
creak = lambda: bp(np.sign(np.sin(2 * np.pi * (180 + 60 * np.sin(2 * np.pi * 2 * T(0.6))) * T(0.6))), 300, 1600) * np.exp(-T(0.6) * 3) * 0.4
for t in [0.15, 1.5, 2.9]: add(creak(), t, 0.45, 0.3)
add(hp(rng.standard_normal(int(0.4 * SR)), 2500) * np.exp(-T(0.4) * 9), 5.1, 0.35)          # newspaper rustle
drip = lambda: np.sin(2 * np.pi * (1800 - 1200 * T(0.08)) * T(0.08)) * np.exp(-T(0.08) * 40)
for t in np.arange(10.7, 12.6, 0.38): add(drip(), t, 0.4, 0.2)
clang = sum(np.sin(2 * np.pi * f * T(1.4)) * np.exp(-T(1.4) * k) for f, k in [(220, 3), (331, 4), (520, 6), (787, 8)]) * 0.35; add(clang, F(760), 0.7)
wah = sum(pluck(m, 0.55, 0.3) for m in [55]) ; [add(np.sin(2 * np.pi * note(m) * T(0.5)) * np.exp(-T(0.5) * 2) * 0.25 * (np.sin(2 * np.pi * 5 * T(0.5)) * 0.3 + 0.7), 13.1 + k * 0.45, 0.5) for k, m in enumerate([58, 57, 56, 55])]
pop = lambda g=0.5: np.sin(2 * np.pi * (900 - 5000 * T(0.12)) * T(0.12)) * np.exp(-T(0.12) * 35) * g
for f0 in [600, 960, 1590, 1740]: add(pop(), F(f0), 0.55)
ding = (np.sin(2 * np.pi * 1320 * T(1.2)) + 0.5 * np.sin(2 * np.pi * 2640 * T(1.2))) * np.exp(-T(1.2) * 3.5); add(ding, F(1262), 0.35)
chime = lambda f: (np.sin(2 * np.pi * f * T(1.2)) + 0.4 * np.sin(2 * np.pi * f * 2.01 * T(1.2))) * np.exp(-T(1.2) * 3)
for f0, fr in [(1395, 880), (1452, 990), (1462, 660)]: add(chime(fr), F(f0), 0.16)
add(hp(rng.standard_normal(int(1.0 * SR)), 3500) * np.sin(np.linspace(0, np.pi, int(1.0 * SR))) * 0.3, 25.0, 0.4)    # heat fizz bouncing off
cheer = lambda d: bp(rng.standard_normal(int(d * SR)), 400, 3000) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 0.7
add(cheer(1.8), 26.3, 0.22); add(cheer(2.2), 28.5, 0.2)
coin = (np.sin(2 * np.pi * 2093 * T(0.5)) + np.sin(2 * np.pi * 2637 * T(0.5))) * np.exp(-T(0.5) * 6) * 0.3; add(coin, F(1930), 0.5)
fan = sum(pluck(m, 1.4, 0.3) for m in [67, 71, 74, 79]); add(fan, F(1895), 0.8); add(fan, F(1895) + 0.45, 0.6)
FXL, FXR = L.copy(), R.copy(); L, R = BL, BR
# ---------------- voice on top, bed ducked under speech ----------------
vv = np.zeros(n); vv[:min(n, len(v))] = v[:n]
# carve the voice band (1-4 kHz) out of the bed so words cut through
def dip(x): return x - 0.6 * bp(x, 1000, 4000)
L = dip(L); R = dip(R)
envv = np.convolve(np.abs(vv), np.ones(2205) / 2205, 'same'); sp = np.clip(envv / (envv.max() * 0.2), 0, 1)
duck = 1 - 0.7 * sp; L *= duck; R *= duck
# set the bed level: BED_DB below the voice while he speaks (rule: 20 dB+)
BED_DB = 22
rms = lambda x: np.sqrt(np.mean(x ** 2)) + 1e-9
mask = sp > 0.5; g = rms(vv[mask]) / rms(((L + R) / 2)[mask]) * 10 ** (-BED_DB / 20)
L *= g; R *= g
# SFX bus: soften hiss (low-pass 5 kHz), duck 50% under speech, peaks capped at SFX_PEAK x voice peak
FXL = lp(FXL, 5000) * (1 - 0.5 * sp); FXR = lp(FXR, 5000) * (1 - 0.5 * sp)
SFX_PEAK = 0.16
gs = SFX_PEAK * np.abs(vv).max() / max(1e-9, np.abs(np.stack([FXL, FXR])).max())
L += FXL * gs + vv; R += FXR * gs + vv
print('sfx gain', round(float(gs), 3))
print('bed gain', round(float(g), 3))
m = np.stack([L, R], 1); m /= max(1e-6, np.abs(m).max()) / 0.89
with wave.open('final_mix.wav', 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes())
print('ok final_mix.wav', DUR)
