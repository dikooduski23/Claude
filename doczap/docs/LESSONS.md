# Doc Zap lessons log

Newest first. Each entry: what went wrong, what changed, what to do next time. Engine decisions are recorded as short ADRs (decision, why, trade-off).

## Captain Cook's cabbage trick (Nov 26-27 2026)
**What went well**
- The story came from `idea-refine` and was fact-checked from Cook's own journal. A fresh-context doubt review caught six overstatements before voicing.
- The voice was generated with Diyar's ElevenLabs (Patrick, Eleven v4). The script had to be trimmed to 656 characters to fit his last credits; `creative_get_generations` gave a signed MP3 URL that curl could download once Diyar allowed it.
- The look was measured before rendering, v1 → v5:
  - brightness 26 → 40 (refs 48)
  - shadow 69 % → 54 % (refs 38 %)
  - saturation 61 % → 48 % (refs 42 %)
  - a* 8.5 (refs 8.7)
  - Warm wood-and-red sets closed the colour gap the Crystal Palace greens couldn't.
- The face-tint balance in dark interiors: a pure white tint pushed burnt highlights to 4.6 %; a warm `#ffeee0` card tint gives faces at L* 92-100 and burnt 1.7 %.

**What went wrong**
- A handwritten label ("the boss likes it") landed on the caption line in the scale cutaway. It was only caught by the whole-video watch, and cost an 80-frame re-render plus a second compose (about 25 min).
- The render ran at about 14 s per frame (about 4.5 h for 2,262 frames). Hiding off-screen sets made no real difference: the cost is per-pixel post, not other sets' lights.
- The two fixed lanes finished unevenly (the hold and cabin shots are slow); splitting the remaining frames evenly near the end saved about 20 min.

**Diyar's feedback (Nov 27 2026): the character movement.** He called the episode the best Rick's Clips replica yet, but the characters barely move. They are cut-out cards that only blink, bob and swap expressions and arm poses, and the swaps pop from one frame to the next. Rick's Clips characters walk, gesture on the words, react with their whole body and turn their heads.

**Next time**
- **Character movement: built Nov 27 2026 (`web/kit/act.js`, see STYLE.md, demo `DocZap_CharacterMovement_before_after.mp4`).** Rules for using it:
  - Arm poses blend over about 8 frames with a small overshoot, instead of switching (the rig needs numeric arm angles or a blend between two poses).
  - Every expression change gets a body reaction: a squash-stretch bounce (0.92 → 1.06 → 1) and a small hop on big reactions (shock, cheer), with a lean toward what they react to.
  - Head turns (`look`) ease over about 10 frames instead of jumping.
  - Characters walk on and off and between marks with `step` plus position paths (the steward walks in with the plate; sailors shuffle forward in the queue).
  - Gestures land on the narration word (point on "officers", hands up on "cheered", arms cross on "grumble").
  - Secondary motion: hats wobble on hops, small idle weight shifts, and occasional mouth movement on reactions.
  - Check it on a contact strip of 10 consecutive frames per shot (at least one character visibly moving in every strip), plus a 3-second preview clip in the preview gate.
- Preview gate: check every `annotAt` label's screen position is clear of the caption band (y 1250-1450 on 1920) before the full render.
- Render with balanced lanes from the start: split the *missing* frames in half every chunk, not fixed ranges.
- Budget 4-5 h for a 38 s episode with many interiors; start the render as soon as the preview is approved.
- Keep ElevenLabs scripts ≤ the remaining credits (1 credit per character on Eleven v4) and check `account_get_usage` before writing the final script.

## Version 6 kit study + measured look upgrade (Nov 26 2026)
Diyar sent the Version 6 master prompt and animated-shorts-kit and asked to learn from them and apply them to Doc Zap.

**What the numbers said** (Crystal Palace as posted vs his 9 reference reels, `doczap/tools/measure.py`):
- Saturation 66 % vs 42 % (the biggest gap), white balance b* 29 vs 7 (yellow), a* -6 vs +9 (green instead of warm red).
- The reference faces are pure white (L* about 100); ours topped out at 88-96 because the grade dulled the cards.
- Outline pixels 0.6 % vs 1.6 %: the references outline every prop, and my modern look had switched world outlines off.
- The references are darker with much more shadow (L* 48 vs 59, shadow 38 % vs 17 %). Most of that is set design, not a global setting.

**What changed** (v1 → v6, measured each step on the same 13 stills):
- v2: saturation × 0.74 plus a neutral white balance → 52 %.
- v3: exposure. It didn't move until the cause was found: a duplicate `expo` key later in the same object.
- v4: faces kept paper-white (burnt-highlight gap 2.1 → 0.5).
- v5: warm brown-black world outlines back on (`inkA` 0.75).
- v6: saturation × 0.64 → 47.5 %, b* 13.

**Also:** the repo engine was missing `web/kit/` and newer web files, so a fresh session couldn't render. It's synced now and renders the same frame as the working engine.

**Next time**
- Run `measure.py` on the stills before the preview gate and include the table for Diyar.
- Design sets warm (wood, brick, red), with shadowed corners.
- Shadow area is the largest gap left: low sun, darker fills in interiors, and bigger occluders (roofs, walls) casting shade across the bottom of the frame.

### ADR-002: measured grade + white faces + warm outlines (Nov 26 2026)
- **Decision:**
  - Modern lights use saturation × 0.64, gain `#faf4f6`, shadows `#f5f0ff`, highlights `#fff5f0`, exposure 0.84, fill `hemiK` 0.2, shadow box × 2.2, vignette ≥ 0.38 and world ink 0.75 (warm brown-black).
  - Character cards skip ACES and take only 20 % of the grade.
- **Why:** every change moved a measured gap toward Diyar's reference reels (`doczap/docs/reference_metrics.json`).
- **Trade-off:** green-heavy stories will always read less warm-red than the references; that gap is content, not grade.

## Crystal Palace / Paxton lily leaf (Nov 26 2026)
**What went wrong**
- Diyar: the render looked "like 2018". The causes were flat toon bands, black outlines on the whole world, blocky low-poly trees, plain flat backgrounds, and a milky glow from the bloom plus a heavy compose glow.
- The voice was 45.9 s after trimming pauses, over the 45 s cap. Fixed with `atempo 1.06` (43.3 s).
- A transparent glass vault plus light-shaft cones in front of the camera put a hazy band over the nave tree. The lower canopy went black under a high sun.
- A one-word caption ("it.") flashed for 0.07 s.

**What changed**
- New `LOOK = 'modern'` (ADR below). Tropical planting ring, natural pond water, a leaf texture showing the ribs and cross-ribs, smooth noise-displaced tree canopies, grass tufts and wildflowers, a far tree line.
- Captions merge any chunk shorter than 0.2 s.
- Light-shaft cones are never placed between the camera and the subject; glass in front of a subject gets low reflectivity (`envK` 0.25).

- Background jobs in this workspace are stopped at 2 h, and a stopped job shouldn't just be restarted. Rendering moved to foreground chunks (`chunk.sh` / `chunk2.sh` in the episode folder): two RESUME lanes for about 9 minutes per call, with the newest frames checked after each call.
- The railway room wall (HSL 95/30/62) turned lime green under the modern grade. Changed to warm amber (22/26/54) and re-rendered that shot (306 frames, about 20 min).
- The compose at CRF 14 with film grain made a 206 MB file (38 Mbps). The delivery file is re-encoded at CRF 19 with a 16 Mbps cap (72 MB).
- Merging captions under 0.2 s produced a few 3-4 word captions ("Critics said it would").
- The roof shot (glowing rib pattern) still looks pale and washed out.

**Next time**
- Merge a short caption into its neighbour only while the result stays ≤ 2 words; otherwise lengthen the short one.
- Keep wall and set colours muted (saturation ≤ 30, hue in warm/neutral ranges) because the filmic grade boosts saturation.
- Always encode delivery files at CRF ~19 with a bitrate cap.
- Give glowing overlay shots a darker backdrop so the glow reads.
- Build sets with modern materials from the start, so the preview gate isn't spent on look fixes.
- With 2 cores, run 2 render ranges (not 3); budget about 11 s per frame, so a 43 s episode takes about 4 h.
- Keep the voice ≤ 43 s before alignment, so `atempo` isn't needed.

### ADR-001: modern render look (Nov 26 2026)
- **Decision:** toon materials become MeshStandardMaterial at load time. Image-based light comes from a prefiltered sky dome with a sun glow, cached per lighting set. Low-poly primitives are rebuilt with more segments (skipped if the geometry was transformed). Post: ACES filmic tone mapping, split-tone grade, world outlines off, light grain and lens fringe, bloom only on real highlights (`bthr ≥ 1.55`), compose glow 0.35.
- **Why:** Diyar asked for modern-quality lighting and colour.
- **Trade-off:** about 10-12 s per frame vs about 5 s for toon. RS=1.5 supersampling was tested at about 3-4× slower and rejected; sharpness comes from the compose unsharp pass instead.
