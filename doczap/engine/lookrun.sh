#!/bin/bash
# Render the look-test stills, apply the compose glow, measure against the reference reels.
# usage: FRAMES_A="60,290,470" FRAMES_B="1720,1830" ./lookrun.sh v1     (keeps every version in looks/vN)
cd "$(dirname "$0")"; V=${1:?version name, e.g. v1}; T="$(git rev-parse --show-toplevel 2>/dev/null)/doczap"
A=${FRAMES_A:?set FRAMES_A}; B=${FRAMES_B:-}
rm -rf stills stills_glow; mkdir -p stills looks
RS=1 HASH="#raw" timeout 280 node render.mjs stills "$A" > /tmp/lr1.log 2>&1 &
[ -n "$B" ] && RS=1 HASH="#raw" timeout 280 node render.mjs stills "$B" > /tmp/lr2.log 2>&1 &
wait
GLOW=0.35 python3 glowprev.py looks/sheet_$V.jpg 7 > /dev/null
rm -rf looks/$V; cp -r stills_glow looks/$V
python3 "$T/tools/measure.py" --refcache "$T/docs/reference_metrics.json" --ours looks/$V 2>/dev/null | tee looks/report_$V.md
