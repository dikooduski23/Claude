# Doc Zap lessons log

Newest first. Each entry: what went wrong, what changed, what to do next time. Engine decisions are recorded as short ADRs (decision, why, trade-off).

## Long-form ep. 1: What If You Were Born as Genghis Khan? (Nov 26 2026)
New weekly 16:9 format modelled on Born in Lore. Diyar chose the free code-drawn 2D style over AI illustrations.
**What went wrong**
- The voice came to 6.5 min, under the 8-10 min target. Fixed with a fact-checked extra section (C, the horsemen) spliced in at "Then you ride." using word timings, plus a 2.6 s chapter-card gap before each chapter. Result: 8:04.
- ElevenLabs files can't be downloaded until `elevenlabsusercontent.com` is on the allowed domains (Diyar added it).
- skia `toarray()` defaults to BGRA, which turned skin and fire blue. Always pass `colorType=kRGBA_8888`.
- Close-ups framed faces too low. Fixed with automatic head tracking for single-character close-ups (`head_center`).
- The baby was drawn behind the mother: give held props and children `z` above the holder.
- The 1080p file at CRF 18 with grain was 3.1 GB. Delivery has to stay under 500 MiB to send: CRF 22, maxrate 7M.
- AAC raised the true peak to -1.1 dB. Limit the mix at 0.78 before muxing.
**What changed**
- New engine `doczap/longform/` (kit, chars, sets, fx, overlays, render, align, mix_long). Speed: about 0.18 s per frame, so a full 8-minute episode renders in about 25 min on 2 lanes.
- Shots are anchored to script phrases, so the timing follows the voice automatically.
**Next time**
- Character art is still simpler than the reference: add more poses (kneel, ride-shoot, lie), hands holding props in both arms, and faces with more realistic proportions.
- Add a proper "Bound" arm pose (it currently reads as raised), a camel walk cycle and crowd variety.
- Budget voice credits for about 1,300 words (about 8 min) from the start.


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
