# The Leaning Tower: voice + music + ambience + REAL ElevenLabs SFX -> final_mix.wav (loudnorm to -14 LUFS happens when base.mp4 is composed)
# Voice-first (Diyar, Nov 24 2026): bed ~20 dB under the voice, 1-4 kHz dip; SFX on their own bus, low-passed, ducked, peak-capped.
import sys, wave, numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, "../../tools")
from el_sfx import load
SR = 44100; DUR = 36.62; n = int(SR * DUR); rng = np.random.default_rng(1990)
with wave.open('voice_loop.wav') as w:
    v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768; ch = w.getnchannels()
v = v.reshape(-1, ch).mean(1) if ch > 1 else v
L = np.zeros(n); R = np.zeros(n)
bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f, o=2: sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
T = lambda d: np.arange(int(d * SR)) / SR
F = lambda f: f / 60.0
def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= n or t < 0: return
    s = sig[:n - i] * g; L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
def fade(s, a=0.03, b=0.15):
    s = s.copy(); na, nb = int(a * SR), int(b * SR)
    if na: s[:na] *= np.linspace(0, 1, na)
    if nb: s[-nb:] *= np.linspace(1, 0, nb)
    return s
def seg(name, a, b, g, pan=0.0):   # ambience bed between a and b seconds (looped if short)
    s = load(name); m = int((b - a) * SR); s = np.tile(s, m // len(s) + 1)[:m]; add(fade(s, 0.2, 0.25), a, g, pan)
th = np.arange(n) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(m, d=0.6, g=0.25):   # mandolin-ish pluck with a fast tremolo
    t = T(d); f = note(m); s = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.25 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 6)
    return s * (0.75 + 0.25 * np.sin(2 * np.pi * 14 * t)) * g
# ---------------- music: A minor tension (danger), held dusk drone (idea), sparse (mechanism), A major lift (payoff) ----------------
beat = 60 / 112
minor = [69, 72, 76, 72, 71, 74, 77, 74, 69, 72, 76, 79]; major = [69, 73, 76, 73, 74, 78, 81, 78, 76, 80, 83, 80]
mus = np.zeros(n)
for k in range(int(DUR / beat)):
    t0 = k * beat
    if F(1291) <= t0 < F(1730): continue                         # mechanism: let the soil sounds carry it
    seq = major if t0 >= F(1776) else minor; m = seq[k % 12] - (12 if F(876) <= t0 < F(1291) else 0)
    s = pluck(m, 0.45, 0.17); i = int(t0 * SR); mus[i:i + len(s)] += s[:max(0, n - i)]
    if k % 4 == 0: b = pluck((45 if seq is minor else 45) - 12, 0.9, 0.3); mus[i:i + len(b)] += b[:max(0, n - i)]
drone = np.sin(2 * np.pi * note(45) * th) * 0.12 * ((th >= F(876)) & (th < F(1291)))
env = np.interp(th, [0, F(876), F(880), F(1290), F(1291), F(1730), F(1776), DUR], [0.8, 0.8, 0.6, 0.6, 0.0, 0.0, 0.6, 0.75])
add((mus + drone) * env * 0.5, 0)
# ---------------- ambience (real ElevenLabs loops) ----------------
seg('amb_piazza', 0, F(876), 0.5); seg('amb_site_night', F(876), F(1291), 0.5); seg('amb_underground', F(1291), F(1730), 0.45); seg('amb_evening', F(1730), DUR, 0.5)
BL, BR = L.copy(), R.copy(); L[:] = 0; R[:] = 0
# ---------------- SFX (own bus) ----------------
drill = load('drill_soil'); add(fade(drill, 0.02, 0.3), 0.0, 1.0, -0.3); add(fade(drill, 0.05, 0.3), F(2150), 0.9, -0.3)
w = load('whoosh')
for i, c in enumerate([216, 471, 691, 876, 1211, 2011]): add(fade(w, 0.01, 0.1), F(c) - 0.25, 0.6, -0.4 if i % 2 else 0.4)
add(fade(w, 0.05, 0.2), F(1291) - 0.35, 0.4)                       # focus pull into the cutaway: soft
add(load('gate_slam'), F(448), 1.0, 0.2)
add(fade(load('crane_winch')), F(480), 0.8, -0.3); add(load('lead_thud'), F(640), 1.0, -0.2)
add(fade(load('nitrogen_hiss')), F(700), 0.9, 0.3); add(fade(load('stone_creak')), F(735), 1.0)
add(load('idea_ding'), F(990), 0.7)
add(fade(load('rig_start'), 0.02, 0.3), F(1041), 1.0, -0.2)
add(fade(load('soil_scrape')), F(1600), 1.0, -0.3)
add(fade(load('tower_settle'), 0.1, 0.6), F(1790), 0.22)
add(fade(load('crowd_cheer'), 0.1, 0.4), F(2030), 0.8)
pop = lambda g=0.5: np.sin(2 * np.pi * (900 - 5000 * T(0.12)) * T(0.12)) * np.exp(-T(0.12) * 35) * g
for f0 in [520, 760, 1222, 1232]: add(pop(), F(f0), 0.6)
chime = lambda fr: (np.sin(2 * np.pi * fr * T(1.2)) + 0.4 * np.sin(2 * np.pi * fr * 2.01 * T(1.2))) * np.exp(-T(1.2) * 3)
for f0, fr in [(70, 880), (1440, 990), (1600, 880), (1925, 1175)]: add(chime(fr), F(f0), 0.25)
FXL, FXR = L.copy(), R.copy(); L, R = BL, BR
# ---------------- voice on top, bed and SFX under it ----------------
vv = np.zeros(n); vv[:min(n, len(v))] = v[:n]
def dip(x): return x - 0.6 * bp(x, 1000, 4000)
L = dip(L); R = dip(R)
envv = np.convolve(np.abs(vv), np.ones(2205) / 2205, 'same'); sp = np.clip(envv / (envv.max() * 0.2), 0, 1)
duck = 1 - 0.7 * sp; L *= duck; R *= duck
BED_DB = 22
rms = lambda x: np.sqrt(np.mean(x ** 2)) + 1e-9
mask = sp > 0.5; g = rms(vv[mask]) / rms(((L + R) / 2)[mask]) * 10 ** (-BED_DB / 20)
L *= g; R *= g
FXL = lp(FXL, 5000) * (1 - 0.5 * sp); FXR = lp(FXR, 5000) * (1 - 0.5 * sp)
SFX_PEAK = 0.16
gs = SFX_PEAK * np.abs(vv).max() / max(1e-9, np.abs(np.stack([FXL, FXR])).max())
L += FXL * gs + vv; R += FXR * gs + vv
print('bed gain', round(float(g), 3), 'sfx gain', round(float(gs), 3))
m = np.stack([L, R], 1); m /= max(1e-6, np.abs(m).max()) / 0.89
with wave.open('final_mix.wav', 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes())
print('ok final_mix.wav', DUR)
