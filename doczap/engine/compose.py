# Final video: plates + whip-pan blur + 2D overlay + audio -> H.264 1080x1920 60 fps.
#   python3 compose.py out/DocZap_<Name>_1080x1920.mp4            whole episode
#   python3 compose.py out/preview.mp4 0-747                      a frame range (previews)
# Video source, first match wins:
#   cap/episode.mp4  from episode.py: plates cut with Remocn transitions + the Remocn overlay -> just add audio
#   cap/overlay.mov  from overlay.py: plates + 3D whip blur + Remocn captions/labels
#   legacy PNGs      from caps.py / labels.py
import json, os, re, subprocess, sys

OUT = sys.argv[1]
TOTAL = int(re.search(r'TOTAL\s*=\s*(\d+)', open('web/story.js').read()).group(1))
F0, F1 = (map(int, sys.argv[2].split('-')) if len(sys.argv) > 2 else (0, TOTAL - 1))
T0, DUR = F0 / 60, (F1 - F0 + 1) / 60
WHIPS = [149, 379, 520, 772, 861, 1019, 1191]  # whip-pan centres in 30 fps units, from story.js

if os.path.exists('cap/episode.mp4'):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{T0:.4f}', '-t', f'{DUR:.4f}', '-i', 'cap/episode.mp4', '-ss', f'{T0:.4f}', '-t', f'{DUR:.4f}', '-i', 'audio/final_mix.wav',
                    '-map', '0:v', '-map', '1:a', '-af', f'afade=t=out:st={DUR - 0.25:.2f}:d=0.25', '-r', '60', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '192k', '-t', f'{DUR:.4f}', OUT], check=True)
    print('ok', OUT); sys.exit(0)
args = ['ffmpeg', '-y', '-v', 'error', '-framerate', '60', '-start_number', str(F0), '-i', 'plates/f%04d.jpg']
en = '+'.join(f'between(t,{(a - 7) / 30 - T0:.3f},{(a + 9) / 30 - T0:.3f})' for a in WHIPS)
fc = f"[0:v]split[a][b];[b]tmix=frames=7:weights='1 1 1 1 1 1 1'[bl];[a][bl]overlay=enable='{en}'[v0]"
if os.path.exists('cap/overlay.mov'):
    args += ['-ss', f'{T0:.4f}', '-t', f'{DUR:.4f}', '-i', 'cap/overlay.mov']
    fc += ';[v0][1:v]overlay=format=auto:shortest=1[vo]'
    na, vout = 2, '[vo]'
else:  # legacy static PNG captions and labels
    c = json.load(open('cap/caps.json'))
    for p in c['inputs']: args += ['-loop', '1', '-framerate', '60', '-t', f'{DUR}', '-i', p]
    labs = [('cap/l_jack.png', 10.0, 12.45, 40, -45, 620), ('cap/l_tix.png', 11.0, 12.45, 600, 45, 450)]
    for p, *_ in labs: args += ['-loop', '1', '-framerate', '60', '-t', f'{DUR}', '-i', p]
    n = len(c['win'])
    for i, (s, e) in enumerate(c['win']):
        fc += f";[v{i}][{i + 1}:v]overlay=enable='between(t,{s - T0:.3f},{e - T0 - 0.001:.3f})'[v{i + 1}]"
    k = n
    for j, (p, s, e, x0, vx, y) in enumerate(labs):
        idx = n + 1 + j
        fc += f";[{idx}:v]fade=t=in:st={s - T0}:d=0.15:alpha=1[lb{j}];[v{k}][lb{j}]overlay=x='{x0}+({vx})*(t+{T0}-11.5)':y={y}:enable='between(t,{s - T0},{e - T0})'[v{k + 1}]"; k += 1
    na, vout = n + 1 + len(labs), f'[v{k}]'
args += ['-ss', f'{T0:.4f}', '-t', f'{DUR:.4f}', '-i', 'audio/final_mix.wav']
fc += f";[{na}:a]afade=t=out:st={DUR - 0.25:.2f}:d=0.25[au]"
args += ['-filter_complex', fc, '-map', vout, '-map', '[au]', '-t', f'{DUR:.4f}', '-r', '60', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', OUT]
subprocess.run(args, check=True); print('ok', OUT)
