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
3. **Voice:** ElevenLabs **Patrick** (**Eleven v4**), with audio tags in square brackets; v4 accepts descriptive and combined tags like [curious, leaning in] [deadpan] [whispering, sly]. Numbers written as words. Diyar makes the MP3 and sends it.
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
- **Camera:** always moving (push-ins, arcs, following objects, POV, low angles), close framing, a new angle every 1.3-3 s. **Transitions are Remocn:** mostly `whip-pan`, plus one `lens-zoom` on the shock beat and one `push-through` into the cutaway.
- **Characters:** big white heads, very expressive faces, emotes (lightbulb, ?, !), hats, beards.
- **Worlds:** textured, warm-lit, depth haze.
- **Mechanism:** an in-world cutaway (glass object, cross-section, balance scale) with **handwritten labels and arrows** (Caveat font).
- **Captions:** 1-2 words, Poppins Bold, white with a dark stroke, sentence case, y≈1342.

## Repo layout
- `doczap/engine/`: the production template (latest = the Lottery Man rebuild).
  - `web/`: three.js engine. `main.js` holds the world sets, `toonbase.js` + `roman.js` the characters (`cat toonbase.js roman.js > toon.js` after editing), `story.js` the shots, camera, cast and FX of the current episode.
  - `render.mjs`: renders frames with headless Chromium (playwright).
  - `caps.py` makes captions, `labels.py` handwritten labels, `overlay.py` renders them as a transparent layer, `episode.py` cuts the plates together with Remocn transitions (+ the overlay), `compose.py` the final video, `cover.py` the cover, `audio/mix.py` the SFX and music mix.
  - `remotion/`: the **Remocn** overlay (Remotion project). `src/doczap/Overlay.tsx` builds captions from `caption-active-pop` and labels from `handwrite` + `ink-arrow` (+ `scribble-circle`). Components live in `src/components/remocn/` (we own and may edit them). Add more with `NODE_USE_ENV_PROXY=1 node scripts/remocn-add.mjs <name>`; the catalog is at https://remocn.dev/llms-components.txt. Fonts are bundled in `public/fonts`, so renders need no network. `src/doczap/Episode.tsx` splices the plates with Remocn transitions (`whip-pan`, `lens-zoom`, `push-through`, `light-leak`, `warp-dissolve`, `iris-wipe`), listed per episode in `TRANSITIONS` in `story.js`. Use Remocn for the 2D layer and the cuts only; the 3D worlds and characters stay in three.js.
- `doczap/tools/`: `trim_pauses.py`, `align_ps.py` (word timing), `audio_lib.py` (sound effects and music synth).
- `doczap/episodes/<slug>/`: what to keep from each finished episode (script, story.js, words.json, post.md).
- `doczap/work/<slug>/`: scratch working copy for an episode (gitignored; frames are big).

## Setup (once per machine or cloud session)
```bash
cd doczap/engine && npm install && npx playwright install chromium   # if the browser download is blocked, tell Diyar
pip install -r ../requirements.txt                                  # numpy scipy pillow pocketsphinx (add --break-system-packages if pip asks)
cd remotion && npm install && cd ..                                   # Remocn overlay (overlay.py also does this on first run)
# ffmpeg must be installed (apt-get install -y ffmpeg if missing)
```
**Speed:** this engine renders on the CPU at roughly 10 frames per minute with 2 cores, so a 45 s episode (2,700 frames) takes ~4 h. Run 2-3 render processes in parallel, each in the background. On Diyar's own computer with a graphics card it's much faster. A later plan is to move the worlds into Blender there.

Commit `doczap/episodes/<slug>/` and any engine improvements after each episode, so the next session starts from the newest version. Never commit frames, MP4s or WAVs.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
