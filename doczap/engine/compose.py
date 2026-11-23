import json, subprocess, sys
OUT = sys.argv[1]; DUR = 2514 / 60
WHIPS = [149, 379, 520, 772, 861, 1019, 1191]
c = json.load(open('cap/caps.json'))
args = ['ffmpeg', '-y', '-v', 'error', '-framerate', '60', '-i', 'plates/f%04d.jpg']
for p in c['inputs']: args += ['-loop', '1', '-framerate', '60', '-t', f'{DUR}', '-i', p]
labs = [('cap/l_jack.png', 10.0, 12.45, 40, -45, 620), ('cap/l_tix.png', 11.0, 12.45, 600, 45, 450)]
for p, *_ in labs: args += ['-loop', '1', '-framerate', '60', '-t', f'{DUR}', '-i', p]
args += ['-i', 'audio/final_mix.wav']
en = '+'.join(f'between(t,{(a - 7) / 30:.3f},{(a + 9) / 30:.3f})' for a in WHIPS)
fc = f"[0:v]split[a][b];[b]tmix=frames=7:weights='1 1 1 1 1 1 1'[bl];[a][bl]overlay=enable='{en}'[v0]"
n = len(c['win'])
for i, (s, e) in enumerate(c['win']):
    fc += f";[v{i}][{i + 1}:v]overlay=enable='between(t,{s:.3f},{e - 0.001:.3f})'[v{i + 1}]"
k = n
for j, (p, s, e, x0, vx, y) in enumerate(labs):
    idx = n + 1 + j
    fc += f";[{idx}:v]fade=t=in:st={s}:d=0.15:alpha=1[lb{j}];[v{k}][lb{j}]overlay=x='{x0}+({vx})*(t-11.5)':y={y}:enable='between(t,{s},{e})'[v{k + 1}]"; k += 1
na = n + 1 + len(labs)
fc += f";[{na}:a]afade=t=out:st={DUR - 0.25:.2f}:d=0.25[au]"
args += ['-filter_complex', fc, '-map', f'[v{k}]', '-map', '[au]', '-t', f'{DUR}', '-r', '60', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', OUT]
subprocess.run(args, check=True); print('ok', OUT)
