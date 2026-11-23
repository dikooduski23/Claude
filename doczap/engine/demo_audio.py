# Sound bed for the engine demo (demo_story.js): torch crackle, mumble-free room tone, fury thump, emote pops, whip whoosh, label chimes.
# usage: python3 demo_audio.py out.wav
import sys, wave, numpy as np
from scipy.signal import butter, sosfilt
SR, DUR = 44100, 6.0; n = int(SR * DUR); rng = np.random.default_rng(7); L = np.zeros(n); R = np.zeros(n)
bp = lambda x, lo, hi: sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
T = lambda d: np.arange(int(d * SR)) / SR
def add(sig, t, g=1.0, pan=0.0):
    i = int(t * SR); s = sig[:max(0, n - i)] * g; L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
# room tone + fire bed (until the cutaway), crackle clicks
bed = lp(rng.standard_normal(n), 300) * 0.05; add(bed, 0)
for t in np.sort(rng.uniform(0, DUR, 90)): c = bp(rng.standard_normal(int(0.02 * SR)), 1500, 7000) * np.exp(-T(0.02) * 220); add(c, t, rng.uniform(0.05, 0.22), rng.uniform(-0.6, 0.6))
# soft music drone (minor), dips on the fury beat
th = T(DUR); drone = (np.sin(2 * np.pi * 110 * th) + 0.5 * np.sin(2 * np.pi * 130.8 * th) + 0.35 * np.sin(2 * np.pi * 164.8 * th)) * 0.04
drone *= np.interp(th, [0, 2.3, 2.5, 3.6, 4.6, 6], [1, 1, 0.35, 0.35, 1, 1]); add(drone, 0)
thump = lambda g: (np.sin(2 * np.pi * (80 - 60 * T(0.5)) * T(0.5)) * np.exp(-T(0.5) * 9)) * g
pop = lambda g: np.sin(2 * np.pi * (900 - 5000 * T(0.12)) * T(0.12)) * np.exp(-T(0.12) * 35) * g
add(thump(0.6), 132 / 60); add(thump(0.8), 175 / 60); add(pop(0.5), 178 / 60, pan=-0.3); add(pop(0.5), 230 / 60, pan=0.3)
wd = int(0.5 * SR); add(bp(rng.standard_normal(wd), 300, 3500) * np.sin(np.linspace(0, np.pi, wd)) ** 2, 266 / 60, 0.7)
ch = lambda f: (np.sin(2 * np.pi * f * T(1.2)) + 0.4 * np.sin(2 * np.pi * f * 2.01 * T(1.2))) * np.exp(-T(1.2) * 3)
add(ch(880), 300 / 60, 0.18); add(ch(660), 312 / 60, 0.12); add(ch(990), 324 / 60, 0.18)
m = np.stack([L, R], 1); m /= max(1e-6, np.abs(m).max()) / 0.8
with wave.open(sys.argv[1], 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes())
print('ok', sys.argv[1])
