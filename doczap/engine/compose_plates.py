# Generic plates -> MP4 (1080x1920, 60 fps, H.264) with motion-blurred whip-pans and optional audio (loudnorm -14 LUFS).
# usage: python3 compose_plates.py <plates_dir> <out.mp4> --whips 280,560 [--audio mix.wav] [--caps cap/caps.json] [--first 0] [--frames 360]
# --glow K adds a bright glossy glow (highlight bloom + soft sheen), applied under the captions; 1.0 = default strength, 0 = off.
# --caps overlays the caption PNGs that caps.py writes (cap/caps.json: inputs + [start, end] windows in seconds).
# Whip windows follow story.js WHIP_FRAMES: [start-14, start+18] in 60-fps frames, blurred with tmix=7 like compose.py.
import argparse, glob, json, os, subprocess
ap = argparse.ArgumentParser(); ap.add_argument('plates'); ap.add_argument('out'); ap.add_argument('--whips', default='')
ap.add_argument('--audio'); ap.add_argument('--caps'); ap.add_argument('--glow', type=float, default=0.0); ap.add_argument('--first', type=int, default=0); ap.add_argument('--frames', type=int)
a = ap.parse_args()
n = a.frames or len(glob.glob(os.path.join(a.plates, 'f*.jpg'))); dur = n / 60
args = ['ffmpeg', '-y', '-v', 'error', '-framerate', '60', '-start_number', str(a.first), '-i', os.path.join(a.plates, 'f%04d.jpg')]
C = json.load(open(a.caps)) if a.caps else {'inputs': [], 'win': []}
cdir = os.path.dirname(os.path.abspath(a.caps)) if a.caps else ''
for p in C['inputs']: args += ['-loop', '1', '-framerate', '60', '-t', f'{dur:.3f}', '-i', p if os.path.isabs(p) or os.path.exists(p) else os.path.join(cdir, os.path.basename(p))]
if a.audio: args += ['-i', a.audio]
whips = [int(x) for x in a.whips.split(',') if x.strip()]
en = '+'.join(f'between(n,{w - 14 - a.first},{w + 18 - a.first})' for w in whips)
fc = f"[0:v]split[a][b];[b]tmix=frames=7:weights='1 1 1 1 1 1 1'[bl];[a][bl]overlay=enable='{en}'[v0]" if whips else '[0:v]null[v0]'
fc = fc.replace('[0:v]', '[0:v]scale=1080:1920:flags=lanczos[sc];[sc]', 1)   # supersampled plates (RS=2) -> crisp 1080x1920
for i, (s0, e0) in enumerate(C['win']): fc += f";[v{i}][{i + 1}:v]overlay=enable='between(t,{s0:.3f},{e0 - 0.001:.3f})'[v{i + 1}]"
if a.glow > 0:  # glossy glow: highlights bloom (tight + wide) + a soft overall sheen, screen-blended
    k = a.glow
    fc = fc.replace('[v0]', '[pre]', 1) + (f";[pre]format=gbrp,split=3[gA][gB][gC];[gB]curves=all='0/0 0.55/0.03 0.8/0.45 1/1',split[hb1][hb2];[hb1]gblur=sigma=10[t1];[hb2]gblur=sigma=40[t2]"
      f";[gC]gblur=sigma=22,eq=saturation=1.25[sh];[t1][t2]blend=all_mode=screen[hl];[gA][hl]blend=all_mode=screen:all_opacity={min(1, 0.55 * k):.3f}[g1];[g1][sh]blend=all_mode=screen:all_opacity={min(1, 0.16 * k):.3f},eq=saturation={1 + 0.06 * k:.3f}:contrast={1 + 0.03 * k:.3f},unsharp=5:5:0.55:5:5:0.0[v0]")
fc += f";[v{len(C['win'])}]null[v]"
if a.audio: fc += f";[{len(C['inputs']) + 1}:a]loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st={max(0, dur - 0.25):.2f}:d=0.25,aresample=48000[au]"
args += ['-filter_complex', fc, '-map', '[v]'] + (['-map', '[au]', '-c:a', 'aac', '-b:a', '192k'] if a.audio else []) + ['-t', f'{dur:.3f}', '-r', '60', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out]
subprocess.run(args, check=True); print('ok', a.out, f'{dur:.2f}s')
