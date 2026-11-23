# Hannibal's snake pots: voice + music bed + SFX -> final_mix.wav (loudnorm to -14 LUFS happens in compose_plates.py)
import wave, numpy as np
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 41.1; n = int(SR * DUR); rng = np.random.default_rng(184)
with wave.open('voice_loop.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768; ch = w.getnchannels(); vsr = w.getframerate()
v = v.reshape(-1, ch).mean(1) if ch > 1 else v
assert vsr == SR, vsr
L = np.zeros(n); R = np.zeros(n)
bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f, o=2: sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f, o=2: sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
T = lambda d: np.arange(int(d * SR)) / SR
F = lambda f: f / 60.0
def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= n: return
    s = sig[:n - i] * g; L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
# ---------------- music: D-dorian lyre plucks over a drone, 100 bpm ----------------
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=0.9, g=0.25):
    t = T(d); f = note(m); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 4.5) * g
beat = 60 / 100; pat = [62, 69, 65, 69, 64, 69, 65, 67]
env = np.interp(np.arange(n) / SR, [0, 2.3, 4.5, 16.9, 17.1, 19.5, 19.7, 26.6, 26.8, 33.2, 33.8, 38.3, 38.9, 41.1], [0.7, 0.8, 1.0, 1.0, 0.15, 0.15, 0.6, 0.6, 1.15, 1.15, 0.55, 0.55, 0.9, 0.9])
mus = np.zeros(n)
for k in range(int(DUR / (beat / 2))):
    t0 = k * beat / 2; m = pat[k % len(pat)] + (5 if (k // 16) % 2 else 0) * (1 if t0 > 26.7 and t0 < 33.2 else 0); s = pluck(m, 0.8, 0.22); i = int(t0 * SR); mus[i:i + len(s)] += s[:max(0, n - i)]
th = np.arange(n) / SR; drone = (np.sin(2 * np.pi * 73.4 * th) + 0.6 * np.sin(2 * np.pi * 110 * th) + 0.3 * np.sin(2 * np.pi * 146.8 * th)) * 0.09
for k in range(int(DUR / beat)):   # frame drum on beats 1 and 3
    if k % 2: continue
    t0 = k * beat; d = (np.sin(2 * np.pi * (95 - 50 * T(0.3)) * T(0.3)) * np.exp(-T(0.3) * 14)) * 0.35; i = int(t0 * SR); mus[i:i + len(d)] += d[:max(0, n - i)]
mus = (mus + drone) * env * 0.42; add(mus, 0)
# ---------------- ambience ----------------
sea = lp(rng.standard_normal(n), 500) * 0.06 * (0.7 + 0.3 * np.sin(2 * np.pi * th / 4.3)); seamask = np.ones(n)
for a, b in [(F(270), F(545)), (F(1172), F(1600)), (F(2025), F(2330))]: seamask[int(a * SR):int(b * SR)] = 0.0 if (a, b) != (F(270), F(545)) else 0.5
add(sea * seamask, 0, 1.0)
for t in np.sort(rng.uniform(F(1172), F(1600), 70)): c = bp(rng.standard_normal(int(0.02 * SR)), 1500, 7000) * np.exp(-T(0.02) * 220); add(c, t, rng.uniform(0.06, 0.25), rng.uniform(-0.6, 0.6))   # campfire
fire = lp(rng.standard_normal(int((F(1600) - F(1172)) * SR)), 300) * 0.08; add(fire, F(1172))
# ---------------- SFX ----------------
whoosh = lambda d=0.45, g=0.5: bp(rng.standard_normal(int(d * SR)), 300, 3500) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2 * g
for i, w in enumerate([138, 270, 545, 764, 1172, 1600, 1850, 2025, 2330]): add(whoosh(), F(w - 14), 0.55, -0.4 if i % 2 else 0.4)
spin = bp(rng.standard_normal(int(2.2 * SR)), 200, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.2 * T(2.2))) * np.linspace(0.2, 1, int(2.2 * SR)) ** 2; add(spin, 0.05, 0.12)
def smash(g=1.0):
    t = T(0.9); thud = np.sin(2 * np.pi * (140 - 80 * t) * t) * np.exp(-t * 16); crack = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 18)
    tink = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (9 + k)) * (t > 0.04 * k) for k, f in enumerate([2400, 3100, 3900, 2750])) * 0.08; return (thud * 0.8 + crack * 0.6 + tink) * g
for (p, f0), pan in zip([(0, 778), (0, 806), (0, 838)], [-0.2, 0.3, -0.35]): add(smash(), F(f0), 0.8, pan)
hiss = lambda d=0.8, g=0.3: hp(rng.standard_normal(int(d * SR)), 4500) * np.minimum(1, np.linspace(0, 6, int(d * SR))) * np.exp(-np.linspace(0, 3, int(d * SR))) * g
for t, g, pan in [(17.6, 0.4, -0.3), (18.4, 0.45, 0.3), (18.95, 0.5, 0), (21.6, 0.3, 0.2), (23.4, 0.35, -0.2), (27.0, 0.45, 0.3), (27.8, 0.4, -0.3), (28.9, 0.45, 0.1), (29.6, 0.4, -0.2), (38.5, 0.3, 0)]: add(hiss(), t, g, pan)
stab = lambda: (np.sin(2 * np.pi * 70 * T(0.6)) * np.exp(-T(0.6) * 7) + lp(rng.standard_normal(int(0.6 * SR)), 200) * np.exp(-T(0.6) * 10)) * 0.9
add(stab(), 17.02, 0.7)
pop = lambda g=0.5: np.sin(2 * np.pi * (900 - 5000 * T(0.12)) * T(0.12)) * np.exp(-T(0.12) * 35) * g
for f0 in [708, 720, 1134, 2302]: add(pop(), F(f0), 0.55)
chime = lambda f: (np.sin(2 * np.pi * f * T(1.2)) + 0.4 * np.sin(2 * np.pi * f * 2.01 * T(1.2))) * np.exp(-T(1.2) * 3)
for f0, fr in [(1452, 880), (1466, 660), (1538, 990)]: add(chime(fr), F(f0), 0.16)
add((np.sin(2 * np.pi * 180 * T(0.25)) * np.exp(-T(0.25) * 25)) * 0.6, F(1532), 0.7)    # wax lid lands
for t in np.arange(26.8, 30.8, 0.19): add((np.sin(2 * np.pi * 90 * T(0.12)) * np.exp(-T(0.12) * 30)) * 0.5, t + rng.uniform(-0.03, 0.03), 0.35, rng.uniform(-0.5, 0.5))   # stamping feet
sp = bp(rng.standard_normal(int(1.4 * SR)), 300, 2000) * np.exp(-T(1.4) * 2); add(sp, 30.9, 0.35)   # oars splash away
fan = sum(pluck(m, 1.6, 0.35) for m in [62, 66, 69, 74]); add(fan, F(1905), 0.9)   # victory stab
# ---------------- voice on top, music ducked under speech ----------------
vv = np.zeros(n); vv[:min(n, len(v))] = v[:n]
envv = np.convolve(np.abs(vv), np.ones(2205) / 2205, 'same'); duck = 1 - 0.45 * np.clip(envv / (envv.max() * 0.25), 0, 1)
L *= duck; R *= duck; L += vv * 1.0; R += vv * 1.0
m = np.stack([L, R], 1); m /= max(1e-6, np.abs(m).max()) / 0.89
with wave.open('final_mix.wav', 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes())
print('ok final_mix.wav', DUR)
