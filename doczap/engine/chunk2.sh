#!/bin/bash
# two lanes, each: main frames then railway re-render, all RESUME, ~9 min per call
cd /home/claude/shorts/paxton/engine; mkdir -p plates_rail
END=$(( $(date +%s) + 540 ))
lane() { for job in "$@"; do left=$(( END - $(date +%s) )); [ $left -le 20 ] && break
  RS=1 HASH="#raw" RESUME=1 timeout -k 5 $left node render.mjs ${job%:*} ${job#*:} >> /tmp/lane.log 2>&1; done; }
lane plates:1169-1299 plates_rail:1441-1593 &
lane plates:2401-2599 plates_rail:1594-1746 &
wait
python3 - <<'PY'
import glob, os
from PIL import Image
for d in ['plates', 'plates_rail']:
    for f in sorted(glob.glob(d + '/f*.jpg'), key=os.path.getmtime)[-3:]:
        try: Image.open(f).load()
        except Exception: os.remove(f); print('removed broken', f)
PY
echo "$(date +%T) plates: $(ls plates | wc -l)  rail: $(ls plates_rail | wc -l)/306"
