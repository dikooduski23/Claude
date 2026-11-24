# Render the remocn overlay (captions + handwritten labels) as a transparent ProRes 4444 layer.
# Run from the episode work dir after caps.py and labels.py:
#   python3 overlay.py            -> cap/overlay.mov (1080x1920, 60 fps, alpha)
#   python3 overlay.py --still F  -> cap/overlay_F.png, one frame, for a quick look
# Env: REMOTION_DIR (default ../../engine/remotion), OVERLAY_CONCURRENCY (default 2).
import glob, json, os, re, subprocess, sys

here = os.getcwd()
rdir = os.path.abspath(os.environ.get('REMOTION_DIR', os.path.join(here, '../../engine/remotion')))
total = int(re.search(r'TOTAL\s*=\s*(\d+)', open('web/story.js').read()).group(1))
props = {
    'durationInFrames': total,
    'captions': json.load(open('cap/captions.json')),
    'labels': json.load(open('cap/labels.json')) if os.path.exists('cap/labels.json') else [],
}
os.makedirs('cap', exist_ok=True)
pfile = os.path.join(here, 'cap/overlay.json')
json.dump(props, open(pfile, 'w'))
if not os.path.isdir(os.path.join(rdir, 'node_modules')):
    subprocess.run(['npm', 'install', '--no-fund', '--no-audit'], cwd=rdir, check=True)
# reuse a preinstalled headless shell when there is one (cloud sessions); otherwise Remotion fetches its own
shell = sorted(glob.glob('/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell'))
browser = ['--browser-executable', shell[-1]] if shell else []
if len(sys.argv) > 2 and sys.argv[1] == '--still':
    f = int(sys.argv[2]); out = os.path.join(here, f'cap/overlay_{f:04d}.png')
    cmd = ['npx', 'remotion', 'still', 'src/index.ts', 'DocZapOverlay', out, f'--props={pfile}', f'--frame={f}', '--image-format=png', *browser]
else:
    out = os.path.join(here, 'cap/overlay.mov')
    cmd = ['npx', 'remotion', 'render', 'src/index.ts', 'DocZapOverlay', out, f'--props={pfile}',
           '--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le', '--image-format=png',
           f"--concurrency={os.environ.get('OVERLAY_CONCURRENCY', '2')}", *browser]
subprocess.run(cmd, cwd=rdir, check=True)
print('ok', out)
