# Generic plates -> MP4 (1080x1920, 60 fps, H.264) with motion-blurred whip-pans and optional audio (loudnorm -14 LUFS).
# usage: python3 compose_plates.py <plates_dir> <out.mp4> --whips 280,560 [--audio mix.wav] [--caps cap/caps.json] [--first 0] [--frames 360]
# --caps overlays the caption PNGs that caps.py writes (cap/caps.json: inputs + [start, end] windows in seconds).
# Whip windows follow story.js WHIP_FRAMES: [start-14, start+18] in 60-fps frames, blurred with tmix=7 like compose.py.
import argparse, glob, json, os, subprocess
ap = argparse.ArgumentParser(); ap.add_argument('plates'); ap.add_argument('out'); ap.add_argument('--whips', default='')
ap.add_argument('--audio'); ap.add_argument('--caps'); ap.add_argument('--first', type=int, default=0); ap.add_argument('--frames', type=int)
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
for i, (s0, e0) in enumerate(C['win']): fc += f";[v{i}][{i + 1}:v]overlay=enable='between(t,{s0:.3f},{e0 - 0.001:.3f})'[v{i + 1}]"
fc += f";[v{len(C['win'])}]null[v]"
if a.audio: fc += f";[{len(C['inputs']) + 1}:a]loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st={max(0, dur - 0.25):.2f}:d=0.25,aresample=48000[au]"
args += ['-filter_complex', fc, '-map', '[v]'] + (['-map', '[au]', '-c:a', 'aac', '-b:a', '192k'] if a.audio else []) + ['-t', f'{dur:.3f}', '-r', '60', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out]
subprocess.run(args, check=True); print('ok', a.out, f'{dur:.2f}s')
