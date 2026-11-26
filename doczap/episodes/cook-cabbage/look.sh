#!/bin/bash
# render the 18 look stills, glow, measure.  usage: ./look.sh vN
cd /home/claude/shorts/cook/engine; V=$1
rm -rf stills stills_glow; mkdir stills
RS=1 HASH="#raw" timeout 290 node render.mjs stills "60,260,380,500,620,790,880,1000,1090" > /tmp/s1.log 2>&1 &
RS=1 HASH="#raw" timeout 290 node render.mjs stills "1220,1300,1430,1550,1660,1780,1930,2060,2170" > /tmp/s2.log 2>&1 &
wait; grep -h "ERR" /tmp/s1.log /tmp/s2.log | head -3
GLOW=0.35 python3 glowprev.py /home/claude/shorts/cook/looks/sheet_$V.jpg 6 >/dev/null
rm -rf /home/claude/shorts/cook/looks/$V; cp -r stills_glow /home/claude/shorts/cook/looks/$V
python3 /home/claude/claude/doczap/tools/measure.py --refcache /home/claude/measure/refs.json --ours /home/claude/shorts/cook/looks/$V 2>/dev/null > /home/claude/shorts/cook/looks/report_$V.md
grep -E "Brightness|Shadow|Burnt|Saturation|Contrast|Warmth|Green|outline|Edge|^- " /home/claude/shorts/cook/looks/report_$V.md
