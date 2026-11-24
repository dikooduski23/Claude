---
name: doczap-next-video
description: Use when Diyar says "let's create next video" (or similar) for his Doc Zap channel - pick the story, virality-check, fact-check, write the Patrick script, then build it in the reference style (close moving camera, whip-pans, expressive faces) after he sends the voiceover.
---

# Doc Zap: create the next video

Read `CLAUDE.md` and `doczap/docs/STYLE.md` first and follow every rule in them.

## Phase 1: after "let's create next video" (no questions needed)
1. **Pick the story** in the STYLE.md formula. It must be true and little-known (most people should never have heard it) and have a clear mechanism to show in a cutaway. It must not repeat anything in `doczap/episodes/`.
2. **Fact-check** against 2+ sources. Leave out anything with only one source and say so.
3. **Write the script** for ElevenLabs **Patrick on Eleven v4** (pacing from punctuation and short lines; tags only if Diyar has confirmed v4 reads them; numbers as words):
   - 30-45 s (~90-120 words);
   - line 1 names the strange act;
   - a "You see," setup, But/So beats and a rehook halfway;
   - the last line flows back into line 1;
   - no comment CTA.
4. **Virality check:** score Hook /25, Value /20, Emotion /20, Platform fit /15, Shareability /10, Trend /10. It must total **> 90**; rework the script until it does.
5. **Send Diyar** a .md with the script, the score table, the fact check and the sources. Ask only for the MP3.

## Phase 2: after he sends the voiceover
Work in `doczap/work/<slug>/`: `cp -r doczap/engine doczap/work/<slug>`, run `npm install` there (or symlink node_modules), and put the MP3 in as `voice_raw.mp3`.
1. **Voice:**
   - `python3 ../../tools/trim_pauses.py voice_raw.mp3 voice.mp3`.
   - Build `fake.html` (`const TOTAL=n;` + `const SCRIPT=[[i,i+1,"line"],...]`) and run `EP=fake.html python3 ../../tools/align_ps.py voice.mp3 0`, which gives warp.json.
   - Write `words.json` (`[{w,s,e}]`) and cut `voice_loop.wav` right after the last word.
   - TOTAL frames = duration × 60.
2. **Sets and cast** (read `doczap/docs/ENGINE.md`; prefer the world kit over hand-built sets):
   - Build the sets in story.js with `export const sets = (K) => {...}`: `K.room`, `K.prop.*` (torches, candles, windows, barrels…), `K.glass`/`K.section` for the cutaway, `LP` lighting presets, `annotAt` for handwritten labels, `emote()` for emotes, `talkAt` for talking mouths. Check new characters with `node cardsheet.mjs`.
   - (Old way, still works:) add a new world block in `web/main.js` before `// ---------- cards ----------`, wrapped in a block scope (`let xState;\n{ ... }`), and call it from worldState. Toggle it with your own W flags.
   - Outfits and faces go in `web/roman.js`; then run `cat toonbase.js roman.js > toon.js`.
   - Build new sets for each story: textured, warm-lit, with foreground props.
3. **Story** (`web/story.js`; use the Lottery Man version as the template):
   - The SH shot table in 30-fps units (u = f/2).
   - `cam30` with push-ins, orbits and object-follow shots.
   - The `WHIPS` list for whip-pans.
   - `dofAt` focus per shot, `worldAt` flags, `actorsAt` cast and expressions, and `fxAt` emotes and confetti.
   - The last shot returns to the opening composition.
4. **Stills first:** `HASH="#raw" timeout 300 node render.mjs stills "f1,f2,..."`, then `bash sheet.sh /tmp/sheet.jpg`. Look at the sheet and fix cropped heads, blocked faces, edge-on props and cameras inside objects before the full render.
5. **Full render:** `HASH="#raw" RESUME=1 node render.mjs plates a-b`, as 2-3 parallel ranges in the background. If a process gets killed, restart with RESUME and validate the newest jpgs with PIL. Comma lists work (`693-1256,1374-1471`).
6. **Captions:** `python3 caps.py` (set END and add number merges). **Labels:** `python3 labels.py` (set positions from a plate). Add the whip windows in `compose.py`.
7. **Audio:** edit the SFX section of `audio/mix.py` for the new shot times (whooshes on whips, an SFX per action, music dips) and run it. It writes `final_mix.wav` at -14 LUFS.
8. **Compose with Remotion + remocn** (Diyar's rule since Nov 24 2026): `bash ../../engine/finish_remotion.sh out/DocZap_<Name>_1080x1920.mp4 0.85` (base.mp4 with glow and audio, then remocn transitions from story.js `TRANSITIONS` and remocn captions; render the plates with hard cuts; see ENGINE.md §8). Old ffmpeg way, now a fallback only: `python3 compose.py out/DocZap_<Name>_1080x1920.mp4`. Then check 2514-ish frames at 60 fps, the LUFS, and a frame strip.
9. **Cover:** `python3 cover.py plates/fNNNN.jpg out/DocZap_<Name>_cover.jpg <y0>`, using a frame where the face is clean, with the text off the face.
10. **Post .md:** title, caption with a share ask, pinned comment with a save ask, YouTube description, tags and sources.
11. **Deliver** the MP4, cover and post.md to Diyar. Copy the script, story.js, words.json and post.md into `doczap/episodes/<slug>/` and commit. Delete `doczap/work/<slug>/plates`.
