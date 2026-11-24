# Doc Zap — Diyar's animated true-story shorts

This repo holds the whole Doc Zap production system. When Diyar says **"let's create next video"** (or similar), use the `doczap-next-video` skill in `.claude/skills/` and follow it step by step.

## About the channel
- **Doc Zap**: crazy true stories (history, loopholes, paradoxes, backfires and science) told as short animated films.
- Accounts: YouTube/Instagram **@doczapstories**, TikTok, Facebook (the Facebook page is still named "Paper Pip").
- Diyar **posts himself** at **11 AM and 6 PM Baghdad time** (UTC+3). Never post for him.
- He isn't confident at prompting: rewrite and improve his requests yourself, then work from the improved version.
- Claude has creative ownership: lead the story ideas, style and editing.

## Standing rules (from Diyar; follow every time)
1. **Virality check first:** run a virality check on every script; it must score **above 90/100** before building.
2. **Fact-check** every claim against **2+ sources**. Exact numbers and dates; no invented quotes presented as history.
3. **Voice:** ElevenLabs **Patrick** on **Eleven v4** (Diyar switched from v3 on Nov 23 2026). Write the script so it paces well without tags: ellipses, short sentences, line breaks. Add [curious]/[deadpan]/[whispers]-style tags only once Diyar confirms v4 reads them; otherwise send a tag-free script. Numbers written as words. Diyar makes the MP3 and sends it.
4. **Length 30-45 s.**
5. **Output:** native **1080×1920 at 60 fps**, H.264, audio at **-14 LUFS**. **Captions version only.**
6. No episode number, watermark, username, progress bar or border on screen. Only essential in-world labels.
7. Props must be physically right: hands grip tools, nothing floats, glass looks like glass.
8. **QC frames before and after** the final render (contact sheets of stills, then frames from the finished MP4).
9. When Diyar sends reference reels, study them, write the lessons into `doczap/docs/STYLE.md` and apply them.

## The style (copied from 9 reference reels, Nov 23 2026: Rick's Clips + Segment Zero)
See `doczap/docs/STYLE.md` for the full rules. In short:
- **Story formula:** someone did something that looked stupid on purpose → everyone laughs or doubts → the hidden trick pays off → "You see," + the mechanism → an ironic punchline. The **last line flows back into line 1**, so it loops. **No "comment yes or no"** in the video.
- **Hook:** no title card. Frame 1 is a close-up of the character already doing the strange thing, or a macro slow-mo of the key object with a focus pull.
- **Camera:** always moving (push-ins, arcs, following objects, POV, low angles), close framing, a new angle every 1.3-3 s, **whip-pans** with motion blur as transitions.
- **Characters:** big white heads, very expressive faces, emotes (lightbulb, ?, !), hats, beards.
- **Worlds:** textured, warm-lit, depth haze.
- **Mechanism:** an in-world cutaway (glass object, cross-section, balance scale) with **handwritten labels and arrows** (Caveat font).
- **Captions:** 1-2 words, Poppins Bold, white with a dark stroke, sentence case, y≈1342.

## Repo layout
- `doczap/engine/`: the production template (latest = the Lottery Man rebuild).
  - `web/`: three.js engine. `main.js` holds the world sets, `toonbase.js` + `roman.js` the characters (`cat toonbase.js roman.js > toon.js` after editing), `story.js` the shots, camera, cast and FX of the current episode.
  - `render.mjs`: renders frames with headless Chromium (playwright).
  - `caps.py` makes captions, `labels.py` handwritten labels, `compose.py` the final video, `cover.py` the cover, `audio/mix.py` the SFX and music mix.
  - `web/kit/`: the **world kit** (textured materials, props, flickering torch/candle light, window beams, lighting presets, glass, cross-sections, handwritten labels, emotes). Episodes build sets with `export const sets = (K) => …` in story.js. **Read `doczap/docs/ENGINE.md` before building sets or characters**; `web/demo_story.js` is a working example.
  - `remotion/` + `finish_remotion.sh` + `remocn_add.py`: the **final edit is done in Remotion with remocn components** (animated captions on top of the rendered plates). Diyar asked for remocn on every episode; see ENGINE.md §8.
- `doczap/tools/`: `trim_pauses.py`, `align_ps.py` (word timing), `audio_lib.py` (sound effects and music synth).
- `doczap/episodes/<slug>/`: what to keep from each finished episode (script, story.js, words.json, post.md).
- `doczap/work/<slug>/`: scratch working copy for an episode (gitignored; frames are big).

## Setup (once per machine or cloud session)
```bash
cd doczap/engine && npm install && npx playwright install chromium   # if the browser download is blocked, tell Diyar
pip install -r ../requirements.txt                                  # numpy scipy pillow pocketsphinx (add --break-system-packages if pip asks)
# ffmpeg must be installed (apt-get install -y ffmpeg if missing)
```
**Speed:** this engine renders on the CPU at roughly 10 frames per minute with 2 cores, so a 45 s episode (2,700 frames) takes ~4 h. Run 2-3 render processes in parallel, each in the background. On Diyar's own computer with a graphics card it's much faster. A later plan is to move the worlds into Blender there.

Commit `doczap/episodes/<slug>/` and any engine improvements after each episode, so the next session starts from the newest version. Never commit frames, MP4s or WAVs.
