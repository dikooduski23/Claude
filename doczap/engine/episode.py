# Cut the plates together with Remocn transitions (+ the Remocn caption/label overlay).
# Run from the episode work dir. Transitions live in web/story.js -> TRANSITIONS.
#   python3 episode.py plan              list each transition and the handle frames it needs
#   python3 episode.py handles           render the handle frames (SHOT=<id>), 3 at a time, RESUME-safe
#   python3 episode.py check             report missing plates / handles
#   python3 episode.py still F           one frame -> cap/episode_F.png (quick look at a transition)
#   python3 episode.py render [a-b]      -> cap/episode.mp4 (video only; compose.py adds the audio)
# Captions/labels are included when cap/captions.json (caps.py) / cap/labels.json (labels.py) exist.
# Env: REMOTION_DIR (default ../../engine/remotion), EPISODE_CONCURRENCY (default 3).
import functools, glob, http.server, json, os, re, socketserver, subprocess, sys, threading
from concurrent.futures import ThreadPoolExecutor

here = os.getcwd()
rdir = os.path.abspath(os.environ.get('REMOTION_DIR', os.path.join(here, '../../engine/remotion')))
story = open('web/story.js').read()
TOTAL = int(re.search(r'TOTAL\s*=\s*(\d+)', story).group(1))
SH = re.findall(r"\['([\w-]+)',\s*(\d+),\s*(\d+),\s*'\w+'\]", story[story.index('const SH = ['):])
SHOTS = [{'id': i, 'a': int(a) * 2, 'b': int(b) * 2 + 1} for i, a, b in SH]
TR = json.loads(re.search(r'/\*TRANSITIONS\*/(.*?)/\*END\*/', story, re.S).group(1))
TRANS = [{'at': t['at'] * 2, 'len': t['len'] * 2, 'type': t['type'], 'opts': t.get('opts', {})} for t in TR]
starts = {s['a']: k for k, s in enumerate(SHOTS)}
for t in TRANS:
    assert t['at'] in starts and starts[t['at']] > 0, f"transition at {t['at'] // 2}u is not a shot start"

def handle_ranges():
    """{shot id: [frames]} for every frame a transition shows outside its own shot."""
    need = {}
    for t in TRANS:
        k, h = starts[t['at']], t['len'] // 2
        need.setdefault(SHOTS[k - 1]['id'], []).extend(range(t['at'], min(TOTAL, t['at'] + h)))   # shot A runs on
        need.setdefault(SHOTS[k]['id'], []).extend(range(max(0, t['at'] - h), t['at']))           # shot B starts early
    return {i: sorted(set(v)) for i, v in need.items()}

def spec(frames):
    out, a = [], None
    for i, f in enumerate(frames):
        if a is None: a = f
        if i + 1 == len(frames) or frames[i + 1] != f + 1: out.append(f'{a}-{f}' if f > a else f'{a}'); a = None
    return ','.join(out)

def missing():
    miss = [f for f in range(TOTAL) if not os.path.exists(f'plates/f{f:04d}.jpg')]
    hm = {i: [f for f in fr if not os.path.exists(f'handles/{i}/f{f:04d}.jpg')] for i, fr in handle_ranges().items()}
    return miss, {i: v for i, v in hm.items() if v}

def props(span=None):
    ov = None
    if os.path.exists('cap/captions.json'):
        ov = {'captions': json.load(open('cap/captions.json')),
              'labels': json.load(open('cap/labels.json')) if os.path.exists('cap/labels.json') else []}
    return {'durationInFrames': TOTAL, 'platesUrl': 'http://127.0.0.1:%d', 'shots': SHOTS, 'transitions': TRANS, 'overlay': ov}

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def remotion(args):
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=here))
    port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
    p = props(); p['platesUrl'] = p['platesUrl'] % port
    os.makedirs('cap', exist_ok=True); pfile = os.path.join(here, 'cap/episode.json'); json.dump(p, open(pfile, 'w'))
    if not os.path.isdir(os.path.join(rdir, 'node_modules')):
        subprocess.run(['npm', 'install', '--no-fund', '--no-audit'], cwd=rdir, check=True)
    shell = sorted(glob.glob('/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell'))
    browser = ['--browser-executable', shell[-1]] if shell else []
    try:
        subprocess.run(['npx', 'remotion', *args, f'--props={pfile}', '--gl=angle', *browser], cwd=rdir, check=True)
    finally:
        srv.shutdown()

cmd = sys.argv[1] if len(sys.argv) > 1 else 'plan'
if cmd == 'plan':
    for t in TRANS:
        k = starts[t['at']]
        print(f"{t['at'] // 2:>5}u  {SHOTS[k - 1]['id']:>8} -> {SHOTS[k]['id']:<8} {t['type']:<14} {t['len'] // 2}f@30 {t['opts'] or ''}")
    for i, fr in handle_ranges().items(): print(f'  handles/{i}: {spec(fr)}')
    print(f"{len(TRANS)} transitions, {sum(len(v) for v in handle_ranges().values())} handle frames")
elif cmd == 'handles':
    jobs = [(i, spec(fr)) for i, fr in handle_ranges().items()]
    def run(job):
        i, s = job
        env = {**os.environ, 'SHOT': i, 'HASH': '#raw', 'RESUME': '1'}
        r = subprocess.run(['node', 'render.mjs', f'handles/{i}', s], env=env, capture_output=True, text=True)
        print(f'handles/{i} {s}: ' + (r.stdout.strip().splitlines() or ['?'])[-1], flush=True)
    with ThreadPoolExecutor(int(os.environ.get('EPISODE_CONCURRENCY', '3'))) as ex: list(ex.map(run, jobs))
elif cmd == 'check':
    miss, hm = missing()
    print(f'plates missing: {len(miss)}' + (f' ({spec(miss)})' if miss else ''))
    for i, v in hm.items(): print(f'handles/{i} missing: {spec(v)}')
    if not miss and not hm: print('all frames present')
elif cmd == 'still':
    f = int(sys.argv[2])
    remotion(['still', 'src/index.ts', 'DocZapEpisode', os.path.join(here, f'cap/episode_{f:04d}.png'), f'--frame={f}', '--image-format=png'])
elif cmd == 'render':
    out = os.path.join(here, 'cap/episode.mp4')
    rng = [f'--frames={sys.argv[2]}'] if len(sys.argv) > 2 else []
    remotion(['render', 'src/index.ts', 'DocZapEpisode', out, '--codec=h264', '--crf=16', '--muted', '--image-format=jpeg', '--jpeg-quality=95',
              f"--concurrency={os.environ.get('EPISODE_CONCURRENCY', '3')}", *rng])
    print('ok', out)
else:
    sys.exit(__doc__ or 'unknown command')
