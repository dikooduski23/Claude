# Engine demo soundtrack (no voice): ElevenLabs SFX + torch ambience -> demo_mix.wav (loudnorm in compose_plates)
import sys, wave, numpy as np
sys.path.insert(0, "../../tools"); from el_sfx import load
SR = 44100; DUR = 6.0; n = int(SR * DUR); L = np.zeros(n); R = np.zeros(n); F = lambda f: f / 60
def add(s, t, g=1.0, pan=0.0):
    i = int(t * SR); s = s[:max(0, n - i)] * g; L[i:i + len(s)] += s * (1 - max(0, pan)); R[i:i + len(s)] += s * (1 + min(0, pan))
def fade(s, a=0.02, b=0.15):
    s = s.copy(); na, nb = int(a * SR), int(b * SR); s[:na] *= np.linspace(0, 1, na); s[-nb:] *= np.linspace(1, 0, nb); return s
add(fade(load('torch_room')[:n], 0.3, 0.3), 0, 0.5)
add(fade(load('murmur')), F(4), 0.55, -0.3); add(fade(load('murmur')), F(64), 0.5, 0.3)
add(fade(load('king_growl')), F(140), 0.8, -0.2); add(load('pop'), F(178), 0.6); add(load('pop'), F(230), 0.6, 0.2); add(load('gulp'), F(236), 0.7, 0.2)
add(fade(load('whoosh'), 0.01, 0.1), F(280) - 0.25, 0.8); add(fade(load('sparkle')), F(312), 0.5)
m = np.stack([L, R], 1); m /= max(1e-6, np.abs(m).max()) / 0.89
with wave.open('demo_mix.wav', 'w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes())
print('ok demo_mix.wav')
