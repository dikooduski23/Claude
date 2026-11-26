#!/usr/bin/env python3
"""Doc Zap: measure, don't guess (method from the Version 6 animated-shorts-kit, adapted Nov 26 2026).

Compares reference reels with our episode using numbers only: look (light, colour, lines, sharpness)
and editing (cuts, camera motion, shot length, loudness). Prints one table and names the biggest gap.

usage:
  python3 measure.py --ref a.mp4 b.mp4 ... --ours ep.mp4 [--frames 20] [--out report.md] [--json m.json]
  python3 measure.py --refcache refs.json --ours stills_dir/      # reuse measured refs; a folder = look metrics only
Notes:
  * Look metrics sample N frames per video (skipping the first/last 3 %) and ignore the caption band
    (62-78 % of the height), so captions don't skew brightness or ink.
  * "Shadow area" = % of pixels with L* < 35. "Burnt" = % with L* > 93. "Ink" = % of pixels that sit on
    a Canny edge AND are dark (L* < 30) — a proxy for outline weight. All on frames scaled to 540 px wide.
  * Camera motion uses dense optical flow at 135 px wide, 30 fps: speed = |median translation| +
    |zoom| x half-height, in % of frame width per second; frames within 3 of a cut are skipped.
    A cut is a one-frame spike (not a sustained plateau, which is a fast move or whip).
  * Numbers can be wrong: check flagged cuts by eye on a contact sheet before trusting them.
"""
import argparse, json, subprocess, sys
import numpy as np, cv2


def probe(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode().strip()
    return float(out)


def frames_at(path, times, w):
    for t in times:
        p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-vf', f'scale={w}:-2',
                            '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
        b = p.stdout
        if not b: continue
        h = len(b) // (w * 3)
        yield np.frombuffer(b[:w * h * 3], np.uint8).reshape(h, w, 3)


def stream(path, fps, w):
    info = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path]).decode().split(',')
    h = int(round(int(info[1]) * w / int(info[0]) / 2) * 2)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={fps},scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h: break
        yield np.frombuffer(b, np.uint8).reshape(h, w)


def look_metrics(img):
    h = img.shape[0]
    keep = np.ones(h, bool); keep[int(h * 0.62):int(h * 0.78)] = False
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    S = hsv[..., 1] / 255; V = hsv[..., 2] / 255
    Lk, Sk, Vk, Ak, Bk = L[keep], S[keep], V[keep], A[keep], B[keep]
    rgb = img[keep].astype(np.float32)
    rg = rgb[:, 2] - rgb[:, 1]; yb = 0.5 * (rgb[:, 2] + rgb[:, 1]) - rgb[:, 0]
    colourful = np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 60, 140) > 0
    ink = (edges & (L < 30))[keep].mean() * 100
    sharp = cv2.Laplacian(gray, cv2.CV_64F)[keep].var()
    return {
        'brightness': Lk.mean(), 'shadow_pct': (Lk < 35).mean() * 100, 'burnt_pct': (Lk > 93).mean() * 100,
        'saturation_pct': Sk[Vk > 0.12].mean() * 100, 'contrast': Lk.std(), 'colourfulness': colourful,
        'warmth_b': Bk.mean(), 'tint_a': Ak.mean(), 'ink_pct': ink, 'edge_pct': edges[keep].mean() * 100, 'sharpness': sharp,
    }


def edit_metrics(path):
    fps = 30; dur = probe(path)
    prev = None; diffs = []; speeds = []
    for g in stream(path, fps, 135):
        g = g.astype(np.float32)
        if prev is not None:
            diffs.append(np.abs(g - prev).mean())
            flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            hh, ww = g.shape
            ys, xs = np.mgrid[0:hh, 0:ww]; cx, cy = xs - ww / 2, ys - hh / 2
            tx, ty = np.median(flow[..., 0]), np.median(flow[..., 1])
            r = np.sqrt(cx ** 2 + cy ** 2) + 1e-3
            radial = ((flow[..., 0] - tx) * cx + (flow[..., 1] - ty) * cy) / r
            zoom = np.median(radial / r)                       # relative scale change per frame
            sp = (np.hypot(tx, ty) + abs(zoom) * hh / 2) / ww * 100 * fps
            speeds.append(sp)
        prev = g
    d = np.array(diffs); sp = np.array(speeds)
    cuts = []
    for i in range(3, len(d) - 3):
        nb = np.median(np.r_[d[i - 3:i], d[i + 1:i + 4]])
        if d[i] > 14 and d[i] > 3 * nb + 4: cuts.append(i)
    near = np.zeros(len(sp), bool)
    for c in cuts: near[max(0, c - 3):c + 4] = True
    s = cv2.medianBlur(sp.astype(np.float32).reshape(1, -1), 5).ravel()[~near] if len(sp) > 5 else sp
    lufs = None
    try:
        e = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-map', '0:a:0', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
        for line in e.splitlines()[::-1]:
            if line.strip().startswith('I:'): lufs = float(line.split()[1]); break
    except Exception: pass
    return {
        'duration_s': dur, 'cuts_per_min': len(cuts) / dur * 60, 'avg_shot_s': dur / (len(cuts) + 1),
        'moving_pct': (s > 10).mean() * 100, 'drift_pct': (s > 2).mean() * 100, 'fast_pct': (s > 60).mean() * 100,
        'median_speed': float(np.median(s)), 'lufs': lufs, 'cut_times': [round((c + 1) / fps, 2) for c in cuts],
    }


def measure(path, n):
    import os, glob
    if os.path.isdir(path):                      # a folder of stills: look metrics only
        fs = sorted(glob.glob(os.path.join(path, '*.jpg')) + glob.glob(os.path.join(path, '*.png')))
        looks = []
        for f in fs:
            im = cv2.imread(f); h, w = im.shape[:2]; looks.append(look_metrics(cv2.resize(im, (540, int(h * 540 / w)), interpolation=cv2.INTER_AREA)))
        return {k: float(np.mean([x[k] for x in looks])) for k in looks[0]}
    dur = probe(path)
    ts = np.linspace(dur * 0.03, dur * 0.97, n)
    looks = [look_metrics(f) for f in frames_at(path, ts, 540)]
    lk = {k: float(np.mean([x[k] for x in looks])) for k in looks[0]}
    return {**lk, **edit_metrics(path)}


LABEL = {
    'brightness': 'Brightness (L*, /100)', 'shadow_pct': 'Shadow area (% L*<35)', 'burnt_pct': 'Burnt highlights (% L*>93)',
    'saturation_pct': 'Saturation (%)', 'contrast': 'Contrast (L* std)', 'colourfulness': 'Colourfulness', 'warmth_b': 'Warmth (b*)',
    'tint_a': 'Green-magenta (a*)', 'ink_pct': 'Dark outline pixels (%)', 'edge_pct': 'Edge density (%)', 'sharpness': 'Sharpness (Laplacian var)',
    'duration_s': 'Duration (s)', 'cuts_per_min': 'Hard cuts per minute', 'avg_shot_s': 'Average shot (s, hard cuts only)',
    'moving_pct': 'Camera moving >10%/s (% of time)', 'drift_pct': 'Camera drifting >2%/s (%)', 'fast_pct': 'Fast/whip >60%/s (%)',
    'median_speed': 'Median camera speed (%/s)', 'lufs': 'Loudness (LUFS)',
}
SKIP_GAP = {'duration_s'}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--ref', nargs='*', default=[]); ap.add_argument('--refcache', help='json with measured refs (written if missing)'); ap.add_argument('--ours', nargs='+', required=True)
    ap.add_argument('--frames', type=int, default=20); ap.add_argument('--out'); ap.add_argument('--json')
    a = ap.parse_args()
    R = {}; O = {}
    import os
    if a.refcache and os.path.exists(a.refcache): R = json.load(open(a.refcache))['ref']
    else:
        for p in a.ref: print('measuring ref', p, file=sys.stderr); R[p] = measure(p, a.frames)
        if a.refcache: json.dump({'ref': R}, open(a.refcache, 'w'), indent=1)
    for p in a.ours: print('measuring ours', p, file=sys.stderr); O[p] = measure(p, a.frames)
    keys = [k for k in LABEL if all(R[p].get(k) is not None for p in R) and any(O[p].get(k) is not None for p in O)]
    rows = []; gaps = []
    for k in keys:
        rv = np.array([R[p][k] for p in R], float); m, sd = rv.mean(), max(rv.std(), 1e-6)
        for p in O:
            ov = O[p].get(k)
            if ov is None: continue
            z = (ov - m) / max(sd, abs(m) * 0.05, 1e-6)
            if k not in SKIP_GAP: gaps.append((abs(z), k, ov, m))
        ours = ' / '.join(f'{O[p][k]:.1f}' if O[p].get(k) is not None else '-' for p in O)
        z = (O[list(O)[-1]].get(k, m) - m) / max(sd, abs(m) * 0.05, 1e-6)
        rows.append(f'| {LABEL[k]} | {m:.1f} ({rv.min():.1f}-{rv.max():.1f}) | {ours} | {z:+.1f} |')
    gaps.sort(reverse=True)
    lines = ['| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |', '|---|---|---|---|'] + rows
    lines += ['', 'Biggest gaps (fix the first one only, then measure again):']
    for z, k, ov, m in gaps[:5]:
        lines.append(f'- {LABEL[k]}: ours {ov:.1f} vs reference {m:.1f} ({"higher" if ov > m else "lower"}), gap {z:.1f}')
    rep = '\n'.join(lines); print(rep)
    if a.out: open(a.out, 'w').write(rep + '\n')
    if a.json: json.dump({'ref': R, 'ours': O}, open(a.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
