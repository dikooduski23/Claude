"""Long-form shot renderer.
usage: python3 render.py EPDIR story_module [first_shot last_shot] [--stills t1,t2,...]
Writes EPDIR/shots/NNN.mp4 (1920x1080, 30 fps), one file per shot."""
import sys, os, json, math, re, importlib, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import skia
from kit import *
from chars import draw_char, draw_horse, draw_head, flame, head_center
import sets as S
import overlays as O
import fx as FX

FPS = 30


def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower())


def resolve(shots, timeline):
    words = timeline['words']
    toks = [norm(w[0]) for w in words]
    pos = 0
    out = []
    for sh in shots:
        if 't' in sh:
            st = sh['t']
        else:
            q = [norm(x) for x in sh['at'].split()]
            found = None
            for i in range(pos, len(toks) - len(q) + 1):
                if toks[i:i + len(q)] == q:
                    found = i; break
            if found is None:
                raise ValueError('anchor not found: ' + sh['at'] + ' after word ' + str(pos))
            pos = found + len(q)
            st = words[found][1] - 0.12
        out.append(dict(sh, start=max(0.0, st)))
    out.sort(key=lambda s: s['start'])
    for sh in out:
        acts = sh.get('actors', [])
        cm = sh.get('cam')
        if 'track' not in sh and not sh.get('track_off') and not any(a.get('rot') for a in acts) and cm and min(cm[0][2], cm[1][2]) >= 1.45 and len(acts) >= 1 and acts[0].get('k', 'char') in ('char', 'head') and 'bg' not in sh:
            if len(acts) == 1:
                sh['track'] = 0
    for i, sh in enumerate(out):
        sh['end'] = out[i + 1]['start'] if i + 1 < len(out) else timeline['dur']
        sh['idx'] = i
    return out


def cam_at(sh, u):
    a, b = sh.get('cam', ((960, 540, 1.0), (960, 540, 1.06)))
    tr = sh.get('track')
    if tr is not None:
        act = sh['actors'][tr]
        if act.get('k', 'char') == 'char':
            hx, hy, hr = head_center(act['c'], act['x'], act['y'], act.get('s', 1.0), act.get('p', {}))
        else:
            hx, hy, hr = act['x'], act['y'], act.get('r', 80)
        # keep the face slightly above centre: screen y ~ 0.45 H
        def fix(cm):
            z = cm[2]
            return (cm[0] if 'track_x' not in sh else hx, hy + 0.08 * H / z, z)
        a, b = fix(a), fix(b)
    k = eio(u) if sh.get('ease', 'io') == 'io' else u
    return tuple(lerp(a[i], b[i], k) for i in range(3))


def to_screen(cam, x, y, d=1.0):
    cx, cy, z = cam
    zz = 1 + (z - 1) * (0.35 + 0.65 * d)
    px = (cx - 960) * (0.15 + 0.85 * d); py = (cy - 540) * (0.15 + 0.85 * d)
    return (960 + (x - px - 960) * zz, 540 + (y - py - 540) * zz, zz)


def draw_actor(c, a, t, u):
    kind = a.get('k', 'char')
    x, y = a['x'], a['y']
    mv = a.get('mv')
    if mv:
        k = eio(u) if a.get('mvease', 'io') == 'io' else u
        x += mv[0] * k; y += mv[1] * k
    pose = dict(a.get('p', {}))
    pose.setdefault('seed', a.get('seed', int(x) % 13))
    if a.get('walk'):
        pose['walk'] = t * a.get('wspeed', 1.6)
    if a.get('talk'):
        pose['talk'] = 0.5 + 0.5 * math.sin(t * 15) if (t * 3) % 2 < 1.4 else 0.0
    s = a.get('s', 1.0)
    c.save()
    if a.get('rot'):
        c.rotate(a['rot'], x, y)
    if kind == 'char':
        draw_char(c, x, y, s, a['c'], pose, t)
    elif kind == 'horse':
        draw_horse(c, x, y, s, a.get('col', '#6b4a32'), a.get('mane', '#2a1d15'), pose.get('facing', 1),
                   (t * a.get('gspeed', 1.6)) if a.get('gallop') else None, t, a.get('rider'), a.get('rp'))
    elif kind == 'camel':
        FX.camel(c, x, y, s, pose.get('facing', 1), t, a.get('rider'))
    elif kind == 'head':
        draw_head(c, x, y, a.get('r', 80), a['c'], pose, t)
    elif kind == 'fn':
        a['fn'](c, x, y, s, t, u)
    c.restore()


def draw_fx_world(c, e, t, u):
    k = e[0]
    if k == 'fire':
        FX.fire(c, e[1], e[2], e[3], t, seed=int(e[1]) % 7)
    elif k == 'smoke':
        FX.smoke(c, e[1], e[2], t, e[3] if len(e) > 3 else 1.0, seed=int(e[1]) % 9)
    elif k == 'torch':
        FX.torch_flame(c, e[1], e[2], e[3], t)
    elif k == 'tug':
        S.banner_tug(c, e[1], e[2], e[3])
    elif k == 'yurt':
        S.yurt(c, e[1], e[2], e[3], night=len(e) > 4 and e[4], glow=len(e) > 5 and e[5])
    elif k == 'water':  # river surface strip in front of a swimmer
        x0, y0, x1 = e[1], e[2], e[3]
        c.drawRect(skia.Rect(x0, y0, x1, y0 + 400), fillp(rgb(e[4] if len(e) > 4 else '#1f3346')))
        for i in range(int((x1 - x0) / 120)):
            xx = x0 + i * 120 + (t * 30 + i * 37) % 120
            c.drawLine(xx, y0 + 30 + (i % 3) * 40, xx + 70, y0 + 30 + (i % 3) * 40, strokep(rgb('#6f8fb0'), 3))
        c.drawLine(x0, y0, x1, y0, strokep(rgb('#8fb0d0'), 4))
    elif k == 'pines':
        for i, xx in enumerate(e[1]):
            S.pine(c, xx, e[2], e[3])
    elif k == 'city':
        pass


def draw_fx_screen(c, e, t, u):
    k = e[0]
    if k == 'snow':
        FX.snow(c, t, n=e[1] if len(e) > 1 else 160)
    elif k == 'dust':
        FX.dust(c, t)
    elif k == 'embers':
        FX.embers_screen(c, t)
    elif k == 'arrows':
        FX.rain_arrows(c, t)
    elif k == 'speed':
        FX.speed_lines(c, t)
    elif k == 'tint':  # colour wash (flashback sepia / blood red / sick green)
        col = rgb(e[1]); a = e[2]
        p = fillp(skia.Color(skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col), int(255 * a)))
        p.setBlendMode(skia.BlendMode.kMultiply if len(e) < 4 else skia.BlendMode.kScreen)
        c.drawRect(skia.Rect(0, 0, W, H), p)
    elif k == 'flash':
        a = max(0.0, 1 - t / e[1])
        c.drawRect(skia.Rect(0, 0, W, H), fillp(skia.Color(255, 245, 230, int(200 * a))))
    elif k == 'bars':  # letterbox for dramatic beats
        c.drawRect(skia.Rect(0, 0, W, 110), fillp(skia.Color(0, 0, 0)))
        c.drawRect(skia.Rect(0, H - 110, W, H), fillp(skia.Color(0, 0, 0)))


def draw_overlay(c, o, t, u, sh, timeline):
    k = o[0]
    d = o[-1] if isinstance(o[-1], (int, float)) and k in ('note', 'polaroid', 'tag', 'stamp', 'circle') else 0
    tt = t - (o[-1] if k in ('note', 'polaroid', 'tag', 'stamp', 'circle', 'height', 'fn') and isinstance(o[-1], (int, float)) else 0)
    if tt < 0:
        return
    if k == 'chapter':
        ch = o[1]
        O.chapter_card(c, ch['num'], ch['title'], ch['sub'], t, dur=sh['end'] - sh['start'] + 0.2)
    elif k == 'note':
        O.paper_note(c, o[1], o[2], o[3], tt, rot=o[4])
    elif k == 'tag':
        O.location_tag(c, o[1], o[2], tt, dur=sh['end'] - sh['start'] - (o[-1] if isinstance(o[-1], (int, float)) else 0))
    elif k == 'stamp':
        O.year_stamp(c, o[1], tt)
    elif k == 'circle':
        O.red_circle(c, o[1], o[2], o[3], o[4], tt)
    elif k == 'polaroid':
        O.polaroid(c, o[1], o[2], o[3], tt, rot=o[4], caption=o[5])
    elif k == 'height':
        O.height_chart(c, o[1], tt)
    elif k == 'end':
        O.end_card(c, t, o[1])
    elif k == 'fn':
        o[1](c, tt, u)


def render_frame(sh, t, u, frame_no, timeline, layers_cache):
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    cam = cam_at(sh, u)
    sk = sh.get('shake', 0)
    if sk:
        cam = (cam[0] + math.sin(t * 37) * sk, cam[1] + math.cos(t * 29) * sk, cam[2])
    if 'set' in sh:
        name, kw = sh['set']
        key = (name, tuple(sorted(kw.items())))
        if key not in layers_cache:
            layers_cache[key] = S.build(name, **kw)
        S.draw_layers(c, layers_cache[key], cam)
    elif 'bg' in sh:
        sh['bg'](c, t, u)
    # world objects (depth 1.0 transform), sorted by y
    c.save(); S.world_tx(c, cam, 1.0)
    for e in sh.get('wfx_back', []):
        draw_fx_world(c, e, t, u)
    acts = sorted(sh.get('actors', []), key=lambda a: a.get('z', a['y']))
    for a in acts:
        draw_actor(c, a, t, u)
    for e in sh.get('wfx', []):
        draw_fx_world(c, e, t, u)
    c.restore()
    if sh.get('light'):
        sh['light'].apply(c, t, lambda x, y: to_screen(cam, x, y))
    for e in sh.get('fx', []):
        draw_fx_screen(c, e, t, u)
    for o in sh.get('ov', []):
        draw_overlay(c, o, t, u, sh, timeline)
    img = surf.makeImageSnapshot()
    return img


def whip(img, k, direction):
    """k 0..1 blur strength; shift image horizontally"""
    s = skia.Surface(W, H); c = s.getCanvas()
    c.clear(skia.Color(0, 0, 0))
    p = skia.Paint(ImageFilter=skia.ImageFilters.Blur(1 + 60 * k, 0.5))
    c.drawImage(img, -direction * 260 * k, 0, skia.SamplingOptions(), p)
    return s.makeImageSnapshot()


def encode_shot(sh, nxt, timeline, outdir, layers_cache):
    n = max(1, int(round((sh['end'] - sh['start']) * FPS)))
    f0 = int(round(sh['start'] * FPS))
    n = int(round(sh['end'] * FPS)) - f0
    tmp = os.path.join(outdir, '%03d.tmp.mp4' % sh['idx'])
    fin = os.path.join(outdir, '%03d.mp4' % sh['idx'])
    p = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
    WN = 5
    for i in range(n):
        t = i / FPS
        u = i / max(1, n - 1)
        img = render_frame(sh, t + sh.get('t0', 0), u, f0 + i, timeline, layers_cache)
        if sh.get('trans') == 'whip' and i < WN:
            img = whip(img, 1 - i / WN, sh.get('wdir', 1))
        if nxt is not None and nxt.get('trans') == 'whip' and i >= n - WN:
            img = whip(img, (i - (n - WN) + 1) / WN, -nxt.get('wdir', 1) * -1)
        arr = img.toarray(colorType=skia.kRGBA_8888_ColorType)
        out = O.film_finish(arr, f0 + i, warm=sh.get('warm', 0.06))
        p.stdin.write(out.tobytes())
    p.stdin.close(); p.wait()
    if p.returncode == 0:
        os.replace(tmp, fin)
    return n


def stills(shots, timeline, times, out):
    cache = {}
    for t in times:
        sh = next(s for s in shots if s['start'] <= t < s['end'])
        lt = t - sh['start']; u = lt / max(0.01, sh['end'] - sh['start'])
        img = render_frame(sh, lt, u, int(t * FPS), timeline, cache)
        arr = img.toarray(colorType=skia.kRGBA_8888_ColorType)
        from PIL import Image
        Image.fromarray(O.film_finish(arr, int(t * FPS))).save(os.path.join(out, 'st_%06.2f.png' % t))


if __name__ == '__main__':
    ep = sys.argv[1]; mod = sys.argv[2]
    sys.path.insert(0, ep)
    timeline = json.load(open(os.path.join(ep, 'timeline.json')))
    story = importlib.import_module(mod)
    shots = resolve(story.build(timeline), timeline)
    os.makedirs(os.path.join(ep, 'shots'), exist_ok=True)
    if '--stills' in sys.argv:
        ts = [float(x) for x in sys.argv[sys.argv.index('--stills') + 1].split(',')]
        os.makedirs(os.path.join(ep, os.environ.get('STILLDIR','stills')), exist_ok=True)
        stills(shots, timeline, ts, os.path.join(ep, os.environ.get('STILLDIR','stills')))
        sys.exit(0)
    if '--list' in sys.argv:
        for s in shots:
            print(s['idx'], round(s['start'], 2), round(s['end'] - s['start'], 2), s.get('at', s.get('t')))
        sys.exit(0)
    a = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    b = int(sys.argv[4]) if len(sys.argv) > 4 else len(shots) - 1
    cache = {}
    for i in range(a, b + 1):
        fin = os.path.join(ep, 'shots', '%03d.mp4' % i)
        if os.path.exists(fin) and '--force' not in sys.argv:
            continue
        t0 = time.time()
        n = encode_shot(shots[i], shots[i + 1] if i + 1 < len(shots) else None, timeline, os.path.join(ep, 'shots'), cache)
        print('shot', i, n, 'frames', round(time.time() - t0, 1), 's', flush=True)
