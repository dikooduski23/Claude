"""Long-form audio mix: voice first, Mongolian-flavoured drone/strings bed ~20 dB under the voice,
diegetic SFX derived from the shot list (wind, fire, hooves, whooshes, arrows, paper, stamps, chapter hits).
usage: python3 mix_long.py EPDIR story_module out.wav"""
import sys, os, json, importlib, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)


def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))


def load(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    j = min(len(buf), i + len(sig))
    s0 = max(0, -i)
    buf[max(0, i):j] += sig[s0:j - i] * g


def env(n, a=0.3, r=0.6):
    e = np.ones(n); na = min(n // 2, int(a * SR)); nr = min(n // 2, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] = np.linspace(1, 0, nr)
    return e


# ------------------------------------------------------------------ sounds
def wind(d, g=1.0):
    x = bp(noise(d), 150, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * T(d) + rng.random() * 6))
    return x * env(len(x), 0.6, 0.6) * g * 0.25


def crackle(d, g=1.0):
    x = lp(noise(d), 600) * 0.15
    pops = np.zeros(int(d * SR))
    for _ in range(int(d * 14)):
        i = rng.integers(0, len(pops) - 400); k = np.exp(-np.arange(400) / 40)
        pops[i:i + 400] += rng.standard_normal(400) * k * rng.uniform(0.3, 1.0)
    return (x + hp(pops, 1500) * 0.5) * env(len(x), 0.2, 0.3) * g * 0.5


def hooves(d, rate=2.4, g=1.0):
    out = np.zeros(int(d * SR)); th = T(0.09)
    hit = np.sin(2 * np.pi * (140 - 400 * th) * th) * np.exp(-th * 45) + lp(rng.standard_normal(len(th)), 900) * np.exp(-th * 60) * 0.4
    t = 0.0
    while t < d - 0.1:
        for k, off in enumerate((0, 0.07, 0.14)):
            place(out, hit * (0.7 + 0.3 * rng.random()), t + off)
        t += 1 / rate
    return out * env(len(out), 0.2, 0.3) * g * 0.6


def whoosh(d=0.4, g=1.0):
    n = int(d * SR)
    return bp(noise(d), 300, 3500) * np.sin(np.linspace(0, np.pi, n)) ** 2 * g * 0.35


def boom(g=1.0):
    th = T(3.0)
    return (lp(noise(3.0), 120, 3) * 4 * np.exp(-th * 1.4) + np.sin(2 * np.pi * 42 * th) * np.exp(-th * 1.8)) * g * 0.5


def riser(d, g=1.0):
    th = T(d)
    return bp(noise(d), 800, 6000) * (th / d) ** 3 * g * 0.18


def paper(g=1.0):
    th = T(0.35)
    return bp(noise(0.35), 1500, 7000) * np.exp(-th * 10) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * th)) * g * 0.22


def thump(g=1.0):
    th = T(0.5)
    return (np.sin(2 * np.pi * (90 - 60 * th) * th) * np.exp(-th * 10) + lp(noise(0.5), 300) * np.exp(-th * 14) * 0.6) * g * 0.6


def arrow(g=1.0):
    th = T(0.5)
    return bp(noise(0.5), 2000, 8000) * np.exp(-((th - 0.2) / 0.08) ** 2) * g * 0.3


def crowd(d, g=1.0):
    x = sum(bp(noise(d), f, f * 1.6) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.5, 2) * T(d))) for f in (300, 500, 800, 1200))
    return x * env(len(x), 0.5, 0.8) * g * 0.12


def clash(g=1.0):
    th = T(0.8)
    return sum(np.sin(2 * np.pi * f * th) * np.exp(-th * k) for f, k in [(2100, 6), (3300, 8), (4700, 10)]) * g * 0.08


def music_bed(dur, chapters, dark_ranges):
    """D-minor drone + slow string pad + overtone-singing whistle, swells at chapters"""
    th = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(th)
    # drone (D2) with overtone whistle sweeping slowly between harmonics 8-12
    f0 = 73.42
    drone = sum(np.sin(2 * np.pi * f0 * k * th + k) / k ** 1.3 for k in range(1, 9))
    out += lp(drone, 900) * 0.35
    harm = 8 + 2 * (1 + np.sin(2 * np.pi * th / 23)) // 1
    whistle = np.sin(2 * np.pi * np.cumsum(f0 * harm) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * th / 11)) * 0.05
    out += whistle
    # string pad chords, 8 s each
    prog = [(146.8, 174.6, 220.0), (116.5, 146.8, 174.6), (130.8, 164.8, 196.0), (110.0, 138.6, 164.8)]
    seg = 8.0
    for i in range(int(dur / seg) + 1):
        ch = prog[i % 4]
        t0 = i * seg
        n = int((seg + 2) * SR); tt = np.arange(n) / SR
        pad = sum(np.sin(2 * np.pi * f * tt * (1 + 0.003 * np.sin(2 * np.pi * 5 * tt))) + 0.5 * np.sin(2 * np.pi * f * 2.002 * tt) for f in ch)
        pad = lp(pad, 1400) * env(n, 2.0, 2.5) * 0.22
        place(out, pad, t0)
    # swell around chapter cards, dip in dark ranges
    gain = np.ones_like(th) * 0.8
    for c in chapters:
        a = int(c['t'] * SR); b = min(len(th), a + int(3.0 * SR))
        gain[a:b] = np.maximum(gain[a:b], 1.6 * np.sin(np.linspace(0, np.pi, b - a)) + 0.8)
    for (a, b) in dark_ranges:
        gain[int(a * SR):int(b * SR)] *= 0.55
    return out * lp(gain, 2)


def main():
    ep, mod, outp = sys.argv[1:4]
    sys.path.insert(0, ep)
    import render as R
    tl = json.load(open(os.path.join(ep, 'timeline.json')))
    story = importlib.import_module(mod)
    shots = R.resolve(story.build(tl), tl)
    dur = tl['dur']
    N = int(dur * SR) + SR
    voice = load(os.path.join(ep, 'voice.wav'))
    V = np.zeros(N); V[:len(voice)] = voice[:N]
    sfx = np.zeros(N)
    dark = []
    for sh in shots:
        st, en = sh['start'], sh['end']; d = en - st
        kw = sh.get('set', ('', {}))[1] if 'set' in sh else {}
        look = kw.get('look', '')
        if sh.get('trans') == 'whip':
            place(sfx, whoosh(0.4, 1.0), st - 0.2)
        if 'set' in sh and sh['set'][0] == 'steppe':
            place(sfx, wind(d + 0.4, 1.4 if kw.get('snow') or look in ('winter', 'storm') else 0.7), st)
        fires = [e for e in sh.get('wfx', []) if e[0] == 'fire']
        if fires:
            place(sfx, crackle(d, 1.0 + 0.3 * len(fires)), st)
        gal = [a for a in sh.get('actors', []) if a.get('k') == 'horse' and a.get('gallop')]
        if gal:
            place(sfx, hooves(d, 2.6, min(1.6, 0.6 + 0.15 * len(gal))), st)
        walkers = [a for a in sh.get('actors', []) if a.get('k') == 'horse' and not a.get('gallop') and a.get('mv')]
        if walkers:
            place(sfx, hooves(d, 1.1, 0.4), st)
        if any(e[0] == 'arrows' for e in sh.get('fx', [])):
            for k in range(int(d * 4)):
                place(sfx, arrow(rng.uniform(0.6, 1.0)), st + k * 0.25 + rng.uniform(0, 0.2))
        if sh.get('shake'):
            for k in range(int(d * 1.5)):
                place(sfx, clash(1.0), st + rng.uniform(0, d))
        for o in sh.get('ov', []):
            if o[0] in ('note', 'polaroid'):
                place(sfx, paper(1.0), st + (o[-1] if isinstance(o[-1], (int, float)) and o[-1] > 0 else 0))
            if o[0] == 'stamp':
                place(sfx, thump(1.2), st + o[-1] + 0.2)
            if o[0] == 'circle':
                place(sfx, paper(0.6), st + o[-1])
        if any(a.get('p', {}).get('arms') == 'raise' for a in sh.get('actors', [])) and len(sh.get('actors', [])) > 10:
            place(sfx, crowd(d, 1.4), st)
        if look in ('night', 'storm') or ('set' in sh and sh['set'][0] == 'yurt' and 'bars' in [e[0] for e in sh.get('fx', [])]):
            dark.append((st, en))
    for c in tl['chapters']:
        place(sfx, riser(1.2, 1.0), c['t'] - 1.2)
        place(sfx, boom(0.9), c['t'])
    music = music_bed(dur + 1, tl['chapters'], dark)
    M = np.zeros(N); M[:len(music)] = music[:N]
    # sidechain: duck music & sfx under voice
    venv = lp(np.abs(V), 6) * 6
    duck = 1 / (1 + venv * 3)
    vr = np.sqrt(np.mean(V[V != 0] ** 2)) if np.any(V) else 0.1
    mr = np.sqrt(np.mean(M ** 2)) + 1e-9
    M *= (vr / mr) * 10 ** (-20 / 20) * 1.4
    sr_ = np.sqrt(np.mean(sfx ** 2)) + 1e-9
    sfx *= (vr / sr_) * 10 ** (-17 / 20)
    mix = V + (M + sfx) * (0.45 + 0.55 * duck)
    mix = np.tanh(mix * 0.9) / 0.9
    tmp = outp + '.raw.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', tmp], input=mix.astype(np.float64).tobytes())
    # two-pass loudnorm to -14 LUFS, TP -1.5
    r = subprocess.run(['ffmpeg', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    js = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    af = 'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'.format(**js)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', af, '-ar', '48000', outp])
    os.remove(tmp)
    print('mixed', outp)


if __name__ == '__main__':
    main()
