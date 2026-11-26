# Doc Zap lessons log

Newest first. Each entry: what went wrong, what changed, what to do next time. Engine decisions are recorded as short ADRs (decision, why, trade-off).

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
