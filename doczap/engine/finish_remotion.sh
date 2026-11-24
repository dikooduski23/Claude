#!/usr/bin/env bash
# Final edit with Remotion + remocn (Nov 2026): plates -> base.mp4 (whip blur, glossy glow, audio at -14 LUFS, NO burned captions)
# -> Remotion composition (remocn caption-word-pop captions) -> final MP4.
# usage (from the episode work folder): bash finish_remotion.sh <out.mp4> <whips,comma,list> [glow=0.85]
set -euo pipefail
OUT=$1; WHIPS=$2; GLOW=${3:-0.85}; HERE=$(pwd); ENG=$(cd "$(dirname "$0")" && pwd); R=$ENG/remotion
python3 "$ENG/compose_plates.py" plates "$R/public/base.mp4" --whips "$WHIPS" --audio final_mix.wav --glow "$GLOW"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$R/public/base.mp4")
python3 -c "import json,sys; json.dump({'video':'base.mp4','words':json.load(open('words.json')),'durationSec':float(sys.argv[1])},open(sys.argv[2],'w'))" "$DUR" "$R/public/episode.json"
cd "$R" && npx remotion render src/index.ts Episode "$HERE/$OUT" --props=public/episode.json --codec=h264 --crf=17 --concurrency=4 --log=error
echo "ok $OUT"
