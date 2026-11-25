---
name: doczap-next-video
description: Use when Diyar says "let's create next video" (or similar) for his Doc Zap channel - pick the story, virality-check, fact-check, write the Patrick script, then build it in the reference style (close moving camera, whip-pans, expressive faces) after he sends the voiceover.
---

# Doc Zap: create the next video

Read `CLAUDE.md` and `doczap/docs/STYLE.md` first and follow every rule in them.

## Skill map: invoke every skill on this list at its step, every episode (Diyar, Nov 25 2026)
Load each skill with the Skill tool at the step named; don't work from memory. Doc Zap rules win where a skill clashes. Record which skills ran in the episode's `script.md` (Phase 1) and `post.md` (Phase 2/3).

| Step | Skills |
|---|---|
| Pick the story | `viral-short-form-ideas` (idea evaluation, evergreen vs trend), `ig-viral`, `yt-viral` (what's over-indexing), `vt-youtube-stats` (our own winners, once Diyar connects YouTube Analytics) |
| Hook + script | `viral-hooks` (archetypes, three-layer hook: spoken + on-screen + visual), `viral-short-form` (retention shape, where viewers drop), `ig-reel` (3 hooks, `hookscore.py`, `beats.py`), `yt-script` (YouTube hook score, tiebreaker), `ig-human` (`detect.py`) |
| Virality | `virality-predictor` (full run, TikTok + Instagram), ig-viral's 8-line pre-build check, platform reads from `viral-tiktok-content`, `viral-instagram-reels` (sends per reach) and `viral-youtube-shorts` (VVSA / engaged views) |
| Look of the episode | `vt-video-design` (palette by act, 9:16 layout, safe zones) before building sets |
| Sets, lights, camera (three.js engine) | `threejs-fundamentals`, `threejs-lighting`, `threejs-materials`, `threejs-textures`, `threejs-geometry`, `threejs-animation`, `threejs-shaders`, `threejs-postprocessing`, `threejs-performance` |
| Sets, cast, camera (Blender, on Diyar's computer) | `vt-blender` (shot spec, rigged cartoon cast, cameras checked by geometry, beats on narration words, sound on the motion); toolkit = submodule `doczap/vendor/claude-code-video-toolkit` |
| Word timing | **`python3 ../../tools/el_words.py voice.mp3 words.json --script script.txt`** (`elevenlabs-speech-to-text`, Scribe v3 word timestamps; key set up Nov 25 2026). Fall back to `align_ps.py` if the API fails |
| Sound | the voice-first mix. **Real SFX:** write `sfx.json` (one specific prompt per action, e.g. "heavy ice block creaking on a rope") and run `python3 ../../tools/el_sfx.py sfx.json` (`elevenlabs-sound-effects`, SFX v3, cached in `sfx/` so each sound is paid once), then `from el_sfx import load` in the mix and put every sound on the SFX bus (low-pass, ducked, `SFX_PEAK`). Synth SFX from `audio_lib.py` only as a fallback. `elevenlabs-music` for beds if wanted; `elevenlabs-voice-isolator` if the MP3 has noise |
| Final edit | `remotion-best-practices` (router), `remotion-markup`, `remotion-captions`, `remotion-interactivity`, `remotion-render`; `remotion-elements` for ready-made components; `remotion-upgrade` when a new Remotion version lands; `remotion-studio` to preview |
| Media work | `vt-ffmpeg` (trims, loudness, encodes); `vt-moviepy` only for quick Python overlays |
| QC | `vt-video-design` contact-sheet critique on the stills and on frames from the final MP4 |
| Cover | `yt-package` (`title.py`, 100/100 pair); `vt-ideogram4` for text-heavy cover art if an Ideogram key is set |
| Posting kit | `viral-captions-and-ctas` (caption, pinned comment, bait check), `ig-caption` (+ `ig-human` on the caption), platform notes from `viral-instagram-reels` / `viral-tiktok-content` / `viral-youtube-shorts`, `yt-seo`, `yt-chapters` not needed for Shorts |
| After posting | `viral-instagram-reels` (diagnose a flop, Trial Reels), `viral-tiktok-content` / `viral-youtube-shorts` (flop diagnosis), `ig-reply`, `yt-comment`, `ig-audit`, `yt-retention`, `vt-youtube-stats`, `ig-plan`/`yt-plan`, `ig-profile`/`yt-audit` monthly, `ig-repurpose`/`ig-carousel`/`ig-story` to reuse an episode |

**Not used for Doc Zap** (installed, but they don't fit the format): `remotion-saas`, `remotion-maps` (unless a story needs a map), `remotion-create`, `remotion-license`, `remotion-docs` (use when stuck), `threejs-react-three-fiber`, `threejs-interaction`, `threejs-loaders`/`threejs-asset-pipeline` (only for imported models), `elevenlabs-agents`, `-realtime`, `-speech-engine`, `-dubbing` (unless Diyar wants other languages), `-voice-changer`, `-onboarding`/`-setup-api-key` (only to set up his key), `elevenlabs-text-to-speech` (Diyar makes the Patrick MP3 himself), `vt-ltx2`, `vt-qwen-edit`, `vt-runpod`, `vt-acestep` (cloud GPU), `vt-synthetic-ui-demo`, `vt-playwright-recording`, `vt-parody-short`, `vt-video-toolkit` (its own pipeline), `ig-dm`, `ig-comment`, `yt-edit`, `yt-shorts`.

## Phase 1: after "let's create next video" (no questions needed)
The installed Instagram/YouTube agent skills (`.claude/skills/ig-*`, `yt-*`, MIT, code reviewed Nov 24 2026) are part of every episode. **Doc Zap rules win** where they clash: no "comment/follow" ask inside the video (the ask goes in the caption), the last line loops back into line 1, captions at y≈1342, and nothing is invented as history. None of the scores predicts views; say so.

1. **Pick the story** in the STYLE.md formula. Start from the story bank `doczap/docs/story-ideas.md` (take the next one in "My order", and remove it from the list once used). It must be true and little-known (most people should never have heard it) and have a clear mechanism to show in a cutaway. It must not repeat anything in `doczap/episodes/`.
   - **Evidence (ig-viral / yt-viral):** check what is over-indexing in the niche right now (outlier multiple = views ÷ that account's median; above 3x is a signal). Keep the swipe file in `doczap/docs/swipe.md` and refresh it monthly (`python3 -I .claude/skills/ig-viral/swipe.py captured.tsv --out doczap/docs/swipe.md`). Read and rank by hand at human speed; never scrape or log in.
2. **Fact-check** against 2+ sources. Leave out anything with only one source and say so.
3. **Hook first (ig-reel / yt-script):** write **3 hooks from 3 different formulas** (for Doc Zap: #21 Mid-Sentence Start, #25 Someone Else's Result, #22 Contrarian Flip, #15 Flop Record, #3 Nobody Tells You). Save them one per line and run `python3 -I .claude/skills/ig-reel/hookscore.py hooks.txt`. Keep the winner; it must score **70+** (5-12 words, a concrete marker, something at stake, the payload up front). Also run `python3 -I .claude/skills/yt-script/hookscore.py hooks.txt` (YouTube's scorer, stricter; story hooks land in the 30s-40s) and use it as a **tiebreaker** between hooks that both pass ig-reel, not as a gate. List both scores.
4. **Write the script** for ElevenLabs **Patrick on Eleven v4** (pacing from punctuation and short lines; tags only if Diyar has confirmed v4 reads them; numbers as words):
   - 30-45 s (~90-120 words);
   - line 1 is the winning hook and names the strange act;
   - a "You see," setup, But/So beats and a rehook halfway;
   - the last line flows back into line 1;
   - no comment CTA.
   - **Time it (ig-reel):** `python3 -I .claude/skills/ig-reel/beats.py script.txt --target <seconds>`. Fix every flag: hook beat 8 words or fewer, **no beat over 4 s** (split the line or give it two shots), a concrete number or name in every run of 3 beats, total on target.
   - **Human check (ig-human):** `python3 -I .claude/skills/ig-human/detect.py script.txt`, and fix the weakest signal by hand. **Never apply `humanize.py`'s output to the voice script:** it capitalises after "..." and changes Patrick's pacing. Use it on captions and descriptions only.
5. **Virality check:** score Hook /25, Value /20, Emotion /20, Platform fit /15, Shareability /10, Trend /10. It must score **80+** on the full virality-predictor run (TikTok and Instagram), scored honestly; rework the script until it does.
   - **virality-predictor skill (run it in full, every episode):** invoke the `virality-predictor` skill with the script, once for **TikTok** and once for **Instagram Reels**. Paste its whole output into the .md (score breakdown, what's working, what's holding it back, fixes) and apply its fixes before sending; show v1 → v2 scores. Score honestly; never round up to reach a bar.
   - **Also:** ig-viral's 8-line **pre-build virality check** (hook, evidence, one idea, specificity, payoff and loop, shareability, retention design, fresh angle). Fix the weakest two lines. Show the virality-predictor scores, the ig-viral average and both hookscores side by side.
6. **Send Diyar** a .md with the script, the beat sheet, the score table, the fact check and the sources. Then **generate the MP3 yourself** with the `elevenlabs-text-to-speech` skill (Patrick, Eleven v4) unless he says he'll make it, and go straight to Phase 2.

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
5. **Full render:** `RS=2 HASH="#raw" RESUME=1 node render.mjs plates a-b` (supersampled, Diyar's quality note Nov 25 2026; story.js uses `LOOK = 'toon'` and `ink: 3.4`, see STYLE.md "Image quality"), as 2-3 parallel ranges in the background. If a process gets killed, restart with RESUME and validate the newest jpgs with PIL. Comma lists work (`693-1256,1374-1471`).
6. **Captions:** `python3 caps.py` (set END and add number merges). **Labels:** `python3 labels.py` (set positions from a plate). Add the whip windows in `compose.py`.
7. **Audio:** edit the SFX section of `audio/mix.py` for the new shot times (whooshes on whips, an SFX per action, music dips) and run it. It writes `final_mix.wav` at -14 LUFS. **Keep the voice on top:** end the mix with the voice-first block from `episodes/ice-king/mix_iceking.py` (1–4 kHz dip in the bed, 70% duck under speech, `BED_DB = 22` auto-sets the bed about 20 dB under the voice; SFX go on their own bus, low-passed at 5 kHz, ducked under speech, `SFX_PEAK = 0.16`).
8. **No blended transitions** (Diyar, Nov 25 2026): every `TRANSITIONS` entry is `type: 'cut'`; whips are camera yaws in the plates, never `tmix` or remocn overlay presentations; don't pass `--whips` to compose.
   **Compose with Remotion + remocn** (Diyar's rule since Nov 24 2026): `bash ../../engine/finish_remotion.sh out/DocZap_<Name>_1080x1920.mp4 0.85` (base.mp4 with glow and audio, then remocn transitions from story.js `TRANSITIONS` and remocn captions; render the plates with hard cuts; see ENGINE.md §8). Old ffmpeg way, now a fallback only: `python3 compose.py out/DocZap_<Name>_1080x1920.mp4`. Then check 2514-ish frames at 60 fps, the LUFS, and a frame strip.
9. **Cover:** `python3 cover.py plates/fNNNN.jpg out/DocZap_<Name>_cover.jpg <y0>`, using a frame where the face is clean, with the text off the face. **3 words at most**, at 150 px (set `lines` in cover.py), not repeating the title.
10. **Post .md:** title, cover text, caption, pinned comment, YouTube description, tags and sources.
   - **Title + cover (yt-package):** write at least 5 titles. Each must be **40 characters or fewer**, carry a number, name or date, and use at most 2 all-caps words. The **cover text is 3 words at most** and says what the title doesn't (e.g. title "He Shipped Ice to the Caribbean in 1806", cover "THEY LAUGHED…"). Score each pair with `python3 -I .claude/skills/yt-package/title.py --title "..." --thumb "COVER TEXT"`; ship a **100/100** pair.
   - **Caption (ig-caption):** the video carries the hook (job A), so line 1 (under ~125 characters) gives context, not a second hook. Exactly **one ask** (a send/share ask), **at most 5 specific hashtags** (never #fyp/#viral/#explorepage), and 2-3 search phrases as plain words (the person's name, the story's name), no link. Run `python3 -I .claude/skills/ig-human/humanize.py caption.txt --report`, then `python3 -I .claude/skills/ig-caption/caption.py caption.txt --keywords "name,story"`. Fix every FAIL and paste the receipt under the caption.
   - **Description + tags (yt-seo):** the first two lines are the words people search for; then the story and the sources; at most 15 tags (spellings, names, places).
   - **Pinned comment:** one real question people will want to answer.
11. **Deliver** the MP4, cover and post.md to Diyar. Copy the script, story.js, words.json and post.md into `doczap/episodes/<slug>/` and commit. Delete `doczap/work/<slug>/plates`.

## Phase 3: after Diyar posts (whenever he sends numbers, comments or a link)
- **Comments (ig-reply / yt-comment):** triage into questions, corrections, praise and bait. Draft replies under 30 words in the Doc Zap voice and name one comment to pin. Diyar posts the replies himself.
- **Results (ig-audit / yt-retention):** when he pastes insights or a YouTube retention CSV (`python3 -I .claude/skills/yt-retention/retention.py retention.csv --duration <s>`), find where people left and what over-performed. Write the lessons into `doczap/docs/STYLE.md`.
- **Weekly (ig-plan / yt-plan):** on request, plan the week's stories around his 11 AM / 6 PM slots.
- **Profile (ig-profile / yt-audit):** run once a month, or when growth stalls.

