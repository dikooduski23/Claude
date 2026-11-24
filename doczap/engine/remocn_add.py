# Install remocn components (https://github.com/Remocn/remocn, MIT) into engine/remotion/src, with their registry dependencies.
# Same result as `npx shadcn add @remocn/<name>`, but fetched from raw GitHub (remocn.dev is not reachable from every machine).
# usage: python3 remocn_add.py caption-word-pop caption-outline ...
import json, os, sys, urllib.request
RAW = 'https://raw.githubusercontent.com/Remocn/remocn/main/'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'remotion', 'src')
get = lambda p: urllib.request.urlopen(RAW + p, timeout=60).read()
index = {}
for reg in json.loads(get('registry.json'))['include']:
    base = os.path.dirname(reg)
    for it in json.loads(get(reg)).get('items', []): index[it['name']] = (base, it)
done, npm = set(), set()
def add(name):
    name = name.replace('@remocn/', '')
    if name in done: return
    done.add(name)
    if name not in index: sys.exit(f'unknown component {name}')
    base, it = index[name]
    for dep in it.get('registryDependencies', []): add(dep)
    npm.update(it.get('dependencies', []))
    for f in it.get('files', []):
        dst = os.path.join(ROOT, f['target']); os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'wb').write(get(base + '/' + f['path'])); print('added', f['target'])
for n in sys.argv[1:]: add(n)
print('npm dependencies:', ' '.join(sorted(npm)))
