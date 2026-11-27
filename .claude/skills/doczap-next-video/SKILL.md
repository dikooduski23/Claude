---
name: doczap-next-video
description: Use when Diyar says "let's create next video" (or similar) for his Doc Zap channel - pick the story, virality-check, fact-check, write the Patrick script, then build it in the reference style (close moving camera, whip-pans, expressive faces) after he sends the voiceover.
---

# Doc Zap: create the next video

Read `CLAUDE.md`, `doczap/docs/STYLE.md` and `doczap/docs/CONSTRAINTS.md` first. CONSTRAINTS.md is the quality bar: never lower a number in it to make a check pass. Read `doczap/docs/LESSONS.md` and apply every lesson from earlier episodes. STYLE.md includes the measured rules from the Version 6 animated-shorts kit (push-in on the narration word, faces paper-white, everything outlined, warm palette).

The work follows the agent-skills lifecycle (addyosmani/agent-skills, installed in `.claude/skills/`): DEFINE → SPEC → BUILD in slices → VERIFY → SHIP → LEARN. Load each named skill with the Skill tool at its step.

## Phase 1: DEFINE (after "let's create next video"; no questions needed)
1. **Story ideas** with `idea-refine`: write 5 candidate stories in the STYLE.md formula (someone did something that looked stupid on purpose → doubted → the trick pays off → "You see," + mechanism → ironic punchline). Score each for little-known (most people never heard it), a mechanism you can show in a cutaway, a strong first image, and a share trigger. Check demand with a vidIQ outlier search if credits allow. Converge on one and write a "Not doing" line for the rest. Never repeat anything in `doczap/episodes/`.
2. **Fact-check** against 2+ sources. Leave out anything with one source or disagreeing sources, and list it.
3. **Doubt review** with `doubt-driven-development`: hand the claims table to a fresh-context agent that has not seen your reasoning and ask it to find what is wrong, overstated or single-sourced. Fold its findings back in. One round, two at most.
4. **Script** for ElevenLabs **Patrick on Eleven v4** (tag-free pacing, numbers as words):
   - 30-45 s (~105-120 words);
   - line 1 names the strange act;
   - a "You see," setup, But/So beats and a rehook halfway;
   - the last line flows back into line 1;
   - no comment CTA in the video.
   - Write and edit it with the `content-principles` skill (Remy Gaskell), applied silently: line 1 must sell line 2, each line sells the next; keep a curiosity loop open at all times and open a fresh one at 60–70 %; a shocking concrete fact inside 10 s; numbers, names and dates instead of summaries; sentences under ~9 words; the 10-year-old test on every line; cut anything interesting but not relevant.
5. **Virality check** with the `virality-predictor` skill for TikTok and Instagram. It must score **80+ on both**, honestly; rework until it does.
6. **Send Diyar** a .md with the script, score table, fact check and sources. Ask only for the MP3.

## Phase 2: SPEC and BUILD in slices (after he sends the voiceover)
Use `incremental-implementation`: one slice at a time, each one checked before the next. Work in `doczap/work/<slug>/`: `cp -r doczap/engine doczap/work/<slug>`, symlink or install node_modules, put the MP3 in as `voice_raw.mp3`.
1. **Voice:**
   - Run `python3 ../../tools/trim_pauses.py voice_raw.mp3 voice.mp3`. If it is still over 45 s, apply `atempo` (up to about 1.08).
   - Build `fake.html` (`const TOTAL=n;` + `const SCRIPT=[[i,i+1,"line"],...]`) and run `EP=fake.html python3 ../../tools/align_ps.py voice.mp3 0`.
   - Write `words.json` (`[{w,s,e}]`).
   - TOTAL frames = duration × 60.
2. **Shot spec** (`spec-driven-development`, kept short): write `SPEC.md` with the shot table (frames, set, camera move, cast, emote, label), the whip list and the cutaway. Each shot is 1.3-3 s.
3. **Sets and cast:**
   - New sets for every story, in `web/story.js` (or a world block in `web/main.js`), with `LOOK = 'modern'`.
   - Material finishes go through `material.userData = { rough, metal, envK }`: glass and water low roughness, foliage via `canopyGeo` / `tree()`.
   - Outfits go in `web/roman.js`; then run `cat toonbase.js roman.js > toon.js`.
4. **Stills first:** render a still per shot, make the contact sheet, apply the glow (`GLOW=0.35 python3 glowprev.py sheet.jpg 5`), look, and fix framing. If something renders wrong, use `debugging-and-error-recovery`: reproduce on one frame, change one thing, re-render that frame.
5. **Measure (Version 6 method: don't ask, measure):** `python3 ../../tools/measure.py --refcache ../../docs/reference_metrics.json --ours stills_glow/`. Fix only the biggest gap, re-render the same stills, measure again, and keep each version (`v1`, `v2` …; `lookrun.sh vN` does render, glow and measure in one go). If a change doesn't move its number, find the cause before trying anything else.
6. **Preview gate:** send Diyar the sheet plus the numbers table (ours vs references) and wait for his OK.

## Phase 3: render, VERIFY, SHIP
1. **Full render:** `RS=1 HASH="#raw" RESUME=1 node render.mjs plates a-b`, as 2 ranges in the background (one per core). Each range takes about 2 h at 10-12 s per frame. Restart with RESUME if killed. Send Diyar a short preview clip and progress while it runs.
2. **Captions:** caption script from `words.json` (number merges such as 245, 1849, 6 million; merge any caption under 0.2 s).
3. **Audio:** SFX section of `audio/mix.py` for the new shot times; voice first, bed about 20 dB under it. Output is `final_mix.wav` at -14 LUFS.
4. **Compose:** `python3 compose_plates.py plates out.mp4 --whips ... --audio audio/final_mix.wav --caps cap/caps.json --glow 0.35`.
5. **Cover:** `cover.py` on a clean frame, text off the face, inside the frame edges.
6. **Post kit:** run `ig-caption`, then `ig-human`, then `youtube-agent` (title linter): title, caption with one share ask, pinned comment with an easy either/or question, YouTube description, tags, sources.
7. **Ship gate** (`shipping-and-launch` pre-launch checklist, adapted): every row in CONSTRAINTS.md passes (ffprobe for size, fps and length, ebur128 for LUFS, no fades at the whips). Watch the WHOLE video with `python3 ../../tools/watch.py out.mp4 qc/` (contact sheets every 0.5 s + CUT/POP/FREEZE notes) and run `measure.py` on the MP4. Encode the delivery file at CRF ~19 with a 16 Mbps cap. For high-stakes episodes, a separate agent checks the finished video against the script.
8. **Deliver** the MP4, cover and post.md to Diyar.

## Phase 4: LEARN (`documentation-and-adrs`)
1. Copy the script, SPEC.md, story.js, words.json and post.md into `doczap/episodes/<slug>/`, along with engine improvements.
2. Add an entry to `doczap/docs/LESSONS.md`: what went wrong, what you changed, what to do next time. Record any engine decision as a short ADR in the same file.
3. Commit (never frames, MP4s or WAVs).
4. Delete `doczap/work/<slug>/plates`.
5. About 48 h after posting, offer to pull the insights and log them in LESSONS.md.
