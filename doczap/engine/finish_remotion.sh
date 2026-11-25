#!/usr/bin/env bash
# Final edit with Remotion + remocn (Nov 2026): plates (hard cuts) -> base.mp4 (glossy glow, audio at -14 LUFS, no captions)
# -> Remotion composition (remocn transitions on every cut + remocn caption-word-pop captions) -> final MP4.
# Transitions: remocn whip-pan / zoom-blur / focus-pull centred on each cut, read from story.js `export const TRANSITIONS = [{ at, type, dir }]`
# (plates are rendered with hard cuts; no in-camera whip yaw and no tmix blur needed).
# usage (from the episode work folder): bash finish_remotion.sh <out.mp4> [glow=0.85]
set -euo pipefail
OUT=$1; GLOW=${2:-0.85}; HERE=$(pwd); ENG=$(cd "$(dirname "$0")" && pwd); R=$ENG/remotion
python3 "$ENG/compose_plates.py" plates "$R/public/base.mp4" --audio final_mix.wav --glow "$GLOW"
node -e "import('$HERE/web/story.js').then((m) => require('fs').writeFileSync('cuts.json', JSON.stringify(m.TRANSITIONS || [])))"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$R/public/base.mp4")
python3 -c "import json,sys; json.dump({'video':'base.mp4','words':json.load(open('words.json')),'cuts':json.load(open('cuts.json')),'durationSec':float(sys.argv[1])},open(sys.argv[2],'w'))" "$DUR" "$R/public/episode.json"
cd "$R" && npx remotion render src/index.ts Episode "$HERE/$OUT" --props=public/episode.json --codec=h264 --crf=14 --concurrency=4 --log=error
echo "ok $OUT"
