#!/bin/bash
# one foreground render chunk: two RESUME ranges for up to ~9 min, then validate the newest frames
cd /home/claude/shorts/paxton/engine
RA=${1:-624-1299}; RB=${2:-1943-2599}; DIR=${3:-plates}
RS=1 HASH="#raw" RESUME=1 timeout -k 5 540 node render.mjs $DIR $RA > /tmp/cA.log 2>&1 &
RS=1 HASH="#raw" RESUME=1 timeout -k 5 540 node render.mjs $DIR $RB > /tmp/cB.log 2>&1 &
wait
pkill -f "chrome.*headless" 2>/dev/null; sleep 1
python3 - "$DIR" <<'PY'
import glob, os, sys
from PIL import Image
for f in sorted(glob.glob(sys.argv[1] + '/f*.jpg'), key=os.path.getmtime)[-4:]:
    try: Image.open(f).load()
    except Exception: os.remove(f); print('removed broken', f)
PY
echo "$(date +%T) frames: $(ls $DIR | wc -l)"
