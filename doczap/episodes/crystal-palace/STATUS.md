# Crystal Palace episode: status (Nov 26 2026, 03:40 Baghdad)
- Script approved, Patrick v4 voice in `voice_fast.mp3` (43.3 s, atempo 1.06 of the trimmed MP3). Word times in `words.json`.
- Engine upgraded to the new **modern look** (`LOOK = 'modern'` in story.js): PBR materials + image-based light, smooth geometry, ACES filmic grade with split tone, no world outlines, light grain. Diyar asked for this ("rendering like 2018").
- Preview stills sent; waiting for Diyar's OK to start the full render.
- To fix before/while rendering: haze band across the elm tree in the nave; lily leaf slightly too bright green.
- Render: RS=1 (RS=1.5 is ~3-4x slower), 3 background ranges with RESUME=1, `HASH="#raw"`. Compose with `compose_plates.py --glow 0.35` (lighter glow for the modern look) and dblur whips `171,348,608,953,1441,1747,1946,2541`.
- Then: captions, voice-first audio mix, cover, post kit (ig-human, ig-caption, youtube-agent), QC, deliver, self-review.
